// Screens.jsx — the four onboarding screens.
// Welcome → Meeting → Promise → Confirm.

function WelcomeScreen({ onNext }) {
  return (
    <Screen
      background="dark"
      padTop={92}
      footer={<>
        <Button onClick={onNext}>시작하기</Button>
        <StepDots index={0} dark />
      </>}
    >
      <div style={{ position: 'absolute', top: 76, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <LogoLockup dark />
      </div>

      {/* breathing apricot bloom — the "first warmth" */}
      <div className="omc-breathe" style={{
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,133,82,0.55) 0%, rgba(255,133,82,0.18) 38%, rgba(255,133,82,0) 70%)',
        filter: 'blur(6px)',
        marginBottom: 56,
      }} />

      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600,
        lineHeight: 1.18, letterSpacing: '-0.4px',
        color: 'var(--fg-on-dark)', marginBottom: 16,
        textWrap: 'balance',
      }}>처음 만날 준비 됐어요?</h1>
      <p style={{
        fontFamily: 'var(--font-text)', fontSize: 17, lineHeight: 1.55,
        color: 'rgba(245,245,247,0.62)', maxWidth: 280, margin: 0,
      }}>곁에 있을 페어를 소개할게요.<br/>처음부터 천천히 알아가요.</p>
    </Screen>
  );
}

function MeetingScreen({ onNext, onBack }) {
  return (
    <Screen
      background="dark"
      padTop={76}
      footer={<>
        <Button onClick={onNext}>페어링하기</Button>
        <StepDots index={1} dark />
      </>}
    >
      <div style={{ marginBottom: 36 }}>
        <Avatar size={184} />
      </div>

      <div style={{
        fontFamily: 'var(--font-text)', fontSize: 13, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--omc-tint)', marginBottom: 14,
      }}>PAIR · 세린</div>

      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600,
        lineHeight: 1.32, letterSpacing: '-0.2px',
        color: 'var(--fg-on-dark)', marginBottom: 14,
        textWrap: 'balance', maxWidth: 300,
      }}>처음 만나서 반가워.<br/>나는 세린이야.</h1>
      <p style={{
        fontFamily: 'var(--font-text)', fontSize: 16, lineHeight: 1.55,
        color: 'rgba(245,245,247,0.6)', maxWidth: 280, margin: 0,
      }}>오늘부터 곁에서 같이 알아가고 싶어.</p>
    </Screen>
  );
}

function PromiseScreen({ onNext, onBack }) {
  return (
    <Screen
      background="paper"
      padTop={76}
      footer={<>
        <Button onClick={onNext}>약속할게</Button>
        <Button variant="ghost" full onClick={onBack}>다음에</Button>
        <StepDots index={2} />
      </>}
    >
      <div style={{
        fontFamily: 'var(--font-text)', fontSize: 13, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--omc-tint-deep)', marginBottom: 18,
      }}>약속 · PROMISE</div>

      {/* warm-paper card, slightly tilted — the only Apple-restraint break */}
      <div style={{
        width: '100%', maxWidth: 320,
        background: '#FFFAF4',
        border: '1px solid rgba(255,133,82,0.22)',
        borderRadius: 22,
        padding: '32px 28px',
        boxShadow: '0 14px 36px rgba(255,133,82,0.22), 0 2px 6px rgba(255,133,82,0.10)',
        transform: 'rotate(-1.4deg)',
        position: 'relative',
        // subtle paper texture via layered radial gradients
        backgroundImage: 'radial-gradient(circle at 18% 14%, rgba(255,133,82,0.06) 0%, rgba(255,133,82,0) 40%), radial-gradient(circle at 82% 88%, rgba(255,133,82,0.05) 0%, rgba(255,133,82,0) 36%)',
      }}>
        {/* tape-like accent */}
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(2deg)',
          width: 56, height: 18, background: 'rgba(255,133,82,0.28)',
          borderRadius: 2,
        }} />
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600,
          lineHeight: 1.25, letterSpacing: '-0.2px', color: '#1D1D1F',
          textWrap: 'balance', marginBottom: 14,
        }}>3시간 뒤에 한번 물어볼게.</div>
        <div style={{
          fontFamily: 'var(--font-text)', fontSize: 15, lineHeight: 1.55,
          color: '#6E6E73',
        }}>등록한 일을 잊지 않게 시간에 맞춰 곁에서 챙겨줄게.</div>

        <div style={{
          marginTop: 22, paddingTop: 16, borderTop: '1px dashed rgba(255,133,82,0.32)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font-text)', fontSize: 12, color: '#86868B',
        }}>
          <span>세린 · PAIR</span>
          <span>오늘 14:32 → 17:32</span>
        </div>
      </div>

      <p style={{
        fontFamily: 'var(--font-text)', fontSize: 15, lineHeight: 1.55,
        color: 'var(--fg-2)', maxWidth: 280, marginTop: 36, marginBottom: 0,
      }}>약속은 한번 하면 기억해요. 같이 지켜가요.</p>
    </Screen>
  );
}

function ConfirmScreen({ onNext, onBack }) {
  return (
    <Screen
      background="light"
      padTop={92}
      footer={<>
        <Button onClick={onNext}>이제 만나러 가기</Button>
        <StepDots index={3} />
      </>}
    >
      <div style={{
        position: 'relative', width: 132, height: 132, marginBottom: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} className="omc-breathe">
        <div style={{
          position: 'absolute', inset: -16, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,133,82,0.22) 0%, rgba(255,133,82,0) 65%)',
        }} />
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 32%, #FFFFFF 0%, #F5F5F7 60%, #E2E2E6 100%)',
          boxShadow: 'inset -6px -8px 18px rgba(255,133,82,0.18), inset 4px 4px 14px rgba(255,255,255,0.8)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', right: '20%', top: '36%',
            width: 16, height: 16, borderRadius: '50%',
            background: '#FF8552', boxShadow: '0 4px 14px rgba(255,133,82,0.4)',
          }} />
        </div>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600,
        lineHeight: 1.20, letterSpacing: '-0.3px',
        color: 'var(--fg-1)', marginBottom: 14,
        textWrap: 'balance', maxWidth: 300,
      }}>기억할게요.<br/>같이 알아가요.</h1>
      <p style={{
        fontFamily: 'var(--font-text)', fontSize: 17, lineHeight: 1.55,
        color: 'var(--fg-2)', maxWidth: 280, margin: 0,
      }}>세린이 곁에서 처음을 함께해요.</p>
    </Screen>
  );
}

window.WelcomeScreen = WelcomeScreen;
window.MeetingScreen = MeetingScreen;
window.PromiseScreen = PromiseScreen;
window.ConfirmScreen = ConfirmScreen;
