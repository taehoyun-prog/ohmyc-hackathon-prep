# RFC: ohmyc 캐릭터 시스템 v1 (Phase 1 + boundary surface)

## Metadata
- 작성일: 2026-04-26 (KST)
- 작성자: track2-rfc (team ohmyc-prod-align)
- 대상 단계: pre-launch (ohmyc 독립 제품, Plaitoon과 분리)
- Spec 출처: `.omc/specs/deep-interview-ohmyc-character-context-production.md`
- Status: Draft (Critic + code-reviewer + 사용자 approval 대기)
- 인식론적 자기 점검: 본 RFC는 Phase 1 결정만 단정하고, 그 외는 "모르는 것을 모른다고 적는다" 원칙으로 Open Questions / Boundary Surface 섹션에 명시한다.

---

## 0. Goals & Non-Goals

### Goals (spec Track 2 인용)
- 캐릭터 본체를 **5개 레이어**로 풀 명세 (Visual / Persona / Relational State / Action / Growth)
- **5개 결정 분기**(IP / 렌더링 스택 / 음성 / 행동 채널 / Growth 정량 모델)에 ADR 형식으로 입장 명시 — 사용자 미결정 분기는 Tentative default + 대안 명시
- **Phase 1 (0~3개월)** 구현 단계는 executor가 시작 가능한 구체성 (파일 path 또는 함수명 anchor + 자동 검증 milestone)
- Phase 2~3은 boundary surface로만 명시 — 확장점만 적고 단정하지 않는다

### Non-Goals (spec 그대로)
- 캐릭터 본체 코드 구현 (RFC만, 코드 변경 없음)
- 다중 캐릭터 시스템 도입 (boundary surface로만)
- 음성·lip sync 인프라 도입 (RFC 결정만)
- Live2D / 3D 자산 제작 (RFC 결정만)
- 새 백엔드·새 디자인 시스템·새 테스트 인프라 도입
- 기존 docs nuke / archive (Track 1이 surgical edit 담당)
- 60초 시연 시나리오 자체의 정합성 검증 (시연 보존)
- 메모리(MEMORY.md memory_files) 의 사실 항목 자체 변경

---

## 1. 배경 및 베이스라인

### 1.1 현재 시스템 상태 (file:line anchor)

| 영역 | 상태 | Anchor |
|---|---|---|
| Visual | 추상 오브 (점 하나 박힌 발광 구체), Breathe 모션 적용 | `components/Avatar.tsx:1-47` |
| Persona | 6줄 정적 system prompt, 두 곳에 분기 존재 | `lib/gemini.ts:27-33` (`SERINE_SYSTEM_PROMPT`), `app/api/promise-copy/route.ts:10-17` (`SERINE_PROMISE_SYSTEM`) |
| Relational State | 스키마·식 정의됨, **prompt 미주입** | `supabase/migrations/0002_production_loop.sql:16-30` (memories), `lib/memories.ts:127-159` (`listRecentMemories`), `lib/memories.ts:161-188` (`computeRelationshipTemperature`) |
| Action — 스케줄링 | cron 존재 (5분 주기), Web Push 미발송 | `app/api/cron/check-due-and-decay/route.ts:14-94` (TODO line 45 web-push 미구현) |
| Action — legacy 단일채널 | `checkin_state='due'` 마킹만 | `app/api/proactive-check/route.ts:67-95` |
| Growth | 정량 식 부분 (`computeRelationshipTemperature`), 응답 미반영 | `lib/memories.ts:161-188` |
| AI 통합 | Gemini 3 Flash Preview, 4-key 라운드로빈 | `lib/gemini.ts:11-23, 35-66` |
| Reminder 시간 휴리스틱 | 시간대 키워드 + 결정타 카피 3패턴 | `lib/reminder-heuristic.ts:50-126` |
| Schema v1 | memories 4-layer (working/active/stable/core) + recall, push_subscriptions, temperatures, agent_loop_runs, check_in_responses, weekly_summaries | `supabase/migrations/0003_v1_schema.sql:7-136` |

### 1.2 핵심 갭 (RFC가 채워야 할 것)

(spec Technical Context > 핵심 갭 7종 발췌 + 베이스라인 검증 결과)

1. **Memory→Persona 주입 경로 부재 (가장 큰 갭)**
   - `lib/memories.ts:127` `listRecentMemories` 가 `app/api/{promise-copy,greet}/route.ts` 어디서도 호출되지 않음
   - prompt가 정적 6줄 + 사용자 입력만으로 합성됨 — 친밀도·기억된 사실·마지막 만남 컨텍스트가 응답에 반영되지 않음
2. 시각 캐릭터 부재 — `Avatar.tsx`는 추상 오브
3. Action 발현 채널 부재 — cron이 due를 마킹하지만 push 발송 라이브러리 미연결 (TODO comment)
4. Persona 정적 — system prompt 고정, 진화 facility 없음
5. 단일 캐릭터 — `character_id='serine'` 하드코딩 (`migrations/0001_init.sql:8`) (Phase 2~3 boundary)
6. 음성 인프라 0
7. Growth 정량 미발현 — `computeRelationshipTemperature` 결과가 prompt나 UI에 흐르지 않음

---

