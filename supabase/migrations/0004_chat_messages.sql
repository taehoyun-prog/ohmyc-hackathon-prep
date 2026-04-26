-- ohmyc 채팅 메시지 영속화 (2026-04-26)
-- 목적: ChatTab의 sessionStorage 1차 저장 함정 차단 + 채팅 발화의 memories/todos 합류
-- 0001~0003 패턴 따라 IF NOT EXISTS + RLS DO $$ 안전 가드.

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_session_id UUID NOT NULL REFERENCES pair_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('character', 'user', 'system')),
  text TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seq BIGSERIAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_pair
  ON chat_messages (pair_session_id, seq);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages'
      AND policyname = 'anon_all on chat_messages'
  ) THEN
    CREATE POLICY "anon_all on chat_messages" ON chat_messages
      FOR ALL TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
