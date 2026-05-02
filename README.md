# Circathym — Minimalist Cycle-aware Alarm (MVP)

A small React + Vite prototype that visualizes 90-minute sleep cycles as a circular ring and rates a chosen wake time with a Red/Amber/Green system.

## Quick start (developer)

Prereqs
- Node (recommended 18+; for newest plugin features use Node 20+ or 22.12+)
- npm (or pnpm/yarn)

Install

1. clone repo
   git clone <repo> circathym
2. cd circathym
3. install deps
    npm install
    - If you get peer dependency errors, try:
      npm install --legacy-peer-deps

Run dev server

  npm run dev

Open in browser

  http://localhost:5173/

Build for production

  npm run build
  npm run preview

## Files of interest
- index.html — entry (root must contain <div id="root"></div>)
- src/main.jsx — bootstraps React
- src/App.jsx — app wiring & state
- src/components/ — UI pieces (CycleRing, ClockDisplay, TimePicker, AlarmControls, Recommendations)
- src/logic/sleepCycle.js — cycle calc & classifier
- src/hooks/useAlarm.js — alarm scheduling + beep

## How to use (UI)
- Select a wake time via the time input.
- The circular ring highlights the sleep-cycle segment for that wake time and shows Optimal/Acceptable/Disruptive.
- Press "Set Alarm" to schedule a browser beep at the chosen time (page must be open).

## Troubleshooting
- Blank page: confirm index.html exists at project root and contains <div id="root"></div>.
- 404 on `/`: ensure dev server is running and open http://localhost:5173/ (not /src/main.jsx).
- Audio doesn't play: browser may block autoplay — interact with the page first.

## Notes
- No backend. Uses local scheduling (setTimeout) and the WebAudio API for a beep.
- SVG ring is in `CycleRing` (no external chart libs).

License: MIT