## 2. 캐릭터 본체 — 5개 레이어

### 2.1 Visual Layer

**책임 영역**
- 캐릭터의 **시각적 본체**: 형상·컬러·모션·표정·의상 슬롯
- 사용자 첫 인상의 70%를 결정 (추측: 중간) — Phase 1에서 추상 오브 → 정적 일러스트 4상태로 격상

**현재 상태**
- `components/Avatar.tsx:21-44`: radial-gradient 발광 구체 + 우측 상단 dot 1개. Breathe 모션 (3.5s) 적용. `--omc-tint` 단일 액센트 사용.
- `components/Avatar.tsx:49-63`: `BloomCircle` (배경 광채만, dot 없음).
- 즉, **표정·자세·시선·의상 모두 없음**.

**Phase 1 목표 — 정적 일러스트 4상태**
- 4가지 상태 SVG/PNG: `idle`, `listening`, `thinking`, `smiling`
- 자산 위치: `public/assets/serine/{idle,listening,thinking,smiling}.{svg|webp}`
- `Avatar.tsx`는 `state` prop을 받아 swap; `BloomCircle` 배경 광채는 유지; `omc-breathe` 클래스도 유지
- `--tint #FF8552` 단일 액센트, Apple HIG + Liquid Glass 골격 보존
- 정적이라는 점 자체를 디자인 컨셉으로 — "조용히 있는 페어" 이미지

**Phase 2~3 boundary surface (확장점만 명시, 단정 안 함)**
- 표정 라이브러리 (감정·맥락별 N종) — 인터페이스 슬롯만 RFC에 남기고 실제 종 수는 디자이너 외주 후 결정
- 의상·헤어·액세서리 슬롯 — `pair_sessions`에 `appearance_meta JSONB` 추가 가능성 (boundary)
- Live2D / Rive / Spine / 3D 애니메이션 (ADR-2 결정에 따름)
- lip sync (음성 결정 ADR-3에 따름)

**자산 파이프라인 개요 (Phase 1 한정)**
1. 디자이너 외주 또는 in-house: 4상태 정적 일러스트 (사이즈: 184×184 base, 2x retina)
2. 자산 검수 — `--tint #FF8552` 보존, Breathe 1.00↔1.02 스케일에서 깨지지 않는지 확인
3. `public/assets/serine/` 배포, `Avatar.tsx`에서 swap

### 2.2 Persona Layer

**책임 영역**
- 캐릭터의 **언어적 본체**: 톤 / 어투 / 금지어 / 1인칭 / 응답 길이 / 결정타 카피 보존 정책

**현재 상태**
- `lib/gemini.ts:27-33` — `SERINE_SYSTEM_PROMPT`: 6줄 정적 디렉티브 (반말, 마침표, 비서·집사·도우미·어시스턴트 금지, 한 문장~두 문장, 결정타 라인 시스템 박힘)
- `app/api/promise-copy/route.ts:10-17` — `SERINE_PROMISE_SYSTEM`: promise 보조 한 줄 전용 prompt (시간 단어 금지 추가)
- 즉, **두 prompt가 코드 두 곳에 박혀 있음** (Phase 1 진화 facility의 시작점)

**System prompt 진화 모델 (Phase 1)**
- 정적 string → 함수: `buildSerineSystemPrompt(context: ContextPackage): string`
- 베이스 디렉티브 (현재 6줄, 보존) + 동적 메모리 스니펫 + 관계 상태 라벨 + (선택) 마지막 만남 컨텍스트
- 합성 우선순위: **베이스 > 금지어 > 결정타 정책 > 메모리 스니펫 > 관계 상태 > 사용자 입력**

**톤 규칙·금지어 정책 (보존)**
- 한국어 우선, 반말, 한 문장~두 문장, 마침표 마감
- 금지어: 비서 / 집사 / 도우미 / 어시스턴트 / assistant / helper / chatbot / 봇
- 결정타 카피 ("3시간 뒤에 한번 물어볼게.", "이따 HH:MM에 한번 물어볼게.", "내일 HH:MM에 한번 물어볼게.")는 **시스템이 박는다** — LLM 절대 생성 금지 (현재 prompt도 이를 명시)

**voice print (boundary surface)**
- Phase 1: 음성 없음. voice print의 텍스트 정의 (1인칭 어휘·말 끝·감탄사 패턴)만 RFC에 남긴다
- Phase 2~3: ElevenLabs voice clone (ADR-3) — 텍스트 voice print를 음성 voice print로 확장

**1인칭 어휘 (Phase 1 텍스트 voice print 안)**
- 1인칭: "나" (반말 일관성)
- 사용자 호칭: 호칭 회피 (이름·"너" 모두 회피, 자연스러운 한국어 격조사로 처리)
- 자주 쓰는 어휘: "처음 / 알아가다 / 기억할게 / 곁에서 / 챙겨줄게" — 카피 톤 어휘 가드레일
- 감탄사: 절제 ("..." 사용 자제, 마침표 정직)

**현재 lib/gemini.ts:SERINE_SYSTEM_PROMPT 와의 관계**
- Phase 1 작업: 6줄 정적 → 함수 합성 (Phase 1.4)
- 두 prompt(`SERINE_SYSTEM_PROMPT`, `SERINE_PROMISE_SYSTEM`)는 베이스를 공유하고 컨텍스트별 부가 디렉티브로 분기 — 단일 진실 source 1개 + N derivative

