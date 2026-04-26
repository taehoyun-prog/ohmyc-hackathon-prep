// Button.jsx — capsule CTA. Pulse-on-tap, single accent.
// Variants: primary (apricot fill), secondary (ink fill), quiet (white w/ border).

function Button({ children, variant = 'primary', onClick, full = true, disabled = false }) {
  const palette = {
    primary:   { bg: 'var(--omc-tint)',     fg: '#FFFFFF', border: 'transparent' },
    secondary: { bg: '#1D1D1F',             fg: '#FFFFFF', border: 'transparent' },
    quiet:     { bg: '#FFFFFF',             fg: '#1D1D1F', border: '1px solid #D2D2D7' },
    ghost:     { bg: 'transparent',         fg: 'var(--omc-tint-deep)', border: 'transparent' },
  }[variant];

  const [pressed, setPressed] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={disabled}
      className="omc-pulse-on-tap"
      style={{
        width: full ? '100%' : 'auto',
        background: palette.bg,
        color: palette.fg,
        border: palette.border,
        borderRadius: 'var(--r-capsule)',
        padding: '17px 28px',
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-body)',
        fontWeight: 'var(--w-semibold)',
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1), background 200ms ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  );
}

window.Button = Button;
