/**
 * TabBar — 4탭 하단 셸 (홈/챗/케어/마이).
 * 2026-04-26 design pivot 신규.
 */

export type TabKey = "home" | "chat" | "care" | "me";

type Props = {
  current: TabKey;
  onChange: (key: TabKey) => void;
};

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "home", label: "홈", icon: "house" },
  { key: "chat", label: "챗", icon: "bubble" },
  { key: "care", label: "케어", icon: "puzzle" },
  { key: "me", label: "마이", icon: "user" },
];

export function TabBar({ current, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-[52] w-full max-w-md -translate-x-1/2 border-t border-[rgba(0,0,0,0.06)] bg-white/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex h-[58px] items-center justify-around px-2">
        {TABS.map((t) => {
          const active = t.key === current;
          return (
            <li key={t.key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(t.key)}
                className="omc-tap flex w-full flex-col items-center gap-[2px] py-1"
                aria-current={active ? "page" : undefined}
              >
                <TabIcon name={t.icon} active={active} />
                <span
                  className="text-[10.5px] tracking-[-0.01em]"
                  style={{ color: active ? "var(--omc-tint)" : "#8e8e93" }}
                >
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "var(--omc-tint)" : "#8e8e93";
  const stroke = 1.7;
  switch (name) {
    case "house":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3.5 11.5L12 4l8.5 7.5V20a1 1 0 0 1-1 1h-4v-6h-7v6h-4a1 1 0 0 1-1-1v-8.5z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bubble":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V14a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V16.5a2.5 2.5 0 0 1-2-2.5V6.5z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "puzzle":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 4h2a1 1 0 0 1 1 1v1.5a1.5 1.5 0 1 0 3 0V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.5a1.5 1.5 0 1 0 0 3H19a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 1 0-3 0V19a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1.5a1.5 1.5 0 1 0 0-3H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1V5a1 1 0 0 1 0-1z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "user":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8.5" r="3.5" stroke={color} strokeWidth={stroke} />
          <path
            d="M5 19.5c1.4-3.4 4-5 7-5s5.6 1.6 7 5"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
