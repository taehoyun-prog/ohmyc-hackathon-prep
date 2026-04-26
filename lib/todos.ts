import { supabase } from "./supabase";
import { computeReminderInfo } from "./reminder-heuristic";
import type { Todo } from "./types";

const TODOS_FALLBACK_KEY = "ohmyc.todos_fallback";

export async function createTodo(
  pairSessionId: string,
  text: string,
): Promise<Todo> {
  const info = computeReminderInfo(text);
  const reminderTime = info.reminderTime;

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

    return data as Todo;
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
        .update({ completed_at: completedAt })
        .eq("id", todoId);
    } catch {
      // 폴백 처리로 이어짐
    }
  }

  if (typeof window !== "undefined") {
    const list = readFallbackList();
    const updated = list.map((t) =>
      t.id === todoId ? { ...t, completed_at: completedAt } : t,
    );
    window.sessionStorage.setItem(TODOS_FALLBACK_KEY, JSON.stringify(updated));
  }
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

    return data as Todo;
  } catch {
    return loadLatestTodoFallback(pairSessionId);
  }
}

function saveTodoFallback(
  pairSessionId: string,
  text: string,
  reminderTime: string,
): Todo {
  const todo: Todo = {
    id: crypto.randomUUID(),
    pair_session_id: pairSessionId,
    text,
    reminder_time: reminderTime,
    completed_at: null,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const list = readFallbackList();
    list.push(todo);
    window.sessionStorage.setItem(TODOS_FALLBACK_KEY, JSON.stringify(list));
  }

  return todo;
}

function loadLatestTodoFallback(pairSessionId: string): Todo | null {
  if (typeof window === "undefined") return null;
  const list = readFallbackList().filter(
    (t) => t.pair_session_id === pairSessionId,
  );
  if (list.length === 0) return null;
  return list[list.length - 1];
}

function readFallbackList(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      window.sessionStorage.getItem(TODOS_FALLBACK_KEY) || "[]",
    ) as Todo[];
  } catch {
    return [];
  }
}