### 2.3 Relational State Layer

**책임 영역**
- 사용자-세린 사이 **관계의 정량·정성 상태** 보관 + prompt 주입

**현재 상태 (스키마 / 함수)**
- 스키마: `supabase/migrations/0002_production_loop.sql:16-30` `memories` 테이블 (kind: fact / event / promise / pattern / mood / system, emotion: great / good / low / down)
- 스키마: `supabase/migrations/0003_v1_schema.sql:7-14` memories에 `layer` (working / active / stable / core), `recall_count`, `last_recalled_at` 추가
- 스키마: `supabase/migrations/0003_v1_schema.sql:38-45` `temperatures` 테이블 (current_temp, equilibrium 36.5 default, daily_avg, level)
- 함수: `lib/memories.ts:127-159` `listRecentMemories(pairSessionId, limit=6)`
- 함수: `lib/memories.ts:161-188` `computeRelationshipTemperature(memories, todos)` → `{score 0..1, label, summary}` (3구간: 온기 높음 / 안정 구간 / 돌봄 필요)

**친밀도 모델 (현재)**
- `score = clamp01(moodScore * 0.45 + completionScore * 0.40 + memoryDepth * 0.15)`
- moodScore: mood memories 평균 (great=1, good=0.78, low=0.42, down=0.24, 없으면 0.6)
- completionScore: todos 완료율 (없으면 0.5)
- memoryDepth: `min(memories.length / 12, 1)`

**기억된 사실 (memories 5종 kind)**
| kind | 의미 | seed 출처 |
|---|---|---|
| fact | 처음 안 사실 | `seedMemoriesForTodo` 비-패턴/이벤트 todo |
| event | 함께 지나간 순간 | `addTodoEventMemory(completed/snoozed)` |
| promise | 세린의 약속 | `seedMemoriesForTodo` 모든 todo |
| pattern | 반복되는 습관 | `inferNonPromiseKind` 정규식 (매일/항상/꾸준/...) |
| mood | 오늘의 기분 | `addMoodMemory` |
| system | 시스템 기록 | normalizeMemory fallback |

**마지막 만남 컨텍스트 (Phase 1 인터페이스만 정의)**
- `last_seen_at`(가칭): 가장 최근 memory의 `created_at` 또는 가장 최근 active session의 timestamp
- 시간 거리에 따른 인사 분기 (예: <2h → 가벼운 인사 / >2일 → 안부) — Phase 1 milestone 기준에선 인터페이스만, 실제 분기 로직은 Phase 1.4 진화 facility에서 결정

**가장 큰 갭 — listRecentMemories() 미호출 (Phase 1 핵심 작업)**
- 현재 `listRecentMemories`는 read 함수로 정의만 돼 있고 어떤 API route도 호출하지 않음
- Phase 1.1에서 `app/api/{promise-copy,greet}/route.ts` 진입 시 컨텍스트 패키지를 빌드하고 prompt에 주입한다 (구체 Phase 1.1 참조)

### 2.4 Action Layer

**책임 영역**
- 캐릭터가 **"먼저 한 일"** 의 로그·발현 채널·발현 트리거

**현재 상태**
- 스키마: `supabase/migrations/0002_production_loop.sql:5-9` todos에 `checkin_state`, `last_notified_at`, `snoozed_until`, `notification_count` 컬럼 존재
- cron: `app/api/cron/check-due-and-decay/route.ts:14-94` 5분 주기 due 스캔 + memory_decay (03:00 idempotent), Web Push **미연결** (line 45 TODO comment)
- legacy: `app/api/proactive-check/route.ts:67-95` `checkin_state='due'` 마킹 routine
- 스키마: `0003_v1_schema.sql:19-33` `push_subscriptions` 테이블 존재 (endpoint, p256dh, auth, is_ios)
- 즉, 인프라는 거의 다 있고 **web-push 라이브러리 호출 한 군데가 비어 있음**

**발현 채널 (현재)**
- 인앱 (`checkin_state='due'` 마킹 → 클라이언트 폴링 또는 채팅창 변화) — 동작 가능하나 사용자가 앱을 켜야만 확인됨
- Web Push: 인프라 있고 발송 미구현
- 푸시·이메일·캘린더: 모두 없음

**Phase 1 (단일 채널 우선)**
- 인앱 + Vercel Cron + Web Push (`web-push` npm 패키지) 1차
- 푸시·이메일·캘린더는 Phase 2~3 boundary

**자세한 결정 → ADR-4 참조**

### 2.5 Growth Layer

**책임 영역**
- 시간 누적에 따른 **1·2·3 레이어 변화 규칙** (시각·언어·관계 진화)

**Phase 1 정량 모델 (현재 facility 확장)**
- 친밀도 식: `lib/memories.ts:161-188` `computeRelationshipTemperature` 그대로 사용 + Phase 1.5에서 score를 prompt 합성에 흘림
- 기억 깊이 식: 현재 `memoryDepth = min(memories.length / 12, 1)`
- 4-layer 진화 (`memories.layer`): working → active → stable → core
  - 0003 schema에 컬럼 존재. memory_decay cron이 7일 active → stable로 흘림 (`check-due-and-decay/route.ts:67-87`)
  - core 승격 규칙: Phase 1.5에서 정의 (예: `recall_count >= 3 AND layer='stable'` → core 승격)
