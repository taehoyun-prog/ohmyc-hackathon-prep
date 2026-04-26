/**
 * TemperaturePill — Bond State UI (P1-1).
 * 균형점 모델 (lib/temperature.ts) 결과 표시.
 */

type Props = {
  temp: number;
  delta?: number;
  size?: "sm" | "md";
};

export function TemperaturePill({ temp, delta, size = "md" }: Props) {
  const isPositive = delta != null && delta > 0;
  const isNegative = delta != null && delta < 0;

  return (
    <div
      className="rounded-capsule inline-flex items-center"
      style={{
        background: "rgba(255,133,82,0.12)",
        border: "1px solid rgba(255,133,82,0.28)",
        padding: size === "sm" ? "4px 10px" : "6px 14px",
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: size === "sm" ? 12 : 14,
          fontWeight: 600,
          color: "var(--omc-tint-deep)",
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {temp.toFixed(1)}°
      </span>
      {delta != null && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: isPositive
              ? "#34C759"
              : isNegative
                ? "var(--fg-3)"
                : "var(--fg-3)",
            opacity: delta === 0 ? 0.4 : 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {isPositive ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
        </span>
      )}
    </div>
  );
}
