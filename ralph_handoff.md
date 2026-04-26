# Ralph Handoff — ohmyc 해커톤 MVP

## 진입점

| 항목 | 경로 |
|---|---|
| **PRD (Ralph 정본)** | `prd.json` |
| 상세 spec (참조) | `.omc/specs/deep-interview-ohmyc-mvp.md` |
| 시연 스크립트 | `demo_script.md` |
| 회고 노트 (자동 생성) | `progress.txt` |
| 메모리 SSOT | `~/.claude/projects/-Users-netty03-Documents-GitHub-ohmyc-hackathon-prep/memory/MEMORY.md` |
| 디자인 시스템 1차 SSOT | `design/ohmyc-design-system/` |
| Gemini 모델·키 로테이션 검증 패턴 | `scripts/{hello_gemini,stream_gemini,gemini_client}.py` |

## Critic 추천: `--critic=architect`

근거:
- 9시간(잔여 ~6.5시간) 박스 + Supabase·Gemini 통합·5-screen 페이지 = **architectural 결정 다수**
- `architect` Sonnet 동급(STANDARD)으로 충분, opus 격상은 보안·복잡 multi-system 통합 시점에만
- `critic`(클로드 critic 에이전트)이 더 강한 challenge를 주지만 시간 박스에 부담
- `codex`는 외부 호출이라 시연 시간 압박 시 폴백이 약함

→ **`oh-my-claudecode:ralph --critic=architect` 권장**.

## 시간 박스 (잔여)

- 현재 시각 (추정): 2026-04-26T11:30+09:00
- **18:00 KST 제출 마감** = 잔여 약 **6시간 30분**
- Ralph iteration 단위: Phase 0 → 6, 각 Phase ~30-90분 추정
- 컷 우선순위 (마감 임박 시): Phase 5 배포 > Phase 4 LLM > Phase 3 5화면 > Phase 6 회고

## Ralph 매 iteration 출력 포맷 (CLAUDE.md line 77-91)

1. PRD 스토리별 pass/fail 표 + 직전 대비 델타
2. PRD에 없던 새 위험 1~3개 + 등장 트리거
3. 다음 iteration ROI 1순위 단일 행동
4. 예상 잔여 iteration / 잔여 시간

## 완료 약속 출력 조건 (AND, prd.json `completion_promise_conditions_AND`)

- prd.json 전체 stories[].passes = true (reviewer 통과)
- vercel deploy 성공 + 라이브 URL에서 5-screen + 새로고침 시연 무중단
- demo_script.md 화면 동선 = 실제 화면 (스크린샷)
- progress.txt 회고 노트 자동 생성
- MEMORY.md 새로 배운 것 1~3개 auto-append

## 자가 reject 규칙 (코드·카피 작성 시 엄격)

- 한국어 카피 (변수·코드 식별자·SQL 외)
- 슬로건 5종 원문 보존
- 결정타 카피 *"3시간 뒤에 한번 물어볼게."* 그대로 (LLM 자유 응답 ❌, 시스템 프롬프트 고정 또는 비-LLM 카피)
- 금지어 0건: 비서·집사·도우미·어시스턴트·helper·assistant·chatbot·봇·AI 컴패니언
- ohmyc 묘사의 "채팅" 단어 자가 reject (기술 용어로서의 "채팅 UI 컴포넌트"는 OK)
- 채팅 UI artifact 0건 (말풍선·하단 입력 바·사이드바·메시지 로그·"User:/Assistant:" 라벨)
- `#FF8552` 외 액센트 0건 (Apple Blue family ❌)
- 화면당 ≥3 radius 값
- Avatar 화면에 Breathe 적용
- 캐릭터 발화 = 반말 / 시스템 메시지 = 존댓말 분리
- 헤드라인 마침표 ❌ / 마이크로카피 마침표 ✓
- 일자 ISO 8601, 추측은 (추측) 표시, 영합 표현 ❌
- 자가 승인 금지 — 코드 작성 후 verifier/code-reviewer 별도 호출

## 가드레일 (CLAUDE.md 3.3 + 디자인 시스템)

- Stack 외 의존성 신규 도입 전 시간 비용 자가 검증
- 모델 ID `gemini-3-flash-preview` 그대로 (CLAUDE.md line 128 outdated, scripts/*.py 진실)
- DB는 Supabase (익명 인증). sessionStorage = anon_user_id 캐시만
- 모바일 웹앱 `max-w-md` 단일 컬럼
- 추상화·디자인 시스템 신설·테스트 인프라 신규 도입 ❌
- 막히면 risks[] plan_b 먼저 시도

## 에이전트 위임 권한 (메모리 2층)

- `executor` / `Plan` / `Explore` / `code-reviewer` / `verifier` / `architect` 자가 결정 OK
- `opus` 격상, 병렬 spawn, 백그라운드 실행 자가 결정 OK
- 큰 위임(opus 다수·1시간+ 백그라운드) 한 줄 통보 후 진행
- 결과 요약을 사용자 메시지에 포함

## 에스컬레이션·정지 조건

- 결정타 카피 LLM 자유 응답으로 흐려질 가능성 발견 시 즉시 정지 + 사용자에게 보고
- Supabase 프로젝트 생성·키 발급 등 외부 인터랙션 필요 시 한 줄 통보 후 진행
- 18:00 마감 30분 전(17:30)에 미완성이면 컷 정책 적용 + 사용자 통보
- 사용자 "stop"·"cancel" 시 즉시 종료
