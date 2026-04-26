/**
 * Real Agent Loop — 사용자 입력에서 의도/시간/감정/중요도 4 필드 추출.
 * Gemini 3 Flash Preview LLM + 휴리스틱 fallback (timeout 2.5s).
 * Zod 미사용 (의존성 추가 회피) — manual validation.
 */

import { generateWithRotation, MODELS } from "./gemini";
import type { ChatMessage } from "./types";

export type AgentExtract = {
  intent: "promise" | "record" | "emotion" | "pattern" | "chat" | "check";
  time: string | null; // ISO 8601 또는 null
  emotion: "great" | "good" | "low" | "down" | "neutral";
  importance: "low" | "medium" | "high";
  refinedText: string | null; // 정제된 할 일/기록 텍스트
};

const TIMEOUT_MS = 2500;

const SYSTEM_PROMPT = `너는 ohmyc 에이전트 분석기. 사용자 발화와 최근 대화를 보고 의도/시간/감정/중요도를 추출한다.

스키마:
{
  "intent": "promise" | "record" | "emotion" | "pattern" | "chat" | "check",
  "time": "YYYY-MM-DDTHH:mm:ss+09:00" 또는 null,
  "emotion": "great" | "good" | "low" | "down" | "neutral",
  "importance": "low" | "medium" | "high",
  "refinedText": "정제된 문구" 또는 null
}

분류 규칙:
1. intent:
   - "promise": 사용자가 새롭게 무언가를 하겠다고 약속하거나, 에이전트에게 시키는 경우. (예: "약 먹을게", "7시에 깨워줘")
   - "record": 과거의 사실이나 정보를 알려주는 경우. (예: "방금 밥 먹었어", "오늘 날씨 좋더라")
   - "emotion": 할 일이나 정보보다는 감정 상태가 주된 경우.
   - "pattern": 반복되는 습관이나 선호도를 말하는 경우.
   - "check": 사용자가 이미 등록된 약속이나 과거의 기억을 확인/조회하려는 경우. (예: "오늘 약속 뭐 있어?", "아까 내가 뭐라 그랬지?", "나 어제 뭐 먹었지?", "나 배고픈데 뭐 먹을지 알아?")
   - "chat": 위 어디에도 해당하지 않는 단순 잡담, 인사, 또는 이미 논의 중인 약속에 대한 추임새/확인. (예: "응", "알겠어", "그래")

2. refinedText:
   - "promise"나 "record"일 때만 작성. (나머지는 null)
   - 사용자 발화에서 군더더기(추임새, 조사 등)를 빼고 핵심 동작/사실만 남긴 한글 문구.
   - 예: "이따 저녁에 단백질 좀 챙겨 먹어야겠다" -> "저녁에 단백질 챙겨 먹기"
   - 예: "어제 너무 늦게 잤어" -> "어제 늦게 취침"

3. time: KST ISO 8601. 명시적 시간 없으면 null.
4. context: 최근 대화를 참고하여, 이미 등록된 약속을 다시 확인하는 말인지 새 약속인지 구분하라. 단순 확인은 "chat"으로 분류한다.

JSON만 응답.`;

function parseExtract(raw: unknown): AgentExtract {
  const obj = (raw && typeof raw === "object") ? (raw as Record<string, unknown>) : {};

  const intentRaw = obj.intent;
  const intent =
    intentRaw === "promise" || intentRaw === "record" || intentRaw === "emotion" || intentRaw === "pattern" || intentRaw === "chat" || intentRaw === "check"
      ? intentRaw
      : "chat";

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

  const refinedText = typeof obj.refinedText === "string" ? obj.refinedText : null;

  return { intent, time, emotion, importance, refinedText };
}

const FALLBACK: AgentExtract = {
  intent: "chat",
  time: null,
  emotion: "neutral",
  importance: "medium",
  refinedText: null,
};

export async function extractAgentSignal(
  input: string,
  history: ChatMessage[] = [],
): Promise<AgentExtract> {
  if (!input.trim()) return FALLBACK;

  const historyText = history.length > 0
    ? history.map(m => `${m.role === 'user' ? '사용자' : '세린'}: ${m.text}`).join('\n')
    : "(이전 대화 없음)";

  const prompt = `최근 대화:
${historyText}

사용자 발화: "${input}"`;

  try {
    const raw = await Promise.race([
      generateWithRotation(prompt, SYSTEM_PROMPT, { model: MODELS.default }),
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
