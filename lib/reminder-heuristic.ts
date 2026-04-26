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
