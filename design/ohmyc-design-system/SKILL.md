---
name: ohmyc-design
description: Use this skill to generate well-branded interfaces and assets for ohmyc — Korean character-agent mobile webapp. Contains design tokens, Pretendard font, Soft Apricot single-accent system, voice/tone rules, and a 4-screen pair-onboarding UI kit. ohmyc is an AGENT (not a chat app) — never render chat bubbles, input bars, sidebars, or use forbidden words (비서/집사/도우미/어시스턴트).
user-invocable: true
---

Read `README.md` first. It carries the full product context, content fundamentals, visual foundations, iconography rules, and an index of every other file.

## How to use this skill

1. **Read `README.md`** — product context + content/visual fundamentals + iconography
2. **Import `colors_and_type.css`** — the canonical token sheet. All ohmyc artifacts must consume these tokens.
3. **Browse `preview/`** — token cards (colors / type / spacing / components / brand). Open any to see the swatch, the copy, the radius, the motion.
4. **Use `ui_kits/onboarding/`** — pixel-fidelity recreation of the 60s pair-onboarding flow. Copy `Screen.jsx` / `Button.jsx` / `Avatar.jsx` / `Screens.jsx` patterns when building new ohmyc surfaces.

## Non-negotiables (self-check before any render)

- **Zero chat-UI artifacts** — no speech bubbles, no bottom-fixed input bar, no sidebar nav, no message log, no "User:/Assistant:" labels. ohmyc is a paired agent, not a chatbot.
- **Single accent** — `#FF8552` (Soft Apricot) is the only ohmyc brand color. No Apple Action Blue. No secondary accents.
- **Korean copy only** — and never use the forbidden words: 비서, 집사, 도우미, 어시스턴트, assistant, helper, chatbot.
- **Anchor vocabulary** — try to land at least one of: 처음 / 알아가다 / 기억할게 / 약속 / 같이 / 곁에 / 페어 per screen.
- **Two motion gestures only** — `Breathe` (avatar, 1.00↔1.02, 3.5s) and `Pulse` (CTA tap, 1.00→0.97, 600ms). Don't invent more.
- **≥3 radius values on screen** — never one-size-fits-all rounding (capsule 980 / card 16–22 / chip 5 / circle 50%).
- **If avatar present → Breathe attached.**
- **Pretendard Variable** is the single type family — substitutes SF Pro everywhere for Korean.

## How to deliver

- If creating visual artifacts (slides, mocks, throwaway prototypes): copy `colors_and_type.css`, the logo SVGs from `assets/`, and the Pretendard `woff2` from `fonts/` into the artifact folder. Output static HTML.
- If working on production code: read the rules here, treat them as design law, and apply tokens via the CSS variables.
- If the user invokes this skill without further guidance, ask what they want to design (a new ohmyc screen? marketing slides? a pitch deck?), confirm whether the ohmyc product frame applies, then act as an expert designer who outputs HTML artifacts or production code.
