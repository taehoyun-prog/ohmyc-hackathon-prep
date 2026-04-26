# MEMORY.md — ohmyc 프로젝트 메모리

이 파일은 ohmyc 프로젝트의 컨텍스트를 유지하기 위한 저장소입니다. `GEMINI.md` 규약에 따라 관리됩니다.

---

## 1. "무엇" (Project / Reference)

### 제품 정체성 (SSOT)
- **정의**: 대중의 첫 캐릭터 에이전트. "기억(Memory) + 행동(Action) + 성장(Growth)"하는 수평적 파트너(Pair).
- **핵심 가치**: "나를 아는 캐릭터가 나를 위해 행동한다."
- **슬로건**:
  1. "대중의 첫 에이전트는 캐릭터다."
  2. "우리는 채팅이 아니라 에이전트를 만든다."
  3. "기억(Memory) + 행동(Action) + 성장(Growth)."
  4. "나를 아는 캐릭터가 나를 위해 행동한다."
  5. "개발자에겐 오픈클로, 대중에겐 ohmyc."

### 디자인 토큰 (Apple HIG + Liquid Glass)
- **메인 컬러**: `--tint: #FF8552` (Soft Apricot) - 단일 액센트.
- **폰트**: Pretendard Variable (한국어 우선).
- **모션**: `Breathe` (아바타, 3.5s), `Pulse` (CTA 클릭, 600ms).
- **UI 원칙**: No chat artifacts (말풍선, 하단 입력바 금지). Radius 다층 사용 (capsule, card, chip, circle).

### 기술 스택
- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **LLM**: Google Gemini 3 Flash (`gemini-3-flash-preview`), Gemini 2.5 Flash Lite (보조).
- **Backend**: Supabase (Anonymous Sign-In), Vercel AI SDK.
- **Deployment**: Vercel.

### 로드맵 및 상태
- **현재 단계**: Phase 1 해커톤 MVP 완료 → Production v1 Pivot 중.
- **주요 성과**: 5-screen 온보딩 흐름 완성, Supabase 영속화, Gemini 4키 로테이션 통합.
- **진행 중**: Pair Home, 실시간 에이전트 루프, 온도 시스템, 기억 투명성 강화.

---

## 2. "누구·어떻게" (User / Feedback)

### 사용자 모델
- **타겟**: 글로벌 20-30대 여성. 캐릭터/IP 친화적, AI 컴패니언 수요층.
- **사용자 니즈**: 도구적인 AI가 아닌, 나를 기억하고 챙겨주는 인격적 존재와의 관계.

### 협업 규약 (톤 & 매너)
- **언어**: 한국어 우선 (시스템 메시지는 존댓말, 캐릭터 발화는 반말).
- **금지어**: 비서, 집사, 도우미, 어시스턴트, 봇 (수평적 '페어' 관계 유지).
- **작업 리듬**: Deep Interview → Ralph 루프 → Vercel 배포 사이클 준수.
- **커밋 컨벤션**: (확신도: 낮음) 현재 명시적 규정 없으나 일반적인 기능 단위 커밋 권장.

---

## 3. "어떻게 실행·어디서 깨지나" (Guardrails / Risk)

### 가드레일 (우리 약속)
- **No-DB (초기)** → **Supabase 익명 인증** (현재 정본).
- **추상화 금지**: 추가적인 백엔드 추상화나 디자인 시스템 신설 금지.
- **채팅 UI 회피**: 한 줄 underline 인풋 + 메모지 톤 placeholder 사용. 하단 고정바 금지.
- **결정타 카피**: "3시간 뒤에 한번 물어볼게." 등 행동 약속 카피는 비-LLM 정적 분기 또는 시스템 프롬프트 고정.

### 위험 등록부 (Risk Register)
| 위험 (Condition) | 발현 신호 (Signal) | 대응 (Plan B) |
|---|---|---|
| Gemini 쿼터 소진 | 429 Error 발생 | 4키 라운드로빈 + 비-LLM 폴백 카피 |
| Supabase 연결 실패 | 네트워크 오류/타임아웃 | sessionStorage 폴백 + 복구 시 동기화 |
| 결정타 카피 변형 | LLM이 자유 응답으로 흐려짐 | `reminder-heuristic.ts` 강제 적용 |
| 시연 지연 | 첫 콜드 스타트 1.5s 초과 | 폴백 카피로 즉시 전환 |

### 워크플로우 약속
- 모든 작업은 `prd.json`의 스토리를 기준으로 진행하고 `passes` 여부를 검증함.
- 매 사이클 종료 시 `progress.txt`에 회고를 기록하고 `MEMORY.md`를 갱신함.
- 시연 시나리오는 `demo_script.md`와 일치해야 함.
