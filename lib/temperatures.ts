/**
 * Temperatures DB helper — 균형점 모델 row CRUD.
 */

import { supabase } from "./supabase";
import {
  T_BASE,
  tickTemperature,
  computeEquilibrium,
  type TemperatureRow,
} from "./temperature";

const FALLBACK_KEY = "ohmyc.temperature_fallback";

function defaultRow(pairSessionId: string): TemperatureRow {
  return {
    pair_session_id: pairSessionId,
    current_temp: T_BASE,
    equilibrium: T_BASE,
    daily_avg: 0,
    level: 0,
    last_updated: new Date().toISOString(),
  };
}

export async function getOrCreateTemperature(
  pairSessionId: string,
): Promise<TemperatureRow> {
  if (!supabase) return defaultRow(pairSessionId);

  try {
    const { data: existing } = await supabase
      .from("temperatures")
      .select("*")
      .eq("pair_session_id", pairSessionId)
      .maybeSingle();

    if (existing) return existing as TemperatureRow;

    const { data: created } = await supabase
      .from("temperatures")
      .insert({ pair_session_id: pairSessionId })
      .select()
      .single();

    return (created as TemperatureRow) ?? defaultRow(pairSessionId);
  } catch {
    return defaultRow(pairSessionId);
  }
}

/**
 * 매 시간 tick — 균형점 향해 K 만큼 이동.
 * 마지막 갱신 후 0.5h 미만이면 skip.
 */
export async function tickTemperatureForPair(
  pairSessionId: string,
): Promise<TemperatureRow> {
  const current = await getOrCreateTemperature(pairSessionId);
  const lastUpdated = new Date(current.last_updated);
  const hoursElapsed = Math.max(
    0,
    (Date.now() - lastUpdated.getTime()) / 3_600_000,
  );

  if (hoursElapsed < 0.5) return current;

  const newTemp = tickTemperature(
    Number(current.current_temp),
    Number(current.equilibrium),
    hoursElapsed,
  );

  if (!supabase) {
    return { ...current, current_temp: newTemp, last_updated: new Date().toISOString() };
  }

  try {
    const { data } = await supabase
      .from("temperatures")
      .update({
        current_temp: newTemp,
        last_updated: new Date().toISOString(),
      })
      .eq("pair_session_id", pairSessionId)
      .select()
      .single();
    return (data as TemperatureRow) ?? current;
  } catch {
    return current;
  }
}

/**
 * Equilibrium 재계산 — daily_avg·level 변경 시 호출.
 */
export async function recomputeEquilibrium(
  pairSessionId: string,
  dailyAvg: number,
  level: number,
): Promise<TemperatureRow> {
  const eq = computeEquilibrium(dailyAvg, level);

  if (!supabase) {
    return { ...defaultRow(pairSessionId), equilibrium: eq, daily_avg: dailyAvg, level };
  }

  try {
    const { data } = await supabase
      .from("temperatures")
      .upsert(
        {
          pair_session_id: pairSessionId,
          equilibrium: eq,
          daily_avg: dailyAvg,
          level,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "pair_session_id" },
      )
      .select()
      .single();
    return (data as TemperatureRow) ?? defaultRow(pairSessionId);
  } catch {
    return defaultRow(pairSessionId);
  }
}
