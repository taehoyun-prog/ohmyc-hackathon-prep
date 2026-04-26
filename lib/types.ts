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
  created_at: string;
};
