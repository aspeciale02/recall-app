# Recall — AI Voice Study App

Upload lectures. Set your exam date. Recall builds your study plan and tests you with your voice until you're ready.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Supabase (auth + PostgreSQL)
- Claude API (claude-sonnet-4-6) — topic extraction, question generation, grading
- Web Speech API — browser-native voice input
- pdf-parse — server-side PDF text extraction
- Vercel — deployment

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration at `supabase/migrations/001_init.sql` in the Supabase SQL editor
3. Get your project URL, anon key, and service role key from Settings > API

### 2. Environment variables

Copy `env.template` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Add the same vars to Vercel:
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add ANTHROPIC_API_KEY
```

### 3. Local dev

```bash
npm install
npm run dev
```

## Features

- **Auth** — email/password via Supabase
- **Course creation** — name + exam date in 2 steps
- **Document upload** — PDF text extraction + image support
- **AI processing** — Claude extracts 5-10 topics + 5 questions per topic
- **Study plan** — day-by-day schedule from today to exam date
- **Practice tab** — text Q&A with Claude grading (0-100 score + feedback)
- **Voice test tab** — speak answers via Web Speech API, Claude grades reasoning quality
- **Progress tab** — readiness score, topic mastery bars, weak spots, streak counter
- **Spaced repetition** — questions reschedule based on score (1/3/7 days)
- **RLS** — all data is user-scoped in Supabase

## Deployment

App is live at: https://recall-app-taupe.vercel.app

To redeploy:
```bash
npx vercel --prod
```
