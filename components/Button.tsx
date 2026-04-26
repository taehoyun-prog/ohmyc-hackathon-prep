type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  full?: boolean;
  dark?: boolean;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  full = false,
  dark = false,
}: ButtonProps) {
  const styles: React.CSSProperties =
    variant === "primary"
      ? {
          background: disabled ? "var(--border-soft)" : "var(--omc-tint)",
          color: "var(--bg-canvas-white)",
        }
      : {
          background: "transparent",
          color: dark ? "var(--fg-on-dark-2)" : "var(--fg-2)",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="omc-pulse-on-tap rounded-capsule transition-opacity"
      style={{
        ...styles,
        padding: "16px 32px",
        fontSize: "var(--t-body)",
        fontWeight: "var(--w-semibold)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        width: full ? "100%" : "auto",
        minWidth: 200,
      }}
    >
      {children}
    </button>
  );
}
