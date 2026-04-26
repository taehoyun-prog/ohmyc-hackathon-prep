/**
 * Promise flow API — 채팅 약속 협상 전용 라우트.
 * 단계: classify → ask_time / confirm / save
 *
 * - phase 안 보내면: classifyPromisePhase로 분류해서 ask_time 또는 confirm 응답.
 * - phase === "save"면: createTodo 실행 후 저장 응답.
 *
 * R-006 결정타 카피 ("이따 HH:MM에/내일 HH:MM에 한번 물어볼게.") 보존.
 */

import { NextResponse } from "next/server";
import {
  generateWithRotation,
  isGeminiConfigured,
  MODELS,
} from "@/lib/gemini";
import {
  buildSerinePrompt,
  extractAndStripMarkers,
  recallMemories,
} from "@/lib/memory-recall";
import {
  classifyPromisePhase,
  rebuildConfirmHeadline,
  type TimeCandidate,
} from "@/lib/reminder-heuristic";
import { getStage } from "@/lib/temperature";
import { getOrCreateTemperature } from "@/lib/temperatures";
import { createTodo } from "@/lib/todos";

export const runtime = "nodejs";

type Body = {
  pairSessionId?: string;
  userMessage?: string;
  phase?: "save" | "rebuild_headline";
  originalText?: string;
  reminderTime?: string;
};

async function buildSaveReply(
  pairSessionId: string,
  text: string,
  reminder: string,
): Promise<{ text: string; memoryIds: string[] }> {
  const fallback = "좋아. 이 일은 흐름 안에서 같이 챙겨볼게.";
  if (!isGeminiConfigured) return { text: fallback, memoryIds: [] };

  try {
    const [memories, temp] = await Promise.all([
      recallMemories(pairSessionId),
      getOrCreateTemperature(pairSessionId),
    ]);
    const stage = getStage(Number(temp.current_temp), temp.level);
    const systemPrompt = `${buildSerinePrompt(memories, stage)}

추가 지시:
- 사용자가 방금 약속 저장을 확정했다.
- 입력 약속을 그대로 반복하지 말고, 세린이 맥락을 이해하고 받아든 말처럼 답한다.
- 관련 기억이 있으면 자연스럽게 반영하고, 관련 없으면 억지로 언급하지 않는다.
- 정확한 시간 약속 카피는 만들지 않는다.
- 한 문장.`;

    const raw = await generateWithRotation(
      `저장된 약속: "${text}"
예약 시각 ISO: "${reminder}"
사용자에게 저장 완료 응답 한 문장을 작성해.`,
      systemPrompt,
      { model: MODELS.lite },
    );
    const parsed = extractAndStripMarkers(raw);
    return { text: parsed.text || fallback, memoryIds: parsed.memoryIds };
  } catch {
    return { text: fallback, memoryIds: [] };
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const pairSessionId = body.pairSessionId?.trim();

  // === phase: save — 사용자가 "응, 맡길게" 칩 탭 후 ===
  if (body.phase === "save") {
    const text = (body.originalText ?? "").trim();
    const reminder = body.reminderTime;
    if (!pairSessionId || !text || !reminder) {
      return NextResponse.json(
        { ok: false, error: "missing fields" },
        { status: 400 },
      );
    }
    try {
      const todo = await createTodo(pairSessionId, text, reminder);
      const reply = await buildSaveReply(pairSessionId, text, reminder);
      return NextResponse.json({
        ok: true,
        todo: {
          id: todo.id,
          text: todo.text,
          reminderTime: todo.reminder_time,
        },
        characterReply: reply.text,
        memoryIds: reply.memoryIds,
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "create_failed" },
        { status: 500 },
      );
    }
  }

  // === phase: rebuild_headline — confirm 단계에서 시간 shift 후 카피 재생성 ===
  if (body.phase === "rebuild_headline") {
    const reminder = body.reminderTime;
    if (!reminder) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      headline: rebuildConfirmHeadline(reminder),
    });
  }

  // === default phase: classify — 첫 진입 ===
  const userMessage = (body.userMessage ?? "").trim();
  if (!userMessage) {
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  }

  const phase = classifyPromisePhase(userMessage);

  if (phase.kind === "confirm") {
    return NextResponse.json({
      ok: true,
      phase: "confirm",
      reminderTime: phase.reminderTime,
      headline: phase.headline,
      characterReply: `${phase.headline} 맞아?`,
      chips: [
        { label: "응, 맡길게", action: "save", primary: true },
        { label: "30분 일찍", action: "shift", deltaMinutes: -30 },
        { label: "30분 늦게", action: "shift", deltaMinutes: 30 },
        { label: "다른 시간으로", action: "pick" },
      ],
    });
  }

  // ask_time
  const candidates: TimeCandidate[] = phase.candidates;
  return NextResponse.json({
    ok: true,
    phase: "ask_time",
    characterReply: phase.followUp,
    candidates,
  });
}
