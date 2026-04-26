export type PairSession = {
  id: string;
  anon_user_id: string;
  character_id: string;
  status: string;
  created_at: string;
};

export type Todo = {
  id: string;
  pair_session_id: string;
  text: string;
  reminder_time: string | null;
  completed_at: string | null;
  checkin_state: "scheduled" | "due" | "snoozed" | "completed";
  last_notified_at: string | null;
  snoozed_until: string | null;
  notification_count: number;
  created_at: string;
};

export type MemoryKind =
  | "fact"
  | "event"
  | "promise"
  | "pattern"
  | "mood"
  | "system";

export type MoodValue = "great" | "good" | "low" | "down";

export type MemoryItem = {
  id: string;
  pair_session_id: string;
  todo_id: string | null;
  kind: MemoryKind;
  content: string;
  emotion: MoodValue | null;
  due_at: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export type ChatRole = "character" | "user" | "system";

export type ChatMessage = {
  id: string;
  pair_session_id: string;
  role: ChatRole;
  text: string;
  meta: Record<string, unknown>;
  created_at: string;
  seq?: number;
};
