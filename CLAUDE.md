# CLAUDE.md — ohmyc 해커톤 협업 규약

이 파일은 ohmyc 해커톤 작업에 들어오는 모든 Claude 세션이 가장 먼저 읽는
"운영 매뉴얼"입니다. 1~4턴 컨텍스트 체인이 흔들리지 않게 유지하는 게
목적이고, 제품 사실은 `docs/`·`design/`에 그대로 두고 여기서는 협업
규약과 진입점만 다룹니다.

---

## 0. 첫 진입 시 30초 체크리스트

1. `MEMORY.md`를 먼저 펼친다. 1~3턴 메모리가 깔려 있으면 컨텍스트로
   삼고, 비어 있으면 1턴부터 시작해야 하는 상태다.
2. 아래 4개 SSOT 문서를 읽었는지 확인한다. 안 읽었다면 병렬로 읽는다.
   - `docs/ONE-PAGER.md`
   - `docs/_context/페어컨셉.md`
   - `docs/_context/피칭내러티브.md`
   - `design/DESIGN.md`
3. 본 CLAUDE.md의 "절대 지킬 규약" 섹션을 한 번 훑는다.

---

## 1. 0~4턴 작업 사이클

해커톤 9시간 작업은 다음 5턴 구조로 흐른다. 각 턴은 다음 턴의 입력을
만들어내므로 순서를 건너뛰지 않는다.

| 턴 | 이름 | 산출물 |
|---|---|---|
| 0 | 준비: 4개 SSOT 정독 + 협업 규약 합의 | 본 CLAUDE.md, 이 대화 컨텍스트 |
| 1 | 컨텍스트 저장 ① "무엇" | MEMORY.md에 project / reference 메모리 |
| 2 | 컨텍스트 저장 ② "누구·어떻게" | MEMORY.md에 user / feedback 메모리 |
| 3 | 컨텍스트 저장 ③ "어떻게 실행·어디서 깨지나" | MEMORY.md에 가드레일·시연 지지대·위험 등록부 |
| 4 | Deep Interview → Ralph 루프 | `prd.json` + `demo_script.md` + `ralph_handoff.md` → 라이브 Vercel URL + `progress.txt` 회고 |

### 1턴 — "무엇"
4개 SSOT 문서에서 제품 정체성·페어 온보딩·디자인 토큰·피칭 내러티브·
Plaitoon 트랙션·로드맵·문서 간 참조 경로를 추출해 메모리화한다. 행간에
묻혀 있는 컬러 충돌·카피 톤·시연 위험구간 같은 것도 발견 즉시 같이
저장하되, 추측은 추측이라 명시한다. 미래 자리(캐릭터 추가, 백엔드,
유료화)는 "확장 슬롯"으로 비워둔다.

### 2턴 — "누구·어떻게"
사용자 모델 + 함께 일할 때 지킬 톤·금지어·작업 리듬을 메모리화한다.
0~1턴 대화·문서·레포 구조에서 추정한 항목에 확신도(높음/중간/낮음)를
붙이고, 확신 낮은 것만 한 번에 3개 이내 짧은 질문으로 검증한다. 보편
항목(커밋 컨벤션, 한국어/영어 비율, 시간대, 회고 빈도 등)은 시키지
않아도 먼저 제안한다. 톤·금지어는 위반 시 자가 reject 가능할 만큼
구체적인 규칙으로 적는다.

### 3턴 — "어떻게 실행·어디서 깨지나"
4턴이 실패하지 않도록 받쳐주는 가드레일 층이다. 다음을 메모리화한다.
- 9시간 해커톤 가드레일 (Supabase 익명 인증만, 추가 백엔드·추상화·
  디자인 시스템·테스트 인프라 신설 금지) — "우리 약속" 형태로
- 60초 시연 스크립트의 1차 가설 (멘트·화면 동선·종료 트리거)
- 위험 등록부: "조건 → 발현 신호 → plan_b" 3단 형식
- 워크플로우 약속 (Deep Interview → Ralph → Vercel 사이클, 회고 노트
  위치, MEMORY.md auto-append 규약)
- Plaitoon 레버리지 자산 (매출 ₩132M/월·전월비 +113.8%·AI비용
  48%→30%)을 ohmyc에 어떻게 연결할지의 메모

### 4턴 — Deep Interview → Ralph (한 턴 안의 두 단계)

**4-A. Deep Interview** (`/oh-my-claudecode:deep-interview`)
1~3턴 메모리에서 답이 나오는 건 다시 묻지 않는다. 종착지는 ralph가
그대로 돌릴 수 있는 산출물이다.
- `prd.json`: stories[] (acceptance_criteria는 관찰 가능 단위로) /
  non_goals[] / risks[]+plan_b / dependencies[]
- `demo_script.md`: 60초 멘트 + 화면 동선
- `ralph_handoff.md`: 다음 단계 진입점 1장 + critic 추천(architect /
  critic / codex)과 그 근거

