/**
 * Cron — check-due (every 5min) + memory-decay (03:00 daily, idempotent).
 * Patch #1 적용: 5분 윈도우 + cron_jobs.last_run_date < CURRENT_DATE idempotency.
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getDueTodos, markTodoNotified } from "@/lib/todos";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(req: Request) {
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const result = {
    checkDueProcessed: 0,
    memoryDecayRan: false,
    error: null as string | null,
  };

  if (!supabase) {
    return NextResponse.json({ ...result, fallback: true });
  }

  try {
    const { data: pairs } = await supabase
      .from("pair_sessions")
      .select("id")
      .eq("status", "active");

    if (pairs) {
      for (const pair of pairs) {
        const dueList = await getDueTodos(pair.id, now);
        for (const todo of dueList) {
          await markTodoNotified(todo.id, todo.notification_count);
          result.checkDueProcessed++;
          // TODO: web-push 라이브러리로 push_subscriptions 발송 (다음 라운드)
        }
      }
    }
  } catch (err) {
    result.error = String(err);
  }

  // Patch #1: 03:00 5분 윈도우 + idempotency
  if (now.getHours() === 3 && now.getMinutes() < 5) {
    try {
      const { data: cronRow } = await supabase
        .from("cron_jobs")
        .select("*")
        .eq("type", "memory_decay")
        .single();

      const today = now.toISOString().slice(0, 10);
      const lastRunDate = cronRow?.last_run
        ? new Date(cronRow.last_run).toISOString().slice(0, 10)
        : null;

      if (lastRunDate !== today) {
        const sevenDaysAgo = new Date(
          now.getTime() - 7 * 24 * 3_600_000,
        ).toISOString();

        await supabase
          .from("memories")
          .update({ layer: "stable" })
          .eq("layer", "active")
          .lt("created_at", sevenDaysAgo);

        await supabase
          .from("cron_jobs")
          .update({
            last_run: now.toISOString(),
            last_status: "ok",
          })
          .eq("type", "memory_decay");

        result.memoryDecayRan = true;
      }
    } catch (err) {
      result.error = String(err);
    }
  }

  return NextResponse.json(result);
}
