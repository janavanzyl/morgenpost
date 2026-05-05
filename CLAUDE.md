# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

**Morgenpost** is a German language learning PWA (Progressive Web App) for a single user at B1 level. Each day it pulls 5 positive news stories from RSS feeds, generates a German briefing for each using Claude, lets the user have a spoken conversation in German about the story, then analyses their mistakes and generates exercises. It runs at `localhost:3000` in dev and is deployed on Vercel.

## Commands

```bash
npm run dev      # start dev server (PWA disabled in dev)
npm run build    # production build
npm run lint     # ESLint check
```

There are no tests.

## Required environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
NEXT_PUBLIC_USER_UUID   # single hardcoded UUID — no auth system
NEXT_PUBLIC_APP_URL
```

## Architecture

### Routing (Next.js App Router)

- `/` → redirects to `/today`
- `/today` — story feed: 5 cards, each with a German briefing and a button to start the conversation
- `/conversation` — voice-based German conversation about the active story
- `/corrections` — mistakes + vocabulary from the completed conversation
- `/exercises` — 10 generated exercises (fill-blank, multiple-choice, rewrite)
- `/progress` — streak, calendar heatmap, session history

### Data flow (one full session)

1. `/api/feed/today` (GET) — fetches 5 RSS stories, calls Claude Haiku to generate a German briefing + quote for each, upserts all into Supabase `sessions` table. Returns early if 5 sessions already exist for today.
2. User taps a story → sets `activeSessionId` in the Zustand store.
3. User records audio → `/api/transcribe` (POST) → OpenAI Whisper returns German transcript.
4. User confirms transcript → `/api/conversation/message` (POST) → Claude Haiku replies in German. Repeats for up to 10 exchanges, saving the transcript to Supabase after each turn.
5. After exchange 10, conversation is marked `completed` → `/api/analysis` (POST) fires automatically → Claude Sonnet analyses the transcript, returns mistakes, vocabulary, and 10 exercises, all saved to Supabase.
6. `/api/streak` (POST) is called to update `user_streak` table.

### State management

`lib/session-store.ts` is a Zustand store (with `persist` middleware) that holds:
- `dailySessions` — array of today's 5 sessions (always re-fetched from server, not persisted to localStorage)
- `conversations` — per-session conversation state keyed by `sessionId`
- `analyses` — per-session analysis results keyed by `sessionId`
- `activeSessionId` — which story the user is currently on
- `streak`

The localStorage key rotates daily (`morgenpost-v2-YYYY-MM-DD`) so stale state is naturally cleaned up.

### AI models used

| Route | Model | Purpose |
|---|---|---|
| `/api/feed/today`, `/api/briefing` | `claude-haiku-4-5-20251001` | Generate German briefing + quote from news |
| `/api/conversation/message` | `claude-haiku-4-5-20251001` | German conversation partner |
| `/api/analysis` | `claude-sonnet-4-6` | Deep mistake analysis + exercise generation |
| `/api/transcribe` | OpenAI `whisper-1` | German speech-to-text |

### Database (Supabase)

Single-user app — RLS is disabled. All queries use the service role key via `getSupabaseAdmin()` in `lib/supabase-server.ts`. The user's UUID comes from `NEXT_PUBLIC_USER_UUID` env var.

Tables: `sessions`, `mistakes`, `vocabulary`, `exercises`, `user_streak`. Schema is in `supabase/schema.sql`.

### Key conventions

- All API routes are in `app/api/*/route.ts` — server-side only, never import these in client components
- Client data fetching goes through hooks in `hooks/` which call the API routes
- `lib/supabase.ts` is the client-side Supabase client (anon key); `lib/supabase-server.ts` is server-side (service role key)
- Components are grouped by page in `components/<page-name>/`; shared layout components are in `components/layout/`
- `@/` path alias maps to the project root
