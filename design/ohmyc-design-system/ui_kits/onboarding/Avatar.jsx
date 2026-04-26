// Avatar.jsx — breathing avatar (the only "character" surface in ohmyc).
// Placeholder — single Soft Apricot bloom + neutral disc.
// Always wrapped in `omc-breathe` animation per the motion contract.

function Avatar({ size = 184, mood = 'calm', label = '세린' }) {
  return (
    <div
      className="omc-breathe"
      style={{
        width: size, height: size, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      aria-label={`${label} avatar`}
    >
      {/* outer halo */}
      <div style={{
        position: 'absolute', inset: -size * 0.2, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,133,82,0.32) 0%, rgba(255,133,82,0) 65%)',
        filter: 'blur(12px)',
      }} />
      {/* inner glow */}
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,133,82,0.55) 0%, rgba(255,133,82,0) 75%)',
        filter: 'blur(2px)',
      }} />
      {/* core disc */}
      <div style={{
        width: size * 0.78, height: size * 0.78, borderRadius: '50%',
        background: 'radial-gradient(circle at 36% 32%, #FFFFFF 0%, #F5F5F7 55%, #E2E2E6 100%)',
        boxShadow: 'inset -8px -10px 24px rgba(255,133,82,0.18), inset 6px 6px 18px rgba(255,255,255,0.6)',
        position: 'relative',
      }}>
        {/* small apricot accent dot — the "spark" */}
        <div style={{
          position: 'absolute', right: '22%', top: '38%',
          width: size * 0.13, height: size * 0.13, borderRadius: '50%',
          background: '#FF8552', boxShadow: '0 4px 14px rgba(255,133,82,0.45)',
        }} />
      </div>
    </div>
  );
}

window.Avatar = Avatar;
