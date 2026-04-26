# ohmyc Design System

> *"대중의 첫 에이전트는 캐릭터다."*
> *"우리는 채팅이 아니라 에이전트를 만든다."*

ohmyc는 채팅 앱이 아닙니다. **페어링하는 인격을 만나는 모바일 웹앱.**
ChatGPT가 도구·휘발성이라면, ohmyc는 **기억(Memory) + 행동(Action) + 성장(Growth)** 을 가진 캐릭터 에이전트입니다.

---

## Product context

| | |
|---|---|
| **이름** | ohmyc (도메인: ohmyc.ai) |
| **카테고리** | 글로벌 캐릭터 에이전트 마켓플레이스 |
| **타깃** | 글로벌 20–30대 여성. 캐릭터/IP 친화. |
| **첫 화면** | 모바일 웹앱 (390×844, `max-w-md` 단일 컬럼) |
| **언어** | 한국어 우선 |
| **데모 시나리오** | 60초 "페어 첫 만남" 4-screen 온보딩 |
| **Stack** | Next.js 15 / Tailwind / Vercel AI SDK / Google Gemini 3 Flash (`gemini-3-flash`) + Supabase 익명 인증 |

ohmyc 핵심 키워드: **페어(Pair)** — "비서/집사/도우미/어시스턴트" 같은 역할 강제어는 모두 금지어. 페어는 **수평적 파트너**.

### 60s pair onboarding (the 4-screen demo)

1. **Welcome** — *"처음 만날 준비 됐어요?"* / CTA `시작하기`
2. **Meeting** — preset 캐릭터 **세린**의 자기소개. 가운데 breathing avatar. *"처음 만나서 반가워. 나는 세린이야."* / CTA `페어링하기`
3. **Promise** *(결정타)* — warm-paper textured card, 살짝 기울어짐. *"3시간 뒤에 한번 물어볼게."* / CTA `약속할게` ← 이 화면만 Apple-restraint를 의도적으로 깨도 됨
4. **Confirm** — *"기억할게요. 같이 알아가요."* / CTA `이제 만나러 가기`

---

## Sources

This system is curated from materials provided by the user. Reader does not need to have access — these are stored for traceability:

- **GitHub repo (provided):** `taehoyun-prog/ohmyc-hackathon-prep@main` — hackathon prep package
  - `design/DESIGN.md` — Apple HIG reference (full text imported below in spirit)
  - `design/assets/fonts/PretendardVariable.woff2` — copied to `fonts/PretendardVariable.woff2`
  - `design/assets/logo/ohmyc-mark.svg` & `ohmyc-wordmark.svg` — copied to `assets/`
  - `docs/ONE-PAGER.md` — product SSOT
  - `docs/_context/페어컨셉.md` — onboarding scenario + UX copy
  - `docs/_context/피칭내러티브.md` — 9-section pitch deck skeleton
- **Product override doc** (provided in chat) — Apple system reference + ohmyc deviations: accent → `#FF8552`, product frame = agent (no chat artifacts), all UI copy in Korean.
- Apple HIG analysis sourced from: apple.com homepage, Environment, Store, iPhone-17-pro buy flow, accessories.

---

## Index — what's in this folder

| Path | Purpose |
|---|---|
| `README.md` | this file — product context + content/visual fundamentals + iconography |
| `colors_and_type.css` | the canonical token sheet — import this in every artifact |
| `SKILL.md` | Claude Code skill manifest |
| `assets/` | logos (mark, wordmark) and brand visual assets |
| `fonts/` | Pretendard Variable woff2 |
| `preview/` | the design system tab cards (one html per token cluster) |
| `ui_kits/onboarding/` | 4-screen "pair first meeting" UI kit, Apple-frame mobile (390×844) |
| `docs/` | original source docs imported from the repo (read-only reference) |
| `design/` | original `design/` tree from the repo (read-only reference) |

---

## CONTENT FUNDAMENTALS — how ohmyc speaks

ohmyc's voice is the product. If the words break, the product breaks.

### Register
**친밀 · 약속 · 누적.** 캐릭터가 사용자와 평등한 친구처럼 말합니다. 기능 설명을 하지 않고, 약속을 합니다.

