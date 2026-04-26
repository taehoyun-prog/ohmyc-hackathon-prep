/**
 * SpeechBubble — 캐릭터 발화 표시 (홈 proactive · 챗 메시지).
 * 2026-04-26 R6 정책 변경 후 신규.
 */

type Variant = "incoming" | "outgoing" | "system";

type Props = {
  text: string;
  variant?: Variant;
  tail?: boolean;
  className?: string;
};

export function SpeechBubble({
  text,
  variant = "incoming",
  tail = true,
  className = "",
}: Props) {
  const styles = STYLES[variant];

  return (
    <div className={`relative ${styles.wrap} ${className}`}>
      <div className={`${styles.bubble}`}>
        <span className={styles.text}>{text}</span>
        {tail && variant !== "system" && (
          <span aria-hidden className={styles.tail} />
        )}
      </div>
    </div>
  );
}

const STYLES = {
  incoming: {
    wrap: "max-w-[78%] self-start",
    bubble:
      "relative rounded-[18px] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.04)]",
    text: "text-[15px] leading-[1.45] text-[#1c1c1e]",
    tail:
      "absolute -left-[6px] bottom-[10px] w-[12px] h-[12px] bg-white rotate-45 border-l border-b border-[rgba(0,0,0,0.04)]",
  },
  outgoing: {
    wrap: "max-w-[78%] self-end",
    bubble:
      "relative rounded-[18px] px-4 py-3 shadow-[0_4px_14px_rgba(255,133,82,0.22)]",
    text: "text-[15px] leading-[1.45] text-white",
    tail: "absolute -right-[6px] bottom-[10px] w-[12px] h-[12px] rotate-45",
  },
  system: {
    wrap: "self-center",
    bubble:
      "rounded-capsule px-3 py-1.5 bg-[#f2f2f7] text-[#6e6e73] border border-[rgba(0,0,0,0.04)]",
    text: "text-[12px] leading-[1.3] tracking-[-0.01em]",
    tail: "",
  },
} as const;

export function TypingBubble({ className = "" }: { className?: string }) {
  return (
    <div className={`relative max-w-[78%] self-start ${className}`}>
      <div className="relative rounded-[18px] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.04)]">
        <span className="omc-typing-dots" aria-label="입력 중">
          <span className="omc-typing-dot" />
          <span className="omc-typing-dot" />
          <span className="omc-typing-dot" />
        </span>
        <span
          aria-hidden
          className="absolute -left-[6px] bottom-[10px] w-[12px] h-[12px] bg-white rotate-45 border-l border-b border-[rgba(0,0,0,0.04)]"
        />
      </div>
    </div>
  );
}

export function OutgoingBubble({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`relative max-w-[78%] self-end ${className}`}>
      <div
        className="relative rounded-[18px] px-4 py-3 shadow-[0_4px_14px_rgba(255,133,82,0.22)]"
        style={{ background: "var(--omc-tint)" }}
      >
        <span className="text-[15px] leading-[1.45] text-white">{text}</span>
        <span
          aria-hidden
          className="absolute -right-[5px] bottom-[10px] w-[12px] h-[12px] rotate-45"
          style={{ background: "var(--omc-tint)" }}
        />
      </div>
    </div>
  );
}
