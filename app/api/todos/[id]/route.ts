/**
 * Todo DELETE — 캘린더에서 약속 삭제.
 * RLS는 anon_all (Phase 1 시연 단계). 다음 사이클에서 pair_session_id 매칭 검증.
 */

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const sb = getServerSupabase();
  if (!sb) return NextResponse.json({ ok: false }, { status: 500 });
  const { error } = await sb.from("todos").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
