import { supabase } from "./supabase";
import { derivePromiseHeadline, computeReminderInfo } from "./reminder-heuristic";
import type { MemoryItem, MoodValue, Todo } from "./types";

// 폴백: 모듈-레벨 in-memory 저장소 (sessionStorage 사용 ❌, 가드레일 #2).
const fallbackByPair: Map<string, MemoryItem[]> = new Map();

function safeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `memory-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

type MemoryInsert = {
  pair_session_id: string;
  todo_id?: string | null;
  kind: MemoryItem["kind"];
  content: string;
  emotion?: MoodValue | null;
  due_at?: string | null;
  meta?: Record<string, unknown>;
};

export type RelationshipTemperature = {
  score: number; // 0..1
  label: string;
  summary: string;
};

export async function createMemory(input: MemoryInsert): Promise<MemoryItem> {
  const payload = {
    pair_session_id: input.pair_session_id,
    todo_id: input.todo_id ?? null,
    kind: input.kind,
    content: input.content,
    emotion: input.emotion ?? null,
    due_at: input.due_at ?? null,
    meta: input.meta ?? {},
  };

  if (!supabase) {
    return saveMemoryFallback(payload);
  }

  try {
    const { data, error } = await supabase
      .from("memories")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      return saveMemoryFallback(payload);
    }

    return normalizeMemory(data);
  } catch {
    return saveMemoryFallback(payload);
  }
}

export async function seedMemoriesForTodo(
  pairSessionId: string,
  todo: Todo,
): Promise<void> {
  const info = computeReminderInfo(todo.text, new Date(todo.created_at));
  const promiseHeadline = derivePromiseHeadline(info);
  const inferredKind = inferNonPromiseKind(todo.text);

  await Promise.all([
    createMemory({
      pair_session_id: pairSessionId,
      todo_id: todo.id,
      kind: "promise",
      content: promiseHeadline,
      due_at: todo.reminder_time,
      meta: {
        text: todo.text,
        source: "todo_created",
      },
    }),
    createMemory({
      pair_session_id: pairSessionId,
      todo_id: todo.id,
      kind: inferredKind,
      content: summarizeTodoAsMemory(todo.text, inferredKind),
      meta: {
        text: todo.text,
        source: "todo_inferred",
      },
    }),
  ]);
}

export async function addMoodMemory(
  pairSessionId: string,
  mood: MoodValue,
): Promise<void> {
  await createMemory({
    pair_session_id: pairSessionId,
    kind: "mood",
    emotion: mood,
    content: moodToCopy(mood),
    meta: { mood },
  });
}

export async function addTodoEventMemory(
  pairSessionId: string,
  todo: Todo,
  event: "completed" | "snoozed",
): Promise<void> {
  const content =
    event === "completed"
      ? `${todo.text}, 약속을 지켰어.`
      : `${todo.text}, 지금은 잠깐 미뤘어.`;
  await createMemory({
    pair_session_id: pairSessionId,
    todo_id: todo.id,
    kind: "event",
    content,
    due_at: todo.reminder_time,
    meta: { event },
  });
}

export async function listRecentMemories(
  pairSessionId: string,
  limit: number = 6,
): Promise<MemoryItem[]> {
  if (!supabase) {
    return readFallback(pairSessionId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("pair_session_id", pairSessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return readFallback(pairSessionId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    }
    return data.map(normalizeMemory);
  } catch {
    return readFallback(pairSessionId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
}

export function computeRelationshipTemperature(
  memories: MemoryItem[],
  todos: Todo[],
): RelationshipTemperature {
  const moodMemories = memories.filter((m) => m.kind === "mood");
  const moodScore =
    moodMemories.length === 0
      ? 0.6
      : moodMemories.reduce((acc, m) => acc + moodNumeric(m.emotion), 0) /
        moodMemories.length;

  const baseTodos = todos.filter((t) => t.text.trim().length > 0);
  const completionScore =
    baseTodos.length === 0
      ? 0.5
      : baseTodos.filter((t) => Boolean(t.completed_at)).length / baseTodos.length;

  const memoryDepth = Math.min(memories.length / 12, 1);
  const score = clamp01(moodScore * 0.45 + completionScore * 0.4 + memoryDepth * 0.15);

  if (score >= 0.78) {
    return { score, label: "온기 높음", summary: "지금 리듬이 아주 좋아." };
  }
  if (score >= 0.58) {
    return { score, label: "안정 구간", summary: "지금처럼 천천히 쌓아가면 돼." };
  }
  return { score, label: "돌봄 필요", summary: "부담 없이 작은 약속부터 다시 잡아보자." };
}

export function memoryKindLabel(kind: MemoryItem["kind"]): string {
  switch (kind) {
    case "fact":
      return "처음 안 사실";
    case "event":
      return "함께 지나간 순간";
    case "promise":
      return "세린의 약속";
    case "pattern":
      return "반복되는 습관";
    case "mood":
      return "오늘의 기분";
    case "system":
      return "시스템 기록";
  }
}

function inferNonPromiseKind(text: string): "fact" | "event" | "pattern" {
  if (/(매일|항상|꾸준|습관|자주|반복)/.test(text)) {
    return "pattern";
  }
  if (/(오늘|내일|아침|점심|저녁|밤|퇴근|주말|이번)/.test(text)) {
    return "event";
  }
  return "fact";
}

function summarizeTodoAsMemory(
  text: string,
  kind: "fact" | "event" | "pattern",
): string {
  if (kind === "pattern") return `${text}, 이건 반복해서 챙기는 습관이야.`;
  if (kind === "event") return `${text}, 오늘의 일정으로 기억해둘게.`;
  return `${text}, 지금 네가 중요하게 두는 일이야.`;
}

function moodToCopy(mood: MoodValue): string {
  switch (mood) {
    case "great":
      return "오늘 기분이 아주 좋아 보여.";
    case "good":
      return "오늘은 꽤 괜찮아 보여.";
    case "low":
      return "오늘은 힘이 조금 빠져 보여.";
    case "down":
      return "오늘은 많이 지쳐 보여.";
  }
}

function moodNumeric(mood: MoodValue | null): number {
  if (mood === "great") return 1;
  if (mood === "good") return 0.78;
  if (mood === "low") return 0.42;
  if (mood === "down") return 0.24;
  return 0.6;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function saveMemoryFallback(payload: Omit<MemoryItem, "id" | "created_at">): MemoryItem {
  const item: MemoryItem = {
    id: safeId(),
    created_at: new Date().toISOString(),
    ...payload,
  };

  const list = fallbackByPair.get(item.pair_session_id) ?? [];
  list.push(item);
  fallbackByPair.set(item.pair_session_id, list);
  return item;
}

function readFallback(pairSessionId: string): MemoryItem[] {
  const list = fallbackByPair.get(pairSessionId);
  return list ? list.map(normalizeMemory) : [];
}

function normalizeMemory(raw: Partial<MemoryItem>): MemoryItem {
  return {
    id: raw.id ?? safeId(),
    pair_session_id: raw.pair_session_id ?? "",
    todo_id: raw.todo_id ?? null,
    kind: isMemoryKind(raw.kind) ? raw.kind : "system",
    content: raw.content ?? "",
    emotion: isMood(raw.emotion) ? raw.emotion : null,
    due_at: raw.due_at ?? null,
    meta: raw.meta ?? {},
    created_at: raw.created_at ?? new Date().toISOString(),
  };
}

function isMemoryKind(v: unknown): v is MemoryItem["kind"] {
  return (
    v === "fact" ||
    v === "event" ||
    v === "promise" ||
    v === "pattern" ||
    v === "mood" ||
    v === "system"
  );
}

function isMood(v: unknown): v is MoodValue {
  return v === "great" || v === "good" || v === "low" || v === "down";
}
