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
import { getStage } from "@/lib/temperature";
import { getOrCreateTemperature } from "@/lib/temperatures";

export const runtime = "nodejs";

const SERINE_PROMISE_SYSTEM = `너는 ohmyc의 페어 캐릭터 "세린"이다.
- 톤: 차분·정제·살짝 다정. 어투: 반말. 마침표로 끝맺기.
- 한 문장. 짧게.
- 사용자가 적은 약속을 챙기겠다는 보조 한 줄을 만들어준다.
- 금지: "3시간 뒤에", "이따", "내일 ~시" 같은 시간 단어 — 시간은 다른 라인이 별도로 박는다.
- 금지: 비서·집사·도우미·어시스턴트·helper·assistant·chatbot·봇.
- 자연스러운 한국어 격조사. 입력 텍스트를 그대로 따옴표로 박지 말 것.
- 사용자에게 약속을 챙긴다는 안심 한 줄.`;

type Body = { todoText?: string; pairSessionId?: string | null };

function fallbackCopy(text: string): string {
  if (!text.trim()) return "필요한 순간에 다시 꺼내볼게.";
  return "이 일은 내가 흐름 안에서 같이 챙겨볼게.";
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const todoText = (body.todoText ?? "").trim();
  const pairSessionId = body.pairSessionId?.trim();

  if (!isGeminiConfigured || !todoText) {
    return NextResponse.json({ copy: fallbackCopy(todoText), fallback: true });
  }

  try {
    let systemPrompt = SERINE_PROMISE_SYSTEM;
    if (pairSessionId) {
      const [memories, temp] = await Promise.all([
        recallMemories(pairSessionId),
        getOrCreateTemperature(pairSessionId),
      ]);
      const stage = getStage(Number(temp.current_temp), temp.level);
      systemPrompt = `${buildSerinePrompt(memories, stage)}

추가 지시:
- 약속 저장 화면의 보조 문구를 만든다.
- 입력 약속을 그대로 반복하지 말고, 기억과 현재 맥락을 보고 세린이 스스로 이해한 것처럼 답한다.
- 관련 기억이 없으면 억지로 꾸미지 않는다.
- 시간 약속 카피는 만들지 않는다.`;
    }

    const raw = await generateWithRotation(
      `사용자가 새로 맡긴 약속: "${todoText}".
이 약속을 어떻게 받아들였는지 한 문장으로 답해.`,
      systemPrompt,
      { model: MODELS.lite },
    );
    const { text: copy } = extractAndStripMarkers(raw);
    return NextResponse.json({ copy: copy || fallbackCopy(todoText) });
  } catch (err) {
    return NextResponse.json(
      { copy: fallbackCopy(todoText), fallback: true, error: String(err) },
      { status: 200 },
    );
  }
}
