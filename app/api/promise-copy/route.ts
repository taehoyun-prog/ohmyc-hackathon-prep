import { NextResponse } from "next/server";
import {
  generateWithRotation,
  isGeminiConfigured,
  MODELS,
} from "@/lib/gemini";

export const runtime = "nodejs";

const SERINE_PROMISE_SYSTEM = `너는 ohmyc의 페어 캐릭터 "세린"이다.
- 톤: 차분·정제·살짝 다정. 어투: 반말. 마침표로 끝맺기.
- 한 문장. 짧게.
- 사용자가 적은 약속을 챙기겠다는 보조 한 줄을 만들어준다.
- 금지: "3시간 뒤에", "이따", "내일 ~시" 같은 시간 단어 — 시간은 다른 라인이 별도로 박는다.
- 금지: 비서·집사·도우미·어시스턴트·helper·assistant·chatbot·봇.
- 자연스러운 한국어 격조사. 입력 텍스트를 그대로 따옴표로 박지 말 것.
- 사용자에게 약속을 챙긴다는 안심 한 줄.`;

type Body = { todoText?: string };

function fallbackCopy(text: string): string {
  if (!text.trim()) return "약속 잊지 않게 곁에 있을게.";
  return `${text.trim()}, 잊지 않게 곁에서 챙겨줄게.`;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const todoText = (body.todoText ?? "").trim();

  if (!isGeminiConfigured || !todoText) {
    return NextResponse.json({ copy: fallbackCopy(todoText), fallback: true });
  }

  try {
    const copy = await generateWithRotation(
      `사용자가 적은 약속: "${todoText}". 이 약속을 잊지 않게 챙기겠다는 보조 한 줄을 자연스러운 한국어로 만들어줘.`,
      SERINE_PROMISE_SYSTEM,
      { model: MODELS.lite },
    );
    return NextResponse.json({ copy: copy || fallbackCopy(todoText) });
  } catch (err) {
    return NextResponse.json(
      { copy: fallbackCopy(todoText), fallback: true, error: String(err) },
      { status: 200 },
    );
  }
}
