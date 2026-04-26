/**
 * 온도 시스템 — 균형점(Equilibrium) 모델
 * 출처: netty-datacenter/.../omc/설계/temperature-v0.1.md
 *
 * T = T_BASE + bonus(daily_avg) + base(level)
 * T_new = T_current + (E - T_current) × K  (매 시간)
 */

export const T_BASE = 36.5;
export const K_HOURLY = 0.03;
export const I_WEIGHT = 1.0;
export const R_WEIGHT = 0.6;
export const B_BONUS = 1.2;
export const B_CAP = 12.0;
export const L_BASE = 0.2;
export const W_DAYS = 7;

export type Stage = "stranger" | "acquaintance" | "friend" | "close";

export type TemperatureRow = {
  pair_session_id: string;
  current_temp: number;
  equilibrium: number;
  daily_avg: number;
  level: number;
  last_updated: string;
};

export type TurnCount = {
  initiated: number; // 유저가 먼저 시작한 턴
  response: number;  // 캐릭터 선제에 응답한 턴
};

export function computeEquilibrium(dailyAvg: number, level: number): number {
  const bonus = Math.min(dailyAvg * B_BONUS, B_CAP);
  const base = level * L_BASE;
  return Math.round((T_BASE + bonus + base) * 100) / 100;
}

export function tickTemperature(
  current: number,
  equilibrium: number,
  hoursElapsed: number = 1,
): number {
  const next = current + (equilibrium - current) * K_HOURLY * hoursElapsed;
  return Math.max(0, Math.round(next * 100) / 100);
}

export function computeDailyAvg(turns: TurnCount[]): number {
  if (turns.length === 0) return 0;
  const weighted = turns.map((t) => t.initiated * I_WEIGHT + t.response * R_WEIGHT);
  return weighted.reduce((a, b) => a + b, 0) / W_DAYS;
}

export function getStage(temp: number, level: number): Stage {
  if (temp < 37.5 || level < 1) return "stranger";
  if (temp < 39 || level < 3) return "acquaintance";
  if (temp < 42 || level < 5) return "friend";
  return "close";
}

export function getStageLabel(stage: Stage): string {
  switch (stage) {
    case "stranger":
      return "처음 알아가는 중";
    case "acquaintance":
      return "익숙해지는 중";
    case "friend":
      return "친한 사이";
    case "close":
      return "곁에 있는 사이";
  }
}
