import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function addCheck(name, pass, detail) {
  checks.push({ name, pass, detail });
}

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function files(dir) {
  const out = [];
  for (const entry of readdirSync(join(root, dir))) {
    const full = join(dir, entry);
    const stat = statSync(join(root, full));
    if (stat.isDirectory()) out.push(...files(full));
    else out.push(full);
  }
  return out;
}

const sourceFiles = files('src').filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
const allSource = sourceFiles.map((file) => `${file}\n${read(file)}`).join('\n');
const coach = read('src/app/api/coach/route.ts');
const insight = read('src/app/api/insight/route.ts');
const packageJson = JSON.parse(read('package.json'));
const readme = read('README.md');

addCheck(
  'OpenAI key is server-only',
  !allSource.includes('NEXT_PUBLIC_OPENAI_API_KEY') && !allSource.includes('dangerouslyAllowBrowser'),
  'No public OpenAI key or browser OpenAI client usage.'
);

addCheck(
  'Coach route has rate limiting',
  coach.includes('rateLimit(') && coach.includes('getClientKey'),
  'Per-client limiter is applied to /api/coach.'
);

addCheck(
  'Insight route has rate limiting',
  insight.includes('rateLimit(') && insight.includes('getClientKey'),
  'Per-client limiter is applied to /api/insight.'
);

addCheck(
  'OpenAI calls have timeout',
  coach.includes('withTimeout(') && insight.includes('withTimeout('),
  'AI calls are wrapped with timeout fallback.'
);

addCheck(
  'Payloads are sanitized',
  coach.includes('sanitizeCoachMessage') && coach.includes('sanitizeSleepLog') && insight.includes('sanitizeSleepLog'),
  'Message, cycle length, and sleep logs are sanitized.'
);

addCheck(
  'Oversized payloads are rejected',
  coach.includes('parseJsonBody') && insight.includes('parseJsonBody'),
  'Shared JSON parser rejects large bodies.'
);

addCheck(
  'Fallbacks exist',
  coach.includes('offlineCoach') && insight.includes('localInsight') && coach.includes('fallback: true') && insight.includes('fallback: true'),
  'Both AI routes survive missing key, timeout, or provider errors.'
);

addCheck(
  'Medical boundary exists',
  coach.includes('hasMedicalEscalation') && coach.includes('medicalEscalationResponse'),
  'Coach route avoids sleep coaching for emergency/self-harm content.'
);

addCheck(
  'Audit logging exists',
  coach.includes('auditLog') && insight.includes('auditLog'),
  'Routes log latency, fallback, rate-limit, and error metadata.'
);

addCheck(
  'README includes safety note',
  /not medical advice/i.test(readme) && /wellness prototype/i.test(readme),
  'Submission docs state wellness-only scope.'
);

addCheck(
  'npm script is registered',
  packageJson.scripts?.['audit:ai'] === 'node scripts/audit-ai.mjs',
  'package.json exposes npm run audit:ai.'
);

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  const mark = check.pass ? 'PASS' : 'FAIL';
  console.log(`${mark} ${check.name}`);
  console.log(`  ${check.detail}`);
}

if (failed.length) {
  console.error(`\nAI audit failed: ${failed.length} check(s) need attention.`);
  process.exit(1);
}

console.log('\nAI audit passed.');
