# Circathym AI

**Adaptive sleep timing that learns your rhythm instead of assuming everyone runs on 90-minute cycles.**

Built for **BeaverHacks 2026**.

## The Problem

Most consumer sleep-cycle apps give every user the same advice: wake up at a 90-minute boundary.

That is simple, but it is not personal. Real sleep cycles vary, and a small difference per cycle can become a meaningful difference after a full night.

## The Solution

Circathym AI learns a user's personal sleep rhythm from wake-quality feedback, then uses that learned rhythm to recommend better wake times, bedtime plans, alarm behavior, and coaching.

The core idea:

> Turn subjective wake quality into adaptive sleep timing.

Circathym is not medical sleep staging. It is a practical feedback engine for everyday sleep decisions.

## Why It Is Different

Circathym does not just say "AI sleep coach." The AI is the explanation layer. The core product is a rhythm engine:

- Logs how refreshed the user felt after waking.
- Learns a personal cycle length from high-quality wake entries.
- Compares the learned rhythm against the generic 90-minute model.
- Shows exactly why one wake time is better than another.
- Uses the same calculation in the clock marker, proof card, recommendations, and AI coach.

## Judge Demo

Click **Judge Demo** in the header.

The demo seeds 8 realistic nights of wake-quality data and learns a **94-minute** rhythm.

The proof moment:

| Model | Wake Time | Result | Distance From Boundary |
|---|---:|---|---:|
| Generic app | 7:15 AM | Amber / Acceptable | 30 min |
| Circathym | 7:15 AM | Green / Optimal | 10 min |

Same wake time. Different model. Better decision.

That comparison is calculated by the same classifier used by the clock's RAG wake marker.

## Features

- **Personal cycle learning:** derives a user's cycle length from high-quality wake logs.
- **Rhythm proof card:** shows generic 90m vs learned rhythm side by side.
- **RAG clock marker:** selected wake time is rendered as green, amber, or red on the clock.
- **Wake recommendations:** suggests nearby times around learned cycle boundaries.
- **Bedtime planner:** turns a required wake time into actionable bedtime options.
- **AI sleep coach:** explains recommendations using recent logs and learned rhythm.
- **Server-side OpenAI routes:** API key stays server-side through Next.js route handlers.
- **Offline AI fallback:** demo still works when Wi-Fi or API access fails.
- **Smart alarm:** ringtone choices, volume, fade-in, test alarm, and adaptive snooze.
- **Local-first privacy:** sleep history stays in browser storage for the prototype.

## 90-Second Pitch

Most sleep apps assume everyone has 90-minute sleep cycles. But real cycles vary.

Circathym learns from how you actually wake up. In the demo, eight wake-quality logs reveal a 94-minute rhythm. At 7:15 AM, the generic model is 30 minutes from a cycle boundary, while Circathym is only 10 minutes away. That changes the wake quality prediction from amber to green.

The result is not just an alarm. It is an adaptive sleep-timing engine that turns feedback into better bedtime and wake decisions.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- shadcn-style UI primitives
- OpenAI API via Next.js route handlers
- Browser `localStorage` for prototype sleep history
- WebAudio API for alarm tones

## Architecture

- `src/app/page.tsx` wires the main dashboard, judge demo, learned cycle state, alarm flow, and RAG wake score.
- `src/logic/cyclePersonalization.js` learns cycle length, confidence, sleep debt, and wake windows.
- `src/logic/sleepCycle.js` classifies wake times as green, amber, or red.
- `src/components/CycleComparisonCard.tsx` proves the learned model against the generic 90-minute model.
- `src/components/CycleRing/` renders the analog clock, sleep-cycle cuts, and RAG wake marker.
- `src/app/api/coach/route.ts` and `src/app/api/insight/route.ts` keep OpenAI calls server-side.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

For live OpenAI responses:

```bash
cp .env.example .env.local
# then add your key to .env.local
```

Without an API key, Circathym uses deterministic fallback coaching so the demo still works.

## Build

```bash
npm run build
```

## AI Safety Audit

```bash
npm run audit:ai
```

The audit checks for server-only OpenAI usage, route rate limiting, request sanitization, provider timeouts, fallback behavior, medical-scope boundaries, and lightweight SRE logs.

Current limiter strategy is in-memory per IP, which is enough for a hackathon demo. For a public production launch, replace it with Redis, Upstash, or Vercel KV so limits work consistently across serverless instances.

## Safety Note

Circathym is a wellness prototype, not medical advice. It does not diagnose sleep disorders or perform medical sleep staging. It uses self-reported wake quality to personalize lightweight sleep-timing recommendations.

## What We Would Build Next

- Calendar-aware bedtime planning.
- Wearable import for passive sleep/wake validation.
- Multi-week trend analysis.
- Confidence intervals around learned cycle estimates.
- Private account sync across devices.
