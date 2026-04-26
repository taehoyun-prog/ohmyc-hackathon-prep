-- ohmyc production loop 확장 (2026-04-26)
-- 목적: 온보딩 이후 "기억 누적 + 시간/감정 트리거 + 투명성" 실동작

-- 1) todos: 선제 체크인 상태 확장
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS checkin_state TEXT NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_todos_due_scan
  ON todos (pair_session_id, reminder_time, created_at DESC)
  WHERE completed_at IS NULL;

-- 2) memories: 5종 기억 + 감정 + 약속 due 정보 저장
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_session_id UUID NOT NULL REFERENCES pair_sessions(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  emotion TEXT,
  due_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT memories_kind_chk
    CHECK (kind IN ('fact', 'event', 'promise', 'pattern', 'mood', 'system')),
  CONSTRAINT memories_emotion_chk
    CHECK (emotion IS NULL OR emotion IN ('great', 'good', 'low', 'down'))
);

CREATE INDEX IF NOT EXISTS idx_memories_pair_created
  ON memories (pair_session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_kind
  ON memories (kind);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'memories'
      AND policyname = 'anon all on memories'
  ) THEN
    CREATE POLICY "anon all on memories" ON memories
      FOR ALL TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
