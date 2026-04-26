# ohmyc — Pair First Meeting

> **대중의 첫 에이전트는 캐릭터다.**
> CMUX × AIM Intelligence Hackathon Seoul · Business & Applications 트랙 · 2026-04-26

## 한 줄 정의

ohmyc는 **기억(Memory) + 행동(Action) + 성장(Growth)** 을 가진 캐릭터 에이전트의 **페어 첫 만남** — 이야기 속에서만 만나던 캐릭터가, 이제 곁에서 약속을 챙겨주는 페어가 된다.

## 라이브 데모

- **라이브 URL**: https://ohmyc-hackathon-prep.vercel.app
- **피치덱(슬라이드)**: https://ohmyc-hackathon-prep.vercel.app/pitch
- **모바일 프레임 권장** (디자인 폭 `max-w-md` / 390px)
- 백업 영상 30초: `[제출 시 첨부]`

## 시연 흐름 (~80초, 7-screen + 새로고침 비트)

1. **Welcome** (다크) — *"처음 만날 준비 됐어요"* + breathing bloom
2. **Meeting** (다크) — 세린 자기소개 *"처음 만나서 반가워. 나는 세린이야."*
3. **Memo** (라이트) — 사용자가 한 줄 입력 (예: `저녁에 고기 먹고 싶어`)
4. **Promise** (warm-paper) — 결정타 *"이따 19:00에 한번 물어볼게."* + 자연 한국어 보조 카피 (Gemini Flash Lite로 자연화)
5. **Confirm** (라이트) — *"기억할게요. 같이 알아가요."*
6. **Home** (라이트) — **곁에 있는 페어**. 활성 약속 카드 + Avatar Breathe + `[새 약속 만들기]·[지금 약속 시간 받기]`
7. **Alarm** (warm-paper) — **시간 도달 시뮬**. *"시간 됐어. 다 했어?"* + 입력 카드 → `[다 했어]` 마킹
8. Home 복귀 — 카드 line-through + *"약속 잘 지켰어."*
9. **새로고침** — Home 직진 + 완료 상태 그대로 → *"기억"* + *"행동"* 슬로건 입증

## 차별점

| 기존 | ohmyc |
|---|---|
| ChatGPT — 도구·휘발성 (stateless) | 인격·누적 (memory + action) |
| Character.AI — 채팅만 | 에이전트 (시간 기반 약속·기억) |
| Replika — 1:1 한정 | 마켓플레이스 진입점 |

→ **"우리는 채팅이 아니라 에이전트를 만든다"** — 채팅 UI가 0건인 이유. 사용자 입력은 메모지·약속 카드·CTA로만 받는다.

## 핵심 기능 매핑 (PM 단계)

- **Stage 1 Memory** ✓ — Supabase 영속화. 새로고침 후 페어·약속 그대로 복귀.
- **Stage 2 Action** ✓ — 시간 휴리스틱(아침·점심·저녁·밤·내일 키워드 추출 + 디폴트 +3h). 결정타 카피가 의도 시간에 맞춰 *"이따 HH:MM에"* / *"내일 HH:MM에"* / *"3시간 뒤에"* 분기.
- **Stage 3 Growth** — 다음 사이클. 대화·관계 누적이 응답을 바꾼다.
- **Stage 4 마켓플레이스** — 캐릭터 다수화·크리에이터 업로드·IP 파트너십. 로드맵.

## 기술 스택

```
Next.js 15 App Router · TypeScript · Tailwind CSS
Pretendard Variable (한국어 우선)
Gemini 3 Flash Preview (시스템 프롬프트 고정 결정타)
Gemini 2.5 Flash Lite (Memo→보조 카피 자연화, 1500ms timeout 폴백)
Supabase (익명 인증, pair_sessions + todos)
@ai-sdk/google + Vercel AI SDK + 4키 라운드로빈 로테이션
Vercel 배포
```

## 디자인 시스템

`design/ohmyc-design-system/` — Apple HIG showcase mode + Soft Apricot (`#FF8552`) 단일 액센트 + Pretendard 한국어. **채팅 UI artifact 0건 (코드 차원 강제)**. 모션 어휘는 Breathe·Pulse 둘만. Promise 화면 한 장만 Apple-restraint를 의도적으로 깨고 warm-paper texture + 살짝 기울어진 카드.

## 팀

**1인 + AI 에이전트 자율경영** — 회사 운영에서 이미 ohmyc가 만들려는 인격적 AI 협업을 자기 증명. 1인 CEO + 다수 AI 에이전트(개발·디자인·리뷰·QA)가 팀원으로 작업.

> *"개발자에겐 오픈클로, 대중에겐 ohmyc."*
