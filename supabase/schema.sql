-- Morgenpost — Supabase Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New Query)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── sessions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL,
  date                    DATE NOT NULL,
  news_title              TEXT NOT NULL,
  news_url                TEXT NOT NULL,
  news_source             TEXT NOT NULL DEFAULT 'Good News Network',
  german_briefing         TEXT NOT NULL,
  quote                   TEXT NOT NULL,
  quote_author            TEXT,
  conversation_transcript JSONB,
  conversation_status     TEXT NOT NULL DEFAULT 'not_started'
    CHECK (conversation_status IN ('not_started','in_progress','completed')),
  analysis_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  story_index             INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date, story_index)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions (user_id, date DESC);

-- ─── mistakes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mistakes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  original_text  TEXT NOT NULL,
  correction     TEXT NOT NULL,
  explanation    TEXT NOT NULL,
  category       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mistakes_session ON mistakes (session_id);

-- ─── vocabulary ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  word        TEXT NOT NULL,
  translation TEXT NOT NULL,
  example     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_session ON vocabulary (session_id);

-- ─── exercises ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('fill_blank', 'multiple_choice', 'rewrite')),
  content     JSONB NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_session ON exercises (session_id);

-- ─── user_streak ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_streak (
  user_id           UUID PRIMARY KEY,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_active_date  DATE,
  total_sessions    INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS disabled for single-user mode
ALTER TABLE sessions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes   DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises  DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_streak DISABLE ROW LEVEL SECURITY;
