"use client";
/**
 * Sheet — 셸 위 modal slide-up.
 * iOS HIG modal 패턴: 좌상단 "취소" / 우상단 primary 텍스트 버튼.
 * 가드레일: 새 keyframe 신설 금지 → CSS transition만 사용 (Breathe/Pulse 외 모션 금지).
 */

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  open: boolean;
  title?: string;
  cancelLabel?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onCancel: () => void;
  onPrimary?: () => void;
  children: ReactNode;
};

export function Sheet({
  open,
  title,
  cancelLabel = "취소",
  primaryLabel,
  primaryDisabled = false,
  onCancel,
  onPrimary,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let secondFrame: number | null = null;
      const firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(firstFrame);
        if (secondFrame !== null) cancelAnimationFrame(secondFrame);
      };
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <button
        type="button"
        aria-label="시트 닫기"
        onClick={onCancel}
        className="absolute inset-0 h-full w-full"
        style={{
          background: "rgba(0,0,0,0.36)",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms var(--ease-soft)",
          border: "none",
          cursor: "pointer",
        }}
      />

      <div
        className="absolute left-1/2 flex flex-col"
        style={{
          width: "min(100vw, var(--shell-max-width))",
          bottom: 0,
          top: 56,
          background: "var(--bg-canvas-light)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: "var(--el-3)",
          transform: visible
            ? "translate(-50%, 0)"
            : "translate(-50%, 100%)",
          transition: "transform 300ms var(--ease-soft)",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--border-soft)",
            margin: "8px auto 0",
            flexShrink: 0,
          }}
        />

        <header
          className="flex items-center justify-between"
          style={{
            padding: "10px 16px 12px",
            borderBottom: "1px solid var(--border-soft)",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="omc-pulse-on-tap"
            style={{
              fontSize: 15,
              color: "var(--fg-2)",
              fontWeight: 500,
              background: "transparent",
              border: "none",
              padding: "6px 4px",
              cursor: "pointer",
              minWidth: 48,
              textAlign: "left",
            }}
          >
            {cancelLabel}
          </button>

          {title ? (
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--fg-1)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>
          ) : (
            <span />
          )}

          {primaryLabel ? (
            <button
              type="button"
              onClick={primaryDisabled ? undefined : onPrimary}
              disabled={primaryDisabled}
              className="omc-pulse-on-tap"
              style={{
                fontSize: 15,
                color: primaryDisabled
                  ? "var(--fg-3)"
                  : "var(--omc-tint-deep)",
                fontWeight: 600,
                background: "transparent",
                border: "none",
                padding: "6px 4px",
                cursor: primaryDisabled ? "not-allowed" : "pointer",
                minWidth: 48,
                textAlign: "right",
              }}
            >
              {primaryLabel}
            </button>
          ) : (
            <span style={{ minWidth: 48 }} />
          )}
        </header>

        <div
          className="flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