- 발현 임계값: Phase 1.5에서 정의 (예: temperature `score >= 0.78` → "온기 높음" 모드 응답 톤; `score < 0.4` → "돌봄 필요" 톤; 인터페이스만 통일)

**외형 진화 트리거 (Phase 2~3 boundary surface)**
- 친밀도 segment / 누적 기억 수 / core memory 수에 따른 의상·표정 슬롯 unlock 가능성 — 단정 안 함
- 첫 만남 vs 30일차 vs 100일차 시각적 차이 — Phase 2~3에서 결정

**자세한 결정 → ADR-5 참조**

---

## 3. 5개 결정 분기 ADR

ADR 형식: Decision / Drivers / Alternatives / Why chosen / Consequences. 사용자 명시 결정은 단정, 미결정 분기는 **[Tentative]** 마크 + 추천 default.

### ADR-1: IP 귀속

**Decision**: ohmyc 자체 IP (사용자 명시 결정).

**Drivers**
- ohmyc는 Plaitoon과 **분리된 독립 제품** (spec Constraints, R3 사용자 명시)
- 향후 캐릭터 자산이 사용자 데이터(memories, temperatures)와 묶임 — 권리 명확화 필요
- pre-launch 단계 — 지금 결정해두지 않으면 추후 분리 비용 큼

**Alternatives**
1. 외주 디자인사 IP — 라이선스 비용·확장 제약, 거부
2. Plaitoon 자산 차용 — 사용자 명시 거부 (R3 답변)

**Why chosen**
- 사용자 명시 결정. ohmyc 독립성 확보.

**Consequences**
- 캐릭터 원화·모델링·표정·voice를 자체 제작 또는 work-for-hire 외주 (ohmyc 귀속 계약)
- 외주 비용 단계적 발생 (Phase 1: 정적 일러스트 4상태, Phase 2~: 표정 라이브러리·의상 슬롯·voice clone)
- 권리·라이선스 문서화는 launch 직전 사이클에서 (Open Question)

### ADR-2: 렌더링 스택

**Decision**: **[Tentative — Phase 1은 정적 일러스트 (svg/webp). Phase 2 1차 권장: Live2D Cubism Web].**

**Drivers**
- Phase 1: 4상태 정적 swap만으로 검증 가능 (boundary surface 원칙)
- Phase 2: 페어 톤 (차분·정제·다정) 유지하려면 2.5D 자연스러운 모션 필요
- 모바일 웹앱 기준 (`max-w-md` 단일 컬럼, 저사양 기기 고려) — 가벼운 런타임 우선
- 한국·일본 사용자 정서: 2.5D / VTuber-style 익숙함 (추측: 중간)

**Alternatives**
1. **Rive** — 인터랙티브 무료, 표현 한계 (페어 톤보다 게임적 톤에 강함)
2. **Spine** — 게임 톤, 라이선스 비용, 페어 톤과 거리
3. **3D VRM** — 풍부 표현 가능하나 모바일 부하·제작 비용 큼; Phase 2~3 후보로 boundary
4. **계속 정적** — 가장 싸지만 Growth Layer 외형 진화 표현 한계

**Why chosen (Tentative)**
- Live2D는 페어의 차분한 톤과 잘 맞고 모바일 웹 호환성 검증된 실적 多 (추측: 높음)
- 라이선스 비용은 매출 단계에서 검토 (Plaitoon 매출 ₩132M/월 레퍼런스로 예산 가능 — Open Question)
- Phase 1에서 정적부터 시작해 사용자 반응 확인 후 Phase 2 결정 — 인식론적 정직성

**Consequences**
- Phase 1: 외주 비용 = 일러스트 4상태 (예상: 추측 낮음 — 견적 후 결정)
- Phase 2: 라이선스 비용 단계, 디자이너·모델러 외주 4-8주 (추측: 중간), 모바일 호환성 별도 검증 필요
- 결정 미루는 비용: Phase 1 정적 자산은 Phase 2 Live2D 모델의 reference로 재활용 가능 → 미루는 비용 낮음

### ADR-3: 음성

**Decision**: **[Tentative — Phase 1: 음성 없음. Phase 2 1순위: ElevenLabs voice clone (사용자 명시 비용 모델 검증 필요)].**

**Drivers**
- 결정타 카피 ("3시간 뒤에 한번 물어볼게.")의 음성 톤 일관성이 페어 정체성에 직결
- pre-launch 단계에서 voice clone 단가는 검증 필요 (사용자/세션당 비용)
- voice print는 Persona Layer의 텍스트 정의가 선행되어야 함 (Phase 1에 텍스트 voice print 정의)
- 한국어 자연스러움 우선 (Pretendard 톤과 결합)

**Alternatives**
1. 범용 TTS (Google Cloud TTS / Azure / OpenAI) — 비용 낮음, 캐릭터 정체성 약함
2. ElevenLabs voice clone — 캐릭터 톤 강함, 비용 모델 미검증
3. 자체 모델 (open-source TTS fine-tune) — 운영 부담 큼
4. 음성 없음 유지 — 텍스트 페어로 시작, 사용자 반응 후 결정

