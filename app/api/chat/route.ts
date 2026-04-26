/**
 * Chat API — 채팅 발화 영속화 + memories/todos 합류 + 세린 응답 생성.
 */

import { NextResponse } from "next/server";
import {
  generateWithRotation,
  isGeminiConfigured,
  MODELS,
} from "@/lib/gemini";
import {
  recallMemories,
  buildSerinePrompt,
  extractAndStripMarkers,
} from "@/lib/memory-recall";
import { getStage } from "@/lib/temperature";
import { getOrCreateTemperature } from "@/lib/temperatures";
import {
  appendChatMessage,
  listChatMessages,
} from "@/lib/chat-messages";
import { extractAgentSignal, type AgentExtract } from "@/lib/agent-loop";
import { createTodo, listTodoHistory } from "@/lib/todos";
import {
  addMoodMemory,
  createMemory,
  seedMemoriesForTodo,
} from "@/lib/memories";

export const runtime = "nodejs";

const FALLBACK_REPLY = "방금 말은 기억해둘게. 다음 흐름에서 같이 이어가자.";

const INTENT_LABEL: Record<AgentExtract["intent"], string> = {
  promise: "약속",
  record: "기록",
  emotion: "기분",
  pattern: "습관",
  chat: "잡담",
  check: "조회",
};

const IMPORTANCE_LABEL: Record<AgentExtract["importance"], string> = {
  low: "가볍게",
  medium: "보통",
  high: "중요",
};

type PostBody = { pairSessionId?: string; userMessage?: string };

export async function POST(req: Request) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const pairSessionId = body.pairSessionId?.trim();
  const userMessage = body.userMessage?.trim();
  if (!pairSessionId || !userMessage) {
    return NextResponse.json(
      { error: "pairSessionId_and_userMessage_required" },
      { status: 400 },
    );
  }

  // 1) 사용자 발화 즉시 저장
  const userChat = await appendChatMessage({
    pair_session_id: pairSessionId,
    role: "user",
    text: userMessage,
  });

  // 2) 컨텍스트 조회 (extraction과 response 생성 모두에 사용)
  let extract: AgentExtract | null = null;
  let memories: Awaited<ReturnType<typeof recallMemories>> = [];
  let temp: Awaited<ReturnType<typeof getOrCreateTemperature>>;
  let todos: Awaited<ReturnType<typeof listTodoHistory>> = [];
  let history: Awaited<ReturnType<typeof listChatMessages>> = [];

  try {
    const [mems, t, h, tds] = await Promise.all([
      recallMemories(pairSessionId),
      getOrCreateTemperature(pairSessionId),
      listChatMessages(pairSessionId, 6, false),
      listTodoHistory(pairSessionId, 10),
    ]);
    memories = mems;
    temp = t;
    history = [...h].reverse();
    todos = tds;

    // 2-2) 의도 추출 (최근 대화 맥락 포함)
    extract = await extractAgentSignal(userMessage, history);
  } catch {
    temp = await getOrCreateTemperature(pairSessionId);
  }

  // 3) 합류 로직 — 실패 silent
  if (extract && extract.intent !== "chat") {
    try {
      const hasTime = Boolean(extract.time && extract.time.length > 0);
      const targetText = extract.refinedText || userMessage;

      if ((extract.intent === "promise" || hasTime) && extract.intent !== "check") {
        const todo = await createTodo(pairSessionId, targetText, extract.time || undefined);
        await seedMemoriesForTodo(pairSessionId, todo);
        
        const intentLabel = INTENT_LABEL[extract.intent] ?? extract.intent;
        const importanceLabel = IMPORTANCE_LABEL[extract.importance] ?? extract.importance;
        const moodPiece = extract.emotion === "neutral" ? "" : ` · 기분 ${extract.emotion}`;
        const factContent = `${intentLabel} 의도 · ${importanceLabel}${moodPiece}`;
        
        await createMemory({
          pair_session_id: pairSessionId,
          todo_id: todo.id,
          kind: "fact",
          content: factContent,
          emotion: extract.emotion === "neutral" ? null : extract.emotion,
          meta: { source: "chat_extract", agent_extract: extract },
        });
      } else if (extract.intent === "emotion") {
        if (extract.emotion !== "neutral") {
          await addMoodMemory(pairSessionId, extract.emotion);
        }
      } else if (extract.intent === "pattern" || extract.intent === "record") {
        await createMemory({
          pair_session_id: pairSessionId,
          kind: extract.intent === "pattern" ? "pattern" : "fact",
          content: targetText,
          emotion: extract.emotion === "neutral" ? null : extract.emotion,
          meta: { source: "chat_extract", agent_extract: extract },
        });
      }
    } catch {
      // 합류 실패는 silent
    }
  }

  // 4) 응답 생성
  let replyText = FALLBACK_REPLY;
  let memoryIds: string[] = [];
  const stage = getStage(Number(temp.current_temp), temp.level);

  if (isGeminiConfigured) {
    try {
      const systemPrompt = buildSerinePrompt(memories, stage, todos, history);
      const userPrompt = `사용자가 방금 한 말: "${userMessage}".
의도 분류: ${extract?.intent ?? "chat"}

이 말에 따뜻하게 한 문장으로 답해.
판단 기준:
- 사용자의 말과 기억, 현재 약속을 함께 보고 지금 필요한 응답을 스스로 고른다.
- 사용자가 약속이나 기억을 물어본 경우(check 의도), <room_memory>의 내용을 바탕으로 친절하게 알려준다.
- 약속·할 일이 들어 있으면 챙기겠다는 뜻을 짧게 보태되, 입력 문장을 그대로 다시 붙이지 않는다.
- 관련 기억이나 약속이 있으면 자연스럽게 반영하고, 관련 없으면 억지로 언급하지 않는다.
"3시간 뒤에/이따 HH:MM에/내일 HH:MM에 한번 물어볼게." 같은 시간 약속 카피는 만들지 마 (다른 시스템이 박는다).
한 문장 또는 두 문장.`;
      const raw = await generateWithRotation(userPrompt, systemPrompt, {
        model: MODELS.default,
      });
      const stripped = extractAndStripMarkers(raw);
      if (stripped.text) replyText = stripped.text;
      memoryIds = stripped.memoryIds;
    } catch {
      // fallback reply 그대로
    }
  }

  // 5) 캐릭터 응답 저장
  const replyChat = await appendChatMessage({
    pair_session_id: pairSessionId,
    role: "character",
    text: replyText,
    meta: { memoryIds, stage },
  });

  return NextResponse.json({
    userMessage: userChat,
    replyMessage: replyChat,
    extract: extract ?? undefined,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pairSessionId = searchParams.get("pairSessionId")?.trim();
  if (!pairSessionId) {
    return NextResponse.json(
      { error: "pairSessionId_required" },
      { status: 400 },
    );
  }
  const messages = await listChatMessages(pairSessionId);
  return NextResponse.json({ messages });
}
