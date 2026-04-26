# Deep Interview PRD: ohmyc 해커톤 MVP

## 메타데이터

| 항목 | 값 |
|---|---|
| Interview ID | ohmyc-mvp-20260426 |
| Rounds | 4 (Contrarian 1회 사용) + 사용자 직권 결정 2건 |
| Final Ambiguity | **9.0%** (R4 8.1% + Supabase 신규 결정으로 미세 상승) |
| Threshold | 20% |
| Status | **PASSED with Contrarian + 사용자 직권 보강** (Goal 0.97 / Constraints 0.80 / Criteria 0.93) |
| Type | Greenfield (메모리 1·2층 사전 컨텍스트 풍부) |
| Generated | 2026-04-26T10:35:00+09:00 (KST) |
| Spec Path | `.omc/specs/deep-interview-ohmyc-mvp.md` |

## 명료도 점수표

| 차원 | 점수 | 가중치 | 가중 점수 |
|---|---|---|---|
| Goal Clarity | 0.97 | 0.40 | 0.388 |
| Constraint Clarity | 0.80 | 0.30 | 0.240 |
| Success Criteria Clarity | 0.93 | 0.30 | 0.279 |
| **Total Clarity** | | | **0.907** |
| **Ambiguity** | | | **0.093 (9.3%)** |

> 주: Constraints는 R3 시점 0.82에서 Supabase 도입(9시간 박스 부담 ↑·테이블/인증 추측)으로 0.80으로 미세 하락. Criteria는 영속화 검증 항목 추가로 약간 상승. Goal은 "기억" 슬로건 입증 명료화로 0.97 유지.

---

## Goal (한 문장)

9시간 해커톤 단일 사이클 안에 ohmyc의 "페어 첫 만남" 60초 데모를 Vercel 프로덕션 URL로 시연 가능한 모바일 웹앱(MVP V0.1) 형태로 구현하되, **캐릭터 선택 화면의 잠금 카드 2-3개로 마켓플레이스 정체성**을, **Supabase 영속화로 슬로건 *"기억(Memory) + 행동(Action) + 성장(Growth)"* 의 "기억"** 을 시각적·기능적으로 입증하고, 결과를 회고 노트로 정리해 다음 사이클의 학습 데이터로 남긴다.

---

## Constraints

### 시간·박스
- 단일 사이클 9시간 (Supabase 도입으로 ~1-2시간 추가 부담 — 컷 정책 더 엄격히 적용)
- 워크플로우: Deep Interview → Ralph → Vercel → 회고
- 4가지 성공 지표 모두 통과해야 사이클 완료

### 기술 스택 (확정 — 사용자 직권 변경 2026-04-26 반영)
- Frontend: **Next.js 15 App Router + TypeScript + Tailwind CSS**
- LLM: **Google Gemini 2.5 Flash** — 모델 ID `gemini-2.5-flash` (Haiku-급 소형·빠름·저렴 포지션 / 사용자 결정 2026-04-26 — 메모리 1층 Haiku에서 변경)
- 스트리밍: **Vercel AI SDK** (선제 발화 + 채팅)
- DB: **Supabase** (사용자 결정 2026-04-26 — 메모리 1층 no-DB 원칙 폐기, "기억" 슬로건 영속화 우선)
- 배포: **Vercel**
- 레이아웃: **모바일 웹앱** `max-w-md` 단일 컬럼

### Supabase 통합 (사용자 직권 결정 2026-04-26)

**의의**: 슬로건 *"기억(Memory) + 행동(Action) + 성장(Growth)"* 에서 "기억"이 휘발성 sessionStorage로는 불충분 → Supabase 영속화로 시연 자체에서 슬로건 입증.

**인증**: 익명 (Supabase Anonymous Sign-In 또는 anon key + 데모용 단순 RLS).

**테이블 스키마 (추측 — R5 또는 코드 구현 시 확정)**:

