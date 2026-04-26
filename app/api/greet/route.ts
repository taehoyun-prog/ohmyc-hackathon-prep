import { NextResponse } from "next/server";
import {
  generateWithRotation,
  isGeminiConfigured,
  SERINE_SYSTEM_PROMPT,
} from "@/lib/gemini";

export const runtime = "nodejs";

const FALLBACK = "오늘부터 곁에서 같이 알아가고 싶어.";

type Body = {
  todoText?: string;
};

export async function POST(req: Request) {
  if (!isGeminiConfigured) {
    return NextResponse.json({ text: FALLBACK, fallback: true });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const todoText = (body.todoText ?? "").trim();

  // 결정타 라인은 시스템이 박음 — LLM에게 절대 만들지 말라고 지시
  const prompt = todoText
    ? `사용자가 오늘 챙기고 싶다고 한 일: "${todoText}". 페어로서 이 일을 곁에서 챙기겠다는 약속의 보조 한 줄을 다정하게 한 문장으로 말해줘. "3시간 뒤에 한번 물어볼게." 라인은 만들지 말 것.`
    : `세린이 사용자에게 처음 만나는 인사를 한 문장으로 다정하게 건네줘. "처음 만나서 반가워. 나는 세린이야." 가 이미 박혀 있으니 그 다음 보조 한 줄.`;

  try {
    const text = await generateWithRotation(prompt, SERINE_SYSTEM_PROMPT);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { text: FALLBACK, fallback: true, error: String(err) },
      { status: 200 },
    );
  }
}
