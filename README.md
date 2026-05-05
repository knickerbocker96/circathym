# Circathym 

**BeaverHacks 2026**

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- shadcn-style UI primitives
- OpenAI API via Next.js route handlers
- Browser `localStorage` for prototype sleep history
- WebAudio API for alarm tones

## Architecture

- `src/app/page.tsx` dashboard, learned cycle state, alarm, RAG score
- `src/logic/cyclePersonalization.js` cycle length, confidence, debt, wake windows
- `src/logic/sleepCycle.js` RAG
- `src/components/CycleComparisonCard.tsx` learned model
- `src/components/CycleRing/` render: analog clock, cycle cuts, RAG ticker
- `src/app/api/coach/route.ts` and `src/app/api/insight/route.ts` keep OpenAI calls server-side.
