/**
 * Next-action API — G5 AI 존재감.
 * Memory recall + stage 톤 + Gemini 한 문장 제안.
 * 결정타 카피 "3시간 뒤에/이따 HH:MM에/내일 HH:MM에" 패턴은 만들지 않음 (코드 차원 분리).
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

export const runtime = "nodejs";

const FALLBACK = "지금 흐름에서 필요한 것부터 같이 볼게.";

type Body = { pairSessionId?: string; userMessage?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const pairSessionId = body.pairSessionId?.trim();
  const userMessage = body.userMessage?.trim();
  if (!pairSessionId || !isGeminiConfigured) {
    return NextResponse.json({ text: FALLBACK, fallback: true });
  }

  try {
    const [memories, temp] = await Promise.all([
      recallMemories(pairSessionId),
      getOrCreateTemperature(pairSessionId),
    ]);

    const stage = getStage(Number(temp.current_temp), temp.level);
    const systemPrompt = buildSerinePrompt(memories, stage);

    const userPrompt = userMessage
      ? `사용자가 방금 한 말: "${userMessage}".
이 말과 세린의 기억을 함께 보고, 지금 필요한 응답을 스스로 판단해서 한 문장으로 답해.
입력 문장을 그대로 반복하지 말고, 관련 기억이 있을 때만 자연스럽게 반영해.
약속·할 일이 들어 있으면 챙기겠다는 뜻을 짧게 보태.
"3시간 뒤에/이따 HH:MM에/내일 HH:MM에 한번 물어볼게." 같은 시간 약속 카피는 만들지 마 (다른 시스템이 박는다).
한 문장 또는 두 문장.`
      : `위 기억과 현재 관계 단계를 바탕으로, 홈에서 사용자에게 지금 건넬 한 문장만 응답.
기억을 나열하지 말고 세린이 스스로 맥락을 판단한 말처럼 쓴다.
관련 기억이 없으면 억지로 개인화하지 말고 조용히 다음 행동을 열어준다.
"3시간 뒤에/이따 HH:MM에/내일 HH:MM에 한번 물어볼게." 같은 시간 약속 카피는 만들지 마. 그건 다른 시스템이 박는다.
한 문장.`;

    const raw = await generateWithRotation(userPrompt, systemPrompt, {
      model: MODELS.default,
    });
    const { text, memoryIds } = extractAndStripMarkers(raw);

    return NextResponse.json({
      text: text || FALLBACK,
      memoryIds,
      stage,
    });
  } catch (err) {
    return NextResponse.json({
      text: FALLBACK,
      fallback: true,
      error: String(err),
    });
  }
}
