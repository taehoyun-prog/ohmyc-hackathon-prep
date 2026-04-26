type AvatarProps = { size?: number; bloom?: boolean };

export function Avatar({ size = 184, bloom = true }: AvatarProps) {
  const dotSize = size * 0.13;
  return (
    <div
      className="omc-breathe relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {bloom && (
        <div
          aria-hidden
          className="absolute rounded-capsule"
          style={{
            inset: -16,
            background:
              "radial-gradient(circle, rgba(255,133,82,0.22) 0%, rgba(255,133,82,0) 65%)",
          }}
        />
      )}
      <div
        className="rounded-capsule relative"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at 36% 32%, #FFFFFF 0%, #F5F5F7 60%, #E2E2E6 100%)",
          boxShadow:
            "inset -6px -8px 18px rgba(255,133,82,0.18), inset 4px 4px 14px rgba(255,255,255,0.8)",
        }}
      >
        <div
          aria-hidden
          className="absolute rounded-capsule"
          style={{
            right: "20%",
            top: "36%",
            width: dotSize,
            height: dotSize,
            background: "var(--omc-tint)",
            boxShadow: "0 4px 14px rgba(255,133,82,0.4)",
          }}
        />
      </div>
    </div>
  );
}

export function BloomCircle({ size = 220 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="omc-breathe rounded-capsule"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, rgba(255,133,82,0.55) 0%, rgba(255,133,82,0.18) 38%, rgba(255,133,82,0) 70%)",
        filter: "blur(6px)",
      }}
    />
  );
}
