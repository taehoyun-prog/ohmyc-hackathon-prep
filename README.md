# ohmyc 해커톤 사전 준비 패키지

> **목적**: 내일 (2026-04-26) 해커톤 09:00에 그대로 사용할 .md 자료 묶음.
> **사용법**: 내일 새 ohmyc 폴더 만들고 이 패키지 통째로 복사.

## 파일 구성

```
ohmyc-hackathon-prep/
├── README.md                              ← 이 파일 (사용 가이드)
├── ONE-PAGER.md                           ← 제품 정의 SSOT (Deep Interview 첫 입력)
├── HACKATHON-PITCH-DECK-TEMPLATE.md       ← 10슬라이드 골격 (3개 채워짐)
└── _context/
    ├── 페어컨셉.md                          ← 온보딩 시나리오 + UX 카피
    └── 피칭내러티브.md                      ← 사업계획 9섹션 + 핵심 카피 5개
```

## 내일 09:00 — 정확한 사용 순서

### Step 1. 폴더 만들고 패키지 복사

```bash
mkdir -p ~/Documents/GitHub/ohmyc-hackathon
cd ~/Documents/GitHub/ohmyc-hackathon

# 이 패키지 통째로 복사
cp -r ~/Documents/GitHub/ohmyc-hackathon-prep/* .
ls -la  # ONE-PAGER.md, HACKATHON-PITCH-DECK-TEMPLATE.md, _context/ 확인
```

### Step 2. Apple 디자인 시스템 + Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --use-npm --yes --import-alias "@/*"
npx getdesign@latest add apple
echo "ANTHROPIC_API_KEY=" > .env.local
```

### Step 3. GitHub 푸시

```bash
git add -A
git commit -m "feat: ohmyc hackathon scaffold"
gh repo create ohmyc-hackathon --public --source=. --remote=origin --push
```

### Step 4. Claude Code 시작 + 컨텍스트 3턴

```bash
claude
```

Claude Code 입력창에 순서대로:

**1턴**:
```
이 폴더의 ONE-PAGER.md, _context/페어컨셉.md, _context/피칭내러티브.md, DESIGN.md를 모두 읽고 핵심을 요약해줘.
앞으로 모든 UI는 DESIGN.md(Apple HIG)를 기반으로 하되, 메인 액센트 컬러는 #FF8552 (Soft Apricot)을 사용한다.
```

**2턴**:
```
이 ohmyc MVP를 9시간 안에 시연 가능하게 만든다면, 가장 큰 기술 리스크 3가지와 가장 작은 스코프를 추천해줘.
```

**3턴**:
```
시연은 단 1장면 60초: "페어 첫 만남" 시나리오 (페어컨셉.md의 Step 4-1과 4-2).
다른 기능 다 빼고 이 1장면만 완성한다.
```

### Step 5. Deep Interview

```
/oh-my-claudecode:deep-interview

위 ONE-PAGER + 페어컨셉.md 기반으로 ohmyc MVP를 만들어주세요.
시연 시나리오: "페어 첫 만남" 60초.
```

**답변 가이드**:
- 모르면 → "추천해줘"
- DB → "없음, sessionStorage만"
- 인증 → "없음, 익명"
- LLM → "Claude Haiku (claude-haiku-4-5)"
- 6번째 질문쯤: **"여기서 끝. PRD 확정해줘."**

### Step 6. Ralph (실행 모드 4번 선택)

```
/oh-my-claudecode:ralph

확정 PRD대로 끝까지 구현해줘. Apple HIG + Soft Apricot #FF8552. Vercel 배포 가능하게.
```

### Step 7. (병렬) 피치덱 작성

13:00–14:30 Ralph 돌아가는 동안:
- 다른 에디터/메모장에서 `HACKATHON-PITCH-DECK-TEMPLATE.md` 열기
- 슬라이드 3·4·6·7·8·9·10 채우기 (1·2·5는 이미 채워짐)

### Step 8. Vercel 배포

```bash
vercel
vercel env add ANTHROPIC_API_KEY  # 키 입력
vercel --prod
```

### Step 9. Claude Design 슬라이드 변환

claude.ai (디자인 모드)에서:
```
이 HACKATHON-PITCH-DECK.md를 Apple HIG 톤(SF Pro, 모노톤 + Soft Apricot #FF8552 액센트, 미니멀)으로 16:9 10페이지 프레젠테이션으로 만들어줘.
```

→ PDF 다운로드.

### Step 10. 발표 스크립트 + 리허설

Claude Code:
```
HACKATHON-PITCH-DECK.md 기반으로 5분짜리 발표 스크립트를 슬라이드별로 작성해줘. 한국어, 친근한 톤.
```

큰 소리로 1번 리허설 → 5분 안 넘는지 시간 재기 → 백업 영상 녹화.

---

## 응급 처치 (사고 대비)

| 상황 | 대응 |
|---|---|
| Deep Interview 30분 넘게 안 끝남 | "여기서 끝. PRD 확정" 강제 종료 |
| Ralph 같은 에러 5분 반복 | `/oh-my-claudecode:cancel` → 에러 복사 → 사람이 같이 디버깅 → 재시작 |
| Vercel 배포 실패 | 로컬 화면 30초 영상 녹화로 백업 |
| API 키 안 먹음 | `vercel env add` 후 `vercel --prod` 재배포 |
| 시간 부족 | **기능 빼는 게 답.** 60초 시연 1장면만 살리기 |
| 데모 시간 직전 안 됨 | 미리 녹화한 영상 틀기. 당황 NO. |

---

## 안전 게이트 (시간별 마지노선)

- **15:00 PM**: 시연 가능한 화면 1개 이상 있나? **없으면 추가 기능 다 빼고 살리기 모드.**
- **16:00 PM**: Vercel URL 열리나? 핸드폰에서도? 안 되면 영상 녹화로 백업.
- **17:00 PM**: 발표 5분 안 넘나? 안 되면 슬라이드 빼기.

---

## 핵심 마인드셋

1. **데모 1장면이 발표의 80%** — 디자인·기능 욕심 NO, 60초 시나리오에 올인.
2. **Ralph 돌릴 동안 사람은 피치덱** — AI 노는 시간 = 사람 일하는 시간.
3. **MVP는 부끄러워야 정상** — 안 부끄러우면 너무 많이 만든 거.
4. **워크플로우 검증이 진짜 산출물** — 회고 노트 잊지 말기.