산출물이 3턴 메모리(가드레일·위험 등록부)와 어긋나면 4-B로 넘어가지
말고 즉시 멈추고 사용자에게 보고한다.

**4-B. Ralph 루프** (`/oh-my-claudecode:ralph --critic=<4-A 추천값>`)
4-A 산출물을 그대로 1차 진입점으로 사용한다. 재해석 금지.

매 iteration 끝 출력 포맷(고정):
1. PRD 스토리별 pass/fail 표 + 직전 대비 델타
2. PRD에 없던 새 위험 1~3개 + 등장 트리거
3. 다음 iteration ROI 1순위 단일 행동
4. 예상 잔여 iteration / 잔여 시간

완료 약속 출력 조건(AND, 한 줄이라도 빠지면 계속 돌 것):
- prd.json 전체 스토리 reviewer 통과
- vercel deploy 성공 + 라이브 URL에서 60초 시나리오 끝까지 무중단
- demo_script.md 화면 동선과 실제 화면 일치 (스크린샷 첨부)
- progress.txt에 다음 사이클 학습 데이터 회고 노트 자동 생성
- MEMORY.md에 이번 사이클에서 새로 배운 것 1~3개 auto-append

---

## 2. "알려주세요" 규약

프롬프트 본문이 충분히 풍부하면, 마지막 줄은 항목 리스트 없이 **그냥
"알려주세요"** 로 끝난다.

- ❌ "다음을 보고: A / B / C 알려주세요" — 좁은 답으로 수렴됨
- ✅ "작업이 끝나면 알려주세요" — 본문 맥락에서 포괄적으로 답함

마지막 줄이 "알려주세요"로 끝나면, 직전 작업의 결과뿐 아니라 인접한
관찰·발견한 패턴·놓친 빈칸·다음 손까지 자유롭게 펼쳐 답한다.

---

## 3. 절대 지킬 규약 (위반 시 자가 reject)

### 3.1 카피·톤
- 슬로건 5종은 **원문 그대로** 유지. 임의 변형 금지.
  1. *"대중의 첫 에이전트는 캐릭터다."*
  2. *"우리는 채팅이 아니라 에이전트를 만든다."*
  3. *"기억(Memory) + 행동(Action) + 성장(Growth)."*
  4. *"나를 아는 캐릭터가 나를 위해 행동한다."*
  5. *"개발자에겐 오픈클로, 대중에겐 ohmyc."*
- 금지어: **비서 / 집사 / 도우미 / 어시스턴트** — 페어(Pair)는
  "수평적 파트너"이며 역할 강제 단어를 쓰면 안 된다.
- 카피 톤 어휘: "처음 / 알아가다 / 기억할게" 적극 사용. 한국어 우선.

### 3.2 디자인
- 골격은 Apple HIG + Liquid Glass.
- ohmyc 고유색은 **`--tint #FF8552` (Soft Apricot) 단 하나**. 추가
  브랜드 컬러 신설 금지.
- Apple Action Blue(`#0071e3`)는 액션 의미가 분명한 경우에만.

### 3.3 기술 가드레일 (해커톤 9시간)
- Stack: Next.js 15 App Router + TypeScript + Tailwind + Google
  Gemini 3 Flash (`gemini-3-flash`) + Vercel AI SDK + Supabase + Vercel 배포
  *(2026-04-26 Haiku→Gemini 3 Flash, no-DB→Supabase 사용자 직권 결정)*
- DB: Supabase (익명 인증 — Anonymous Sign-In).
  sessionStorage는 `anon_user_id` 캐시 용도로만.
- 모바일 웹앱 기준 (`max-w-md` 단일 컬럼).
- 추상화·디자인 시스템 신설·테스트 인프라 신규 도입 **금지**.
- 막히면 risks[]의 plan_b를 먼저 시도.

---

## 4. 핵심 진입점

| 목적 | 경로 |
|---|---|
| 한 장 요약 | `docs/ONE-PAGER.md` |
| 페어 온보딩 시나리오·UX 카피 | `docs/_context/페어컨셉.md` |
| 9섹션 IR 골격 | `docs/_context/피칭내러티브.md` |
| Apple HIG 디자인 시스템 토큰 | `design/DESIGN.md` |
| 메모리 인덱스 | `MEMORY.md` (1~3턴이 채움) |
| Deep Interview 산출물 | `prd.json` / `demo_script.md` / `ralph_handoff.md` |
| Ralph 회고 | `progress.txt` |
| OMC 상태 | `.omc/state/` |

---

## 5. 성공 정의

해커톤 사이클 1회의 성공은 다음 4가지 동시 충족이다.
1. 60초 시연 시나리오 1개 완성
2. Vercel URL에서 진짜로 작동
3. 워크플로우 한 사이클 통과 (Deep Interview → Ralph → Vercel)
4. 다음 사이클 학습 데이터로 쓸 회고 노트 산출
