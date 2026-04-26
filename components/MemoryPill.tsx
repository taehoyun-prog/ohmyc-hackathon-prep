/**
 * MemoryPill — LLM이 인용한 메모리 출처 시각화 (G3 기억 투명성).
 * "세린이 무엇을 기억하는지" 사용자 가시화.
 */

import type { MemoryItem } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  fact: "기억",
  event: "지난 일",
  promise: "약속",
  pattern: "습관",
  mood: "기분",
  system: "기록",
};

type Props = {
  memory: MemoryItem;
  compact?: boolean;
  highlighted?: boolean;
};

export function MemoryPill({ memory, compact = false, highlighted = false }: Props) {
  return (
    <div
      className="rounded-tag inline-flex items-center"
      style={{
        background: highlighted
          ? "rgba(255,133,82,0.22)"
          : "rgba(255,133,82,0.08)",
        border: highlighted
          ? "1px solid rgba(255,133,82,0.55)"
          : "1px solid rgba(255,133,82,0.18)",
        boxShadow: highlighted ? "0 2px 8px rgba(255,133,82,0.18)" : "none",
        padding: "4px 10px",
        gap: 6,
        maxWidth: compact ? 220 : 320,
        transition: "background 0.2s, border 0.2s",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--omc-tint-deep)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {KIND_LABEL[memory.kind] || memory.kind}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "var(--fg-2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {memory.content}
      </span>
    </div>
  );
}
