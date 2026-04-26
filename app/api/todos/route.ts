/**
 * Todos GET — 캘린더 뷰용 약속 조회.
 * pair_session_id로 필터링, reminder_time 시간순 정렬.
 */

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pairSessionId = url.searchParams.get("pair_session_id");
  if (!pairSessionId) {
    return NextResponse.json({ todos: [] });
  }
  const sb = getServerSupabase();
  if (!sb) return NextResponse.json({ todos: [] });

  const { data, error } = await sb
    .from("todos")
    .select("*")
    .eq("pair_session_id", pairSessionId)
    .order("reminder_time", { ascending: true })
    .limit(200);

  if (error || !data) return NextResponse.json({ todos: [] });
  return NextResponse.json({ todos: data });
}
