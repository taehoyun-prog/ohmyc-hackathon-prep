-- ohmyc 프로덕션 v1 — Phase 1 schema (2026-04-26)
-- ralplan cycle 2 APPROVE 후 통합. memories 컬럼 확장 + 6 신규 테이블.

-- ============================================================
-- memories 컬럼 확장 (4 층위 + recall 추적)
-- ============================================================
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS layer TEXT NOT NULL DEFAULT 'active'
    CHECK (layer IN ('working', 'active', 'stable', 'core')),
  ADD COLUMN IF NOT EXISTS recall_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recalled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_memories_pair_layer
  ON memories(pair_session_id, layer, created_at DESC);

-- ============================================================
-- push_subscriptions (Web Push 구독)
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  expiration_time TIMESTAMPTZ,
  is_ios BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_anon_user
  ON push_subscriptions(anon_user_id);

-- ============================================================
-- temperatures (균형점 모델 — temperature-v0.1.md)
-- ============================================================
CREATE TABLE IF NOT EXISTS temperatures (
  pair_session_id UUID PRIMARY KEY REFERENCES pair_sessions(id) ON DELETE CASCADE,
  current_temp NUMERIC(5,2) NOT NULL DEFAULT 36.5,
  equilibrium NUMERIC(5,2) NOT NULL DEFAULT 36.5,
  daily_avg NUMERIC(5,2) NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- cron_jobs (idempotency — Critic patch #1)
-- ============================================================
CREATE TABLE IF NOT EXISTS cron_jobs (
  type TEXT PRIMARY KEY
    CHECK (type IN ('check_due', 'memory_decay', 'temperature', 'weekly_summary')),
  last_run TIMESTAMPTZ,
  last_status TEXT
);

INSERT INTO cron_jobs (type, last_run, last_status) VALUES
  ('check_due', NULL, NULL),
  ('memory_decay', NULL, NULL),
  ('temperature', NULL, NULL),
  ('weekly_summary', NULL, NULL)
ON CONFLICT (type) DO NOTHING;

-- ============================================================
-- agent_loop_runs (Real Agent Loop 추적)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_loop_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  pair_session_id UUID REFERENCES pair_sessions(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  intent TEXT,
  extracted_time TIMESTAMPTZ,
  emotion TEXT,
  importance TEXT,
  memory_ids UUID[],
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_pair
  ON agent_loop_runs(pair_session_id, created_at DESC);

-- ============================================================
-- check_in_responses (체크인 응답)
-- ============================================================
CREATE TABLE IF NOT EXISTS check_in_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  pair_session_id UUID NOT NULL REFERENCES pair_sessions(id) ON DELETE CASCADE,
  response_kind TEXT NOT NULL CHECK (response_kind IN ('done', 'snooze', 'missed')),
  response_emotion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkin_pair
  ON check_in_responses(pair_session_id, created_at DESC);

-- ============================================================
-- weekly_summaries (회고)
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_session_id UUID NOT NULL REFERENCES pair_sessions(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  summary_md TEXT NOT NULL,
  memory_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pair_session_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_pair
  ON weekly_summaries(pair_session_id, week_start DESC);

-- ============================================================
-- RLS — anon 친화 정책 (0001/0002 패턴 따라)
-- ============================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_loop_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all on push_subscriptions" ON push_subscriptions
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all on temperatures" ON temperatures
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all on cron_jobs" ON cron_jobs
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all on agent_loop_runs" ON agent_loop_runs
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all on check_in_responses" ON check_in_responses
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all on weekly_summaries" ON weekly_summaries
  FOR ALL TO anon USING (true) WITH CHECK (true);