```sql
-- 익명 사용자(혹은 페어 세션) 단위
CREATE TABLE pair_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_user_id TEXT NOT NULL,           -- sessionStorage에 캐시된 ID
  character_id TEXT NOT NULL,            -- "serine" 등 프리셋
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_session_id UUID REFERENCES pair_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  reminder_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_session_id UUID REFERENCES pair_sessions(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  response_copy TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_session_id UUID REFERENCES pair_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('character','user')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**sessionStorage 역할 변경 (추측)**: 영속 저장은 Supabase가 담당. sessionStorage는 `anon_user_id` 캐싱(다시 들어왔을 때 같은 페어 세션으로 복귀) 용도로만 유지.

**RLS 전략 (추측)**: 데모용으로 RLS 풀거나, `anon_user_id` 기반 단순 정책. 해커톤 박스에서 정교한 정책 ❌.

### 컷 정책 (R3 사용자 명시 결정 2026-04-26)
- **4단계 풀 사수**: 진입점 → Hook → 옵트인 → Activation(4-1·4-2) 모두 유지
- 시간 압박 시 **LLM 응답 단축 또는 타이핑 속도 증가**로만 조절
- 단계 자체 컷 ❌

### 잠금 카드 표시 규칙 (R4 사용자 결정 2026-04-26)
- 캐릭터 선택 화면에 **잠금 카드 2-3개** 함께 노출 (예: "Coming Soon 캐릭터 A", "Coming Soon 캐릭터 B")
- `disabled` 상태 — 클릭 불가, 호버 시 미세 피드백만
- 활성 카드(세린)와 시각적 구분 (예: 흐림·자물쇠 아이콘)
- 목적: **마켓플레이스 정체성** 시각 암시

### 환경 변수
- `.env.local` (로컬):
  - `GEMINI_API_KEY` (+ 로테이션 백업 `GEMINI_API_KEY_2` / `_3` / `_4` — 쿼터·레이트리밋 분산용)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (필요 시 서버 측 `SUPABASE_SERVICE_ROLE_KEY` — 추측, 데모는 anon만으로 가능)
- Vercel 환경 변수 (배포): Production·Preview 분리, 동일 키들 등록
- `.gitignore`에 `.env*.local`

---

## Non-Goals (확장 슬롯 — 이번 사이클 미포함)

| 슬롯 | 시점 |
|---|---|
| 인증 / 계정 동기화 (소셜 로그인 등) | H2 2026 |
| 캐릭터 다수화 (잠금 카드 활성화) | H2 2026 |
| RAG·임베딩·정교한 LLM 메모리 시스템 | H2 2026 (이번 사이클은 messages 테이블 누적까지) |
| 결제·크레딧·캐릭터 구매 | H2 2026 이후 |
| 시맨틱 컬러·다크/라이트 토글 | H2 2026 |
| 다국어 폰트 매핑 | 글로벌 런칭 시점 |
| 크리에이터 업로드·인센티브 | H1 2027 |
| IP 파트너십·마켓플레이스 정산 | H1 2027 |
| Tool Use·멀티모달 | H2 2027 |

> 변경: "DB·인증·계정 동기화 → H2 2026"에서 **DB는 이번 사이클로 끌어옴**(Supabase 도입). 인증 자체는 익명 유지.

---

## Acceptance Criteria

### G1 정량 (1차 게이트)

- [ ] Vercel 프로덕션 URL이 공개되어 모바일 환경에서 접근 가능
- [ ] 모바일 폭(`max-w-md`)으로 화면 정상 렌더
- [ ] 페어 온보딩 4단계가 끊김·에러 없이 흐름:
  - [ ] Step 1 진입점 — Soft Apricot Breathe 아이콘 + `[초대장 열어보기]` 동작
  - [ ] Step 2 Hook — Liquid Glass 오버레이 + 타이핑 효과 카피 노출
  - [ ] Step 3 옵트인 + 캐릭터 선택 — **세린 활성 카드 + 잠금 카드 2-3개** 함께 표시 → 세린 선택 → `[페어링 하기]` + Soft Apricot Pulse + "페어링 중..." 트랜지션
  - [ ] Step 4-1 — 캐릭터 선제 발화(투두 묻기) → 사용자 입력 → **결정타 라인** *"알았어, 3시간 뒤에 다 했는지 내가 꼭 물어볼게!"* 출력
  - [ ] Step 4-2 — 기분 트래커 → 이모지 → 맞춤 공감 응답
- [ ] 결정타 라인은 LLM 자유 응답이 아닌 **시스템 프롬프트 고정 또는 비-LLM 카피** (시연 위험 3 대응)
- [ ] **잠금 카드 시각 암시** — 시연 중 캐릭터 선택 화면에서 잠금 카드가 명확히 보여 마켓플레이스 정체성 전달
- [ ] **Supabase 영속화 검증** — 시연 직후 새로고침/탭 재진입 시 페어 세션·투두·기분·메시지 그대로 복귀 → 슬로건 *"기억"* 입증

### G2 정성 (2차 게이트)

- [ ] 시연 직후 본인 또는 팀원이 "에이전트 vs 채팅 차이"를 1문장으로 설명 가능 (청중 부재 시 자가 코멘트로 갈음)
- [ ] 슬로건 *"우리는 채팅이 아니라 에이전트를 만든다"* 정합성을 시연이 입증
- [ ] 슬로건 *"개발자에겐 오픈클로, 대중에겐 ohmyc"* 의 마켓플레이스 정체성이 잠금 카드로 전달됨
- [ ] 슬로건 *"기억(Memory) + 행동(Action) + 성장(Growth)"* 의 "기억"이 영속화 시연으로 입증됨

### 부수 기준

- [ ] 시연 도중 **새로고침 0회 강제 X** — Supabase 영속화로 새로고침 검증이 오히려 시연 자산 (메모리 1층 시연 위험 2의 의미가 변화)
- [ ] LLM 첫 응답 지연이 무한 대기로 보이지 않음 — 첫 발화는 **고정 카피** (시연 위험 1)
- [ ] 회고 노트 1편: 통한 것 / 막힌 것 / 다음 사이클 학습 데이터 (성공 지표 4번)
- [ ] 워크플로우 한 사이클 통과 (성공 지표 3번)

---

## Assumptions Exposed & Resolved

| 가정 | 도전 라운드 | 해소 |
|---|---|---|
| PRD가 H2 2026 글로벌 MVP까지 다룬다 | R1 시간 스코프 | 해커톤 MVP만으로 한정 |
| 60초 데모 성공 = 6단계 무결 흐름 | R2 성공 판정 | G1 정량 + G2 정성 2 게이트로 확장 |
| 시간 부족 시 4-2 컷 가능 (메모리 1층 추측) | R3 컷 우선순위 | **4단계 풀 사수, LLM 응답 단축으로만 조절** |
| 프리셋 1명 고정으로 충분 | R4 **Contrarian** | **잠금 카드 2-3개로 마켓플레이스 정체성 시각 암시** |
| Claude Haiku가 LLM 적정 | R5 사용자 직권 (PRD 직접 편집) | **Gemini 2.5 Flash로 변경** (Haiku-급 포지션 + 키 로테이션) |
| DB 없이 sessionStorage만으로 충분 | R5 사용자 직권 (이번 메시지) | **Supabase 도입** — "기억" 슬로건 영속화 우선, 9시간 박스 위험 인지하고 진행 |

---

## Technical Context

### 시연 위험 대응 패턴 (메모리 1층 `project_consistency_guardrails.md` [추론 3])

| 위험 | 패턴 | 변경 사항 |
|---|---|---|
| LLM 첫 응답 지연 | 첫 발화는 고정 카피, LLM은 두 번째 응답부터 | Gemini 콜드 스타트도 동일 위험 |
| sessionStorage 휘발 | (해소) Supabase 영속화로 위험 → **자산** 전환 | 새로고침 = 슬로건 입증 시연 |
| 결정타 표현 흐림 | 시스템 프롬프트 고정 또는 비-LLM 카피 | 동일 적용 |

### Supabase 클라이언트 통합 (추측)

- `@supabase/supabase-js` 의존성 추가
- 클라이언트 초기화: `lib/supabase.ts` (브라우저 안전한 `NEXT_PUBLIC_*` 키만)
- 익명 사용자 ID 생성: `crypto.randomUUID()` → sessionStorage 캐시 → Supabase row PK로 사용
- 첫 진입 시 `pair_sessions` row 생성, 이후 모든 행위(투두·기분·메시지)는 그 row 참조

### Gemini API 통합 (추측)

- Vercel AI SDK의 Google provider 사용 (`@ai-sdk/google` — 추측, 정확 패키지명 코드 단계에서 확인 필요)
- 4개 키 로테이션: 라운드로빈 또는 레이트리밋 감지 시 폴백
- 시스템 프롬프트에 캐릭터 톤(세린: 차분·정제·살짝 다정) + 결정타 라인 고정 지시 명시

### 시연 환경
- 노트북 1대, 무선 인터넷 (Vercel + Supabase 접근)
- 발표 화면: 모바일 미러링 또는 브라우저 모바일 뷰(DevTools `max-w-md`)
- 새로고침 시연: 의도적 1회 — 슬로건 *"기억"* 입증

---

## 디자인 토큰 인용 (전체는 `project_design_system.md`)

### 컬러
- `--tint = #FF8552` Soft Apricot — OMC 시그니처 단일 액센트
- 중립 3색조: `#000000` / `#f5f5f7` / `#ffffff`
- 텍스트: `#1d1d1f` (1차) / `#6e6e73` (2차)
- 그래파이트 4단: `#272729` → `#262629` → `#28282b` → `#2a2a2c`
- 보더: `#d2d2d7` (소프트) / `#86868b` (미드)
- ⚠️ Apple Blue `#0071e3` 사용 금지 (단일 액센트 원칙 — [추론 1])