- **Person:** 캐릭터는 **반말**, 시스템은 **존댓말**. 둘이 섞일 때는 화면 안에서 발화 주체가 분명해야 함.
  - 캐릭터: *"처음 만나서 반가워. 나는 세린이야."* (반말 · 친밀)
  - 시스템: *"기억할게요. 같이 알아가요."* (존댓말 · 약속)
- **Tone:** soft promise — 절대 명령형/안내형 아님. *"~할게"* / *"~할까?"* 가 기본.
- **No marketing-speak.** 기능 나열, 형용사 더미, "AI가 알아서 ~" 같은 도구적 표현 모두 금지.

### Anchor vocabulary (적극 사용)
**처음 / 알아가다 / 기억할게 / 약속 / 같이 / 페어 / 곁에**

이 단어들은 ohmyc의 정체성을 운반합니다. 한 화면에 1–2개는 등장해야 ohmyc 같은 카피.

### Forbidden words
**비서 · 집사 · 도우미 · 어시스턴트 · helper · assistant · chatbot · 봇.**
"AI 컴패니언"도 위험. 페어는 컴패니언이 아니라 **수평적 파트너**.

### Casing & punctuation
- Headline: 한국어 끝 마침표 **없음**. *"처음 만날 준비 됐어요"*
- Microcopy: 끝 마침표 **있음**. *"기억할게요. 같이 알아가요."*
- 영문 섞일 때: 라틴 단어는 lowercase 우선. *ohmyc*, *pair*, *Claude*. 제품명은 항상 lowercase **ohmyc**.
- 숫자는 아라비아. *3시간 뒤에* (not *세 시간*).
- 이모지 **사용 안 함** (단, 4-2 기분 트래커에서만 감정 픽커로 등장).

### Examples (from the demo flow — copy verbatim)

| Screen | Korean | Note |
|---|---|---|
| Welcome | 처음 만날 준비 됐어요? | 끝 물음표 — 부드러운 초대 |
| Welcome CTA | 시작하기 | 동사 한 단어 — 결단 |
| Meeting | 처음 만나서 반가워. 나는 세린이야. | 캐릭터 반말 — 친밀 |
| Meeting CTA | 페어링하기 | 페어 = 핵심 명사 |
| Promise | 3시간 뒤에 한번 물어볼게. | "한번" — 가벼운 무게감 |
| Promise CTA | 약속할게 | 시스템이 캐릭터의 톤을 흉내 — 약속의 무게 |
| Confirm | 기억할게요. 같이 알아가요. | 두 anchor 단어 |
| Confirm CTA | 이제 만나러 가기 | "만나러" — 관계 진입 |

### Rules of thumb
- 한 화면 = 한 문장 + 한 CTA.
- 길이는 짧게. 캐릭터 발화는 보통 1–2 문장.
- 시스템적 관여 표현 (*"3시간 뒤에 다 했는지 물어볼게"*) 은 ohmyc의 시그니처. 시연에서 절대 빠지면 안 됨.

---

## VISUAL FOUNDATIONS

### Compositional DNA
Apple HIG의 **showcase mode**를 빌려 — 넓은 여백, 거의 빈 캔버스, 중앙에 단 하나의 객체. ohmyc는 이 객체 자리에 **숨 쉬는 아바타**를 둡니다. 화면은 정보 패널이 아니라 **무대**. UI chrome은 사라지고, 캐릭터(또는 약속 카드)가 모든 시각적 무게를 감당합니다.

### Surfaces
- **Default canvas:** `--bg-canvas-light` (`#F5F5F7`) — pale apple gray. 대부분의 화면.
- **Drama canvas:** `--bg-canvas-dark` (`#000000`) — Welcome / Meeting 화면. 캐릭터를 정전기처럼 떠오르게.
- **Promise canvas:** `--omc-tint-paper` (`#FFF1E8`) — Promise 화면 한 장만 사용. 따뜻한 종이 위에 잉크로 쓴 느낌.
- 카드 표면은 **white(`#FFF`) on light, graphite (`#272729`) on dark**. 그라데이션 사용 안 함.

