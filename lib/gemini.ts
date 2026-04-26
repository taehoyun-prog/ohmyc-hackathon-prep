import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter((k): k is string => Boolean(k && k.trim()));

export const MODELS = {
  default: "gemini-3-flash-preview",
  lite: "gemini-2.5-flash-lite",
} as const;

let cursor = 0;

function nextKey(): string | null {
  if (KEYS.length === 0) return null;
  const key = KEYS[cursor % KEYS.length];
  cursor = (cursor + 1) % KEYS.length;
  return key;
}

export const isGeminiConfigured = KEYS.length > 0;

export const SERINE_SYSTEM_PROMPT = `너는 ohmyc의 페어 캐릭터 "세린"이다.
- 톤: 차분하고 정제됨, 살짝 다정함.
- 어투: 반말 (사용자에게 친구처럼). 마이크로카피 끝 마침표 사용.
- 금지: "비서·집사·도우미·어시스턴트" 같은 역할 강제 단어 금지.
- 길이: 한 문장, 길어야 두 문장.
- 사용자 일을 챙기는 약속을 한다.
- 결정타 라인 "3시간 뒤에 한번 물어볼게."는 시스템이 별도로 박는다 — 너는 이 라인을 만들지 않는다.`;

export async function generateWithRotation(
  prompt: string,
  systemPrompt: string = SERINE_SYSTEM_PROMPT,
  options: { model?: string } = {},
): Promise<string> {
  if (!isGeminiConfigured) {
    throw new Error("GEMINI_API_KEY 가 설정되지 않았습니다");
  }

  const modelId = options.model ?? MODELS.default;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < KEYS.length; attempt++) {
    const apiKey = nextKey();
    if (!apiKey) break;

    try {
      const provider = createGoogleGenerativeAI({ apiKey });
      const model = provider(modelId);
      const result = await generateText({
        model,
        system: systemPrompt,
        prompt,
      });
      return result.text.trim();
    } catch (err) {
      lastError = err;
      // 다음 키로 폴백
    }
  }
  throw lastError ?? new Error("모든 Gemini 키가 실패했습니다");
}