### 모션
- `Breathe` (호흡) — 진입점 아이콘
- `Pulse` (맥동) — 페어링 CTA·트랜지션
- 그 외 모션 명 새로 만들지 말 것

### 타이포
- SF Pro Display + SF Pro Text (또는 Inter / Inter Tight 대체)
- 본문 17px, 600 weight 지배

### Radius (단일값 평탄화 X)
- 8-12px 컨트롤 / 16-18px 카드 / 28-36px 스포트라이트 / 56-980px 캡슐 / 50% 원형

### 잠금 카드 시각 처리 (R4 신규)
- 활성 카드(세린)와 동일 radius·타이포 사용
- `opacity` 또는 `grayscale` 처리로 비활성 표현
- 자물쇠 아이콘(또는 "Coming Soon" 라벨) 작게 오버레이
- 호버 시 미세 피드백(예: 라벨 강조)만, 클릭 불가

---

## 시연 동선 60초 (페어 온보딩 4단계 매핑)

| 시간 | 단계 | 주요 인터랙션 |
|---|---|---|
| 0:00–0:05 | Step 1 진입점 | Breathe 아이콘 → `[초대장 열어보기]` 클릭 |
| 0:05–0:18 | Step 2 Hook | Liquid Glass 오버레이 + 타이핑 효과 카피 |
| 0:18–0:30 | Step 3 옵트인 + 캐릭터 선택 | **세린 활성 카드 + 잠금 카드 2-3개** 노출 → 세린 선택 → `[페어링 하기]` 클릭 + Pulse 트랜지션 |
| 0:30–0:45 | Step 4-1 | 선제 발화 → 투두 입력 → **결정타 라인** (Supabase에 todo·message 저장) |
| 0:45–1:00 | Step 4-2 | 기분 묻기 → 이모지 → 맞춤 공감 응답 (Supabase에 mood 저장) |