### Color
**단일 액센트 원칙.** ohmyc 전체에서 액센트는 `#FF8552` (Soft Apricot) 한 색뿐. Apple Action Blue는 사용하지 않음.
- Primary CTA fill: `--omc-tint`.
- Pressed: `--omc-tint-deep`.
- Halo / breathing avatar bloom: `--omc-tint` at 18–24% opacity.
- 텍스트: 다크 캔버스 위 `--fg-on-dark`, 라이트 위 `--fg-1`. 보조는 항상 `--fg-2`.

### Type
**Pretendard Variable** 단일 패밀리. SF Pro Display/Text를 한국어 환경에서 대체. weight ladder는 400 / 500 / 600 / 700 — 600이 지배 weight. Display는 `letter-spacing: -0.4px ~ -1.2px`로 압축, body는 `1.55` line-height로 한국어 가독성 확보 (Apple 기준 +0.04).

### Backgrounds & imagery
- 사진 사용 **거의 없음.** ohmyc는 캐릭터 외엔 시각 요소를 비웁니다.
- 배경 패턴/그라데이션 사용하지 않음. 단, **Promise 화면**의 *warm-paper texture* 만 예외 — `radial-gradient` + 미세한 noise를 SVG로 합성. 이 한 화면에서만 Apple-restraint를 의도적으로 깸.
- 캐릭터는 placeholder로 표현 (실제 일러스트 미정 — `assets/avatar-placeholder.svg` 사용).

### Animation — only two gestures
새로운 모션을 만들지 않습니다. 시스템은 **두 개의 이름을 가진 동작**만 허용:
1. **Breathe** — `scale(1.00 ↔ 1.02)`, `3.5s ease-in-out infinite`. **avatar 전용**.
2. **Pulse** — `scale(1.00 → 0.97 → 1.00)`, `600ms`. **CTA 탭 응답 전용**.

페이지 전환은 200ms opacity fade로 충분. 추가 모션 금지.

### Hover & press states
- **Hover (desktop fallback):** primary CTA — fill `--omc-tint` → `--omc-tint-deep`, no scale change.
- **Press:** 위 Pulse 애니메이션이 수행 — 별도 색 변화 없음.
- **Disabled:** opacity 0.4, no animation, cursor not-allowed.
- **Focus:** `--focus-ring` (Soft Apricot 35% halo). 키보드 사용자만 보이도록 `:focus-visible`.

### Borders
- 라이트 캔버스: `--border-soft` (`#D2D2D7`) for dividers, `--border-mid` (`#86868B`) for input fields.
- 다크 캔버스: `rgba(255,255,255,0.12)` 만.
- 카드는 가능하면 **border 없이** elevation으로 분리. Promise 카드만 예외 — 살짝의 warm border (`rgba(255,133,82,0.20)`).

### Shadows
극도로 절제. 4단계만:
- `--el-1` (1–3px) — 인풋, 작은 칩.
- `--el-2` (12px) — 일반 카드.
- `--el-3` (32px) — 모달, 가장 떠 있는 요소.
- `--el-warm` — Promise 카드 한 화면 전용. 따뜻한 톤이 들어간 유일한 shadow.

내부 그림자(inner shadow), glow effect, 네온 모두 사용 안 함.

### Radius — purposeful tiers
한 가지 라운딩으로 통일하지 않습니다. 컴포넌트 클래스마다 다름:
- `5px` 칩/태그 · `10px` 컨트롤 · `16–22px` 카드 · `28–36px` 모듈/스포트라이트 · `980px` 시그니처 캡슐 CTA · `50%` 원형 (avatar, dot).

### Transparency & blur
- Liquid Glass는 다크 캔버스의 chrome bar에서만: `backdrop-filter: blur(24px)`, `background: rgba(0,0,0,0.55)`.
- 카드 표면에는 사용하지 않음. 정직한 solid surface 우선.

### Layout rules
- 모바일 웹앱이 1차 타깃 — `max-width: 430px` 컬럼, `padding-inline: 24px`.
- 가로 정렬: 텍스트는 모두 **center align** (4 화면 데모 한정). 일반 페이지에서는 left.
- 화면 하단 고정 CTA 사용 가능 — but iOS-style safe-area inset 항상 반영.
- 채팅 UI 금지: speech bubbles, 하단 입력 바, 사이드바, message log, "User:/Assistant:" 라벨. **모두 ohmyc에 존재하지 않음.**

