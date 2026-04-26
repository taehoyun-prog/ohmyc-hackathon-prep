/**
 * 채팅 메시지가 "약속/할 일 등록 시도"인지 감지하는 클라이언트 휴리스틱.
 * true면 /api/promise-flow로, false면 /api/next-action으로 라우트.
 * false negative 위험은 감수 (시연 동선 안정성 우선).
 */

const PROMISE_PATTERNS: RegExp[] = [
  // 시간 키워드 (가장 강한 신호)
  /내일|이따|아침|점심|저녁|밤|새벽/,
  /\d{1,2}\s*시(?!간)/,
  /\d{1,2}:\d{2}/,
  // 의지·계획 어미
  /(할래|먹을래|갈래|볼래|할래요|먹을래요)/,
  /(해야\s*돼|해야지|해야겠|해야겠다)/,
  /(하기로|먹기로|가기로|만나기로|보기로)/,
  /(하자|먹자|가자|보자)/,
  /(잊지\s*마|기억해\s*줘|챙겨\s*줘)/,
  // 명시적 트리거 (단, 확인/조회 의도가 없을 때만)
  /약속|일정|미팅|회의|운동|루틴/,
];

const QUERY_PATTERNS: RegExp[] = [
  /확인/,
  /보여줘/,
  /뭐\s*있어/,
  /뭐지/,
  /리스트/,
  /목록/,
  /알아\?/,
  /있나\?/,
];

export function looksLikePromise(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // 조회/확인 의도가 포함되어 있으면 일단 일반 대화(fallbackChat)로 보내서 LLM이 판단하게 함
  if (QUERY_PATTERNS.some((re) => re.test(trimmed))) {
    return false;
  }

  return PROMISE_PATTERNS.some((re) => re.test(trimmed));
}