### 선택적 후속 시연 (+5–10초) — *"기억"* 입증 (추측)

| 시간 | 액션 | 효과 |
|---|---|---|
| 1:00–1:05 | 새로고침 또는 탭 재진입 | sessionStorage `anon_user_id`로 동일 페어 세션 복귀 |
| 1:05–1:10 | 채팅방 진입 | 이전 메시지·투두·기분 그대로 복원 |

→ "에이전트가 진짜 *기억* 한다"를 슬로건과 1대1로 시연.

---

## 온톨로지 (Key Entities)

| 엔티티 | 타입 | 필드 | 관계 |
|---|---|---|---|
| Pair / PairSession | core | id, anon_user_id, character_id, status | User 1:1 Character |
| Character | core | name (권장 "세린"), tone, preset, status (active/locked) | 1:N Pair |
| User | core | anon_user_id (sessionStorage 캐시 + Supabase row) | Persistent (Supabase) |
| Todo | supporting (DB-backed) | text, reminder_time, completed_at | Pair 1:N |
| Mood | supporting (DB-backed) | emoji, response_copy | Pair 1:N |
| Message | supporting (DB-backed) | role, content, created_at | Pair 1:N |
| ChatRoom | supporting (UI) | messages[] (Message에서 derive) | Pair 1:1 |
| SuccessGate | supporting | gate_type (G1/G2), criteria | DemoSession 1:N |
| DemoSession | supporting | duration, started_at | 1:N SuccessGate |
| Retrospective | supporting | what_worked, what_blocked, next_cycle_learning | Cycle 1:1 |
| **LockedCharacterCard** (R4) | supporting | label="Coming Soon", disabled, character_slot_id | CharacterSelector 1:N |
| **PersistentSession** (R5) | core (DB-backed) | anon_user_id ↔ Supabase pair_sessions row 매핑 | User 1:1 |