**Why chosen (Tentative)**
- Phase 1에서 음성 도입은 ROI 미검증 — 텍스트만으로 페어 정체성 검증 가능 (R6 Simplifier 원칙)
- Phase 2: ElevenLabs voice clone이 캐릭터 톤 일관성 측면 강점 (추측: 중간)
- 비용 모델은 launch 직전 사용자 N과 세션당 음성 사용 빈도 예상치 확보 후 결정

**Consequences**
- Phase 1: 0 비용
- Phase 2: voice clone 단가 (per-character + per-second TTS) — 매출 단계 ROI 비교 필요
- Phase 1.4에서 텍스트 voice print 명세 (1인칭, 어휘, 말 끝 패턴)는 음성 도입 시 그대로 brief로 사용

### ADR-4: 행동 채널

**Decision**: **Phase 1 단일 채널 — 인앱 + Vercel Cron + Web Push (web-push 라이브러리). Phase 2부터 푸시(iOS APNs)·이메일·캘린더 확장은 boundary surface.**

**Drivers**
- 0003 schema에 `push_subscriptions` 테이블 존재 + cron 인프라 존재 — Web Push가 사실상 가장 가까운 결승선
- spec R6 Simplifier: 단일 채널 우선
- 인앱 + Web Push만으로 결정타 카피 ("3시간 뒤에 한번 물어볼게.") 발현 가능
- iOS Web Push는 PWA installed 상태에서만 — 보조 채널로 boundary

**Alternatives**
1. 다채널 (인앱 + 푸시 APNs + 이메일 + 캘린더) — Phase 1 범위 초과
2. 이메일만 — 즉시성 부족
3. 인앱만 (Web Push 없음) — 사용자가 앱 안 켜면 발현 0

**Why chosen**
- 인프라가 가장 가까움 (`push_subscriptions` 테이블 + cron + web-push npm 추가만 필요)
- 결정타 카피의 시간성과 가장 잘 맞음 (실시간 발현)
- 인앱 폴링 fallback 유지 → 환경 광범위 커버

**Consequences**
- Phase 1.3 작업: web-push 라이브러리 설치 + `app/api/cron/check-due-and-decay/route.ts:45` TODO 자리에 발송 호출 추가 + VAPID 키 환경변수 (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) 도입
- iOS Safari 제약 (PWA installed 상태에서만 Web Push) → Phase 2에서 PWA install prompt 또는 APNs 전환 결정
- Vercel Hobby plan cron 1일 1회 한도 (Pro 필요) — Open Question 또는 자체 Vercel Pro 가정

### ADR-5: Growth 정량 모델

**Decision**: **Phase 1 — 친밀도 식 (현 `computeRelationshipTemperature` 확장) + 기억 깊이 식 + memory layer 4단계 + listRecentMemories 주입 임계값. Phase 2~3 — 외형 진화 트리거.**

**Drivers**
- 정량은 검증 가능해야 함 (spec "측정 가능 형태" 요구)
- 현재 식이 이미 0~1 score를 출력 → prompt 합성에 그대로 흘릴 수 있음
- 4-layer (working/active/stable/core) 컬럼은 0003에 이미 존재 → 승격 규칙만 RFC에서 결정

**Alternatives**
1. 단일 친밀도만 (memory layer 무시) — 기억 깊이 표현 손실
2. 다차원 (친밀도·신뢰·즐거움 등 N차원) — Phase 1 범위 초과
3. 외형 진화도 Phase 1 포함 — Visual Layer Phase 1 (정적 4상태)와 충돌

**Why chosen**
- 현재 facility 그대로 활용 → 추가 인프라 0
- 승격 규칙은 검증 가능 (memory 수, recall_count 측정 가능)
- 외형 진화 트리거는 정적 자산만 있는 Phase 1에서 무의미 → 자연스러운 Phase 2 진입

**Consequences**
- Phase 1.5 작업:
  1. `score → prompt 톤 분기` (3구간: 온기 높음 / 안정 구간 / 돌봄 필요)
  2. memory layer 승격 규칙 정의 (예: `active` → `stable`은 7일 idle, `stable` → `core`는 `recall_count >= 3`)
  3. 발현 임계값 정의 (예: temperature `score < 0.4` 일 때 cron 발현 빈도 줄임)
- 정량 정의가 잘못되면 응답 톤이 어긋남 → A/B 측정 facility는 Phase 2 (Open Question)

---

## 4. Phase 1 (0~3개월) 구현 단계

executor가 시작 가능한 구체성. 각 단계는 **파일 path 또는 함수명 anchor + 자동 검증 milestone**.

### Phase 1.1 — Memory→Persona 주입 (가장 큰 갭 해결, ROI 1순위)

**File anchors**
- `app/api/promise-copy/route.ts:26-52` (POST handler)
- `app/api/greet/route.ts:16-44` (POST handler)
- `app/api/proactive-check/route.ts:32-105` (GET handler — legacy 단일 채널 경로)
- `lib/memories.ts:127-159` (`listRecentMemories` — read 함수, 그대로 호출)
- `lib/memories.ts:161-188` (`computeRelationshipTemperature` — read 함수, 그대로 호출)

