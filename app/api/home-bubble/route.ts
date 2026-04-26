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

type Body = {
  pairSessionId?: string;
  activeTodoText?: string;
};

const FALLBACK = "지금 필요한 일부터 차분히 챙겨볼게.";

function buildHomeBubblePrompt(activeTodoText: string): string {
  return `홈 화면 말풍선에 들어갈 세린의 한 문장을 작성해.

현재 화면 맥락:
- 사용자는 홈에서 진행 중인 약속을 보고 있다.
- 가장 우선인 진행 약속: "${activeTodoText}"

판단 기준:
- 위 약속을 그대로 복붙하지 말고, 세린이 기억과 현재 맥락을 보고 스스로 고른 말처럼 답한다.
- 기억에 관련 맥락이 있으면 은근히 반영한다. 관련 없으면 억지로 언급하지 않는다.
- 사용자가 해야 할 일을 대신 명령하지 말고, 곁에서 챙긴다는 태도로 말한다.
- "시간 되면 먼저 물어볼게", "잊지 않게 챙겨볼게" 같은 고정 문구를 반복하지 않는다.
- 정확한 시간 약속 카피("3시간 뒤에", "이따 HH:MM에", "내일 HH:MM에")는 만들지 않는다.
- 한 문장, 35자 안팎.`;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const pairSessionId = body.pairSessionId?.trim();
  const activeTodoText = (body.activeTodoText ?? "").trim();

  if (!pairSessionId || !isGeminiConfigured || !activeTodoText) {
    return NextResponse.json({
      text: FALLBACK,
      fallback: true,
    });
  }

  try {
    const [memories, temp] = await Promise.all([
      recallMemories(pairSessionId),
      getOrCreateTemperature(pairSessionId),
    ]);
    const stage = getStage(Number(temp.current_temp), temp.level);
    const systemPrompt = buildSerinePrompt(memories, stage);
    const raw = await generateWithRotation(
      buildHomeBubblePrompt(activeTodoText),
      systemPrompt,
      { model: MODELS.lite },
    );
    const { text, memoryIds } = extractAndStripMarkers(raw);

    return NextResponse.json({
      text: text || FALLBACK,
      memoryIds,
      stage,
    });
  } catch (err) {
    return NextResponse.json(
      {
        text: FALLBACK,
        fallback: true,
        error: String(err),
      },
      { status: 200 },
    );
  }
}
