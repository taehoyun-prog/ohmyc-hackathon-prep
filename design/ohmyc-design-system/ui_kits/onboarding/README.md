# Pair Onboarding — UI Kit

The 60-second "first meeting" demo. Four mobile screens (390×844) inside an iPhone shell.

| Step | Screen | Background | CTA |
|---|---|---|---|
| 01 | Welcome — *처음 만날 준비 됐어요?* | dark | 시작하기 |
| 02 | Meeting — *나는 세린이야* | dark | 페어링하기 |
| 03 | **Promise** — *3시간 뒤에 한번 물어볼게* | warm-paper | 약속할게 |
| 04 | Confirm — *기억할게요. 같이 알아가요* | light | 이제 만나러 가기 |

## Files
- `index.html` — entry, dual view (interactive demo / all-frames grid)
- `App.jsx` — orchestration + phone shell
- `Screens.jsx` — Welcome / Meeting / Promise / Confirm
- `Avatar.jsx` — breathing placeholder avatar
- `Button.jsx` — capsule CTA (primary / secondary / quiet / ghost)
- `Screen.jsx` — shared scaffold + LogoLockup + StepDots
- `ios-frame.jsx` — starter iOS frame (reference only — App.jsx uses an inline shell tuned to 390×844)

## Self-check
- [x] No chat artifacts (bubbles / input bar / sidebar / message log)
- [x] Single accent — `#FF8552` only
- [x] Korean-only copy, no forbidden words
- [x] ≥3 radius values per screen (capsule 980 / card 22 / chip 5 / circle 50%)
- [x] Avatar → Breathe attached on screens 02 and 04
- [x] Promise screen breaks Apple-restraint with warm-paper texture + tilt — by design
