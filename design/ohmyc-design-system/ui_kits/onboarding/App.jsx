// App.jsx — interactive 4-screen click-thru pair onboarding.
// Two displays: single-phone interactive demo, or all 4 frames side-by-side.

function PhoneShell({ children, dark }) {
  return (
    <div style={{
      width: 390, height: 844,
      borderRadius: 54,
      background: dark ? '#000' : '#F5F5F7',
      boxShadow: '0 30px 70px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.10), inset 0 0 0 4px #1D1D1F',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-text)',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 122, height: 36, borderRadius: 22, background: '#000', zIndex: 50,
      }} />
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 16, left: 28, right: 28, zIndex: 30,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: dark ? '#fff' : '#000', fontSize: 15, fontWeight: 600,
        letterSpacing: '-0.01em',
      }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
            <rect x="0" y="6.5" width="3" height="4.5" rx="0.6" fill="currentColor"/>
            <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.6" fill="currentColor"/>
            <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill="currentColor"/>
            <rect x="13.5" y="0" width="3" height="11" rx="0.6" fill="currentColor"/>
          </svg>
          <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
            <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.4" fill="none"/>
            <rect x="2" y="2" width="17" height="7" rx="1.4" fill="currentColor"/>
          </svg>
        </span>
      </div>
      {children}
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 3,
        background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.28)', zIndex: 60,
      }} />
    </div>
  );
}

function App() {
  const [step, setStep] = React.useState(0);
  const [view, setView] = React.useState('demo'); // 'demo' | 'all'

  const screens = [
    { dark: true,  el: <WelcomeScreen onNext={() => setStep(1)} /> },
    { dark: true,  el: <MeetingScreen onNext={() => setStep(2)} onBack={() => setStep(0)} /> },
    { dark: false, el: <PromiseScreen onNext={() => setStep(3)} onBack={() => setStep(2)} /> },
    { dark: false, el: <ConfirmScreen onNext={() => setStep(0)} onBack={() => setStep(2)} /> },
  ];
  const labels = ['01 Welcome', '02 Meeting', '03 Promise', '04 Confirm'];

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#EAEAEC',
      // soft gradient stage so phones feel grounded
      backgroundImage: 'radial-gradient(circle at 50% 0%, #F5F5F7 0%, #E4E4E8 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px 60px',
      fontFamily: 'var(--font-text)',
    }}>
      {/* header */}
      <div style={{
        width: '100%', maxWidth: 1280,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 40, height: 28 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 28, height: 28, borderRadius: '50%', background: '#1D1D1F' }} />
            <div style={{ position: 'absolute', left: 18, top: 6, width: 20, height: 20, borderRadius: '50%', background: '#FF8552' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#1D1D1F' }}>ohmyc · pair onboarding</div>
            <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 2 }}>60s 첫 만남 — 4 screens</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: 4, background: '#FFFFFF', borderRadius: 999, border: '1px solid #D2D2D7' }}>
          {[['demo', '데모'], ['all', '전체 보기']].map(([k, label]) => (
            <button key={k} onClick={() => setView(k)}
              style={{
                padding: '8px 16px', borderRadius: 999, border: 'none',
                background: view === k ? '#1D1D1F' : 'transparent',
                color: view === k ? '#FFF' : '#1D1D1F',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-text)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'demo' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <PhoneShell dark={screens[step].dark}>
            {screens[step].el}
          </PhoneShell>
          {/* step navigator */}
          <div style={{
            display: 'flex', gap: 6, padding: 6, background: '#FFFFFF',
            borderRadius: 999, border: '1px solid #D2D2D7',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}>
            {labels.map((l, i) => (
              <button key={i} onClick={() => setStep(i)}
                style={{
                  padding: '8px 14px', borderRadius: 999, border: 'none',
                  background: step === i ? '#FF8552' : 'transparent',
                  color: step === i ? '#FFF' : '#1D1D1F',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-text)', letterSpacing: '0.02em',
                }}>{l}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#86868B', margin: 0, fontFamily: 'var(--font-text)' }}>
            CTA를 탭해서 다음 화면으로 진행해보세요. 마지막 화면에서 다시 처음으로 돌아갑니다.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, auto)',
          gap: 28, alignItems: 'start',
        }}>
          {screens.map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} data-screen-label={`0${i+1} ${labels[i].split(' ')[1]}`}>
              <div style={{ transform: 'scale(0.78)', transformOrigin: 'top center', height: 660 }}>
                <PhoneShell dark={s.dark}>{s.el}</PhoneShell>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'var(--font-text)' }}>{labels[i]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
