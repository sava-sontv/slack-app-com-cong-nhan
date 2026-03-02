-- Vercel Neon (Postgres) schema for Slack Yes/No responses.
-- Run once in Neon SQL Editor or: psql $POSTGRES_URL -f lib/schema.sql

CREATE TABLE IF NOT EXISTS slack_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  message_ts TEXT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('yes', 'no')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slack_responses_responded_at
  ON slack_responses (responded_at DESC);
