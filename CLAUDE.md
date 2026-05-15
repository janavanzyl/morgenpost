# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Morgenpost** is a German language learning PWA for a single user at B1 level. Each day it pulls 5 positive news stories from RSS feeds, generates a German briefing for each using Claude, lets the user have a spoken conversation in German about the story, then analyses their mistakes and generates exercises. Dev: `localhost:3000`. Production: `https://morgenpost.vercel.app`.

## Commands

```bash
npm run dev      # start dev server (PWA disabled in dev)
npm run build    # production build
npm run lint     # ESLint check
```

To open in terminal:
```
cd C:\Users\janav\morgenpost && npm run dev
```

No test suite. Verification is done by running a full session end-to-end.

Deploy by pushing to GitHub — Vercel auto-deploys from `janavanzyl/morgenpost`.

## Required environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL        # https://qhbplapwqukslmpgbbyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY                  # Whisper speech-to-text only
NEXT_PUBLIC_USER_UUID           # single hardcoded UUID — no auth system
NEXT_PUBLIC_APP_URL
```

## Architecture

### Routing (Next.js App Router)

- `/` → redirects to `/today`
- `/today` — story feed: 5 cards, each with a German briefing and a button to start conversation
- `/conversation` — voice-based German conversation about the active story
- `/corrections` — mistakes + vocabulary from the completed conversation
- `/exercises` — 10 generated exercises (fill-blank, multiple-choice, rewrite)
- `/progress` — streak, calendar heatmap, session history

### Data flow (one full session)

1. `/api/feed/today` (GET) — fetches 5 RSS sources, uses Claude Haiku to pick the best story from each, generates a German briefing + German title + quote for each. Returns early if 5 sessions already exist for today.
2. User taps a story → sets `activeSessionId` in the Zustand store.
3. User records audio → `/api/transcribe` (POST) → OpenAI Whisper returns German transcript.
4. User confirms transcript → `/api/conversation/message` (POST) → Claude Haiku replies in German. Repeats for up to 10 exchanges, saving transcript to Supabase after each turn.
5. After exchange 10, conversation marked `completed` → `/api/analysis` (POST) fires automatically → Claude Sonnet analyses transcript, returns mistakes, vocabulary, and 10 exercises, all saved to Supabase.
6. `/api/streak` (POST) is called to update `user_streak` table.

### Automated daily job

`vercel.json` runs a Vercel cron at `0 4 * * *` (4am UTC = 6am Swiss summer time) calling `/api/feed/today` to pre-populate stories before the user opens the app. `.github/workflows/daily-feed.yml` also exists as a redundant backup (same schedule, same endpoint).

### RSS feed logic (`lib/rss.ts`)

Five sources — Good News Network, Good Good Good, Positive News, The Optimist Daily, TreeHugger. Each feed fetches 5 candidates. `fetchStoryCandidates()` returns `Record<source, NewsItem[]>`. The feed route calls `selectBestStories()` which uses one Claude Haiku call to pick the most compelling story per source (exactly 1, no duplicates). Stories matching `SKIP_PATTERNS` (e.g. "Good News in History") are filtered out.

### State management

`lib/session-store.ts` is a Zustand store (with `persist` middleware) holding:
- `dailySessions` — today's 5 sessions (persisted to localStorage for instant load)
- `conversations` — per-session conversation state keyed by `sessionId`
- `analyses` — per-session analysis results keyed by `sessionId`
- `activeSessionId` — which story the user is currently on
- `streak`

The localStorage key rotates daily (`morgenpost-v2-YYYY-MM-DD`) so stale state is naturally cleaned up. `useFeed` in `hooks/useSession.ts` skips the loading spinner if sessions are already cached and refreshes silently in the background.

**Important:** Zustand setters that could be called in a loop (e.g. `setConversationPhase`, `setPendingTranscript`) are idempotent — they return the original `state` object unchanged when the value hasn't changed, preventing React re-render loops.

### AI models used

| Route | Model | Purpose |
|---|---|---|
| `/api/feed/today` | `claude-haiku-4-5-20251001` | Story selection + German briefing/title/quote |
| `/api/conversation/message` | `claude-haiku-4-5-20251001` | German conversation partner |
| `/api/analysis` | `claude-sonnet-4-6` | Deep mistake analysis + exercise generation |
| `/api/transcribe` | OpenAI `whisper-1` | German speech-to-text |

### Database (Supabase)

Single-user app. All queries use the service role key via `getSupabaseAdmin()` in `lib/supabase-server.ts` which bypasses RLS. The user's UUID comes from `NEXT_PUBLIC_USER_UUID`.

Tables: `sessions`, `mistakes`, `vocabulary`, `exercises`, `user_streak`. Schema in `supabase/schema.sql`.

The `sessions` table includes `german_title TEXT` (nullable) — older rows may have this as null, in which case the UI falls back to `news_title`.

**Race condition note:** The feed upsert uses `ignoreDuplicates: true` which returns 0 rows on conflict. Always re-fetch sessions with a separate SELECT after the upsert loop rather than relying on the upsert return value.

### Key conventions

- All API routes are in `app/api/*/route.ts` — server-side only
- Client data fetching goes through hooks in `hooks/` which call the API routes
- `lib/supabase.ts` is the client-side Supabase client (anon key); `lib/supabase-server.ts` is server-side (service role key)
- `lib/rss.ts` must NOT have `'use client'` — it is imported by server-side API routes
- Components are grouped by page in `components/<page-name>/`; shared layout in `components/layout/`
- `@/` path alias maps to the project root