### Card anatomy
| Card type | Surface | Radius | Elevation | Border |
|---|---|---|---|---|
| Default card | `#FFF` | `--r-card` (16) | `--el-2` | none |
| Promise card | `--omc-tint-paper` | `--r-card-lg` (22) | `--el-warm` | `rgba(255,133,82,0.20)` 1px |
| Dark card | `--bg-graphite-a` | `--r-card` | none | `--border-on-dark` |
| Spotlight module | `#FFF` | `--r-spotlight` (36) | `--el-3` | none |

---

## ICONOGRAPHY

ohmyc는 **아이콘이 거의 없는** 시스템입니다. 화면의 시각적 주인공은 캐릭터(아바타)이고, UI는 사라져야 하기 때문입니다.

### What we use
- **로고:** `assets/ohmyc-mark.svg` (96×96, 검은 라운드 사각 위 투톤 dot — gray + apricot), `assets/ohmyc-wordmark.svg` (가로형 wordmark). 로고 외에 정체성 표현 없음.
- **Avatar:** placeholder는 단순 원 + apricot bloom. 실제 캐릭터 일러스트는 미정 (사용자가 추가).
- **Emoji:** 일반 UI에선 **사용 안 함**. 예외는 Promise/Confirm 다음 화면(이번 시스템 범위 밖)의 기분 트래커에서 사용자가 선택하는 감정 이모지뿐.
- **Unicode glyph:** 화살표는 `→` (U+2192) — system font 그대로. CTA 보조 글리프로만 사용.

### Substitution flag
ohmyc 자체 아이콘 세트는 존재하지 않습니다. 시스템 아이콘이 필요해질 경우 **Lucide** (`stroke-width: 1.5`, `currentColor`) 를 CDN에서 로드하는 것을 권장 — Apple HIG의 hairline weight과 가장 가깝고, OSS 라이선스가 깨끗합니다.
*Substitution flagged — 사용자가 ohmyc 전용 아이콘 세트를 추후 제공할 경우 교체 필요.*

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

---

## Quick reference

```css
@import url("./colors_and_type.css");

/* primary CTA */
.btn-primary {
  background: var(--omc-tint);
  color: var(--bg-canvas-white);
  border-radius: var(--r-capsule);
  padding: 16px 28px;
  font-weight: var(--w-semibold);
  font-size: var(--t-body);
}

/* breathing avatar */
.avatar { animation: omc-breathe var(--dur-breathe) var(--ease-soft) infinite; }

/* CTA tap */
.btn-primary:active { animation: omc-pulse var(--dur-pulse) var(--ease-soft); }
```

## Known caveats / substitutions

- **Avatar is a placeholder.** ohmyc has no committed character illustration yet. The breathing avatar in the kit is a neutral disc + apricot bloom. Replace with the real 세린 illustration when available.
- **Iconography substitution flagged.** ohmyc has no proprietary icon set. Lucide (CDN) is the recommended substitute — `stroke-width: 1.5`, `currentColor`. Replace if/when an ohmyc icon set ships.
- **Pretendard Variable** is the canonical font (Korean-first). It substitutes SF Pro Display/Text from the Apple HIG reference. Keep this substitution.
- **No semantic status colors** (error/warning/success). ohmyc's emotional surface is so narrow we haven't defined them. Use neutral fg-1/fg-2 + a single warm or cool nudge if needed; do not introduce red/green/yellow without flagging.
- **Promise screen** intentionally breaks Apple-restraint (warm-paper texture + tilt + warm shadow). This is by design — it is the *결정타* moment of the demo and must feel different from the rest of the system.

## Self-check before any render
- [ ] Zero chat-UI artifacts (bubbles / input bar / sidebar / message log)
- [ ] Only `#FF8552` accent — no Apple Blue family
- [ ] All Korean copy — no forbidden words (비서/집사/도우미/어시스턴트)
- [ ] At least 3 different radius values on screen
- [ ] If avatar present → Breathe animation attached
