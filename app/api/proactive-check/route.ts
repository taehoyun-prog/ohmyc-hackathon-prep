import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const COOLDOWN_MINUTES = 8;

type CronTodo = {
  id: string;
  pair_session_id: string;
  reminder_time: string | null;
  completed_at: string | null;
  snoozed_until: string | null;
  last_notified_at: string | null;
  notification_count: number | null;
};

function shouldProcess(todo: CronTodo, now: Date): boolean {
  if (todo.completed_at) return false;
  if (!todo.reminder_time) return false;
  if (new Date(todo.reminder_time).getTime() > now.getTime()) return false;
  if (todo.snoozed_until && new Date(todo.snoozed_until).getTime() > now.getTime()) {
    return false;
  }
  if (todo.last_notified_at) {
    const diffMs = now.getTime() - new Date(todo.last_notified_at).getTime();
    if (diffMs < COOLDOWN_MINUTES * 60 * 1000) return false;
  }
  return true;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase env missing" },
      { status: 500 },
    );
  }

  const now = new Date();

  const { data, error } = await supabase
    .from("todos")
    .select(
      "id,pair_session_id,reminder_time,completed_at,snoozed_until,last_notified_at,notification_count",
    )
    .is("completed_at", null)
    .order("reminder_time", { ascending: true })
    .limit(200);

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "query failed" },
      { status: 500 },
    );
  }

  const due = (data as CronTodo[]).filter((todo) => shouldProcess(todo, now));
  if (due.length === 0) {
    return NextResponse.json({
      ok: true,
      scanned: data.length,
      due: 0,
      updated: 0,
      timestamp: now.toISOString(),
    });
  }

  let updated = 0;
  const errors: string[] = [];
  for (const todo of due) {
    const { error: updateError } = await supabase
      .from("todos")
      .update({
        checkin_state: "due",
        last_notified_at: now.toISOString(),
        notification_count: (todo.notification_count ?? 0) + 1,
      })
      .eq("id", todo.id);

    if (updateError) {
      errors.push(`${todo.id}:${updateError.message}`);
    } else {
      updated += 1;
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    scanned: data.length,
    due: due.length,
    updated,
    errors,
    timestamp: now.toISOString(),
  });
}