→ Message가 ChatRoom의 백킹 데이터로 분리되어 명확화 (R5).

---

## 온톨로지 수렴

| Round | Entity Count | New | Changed | Stable | Stability |
|---|---|---|---|---|---|
| 1 | 7 | 7 | - | - | N/A |
| 2 | 10 | 3 | 0 | 7 | 70.0% |
| 3 | 10 | 0 | 0 | 10 | 100% ✓ |
| 4 (Contrarian) | 11 | 1 (LockedCharacterCard) | 0 | 10 | 90.9% |
| 5 (사용자 직권) | 12 | 1 (PersistentSession) | 1 (Message 분리) | 10 | 91.7% |

→ R5에서 Supabase 도입으로 1 엔티티 추가 + Message 명확화. 정상 수렴.

---

## 메모리 1·2층 참조 매핑 + 갱신 알림

| PRD 섹션 | 근거 메모리 | 갱신 |
|---|---|---|
| Goal | `project_ohmyc_identity.md` + `project_hackathon_constraints.md` | hackathon_constraints 갱신 필요 |
| Constraints (스택) | `project_hackathon_constraints.md` | **Haiku → Gemini, no-DB → Supabase 갱신 필요** |
| Constraints (컷 정책) | R3 사용자 결정 2026-04-26 | 메모리 갱신 완료 |
| Constraints (잠금 카드) | R4 사용자 결정 2026-04-26 | PRD에만 박힘 |
| Constraints (Supabase) | R5 사용자 결정 2026-04-26 | hackathon_constraints 갱신 필요 |
| Non-Goals | `project_roadmap.md` 확장 슬롯 | DB가 슬롯에서 빠져나옴 — 로드맵 메모리에 메모 |
| 시연 위험 대응 | `project_consistency_guardrays.md` [추론 3] | 위험 2(sessionStorage 휘발)가 자산으로 전환 — 메모리 메모 가치 |
| 디자인 토큰 | `project_design_system.md` | 변경 없음 |
| 시연 동선 | `project_pair_onboarding.md` 4단계 + R4·R5 보강 | 메모리는 그대로 (PRD가 더 상세) |
| 자가 reject (PRD 작성) | `feedback_writing_rules.md` 8규칙 | 변경 없음 |
| 협업 톤 (PRD 한국어·구조화) | `feedback_collaboration_tone.md` | 변경 없음 |

