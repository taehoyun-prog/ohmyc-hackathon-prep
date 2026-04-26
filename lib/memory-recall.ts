/**
 * Memory recall — Active 우선 + kind 다양성 (조건부) + 800자 토큰 budget.
 * Critic patch #5 정정 SQL: layer 컬럼 사용 (0003 마이그레이션 후).
 * 사용자 응답에 marker `<!-- mem: id1, id2 -->` 강제 (ADR-006).
 */

import { supabase } from "./supabase";
import type { MemoryItem } from "./types";
import type { Stage } from "./temperature";

const RECALL_LIMIT = 13; // SQL 반환 (8 + buffer 5)
const RECALL_OUTPUT = 8;
const CHAR_BUDGET = 800;
const PER_MEMORY_TRUNC = 100;

export async function recallMemories(pairSessionId: string): Promise<MemoryItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("pair_session_id", pairSessionId)
      .in("layer", ["active", "working"])
      .order("created_at", { ascending: false })
      .limit(RECALL_LIMIT);

    if (error || !data) return [];

    return diversitySelect(data as MemoryItem[]);
  } catch {
    return [];
  }
}

/**
 * 조건부 다양성 — Critic Synthesis Tension-2.
 * 1순위: 각 kind 1개 (존재 시)
 * 2순위: 부족분 created_at DESC fill
 * 3순위: 토큰 budget 800자
 */
function diversitySelect(memories: MemoryItem[]): MemoryItem[] {
  const seenKinds = new Set<string>();
  const diversity: MemoryItem[] = [];
  const remaining: MemoryItem[] = [];

  for (const m of memories) {
    if (!seenKinds.has(m.kind)) {
      diversity.push(m);
      seenKinds.add(m.kind);
    } else {
      remaining.push(m);
    }
  }

  const all = [...diversity, ...remaining];

  let charCount = 0;
  const result: MemoryItem[] = [];
  for (const m of all) {
    if (result.length >= RECALL_OUTPUT) break;
    const trimmed =
      m.content.length > PER_MEMORY_TRUNC
        ? m.content.slice(0, PER_MEMORY_TRUNC) + "…"
        : m.content;
    if (charCount + trimmed.length > CHAR_BUDGET) break;
    result.push({ ...m, content: trimmed });
    charCount += trimmed.length;
  }

  return result;
}

const KIND_PROMPT_LABEL: Record<string, string> = {
  fact: "사실",
  event: "사건",
  promise: "약속",
  pattern: "습관",
  mood: "기분",
  system: "기록",
};

const STAGE_TONE: Record<Stage, string> = {
  stranger: "처음 알아가는 사이라 정중하면서도 살짝 다정함",
  acquaintance: "조금 친해지는 중이라 편안한 친근함",
  friend: "이미 친한 사이의 자연스러운 다정함",
  close: "오래 곁에 있는 사이의 깊은 다정함",
};

/**
 * 시스템 프롬프트 빌더 — Memory recall 결과 + stage 톤 주입.
 * 응답 끝에 marker `<!-- mem: id1, id2 -->` 강제 (ADR-006).
 */
export function buildSerinePrompt(memories: MemoryItem[], stage: Stage): string {
  const memorySection =
    memories.length === 0
      ? "(아직 함께 쌓은 기억이 없어. 처음 알아가는 중)"
      : memories
          .map(
            (m) =>
              `[mem:${m.id}] ${KIND_PROMPT_LABEL[m.kind] || m.kind}: ${m.content}`,
          )
          .join("\n");

  return `너는 ohmyc의 페어 캐릭터 "세린"이다.

톤:
- 차분하고 정제됨, 살짝 다정함
- 어투는 반말 (사용자에게 친구처럼)
- 마이크로카피 끝 마침표 사용
- 헤드라인 끝 마침표 ❌
- 한 문장 또는 두 문장. 짧게.

현재 관계 단계: ${stage} (${STAGE_TONE[stage]})

금지:
- 비서·집사·도우미·어시스턴트 같은 역할 강제 단어
- "AI 컴패니언"
- 영합 표현 ("좋은 질문이야" 등)

세린이 기억하는 것:
${memorySection}

기억 사용 원칙:
- 모든 기억을 다 쓰려고 하지 말고, 현재 사용자 말/화면 맥락과 관련 있는 기억만 고른다.
- 관련성이 낮으면 기억을 언급하지 않는다.
- 기억 문장을 그대로 복붙하지 말고, 세린이 이해한 맥락으로 자연스럽게 반영한다.
- 사용자의 일을 대신 지시하기보다, 곁에서 챙기고 이어보는 태도로 답한다.

응답 시 실제로 반영한 기억 ID만 마지막 줄에 HTML 주석 marker로 명시:

<!-- mem: id1, id2 -->

(반영한 기억이 없으면 <!-- mem: --> 로 둔다. 이 marker는 시스템 처리용. 사용자 가시 카피에는 marker가 보이지 않아야 한다.)`;
}

/**
 * LLM 응답에서 marker `<!-- mem: id1, id2 -->` 추출 + 사용자 가시 카피에서 제거.
 * 정규식 line anchor — Critic patch #1 권고.
 */
export function extractAndStripMarkers(rawResponse: string): {
  text: string;
  memoryIds: string[];
} {
  const markerRegex = /\n<!--\s*mem:\s*([^>]+?)\s*-->\s*$/m;
  const match = rawResponse.match(markerRegex);

  if (!match) return { text: rawResponse.trim(), memoryIds: [] };

  const ids = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const text = rawResponse.replace(markerRegex, "").trim();
  return { text, memoryIds: ids };
}