**작업**
1. **신규 함수**: `lib/context-package.ts` — `buildContextPackage(pairSessionId): Promise<ContextPackage>`
   - 인터페이스:
     ```ts
     type ContextPackage = {
       recent_memories: { kind, content, emotion, created_at }[];   // listRecentMemories(pairSessionId, 6)
       relationship_state: { score, label, summary };                // computeRelationshipTemperature(memories, todos)
       mood_trend: "rising" | "stable" | "falling" | "unknown";      // 최근 mood memory 3개 비교
     };
     ```
2. **신규 함수**: `lib/persona-prompt.ts` — `buildSerineSystemPrompt(base: string, ctx: ContextPackage): string`
   - 베이스(현재 6줄) + 메모리 스니펫 (최대 6 lines) + 관계 상태 한 줄 + (선택) mood_trend 한 줄
3. 각 route에서:
   - body parse 직후 `pair_session_id` 획득 (현재 routes 시그니처 변경 필요 — request body에 추가, 또는 익명 세션 헤더에서 획득)
   - `buildContextPackage` 호출 → `buildSerineSystemPrompt(SERINE_SYSTEM_PROMPT, ctx)` 결과를 `generateWithRotation`의 systemPrompt 인자로 전달

**Milestone (자동 검증 가능)**
- integration test (manual 또는 vitest): 동일 `todoText` 입력에 대해 메모리 0개 vs 메모리 6개 (mood='great' 3개 + completed todo 3개) 시 응답 텍스트가 다름을 확인 (deterministic은 아님 — substring assertion 또는 length delta 측정)
- LLM 호출 systemPrompt 길이가 메모리 컨텍스트 주입 시 증가하는지 lib unit test로 확인

**위험**
- prompt 길이 증가 → latency 증가 → cost 증가. 메모리 6개 + 관계 상태 1줄 + mood_trend 1줄로 상한 결정 (~8 lines)
- pair_session_id 식별이 routes 시그니처 변경을 강제 — 클라이언트에서 매 요청에 첨부 (또는 cookie/세션) 결정 필요 (Open Question)

### Phase 1.2 — Visual Layer 1차 (정적 일러스트 4종)

**File anchors**
- `components/Avatar.tsx:1-47` (Avatar 컴포넌트)
- `public/assets/serine/{idle,listening,thinking,smiling}.{svg|webp}` (신규 자산)

**작업**
1. 자산 4종 입수 (디자인팀 외주 또는 in-house, 184×184 기본 + 2x retina)
2. `Avatar.tsx`에 `state?: "idle" | "listening" | "thinking" | "smiling"` prop 추가
3. radial-gradient 발광 구체 → 자산 swap, dot 제거 (또는 선택적 유지)
4. `omc-breathe` 클래스, `BloomCircle` 배경 광채, `--omc-tint` 토큰 그대로 보존
5. 사용처에서 prop 전달:
   - 인사 시: `state="smiling"`
   - 입력 중일 때: `state="listening"`
   - LLM 호출 중일 때: `state="thinking"`
   - 디폴트: `state="idle"`

**Milestone**
- 4상태 모두 시각 검증 (스크린샷 첨부 — 60초 시연 화면 동선과 일치하는지)
- Lighthouse 모바일 점수 회귀 0 (자산이 가벼운지)

**위험**
- 자산 외주 일정 (4-6주, 추측: 중간) → Phase 1 전체 일정에 영향
- 4상태가 너무 비슷하면 사용자가 차이 인지 못 함 → 디자인 brief에서 차이 명확화

### Phase 1.3 — Action Layer 1차 (Web Push 결승)

**File anchors**
- `app/api/cron/check-due-and-decay/route.ts:45` (TODO 위치, web-push 발송 호출이 들어갈 자리)
- `supabase/migrations/0003_v1_schema.sql:19-33` (`push_subscriptions` 테이블 — 그대로 사용)
- `package.json` (web-push npm 추가)
- `app/api/push/` 디렉토리 (구독 등록 route, 베이스라인에 디렉토리 존재 확인됨 — 내부 구현 필요)

**작업**
1. `web-push` npm 설치 + VAPID 키 생성 (`web-push generate-vapid-keys` 한 번)
2. 환경변수: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
3. 클라이언트 service worker 등록 + 구독 → `app/api/push/subscribe` POST 로 endpoint+keys 저장
4. `app/api/cron/check-due-and-decay/route.ts:45` TODO 자리:
   ```ts
   const { data: subs } = await supabase.from("push_subscriptions")
     .select("*").eq("anon_user_id", /* pair_session → anon_user_id 조인 */);
   for (const sub of subs ?? []) {
     await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth }}, JSON.stringify({ title: "세린", body: <결정타 카피> }));
   }
   ```
5. 결정타 카피는 `lib/reminder-heuristic.ts:103-112` `derivePromiseHeadline` 결과 사용 (보존)

**Milestone**
- Vercel Cron이 5분 주기로 실행되며 due todo 검출 + Web Push 발송 성공 (서버 로그 + 클라이언트 OS 알림 표시)
- iOS PWA installed 상태에서 알림 도착 확인
- 알림 미도착 시 fallback (인앱 polling)이 여전히 동작

