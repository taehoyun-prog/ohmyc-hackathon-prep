// Screen.jsx — shared screen scaffolding inside the iOS frame.
// Provides centered, single-CTA layout with safe bottom inset.

function Screen({ background = 'light', children, footer, padTop = 76 }) {
  const bg = {
    light: 'var(--bg-canvas-light)',
    white: '#FFFFFF',
    dark:  '#000000',
    paper: 'var(--omc-tint-paper)',
  }[background];

  const isDark = background === 'dark';

  return (
    <div style={{
      height: '100%', width: '100%',
      background: bg,
      color: isDark ? 'var(--fg-on-dark)' : 'var(--fg-1)',
      display: 'flex', flexDirection: 'column',
      paddingTop: padTop,
      paddingLeft: 24, paddingRight: 24, paddingBottom: 56,
      boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        {children}
      </div>
      {footer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {footer}
        </div>
      )}
    </div>
  );
}

// Logo lockup (ohmyc-mark, scaled down) — used in screen corners.
function LogoLockup({ dark = false }) {
  const dotA = dark ? '#F5F5F7' : '#1D1D1F';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-display)',
      fontWeight: 600, fontSize: 18, letterSpacing: '-0.02em',
      color: dark ? '#F5F5F7' : '#1D1D1F',
    }}>
      <div style={{ position: 'relative', width: 28, height: 18 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: 18, height: 18, borderRadius: '50%', background: dotA,
        }} />
        <div style={{
          position: 'absolute', left: 12, top: 4,
          width: 13, height: 13, borderRadius: '50%', background: '#FF8552',
        }} />
      </div>
      <span>ohmyc</span>
    </div>
  );
}

// StepDots — quiet 4-step indicator for the onboarding chrome.
function StepDots({ index = 0, total = 4, dark = false }) {
  const active = dark ? '#F5F5F7' : '#1D1D1F';
  const dim = dark ? 'rgba(245,245,247,0.28)' : 'rgba(29,29,31,0.18)';
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === index ? 18 : 6, height: 6, borderRadius: 3,
          background: i === index ? active : dim,
          transition: 'all 240ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      ))}
    </div>
  );
}

window.Screen = Screen;
window.LogoLockup = LogoLockup;
window.StepDots = StepDots;