---

## 인터뷰 트랜스크립트

<details>
<summary>Full Q&A (4 rounds + 2 사용자 직권 결정)</summary>

### Round 1 — Goal Clarity
- **Q**: 이 PRD가 다루는 시간 스코프는 어디까지인가요?
- **A**: 해커톤 MVP만 (추천)
- **Ambiguity**: 22.5%

### Round 2 — Success Criteria
- **Q**: 60초 데모가 '성공했다'를 어떻게 판정하시겠어요?
- **A**: G1 정량 + G2 정성 + 부수 기준 4개 (Claude 추천 → 사용자 승인)
- **Ambiguity**: 15.0%

### Round 3 — Goal (Cut Priority)
- **Q**: 9시간이 부족할 때 60초 데모를 어디까지 컷할 수 있을까요?
- **A**: 4단계 풀 사수
- **Ambiguity**: 11.0%

### Round 4 — Contrarian (마켓플레이스 정체성 도전)
- **Q**: 프리셋 1명 고정이 마켓플레이스 정체성과 충돌할 수 있습니다. 9시간 박스 안에서 어떻게 대응하시겠어요?
- **A**: 잠금 카드 추가 (추천)
- **Ambiguity**: 8.1%

### R5-① 사용자 직권 (PRD 직접 편집) — LLM 변경
- **결정**: Claude Haiku → Google Gemini 2.5 Flash + 4개 키 로테이션
- **시점**: 2026-04-26 PRD 첫 결정화 직후 사용자 수동 편집

### R5-② 사용자 직권 (이번 메시지) — DB 도입
- **결정**: no-DB 원칙 폐기, Supabase 영속화 도입
- **이유 (사용자 메시지)**: "DB를 하지 않는 게 이상합니다 (기억과 관련된 내용)"
- **함의**: 슬로건 *"기억(Memory) + 행동(Action) + 성장(Growth)"* 의 "기억"을 시연 자체에서 입증
- **Ambiguity 영향**: 8.1% → 9.3% (테이블/인증 추측 도입으로 미세 상승)

</details>

---

## 메타: 자가 reject 검증 (PRD 작성 시점)

출처: `feedback_writing_rules.md` 8규칙

- ✓ 한국어 1차 (변수·코드 식별자·SQL 외)
- ✓ 슬로건 5종 원문 보존 (*"기억(Memory) + 행동(Action) + 성장(Growth)"*, *"우리는 채팅이 아니라 에이전트를 만든다"*, *"개발자에겐 오픈클로, 대중에겐 ohmyc"*)
- ✓ 결정타 카피 *"알았어, 3시간 뒤에 다 했는지 내가 꼭 물어볼게!"* 그대로 인용
- ✓ 금지어 0건 ("비서·집사·도우미", ohmyc 묘사의 "채팅" 모두 부재 — "채팅"은 슬로건/기술 용어로만 등장)
- ✓ 추측·추론은 메모리 출처 명기 + Supabase 테이블·시연 보강 등은 (추측) 표시
- ✓ 일자 ISO 8601 (`2026-04-26`)
- ✓ 영합 표현 0건
- ✓ 시점 명기 (Plaitoon ₩132M = 2026-02 기준 등 외부 데이터 — 본 PRD에선 직접 인용 없음)

## Challenge Modes 사용 기록

| 모드 | 활성 라운드 | 도전 내용 | 결과 |
|---|---|---|---|
| Contrarian | R4 | "프리셋 1명 고정이 마켓플레이스 정체성과 충돌하는가?" | 잠금 카드 2-3개 추가 결정 |
| Simplifier | (미사용) | — | — |
| Ontologist | (미사용 — 모호도 ≤ 0.3 미달) | — | — |
