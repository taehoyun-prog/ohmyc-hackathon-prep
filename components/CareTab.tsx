"use client";
/**
 * CareTab — 기능 창고 (App Drawer).
 * 2026-04-26 design pivot 신규. 5 도메인 grid, 투두만 활성화 (다음 사이클 확장).
 */

type Props = {
  onOpenTodo: () => void;
  onOpenCalendar: () => void;
};

const ITEMS: {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
  caption?: string;
}[] = [
  { key: "calendar", label: "캘린더", icon: "calendar", enabled: true },
  { key: "todo", label: "투두", icon: "check", enabled: true },
  { key: "meal", label: "식단", icon: "bowl", enabled: false, caption: "곧 알아갈게" },
  { key: "health", label: "헬스", icon: "muscle", enabled: false, caption: "곧 알아갈게" },
  { key: "routine", label: "루틴", icon: "loop", enabled: false, caption: "곧 알아갈게" },
];

export function CareTab({ onOpenTodo, onOpenCalendar }: Props) {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-canvas-light)" }}
    >
      <div className="flex-1 overflow-y-auto omc-scroll-y px-5 pt-12 pb-32">
        <h1
          className="mb-2 font-display"
        style={{
          fontSize: 28,
          lineHeight: 1.25,
          letterSpacing: "-0.3px",
          fontWeight: 600,
          color: "var(--fg-1)",
        }}
      >
        기능 모음
      </h1>
      <p
        className="mb-9"
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--fg-2)",
        }}
      >
        챗에서 대화하면 자동으로 정리해 둬.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={
              item.enabled
                ? item.key === "calendar"
                  ? onOpenCalendar
                  : onOpenTodo
                : undefined
            }
            disabled={!item.enabled}
            className="omc-tap flex flex-col items-center gap-2 rounded-card-md bg-white p-3 text-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] disabled:opacity-55"
            style={{ aspectRatio: "1 / 1" }}
          >
            <CareIcon name={item.icon} active={item.enabled} />
            <span
              className="text-[13px] font-medium"
              style={{ color: item.enabled ? "var(--fg-1)" : "var(--fg-3)" }}
            >
              {item.label}
            </span>
            {item.caption && (
              <span className="text-[10px]" style={{ color: "var(--fg-3)" }}>
                {item.caption}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  </div>
);
}

function CareIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "var(--omc-tint)" : "#b0b0b8";
  const stroke = 1.7;
  switch (name) {
    case "calendar":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="5.5" width="17" height="14" rx="2.5" stroke={color} strokeWidth={stroke} />
          <path d="M3.5 10h17" stroke={color} strokeWidth={stroke} />
          <path d="M8 3v4M16 3v4" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke={color} strokeWidth={stroke} />
          <path d="M7.5 12.2l3.2 3.2 6.1-6.4" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "bowl":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M3 11.5h18a8.5 8.5 0 0 1-8.5 8.5h-1A8.5 8.5 0 0 1 3 11.5z" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
          <circle cx="9" cy="7" r="1.6" stroke={color} strokeWidth={stroke} />
          <circle cx="14.5" cy="6" r="1.6" stroke={color} strokeWidth={stroke} />
        </svg>
      );
    case "muscle":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M5 12c0-3.3 2.6-6 5.7-6 2.5 0 4.6 1.5 5.4 3.8l2.2-.4-1 5.6h-2.6c-.7 2.3-2.8 3.9-5.4 3.9-3.1 0-5.7-2.7-5.7-6z" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
        </svg>
      );
    case "loop":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M5 8a6 6 0 0 1 11 .5M19 16a6 6 0 0 1-11-.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          <path d="M16 5v3.5h-3.5M8 19v-3.5h3.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
