/**
 * Real Agent Loop — 사용자 입력에서 의도/시간/감정/중요도 4 필드 추출.
 * Gemini 3 Flash Preview LLM + 휴리스틱 fallback (timeout 2.5s).
 * Zod 미사용 (의존성 추가 회피) — manual validation.
 */

import { generateWithRotation, MODELS } from "./gemini";

export type AgentExtract = {
  intent: "promise" | "record" | "emotion" | "pattern";
  time: string | null; // ISO 8601 또는 null (휴리스틱이 채움)
  emotion: "great" | "good" | "low" | "down" | "neutral";
  importance: "low" | "medium" | "high";
};

const TIMEOUT_MS = 2500;

const SYSTEM_PROMPT = `너는 ohmyc 에이전트 분석기. 사용자 입력을 받아 4 필드 JSON만 응답.
다른 카피·markdown·코드 펜스 금지. JSON 키 외 텍스트 금지.

스키마:
{
  "intent": "promise" | "record" | "emotion" | "pattern",
  "time": "YYYY-MM-DDTHH:mm:ss+09:00" 또는 null,
  "emotion": "great" | "good" | "low" | "down" | "neutral",
  "importance": "low" | "medium" | "high"
}

분류 규칙:
- intent: 약속·할 일 = "promise" / 사실 기록 = "record" / 감정 표현 = "emotion" / 반복 습관 = "pattern"
- time: 입력에 명시 시간 ("내일 19시", "저녁 7시 30분") 있으면 KST ISO. 없으면 null
- emotion: 입력 톤에서 추측. 중립이면 "neutral"
- importance: 시급성·중요도

JSON만 응답.`;

function parseExtract(raw: unknown): AgentExtract {
  const obj = (raw && typeof raw === "object") ? (raw as Record<string, unknown>) : {};

  const intentRaw = obj.intent;
  const intent =
    intentRaw === "promise" || intentRaw === "record" || intentRaw === "emotion" || intentRaw === "pattern"
      ? intentRaw
      : "promise";

  const timeRaw = obj.time;
  const time = typeof timeRaw === "string" && timeRaw.length > 0 ? timeRaw : null;

  const emotionRaw = obj.emotion;
  const emotion =
    emotionRaw === "great" || emotionRaw === "good" || emotionRaw === "low" || emotionRaw === "down"
      ? emotionRaw
      : "neutral";

  const importanceRaw = obj.importance;
  const importance =
    importanceRaw === "low" || importanceRaw === "high" ? importanceRaw : "medium";

  return { intent, time, emotion, importance };
}

const FALLBACK: AgentExtract = {
  intent: "promise",
  time: null,
  emotion: "neutral",
  importance: "medium",
};

export async function extractAgentSignal(input: string): Promise<AgentExtract> {
  if (!input.trim()) return FALLBACK;

  try {
    const raw = await Promise.race([
      generateWithRotation(input, SYSTEM_PROMPT, { model: MODELS.default }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("agent-extract timeout")), TIMEOUT_MS),
      ),
    ]);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parseExtract(parsed);
  } catch {
    return FALLBACK;
  }
}