**위험**
- iOS Web Push는 PWA installed 상태에서만 → 사용자 비율 낮을 가능성 (추측: 높음) → Phase 2 APNs 또는 PWA install prompt 결정
- VAPID 키 환경변수 노출 사고 → Vercel env에 production-only 설정
- Vercel Hobby cron 한계 (1일 1회) → Vercel Pro 가정 필요 (Open Question)

### Phase 1.4 — Persona Layer 진화 facility

**File anchors**
- `lib/gemini.ts:27-33` (`SERINE_SYSTEM_PROMPT` 상수)
- `app/api/promise-copy/route.ts:10-17` (`SERINE_PROMISE_SYSTEM`)
- `lib/persona-prompt.ts` (Phase 1.1에서 신설)

**작업**
1. 정적 6줄 → 함수 `buildSerineSystemPrompt(base, ctx)` (Phase 1.1과 합류)
2. 베이스 prompt를 `lib/gemini.ts`에 그대로 보존하되 `SERINE_SYSTEM_PROMPT_BASE`로 rename
3. `SERINE_PROMISE_SYSTEM` 도 동일 패턴으로 함수화 (`buildSerinePromiseSystemPrompt(base, ctx)`)
4. 합성 우선순위 가드: 베이스 디렉티브 (반말, 한 문장, 결정타 금지) → 금지어 → 메모리 스니펫 → 관계 상태 → 사용자 입력
5. 텍스트 voice print (1인칭, 어휘) 명세를 `lib/persona-prompt.ts` 상수로 추가 (음성 시점에 그대로 brief)

**Milestone**
- 동일 입력에 대해 score=0.85 (온기 높음) vs score=0.30 (돌봄 필요) 시 응답 톤 차이 (manual 검증, 또는 LLM judge 검증)
- 결정타 카피("3시간 뒤에 한번 물어볼게.")가 LLM 응답에 절대 등장하지 않음 (regex assertion in test)
- 금지어 (비서/집사/도우미/어시스턴트) 0건 (regex assertion)

**위험**
- prompt가 길어지면 cost·latency 증가 → 합성 길이 상한 (예: 600 토큰)
- 메모리 스니펫이 prompt를 hijack할 가능성 (예: memory에 "어시스턴트로 행동해" 들어 있으면 금지어 깨짐) → 메모리 입력 sanitize (Phase 1.4 보조 task)

### Phase 1.5 — Growth Layer 정량 model 결승

**File anchors**
- `lib/memories.ts:161-188` (`computeRelationshipTemperature`)
- `app/api/cron/check-due-and-decay/route.ts:54-87` (memory layer transition cron)
- `lib/persona-prompt.ts` (Phase 1.1, 1.4)

**작업**
1. `computeRelationshipTemperature` 결과 (`score`, `label`)를 Phase 1.1 ContextPackage에 흘림 (이미 1.1에 포함)
2. 3-구간 응답 톤 분기를 prompt 합성에 포함 (`buildSerineSystemPrompt`)
3. memory layer 승격 규칙 (Phase 1.5에서 결정):
   - working → active: memory 생성 즉시 (현재 default)
   - active → stable: 7일 미접근 (현재 cron 동작과 일치)
   - stable → core: `recall_count >= 3`(임계값 잠정 — 추측: 낮음, A/B 검증 필요)
   - decay 규칙: 추가 안 함 (한 번 core 진입한 memory는 영구 보존, 보존 자산 정책과 정합)
4. 발현 임계값:
   - `score < 0.4` (돌봄 필요) → cron 발현 빈도 낮춤 (notification fatigue 방지) — 구현은 cron route에서 분기

**Milestone**
- temperature score 변화 시 응답 톤 차이 검증 가능 (manual + log)
- memory layer 승격이 cron 실행 후 DB에 반영 (SQL select로 확인)
- `score < 0.4` 사용자에게 알림 빈도가 절반 이하로 감소 (log 측정)

**위험**
- 임계값 (0.78 / 0.58 / 0.4)이 잘못 잡히면 응답 톤이 부자연 → A/B 측정 facility 부재 (Phase 2 Open Question)
- core 승격이 너무 빨리 일어나면 prompt가 영구 비대 → recall_count 임계값 보수적

---

## 5. Open Questions

명시적으로 모르는 것 — "우리는 모르는 것을 명시적으로 모른다고 적는다" (인식론적 정직성).

