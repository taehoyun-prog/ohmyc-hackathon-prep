/**
 * 사용자 입력 텍스트에서 시간 키워드를 추출해 reminder_time + 결정타 카피 패턴을 결정.
 * 자가 reject 4번(결정타 카피) — 본질은 "시간 기반 약속을 챙긴다", 표현은 3 패턴 중 동적.
 *
 * 디폴트(키워드 없음): "3시간 뒤에 한번 물어볼게." (+3h)
 * 시간대 키워드(저녁/밤/아침/점심): "이따 HH:MM에 한번 물어볼게." (지난 시간이면 내일)
 * "내일" 키워드: "내일 HH:MM에 한번 물어볼게."
 */

export type ReminderPattern = "relative_hours" | "absolute" | "tomorrow";

export type ReminderInfo = {
  reminderTime: string; // ISO 8601
  pattern: ReminderPattern;
  hours?: number;       // pattern === "relative_hours" 전용
  timeLabel: string;    // "HH:MM"
  isTomorrow: boolean;
};

const HOURS_DEFAULT = 3;
const SLOT_THRESHOLD_MIN = 30; // 시간대 키워드의 시간이 이만큼 안 남았으면 내일로

const SLOT_KEYWORDS: { regex: RegExp; hour: number; minute: number }[] = [
  { regex: /아침/, hour: 9, minute: 0 },
  { regex: /점심/, hour: 12, minute: 30 },
  { regex: /저녁/, hour: 19, minute: 0 },
  { regex: /(밤|야식|자기 ?전)/, hour: 22, minute: 0 },
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatHHMM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function setTime(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

export function computeReminderInfo(
  text: string,
  now: Date = new Date(),
): ReminderInfo {
  // "내일" 키워드 우선
  if (/내일/.test(text)) {
    const target = setTime(addDays(now, 1), 9, 0);
    return {
      reminderTime: target.toISOString(),
      pattern: "tomorrow",
      timeLabel: formatHHMM(target),
      isTomorrow: true,
    };
  }

  // 시간대 키워드
  for (const slot of SLOT_KEYWORDS) {
    if (slot.regex.test(text)) {
      let target = setTime(now, slot.hour, slot.minute);
      const minutesUntil = (target.getTime() - now.getTime()) / 60000;
      if (minutesUntil < SLOT_THRESHOLD_MIN) {
        target = setTime(addDays(now, 1), slot.hour, slot.minute);
        return {
          reminderTime: target.toISOString(),
          pattern: "tomorrow",
          timeLabel: formatHHMM(target),
          isTomorrow: true,
        };
      }
      return {
        reminderTime: target.toISOString(),
        pattern: "absolute",
        timeLabel: formatHHMM(target),
        isTomorrow: false,
      };
    }
  }

  // 디폴트: +3시간
  const target = new Date(now.getTime() + HOURS_DEFAULT * 60 * 60 * 1000);
  return {
    reminderTime: target.toISOString(),
    pattern: "relative_hours",
    hours: HOURS_DEFAULT,
    timeLabel: formatHHMM(target),
    isTomorrow: false,
  };
}

/**
 * 결정타 카피 — 3패턴 중 분기.
 * 본질은 "시간 기반 약속". 임의 변형 금지.
 */
export function derivePromiseHeadline(info: ReminderInfo): string {
  switch (info.pattern) {
    case "relative_hours":
      return `${info.hours}시간 뒤에 한번 물어볼게.`;
    case "absolute":
      return `이따 ${info.timeLabel}에 한번 물어볼게.`;
    case "tomorrow":
      return `내일 ${info.timeLabel}에 한번 물어볼게.`;
  }
}

/**
 * Promise 카드 메타 시간 라벨 — "오늘 HH:MM → HH:MM" 또는 "오늘 HH:MM → 내일 HH:MM".
 */
export function deriveTimeLabel(
  info: ReminderInfo,
  createdAt: Date = new Date(),
): string {
  const start = formatHHMM(createdAt);
  if (info.isTomorrow) {
    return `오늘 ${start} → 내일 ${info.timeLabel}`;
  }
  return `오늘 ${start} → ${info.timeLabel}`;
}

// ============================================================
// 정확한 시간 파서 — "19시", "오후 7시", "19:30", "7시 반"
// 명시 시간이 잡히면 ask_time을 건너뛰고 confirm 단계로 직행.
// ============================================================

export type ParsedTime = {
  iso: string;
  isTomorrow: boolean;
};

export function parseExplicitTime(
  text: string,
  now: Date = new Date(),
): ParsedTime | null {
  const tomorrowKeyword = /내일/.test(text);
  const todayKeyword = /오늘/.test(text);
  const ampmMatch = text.match(/오전|오후/);
  const explicitPM =
    ampmMatch === null ? null : ampmMatch[0] === "오후";

  let hour: number | null = null;
  let minute = 0;

  // "HH:MM" 우선
  const colonMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    hour = parseInt(colonMatch[1], 10);
    minute = parseInt(colonMatch[2], 10);
  } else {
    // "X시 반"
    const halfMatch = text.match(/(\d{1,2})\s*시\s*반/);
    if (halfMatch) {
      hour = parseInt(halfMatch[1], 10);
      minute = 30;
    } else {
      // "X시 Y분" 또는 "X시"
      const sigMatch = text.match(/(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
      if (sigMatch) {
        hour = parseInt(sigMatch[1], 10);
        if (sigMatch[2]) minute = parseInt(sigMatch[2], 10);
      }
    }
  }

  if (hour === null) return null;
  if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;

  if (explicitPM === true && hour < 12) hour += 12;
  if (explicitPM === false && hour === 12) hour = 0;

  const target = new Date(now);
  if (tomorrowKeyword) target.setDate(target.getDate() + 1);
  target.setHours(hour, minute, 0, 0);

  // 오늘로 해석했는데 이미 지난 시간이면 — 오전/오후 미명시 + 12시 미만이면 오후로 재시도
  if (!tomorrowKeyword && !todayKeyword && target.getTime() < now.getTime()) {
    if (explicitPM === null && hour < 12) {
      target.setHours(hour + 12, minute, 0, 0);
    }
    // 그래도 과거면 내일로
    if (target.getTime() < now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
  }

  const isTomorrow =
    target.getDate() !== now.getDate() ||
    target.getMonth() !== now.getMonth() ||
    target.getFullYear() !== now.getFullYear();

  return { iso: target.toISOString(), isTomorrow };
}

// ============================================================
// Promise phase 분류 — 채팅 약속 플로우 진입 직후 단계 결정
// ============================================================

export type TimeCandidate = {
  label: string; // 칩에 표시할 짧은 라벨
  iso: string; // 선택 시 사용할 ISO 시간
};

export type PromisePhase =
  | { kind: "confirm"; reminderTime: string; headline: string }
  | { kind: "ask_time"; followUp: string; candidates: TimeCandidate[] };

function isoFromHourMinute(now: Date, hour: number, minute: number, addDay = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + addDay);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildHeadlineFromIso(reminderIso: string, now: Date): string {
  const info = computeReminderInfo("", now);
  const target = new Date(reminderIso);
  const sameDay =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();
  const label = `${pad2(target.getHours())}:${pad2(target.getMinutes())}`;
  void info;
  if (!sameDay) return `내일 ${label}에 한번 물어볼게.`;
  return `이따 ${label}에 한번 물어볼게.`;
}

export function classifyPromisePhase(
  text: string,
  now: Date = new Date(),
): PromisePhase {
  // 1) 정확한 시간 명시 → confirm 직행
  const explicit = parseExplicitTime(text, now);
  if (explicit) {
    return {
      kind: "confirm",
      reminderTime: explicit.iso,
      headline: buildHeadlineFromIso(explicit.iso, now),
    };
  }

  // 2) "내일" 키워드만 (시간 없음) → 09:00 기준 confirm 직행
  if (/내일/.test(text)) {
    const iso = isoFromHourMinute(now, 9, 0, 1);
    return {
      kind: "confirm",
      reminderTime: iso,
      headline: `내일 09:00에 한번 물어볼게.`,
    };
  }

  // 3) 시간대 키워드 (저녁/밤/아침/점심) → confirm 직행 (기존 휴리스틱)
  for (const slot of SLOT_KEYWORDS) {
    if (slot.regex.test(text)) {
      let target = new Date(now);
      target.setHours(slot.hour, slot.minute, 0, 0);
      const minutesUntil = (target.getTime() - now.getTime()) / 60000;
      let isTomorrow = false;
      if (minutesUntil < SLOT_THRESHOLD_MIN) {
        target = new Date(now);
        target.setDate(target.getDate() + 1);
        target.setHours(slot.hour, slot.minute, 0, 0);
        isTomorrow = true;
      }
      const label = `${pad2(slot.hour)}:${pad2(slot.minute)}`;
      return {
        kind: "confirm",
        reminderTime: target.toISOString(),
        headline: isTomorrow
          ? `내일 ${label}에 한번 물어볼게.`
          : `이따 ${label}에 한번 물어볼게.`,
      };
    }
  }

  // 4) 모호 → ask_time. 휴리스틱 칩 후보 4개.
  return {
    kind: "ask_time",
    followUp: "몇 시쯤이 좋아?",
    candidates: [
      { label: "이따 18:00", iso: isoFromHourMinute(now, 18, 0) },
      { label: "이따 21:00", iso: isoFromHourMinute(now, 21, 0) },
      { label: "내일 09:00", iso: isoFromHourMinute(now, 9, 0, 1) },
      { label: "직접 입력", iso: "" }, // iso 빈 문자열 = picker
    ],
  };
}

export function applyConfirmShift(reminderTime: string, deltaMinutes: number): string {
  return new Date(
    new Date(reminderTime).getTime() + deltaMinutes * 60_000,
  ).toISOString();
}

// confirm 단계용 헤드라인 재생성 (shift 후)
export function rebuildConfirmHeadline(reminderIso: string, now: Date = new Date()): string {
  return buildHeadlineFromIso(reminderIso, now);
}
