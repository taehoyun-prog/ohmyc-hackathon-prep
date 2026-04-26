-- ohmyc 해커톤 MVP V0.1 (2026-04-26)
-- 익명 사용자 기반 pair_sessions + todos 테이블
-- 디자인: PRD `.omc/specs/deep-interview-ohmyc-mvp.md` Constraints > Supabase 통합

CREATE TABLE IF NOT EXISTS pair_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_user_id TEXT NOT NULL,
  character_id TEXT NOT NULL DEFAULT 'serine',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pair_sessions_anon_user
  ON pair_sessions(anon_user_id);

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_session_id UUID NOT NULL REFERENCES pair_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  reminder_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_todos_pair_session
  ON todos(pair_session_id);

-- RLS 활성화 (데모용 단순 정책 — anon 키로 모든 작업 허용)
ALTER TABLE pair_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon all on pair_sessions" ON pair_sessions
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon all on todos" ON todos
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
