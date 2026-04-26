import { supabase } from "./supabase";
import { computeReminderInfo } from "./reminder-heuristic";
import type { Todo } from "./types";

const NOTIFY_COOLDOWN_MINUTES = 8;

// 폴백: 모듈-레벨 in-memory 저장소 (sessionStorage 사용 ❌, 가드레일 #2).
const fallbackByPair: Map<string, Todo[]> = new Map();

function safeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `todo-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export async function createTodo(
  pairSessionId: string,
  text: string,
  explicitReminderTime?: string | null,
): Promise<Todo> {
  let reminderTime: string;
  if (explicitReminderTime && !Number.isNaN(new Date(explicitReminderTime).getTime())) {
    reminderTime = new Date(explicitReminderTime).toISOString();
  } else {
    reminderTime = computeReminderInfo(text).reminderTime;
  }

  if (!supabase) {
    return saveTodoFallback(pairSessionId, text, reminderTime);
  }

  try {
    const { data, error } = await supabase
      .from("todos")
      .insert({
        pair_session_id: pairSessionId,
        text,
        reminder_time: reminderTime,
      })
      .select()
      .single();

    if (error || !data) {
      return saveTodoFallback(pairSessionId, text, reminderTime);
    }

    return normalizeTodo(data);
  } catch {
    return saveTodoFallback(pairSessionId, text, reminderTime);
  }
}

export async function markTodoCompleted(todoId: string): Promise<void> {
  const completedAt = new Date().toISOString();

  if (supabase) {
    try {
      await supabase
        .from("todos")
        .update({
          completed_at: completedAt,
          checkin_state: "completed",
          snoozed_until: null,
        })
        .eq("id", todoId);
    } catch {
      // 폴백 처리로 이어짐
    }
  }

  updateFallback(todoId, {
    completed_at: completedAt,
    checkin_state: "completed",
    snoozed_until: null,
  });
}

export async function markTodoNotified(
  todoId: string,
  currentCount: number = 0,
): Promise<void> {
  const now = new Date().toISOString();
  const nextCount = currentCount + 1;

  if (supabase) {
    try {
      await supabase
        .from("todos")
        .update({
          last_notified_at: now,
          notification_count: nextCount,
          checkin_state: "due",
        })
        .eq("id", todoId);
    } catch {
      // 폴백 처리로 이어짐
    }
  }

  updateFallback(todoId, {
    last_notified_at: now,
    notification_count: nextCount,
    checkin_state: "due",
  });
}

export async function snoozeTodo(
  todoId: string,
  minutes: number = 30,
): Promise<void> {
  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  if (supabase) {
    try {
      await supabase
        .from("todos")
        .update({
          snoozed_until: until,
          checkin_state: "snoozed",
        })
        .eq("id", todoId);
    } catch {
      // 폴백 처리로 이어짐
    }
  }

  updateFallback(todoId, {
    snoozed_until: until,
    checkin_state: "snoozed",
  });
}

export async function getLatestTodo(
  pairSessionId: string,
): Promise<Todo | null> {
  if (!supabase) {
    return loadLatestTodoFallback(pairSessionId);
  }

  try {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("pair_session_id", pairSessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return loadLatestTodoFallback(pairSessionId);
    }

    return normalizeTodo(data);
  } catch {
    return loadLatestTodoFallback(pairSessionId);
  }
}

export async function listTodoHistory(
  pairSessionId: string,
  limit: number = 6,
): Promise<Todo[]> {
  if (!supabase) {
    return readFallbackList(pairSessionId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("pair_session_id", pairSessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return readFallbackList(pairSessionId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    }

    return data.map(normalizeTodo);
  } catch {
    return readFallbackList(pairSessionId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
}

export async function getDueTodos(
  pairSessionId: string,
  at: Date = new Date(),
): Promise<Todo[]> {
  const nowIso = at.toISOString();
  const filterDue = (todo: Todo) => {
    if (todo.pair_session_id !== pairSessionId) return false;
    if (todo.completed_at) return false;
    if (!todo.reminder_time) return false;
    if (new Date(todo.reminder_time).getTime() > at.getTime()) return false;
    if (todo.snoozed_until && new Date(todo.snoozed_until).getTime() > at.getTime()) {
      return false;
    }
    if (todo.last_notified_at) {
      const diffMs = at.getTime() - new Date(todo.last_notified_at).getTime();
      if (diffMs < NOTIFY_COOLDOWN_MINUTES * 60 * 1000) return false;
    }
    return true;
  };

  if (!supabase) {
    return readFallbackList(pairSessionId)
      .filter(filterDue)
      .sort((a, b) => a.reminder_time!.localeCompare(b.reminder_time!));
  }

  try {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("pair_session_id", pairSessionId)
      .is("completed_at", null)
      .lte("reminder_time", nowIso)
      .order("reminder_time", { ascending: true })
      .limit(20);

    if (error || !data) {
      return readFallbackList(pairSessionId)
        .filter(filterDue)
        .sort((a, b) => a.reminder_time!.localeCompare(b.reminder_time!));
    }

    return data.map(normalizeTodo).filter(filterDue);
  } catch {
    return readFallbackList(pairSessionId)
      .filter(filterDue)
      .sort((a, b) => a.reminder_time!.localeCompare(b.reminder_time!));
  }
}

function saveTodoFallback(
  pairSessionId: string,
  text: string,
  reminderTime: string,
): Todo {
  const todo: Todo = {
    id: safeId(),
    pair_session_id: pairSessionId,
    text,
    reminder_time: reminderTime,
    completed_at: null,
    checkin_state: "scheduled",
    last_notified_at: null,
    snoozed_until: null,
    notification_count: 0,
    created_at: new Date().toISOString(),
  };

  const list = fallbackByPair.get(pairSessionId) ?? [];
  list.push(todo);
  fallbackByPair.set(pairSessionId, list);
  return todo;
}

function loadLatestTodoFallback(pairSessionId: string): Todo | null {
  const list = readFallbackList(pairSessionId);
  if (list.length === 0) return null;
  return list[list.length - 1];
}

function readFallbackList(pairSessionId: string): Todo[] {
  const list = fallbackByPair.get(pairSessionId);
  return list ? list.map(normalizeTodo) : [];
}

function normalizeTodo(raw: Partial<Todo>): Todo {
  return {
    id: raw.id ?? safeId(),
    pair_session_id: raw.pair_session_id ?? "",
    text: raw.text ?? "",
    reminder_time: raw.reminder_time ?? null,
    completed_at: raw.completed_at ?? null,
    checkin_state:
      raw.checkin_state === "due" ||
      raw.checkin_state === "snoozed" ||
      raw.checkin_state === "completed"
        ? raw.checkin_state
        : "scheduled",
    last_notified_at: raw.last_notified_at ?? null,
    snoozed_until: raw.snoozed_until ?? null,
    notification_count:
      typeof raw.notification_count === "number" ? raw.notification_count : 0,
    created_at: raw.created_at ?? new Date().toISOString(),
  };
}

function updateFallback(todoId: string, patch: Partial<Todo>) {
  for (const [pairId, list] of fallbackByPair.entries()) {
    const idx = list.findIndex((t) => t.id === todoId);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = { ...next[idx], ...patch };
      fallbackByPair.set(pairId, next);
      return;
    }
  }
}
