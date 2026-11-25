# Lyta

A kinder way to get lighter. A personal habit app: real food, a 10 minute knee routine and an earlier bedtime, with a no-shame sugar journal, streaks with freezes, and rewards.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 at phone width.

## What's here (milestone 1)

- Liquid glass launch animation (`components/Loader.tsx`, WebGL)
- Onboarding: current weight, goal, bedtime, reminders (`components/Onboarding.tsx`)
- Today: three habits, week strip, water, sugar log (`components/Today.tsx`, `components/SugarSheet.tsx`)
- Local-only data in the browser (`lib/store.ts`): streaks with 2 freezes a month, points, bedtime ladder, coffee cut-off (8 hours before bedtime)

Design tokens in `app/globals.css` match the colour and text styles in the Lyta Figma file.