| # | Question | 현재 상태 | 결정 시점 |
|---|---|---|---|
| OQ-1 | ElevenLabs voice clone 단가 (per-character + per-second) | 모름 | Phase 2 진입 직전 |
| OQ-2 | 렌더링 스택 최종 결정 (Live2D vs Rive vs 3D) | Tentative | Phase 1 정적 자산 사용자 반응 검증 후 |
| OQ-3 | 캐릭터 IP 권리의 법적 구조 (저작권 등록 / 상표 / work-for-hire 계약 템플릿) | 모름 | launch 직전 사이클 |
| OQ-4 | Plaitoon 자산의 ohmyc 차용 가능성 (현재는 분리 결정, 향후 협의) | 분리 결정 (R3) | Phase 2~3에서 사용자 재결정 가능성 |
| OQ-5 | iOS Web Push 사용자 비율 / PWA install rate | 모름 | Phase 1.3 1주 운영 후 측정 |
| OQ-6 | Vercel Cron Pro 필요 여부 (Hobby는 1일 1회) | Pro 가정 | Phase 1.3 시작 전 사용자 결정 |
| OQ-7 | pair_session_id 클라이언트 식별 전달 방법 (cookie / header / body) | 미결정 | Phase 1.1 시작 전 |
| OQ-8 | 응답 톤 A/B 측정 facility (LLM judge / 사용자 평점) | 부재 | Phase 2 |
| OQ-9 | 메모리 입력 sanitize 정책 (prompt injection 방어) | 미결정 | Phase 1.4 시작 전 |
| OQ-10 | 표정 라이브러리 N종 수 / 의상 슬롯 수 | 미결정 | Phase 2 디자이너 외주 견적 후 |
| OQ-11 | core memory 승격 임계값 (`recall_count >= 3`은 잠정) | Tentative | Phase 1.5 운영 1개월 후 |
| OQ-12 | 다중 캐릭터 (`character_id` 하드코딩 해제) | Phase 2~3 boundary | Phase 1 종료 후 |

---

## 6. Boundary Surface (확장점만 명시, Phase 1에선 단정 안 함)

spec Constraints > "Boundary surface only (확장점 명시만)" 그대로.

- **Scale**: 사용자 N에 대한 capacity 추정. 현재 supabase + Vercel 단일 region. multi-region·DB sharding은 Phase 2~3.
- **a11y (접근성)**: 시각 보조 (스크린리더 라벨, prefers-reduced-motion) — Phase 1 자산 작업 시 alt text 정도만, 풀 a11y 감사는 launch 직전.
- **음성 / 청각 보조**: voice clone 도입 시 자막 자동 생성 — Phase 2.
- **Compliance**: 한국 PIPA / GDPR — 사용자 메모리 보관·삭제 권리, 데이터 export. launch 직전 사이클.
- **Multi-region**: launch 단계.
- **음성 SLA**: voice clone 안정성·지연 (P95 < 1s 등) — Phase 2.
- **다중 캐릭터**: `character_id` 하드코딩 해제 + 사용자 선택 UI — Phase 2~3.
- **표정·의상 슬롯**: Visual Layer 확장 인터페이스 — Phase 2.
- **외형 진화 트리거**: Growth Layer 정량 모델과 Visual Layer의 결합 — Phase 2~3.
- **A/B 측정 facility**: 응답 톤 평가 / temperature 임계값 튜닝 — Phase 2.

---

## 7. 보존 자산 (이 RFC가 변경 안 함)

spec Track 1 보존 자산 8종 그대로 (Track 2도 동일 가드레일 준수).

1. 슬로건 5종 원문 ("대중의 첫 에이전트는 캐릭터다." / "우리는 채팅이 아니라 에이전트를 만든다." / "기억(Memory) + 행동(Action) + 성장(Growth)." / "나를 아는 캐릭터가 나를 위해 행동한다." / "개발자에겐 오픈클로, 대중에겐 ohmyc.")
2. 금지어 정책 (비서 / 집사 / 도우미 / 어시스턴트 / assistant / helper / chatbot / 봇)
3. `--tint #FF8552` (Soft Apricot) 단일 액센트
4. Apple HIG + Liquid Glass 골격
5. Breathe (3.5s, 1.00↔1.02) / Pulse (600ms, 1.00→0.97) 모션
6. 페어(Pair) · 세린(Serine) 정체성과 페르소나 톤
7. Plaitoon 트랙션 메모리 (이새로찬 CEO 소유 별개 회사 맥락 — ohmyc는 분리)
8. 결정타 카피 3패턴 (`lib/reminder-heuristic.ts:103-112`)

---

## 8. References

- spec: `.omc/specs/deep-interview-ohmyc-character-context-production.md`
- 베이스라인 코드:
  - `lib/gemini.ts:11-66` (Gemini provider, MODELS, SERINE_SYSTEM_PROMPT)
  - `lib/memories.ts:127-188` (listRecentMemories, computeRelationshipTemperature)
  - `lib/reminder-heuristic.ts:50-126` (시간 휴리스틱, 결정타 카피)
  - `app/api/promise-copy/route.ts:10-52`
  - `app/api/greet/route.ts:16-44`
  - `app/api/proactive-check/route.ts:32-105`
  - `app/api/cron/check-due-and-decay/route.ts:14-94` (cron + memory_decay)
  - `components/Avatar.tsx:1-63`
- 베이스라인 schema:
  - `supabase/migrations/0001_init.sql:1-40`
  - `supabase/migrations/0002_production_loop.sql:1-54`
  - `supabase/migrations/0003_v1_schema.sql:1-136`
- 디자인 토큰: `design/DESIGN.md`, `design/ohmyc-design-system/colors_and_type.css:15-101`
- 페어 컨셉: `docs/_context/페어컨셉.md`
- 피칭: `docs/_context/피칭내러티브.md`

---

**Status: Draft** — Critic + code-reviewer + 사용자 approval 대기.
