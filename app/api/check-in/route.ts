/**
 * Check-in API — 알림 응답 처리 (G2/G5).
 * 사용자가 "다 했어"·"30분 뒤에"·"놓침" 응답 → todo 상태 + memories event 동시 갱신.
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { markTodoCompleted, snoozeTodo } from "@/lib/todos";
import { addTodoEventMemory } from "@/lib/memories";
import type { Todo } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  todoId?: string;
  pairSessionId?: string;
  responseKind?: "done" | "snooze" | "missed";
  responseEmotion?: "great" | "good" | "low" | "down" | "neutral";
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const { todoId, pairSessionId, responseKind, responseEmotion } = body;
  if (!todoId || !pairSessionId || !responseKind) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (responseKind === "done") {
    await markTodoCompleted(todoId);
  } else if (responseKind === "snooze") {
    await snoozeTodo(todoId, 30);
  }

  if (supabase) {
    try {
      const { data: todo } = await supabase
        .from("todos")
        .select("*")
        .eq("id", todoId)
        .single();

      if (todo && (responseKind === "done" || responseKind === "snooze")) {
        await addTodoEventMemory(
          pairSessionId,
          todo as Todo,
          responseKind === "done" ? "completed" : "snoozed",
        );
      }

      await supabase.from("check_in_responses").insert({
        todo_id: todoId,
        pair_session_id: pairSessionId,
        response_kind: responseKind,
        response_emotion: responseEmotion ?? null,
      });
    } catch {
      // 폴백: silent skip (UX 진입은 클라이언트가 즉시 처리)
    }
  }

  return NextResponse.json({ ok: true });
}
