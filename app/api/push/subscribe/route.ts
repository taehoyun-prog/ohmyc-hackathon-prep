/**
 * Push subscribe API — Web Push subscription 등록.
 * iOS UA 분기 (nami ios-monitor.ts ~50 LOC 부분 import — Q4).
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const IOS_UA_REGEX = /iP(hone|ad|od)/i;

type Body = {
  anonUserId?: string;
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  userAgent?: string;
  expirationTime?: string | null;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const { anonUserId, endpoint, p256dh, auth, userAgent, expirationTime } = body;
  if (!anonUserId || !endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (!supabase) {
    return NextResponse.json({ ok: false, fallback: true });
  }

  const isIos = IOS_UA_REGEX.test(userAgent ?? "");

  try {
    await supabase.from("push_subscriptions").upsert(
      {
        anon_user_id: anonUserId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent ?? null,
        expiration_time: expirationTime ?? null,
        is_ios: isIos,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    return NextResponse.json({ ok: true, isIos });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  let body: { endpoint?: string };
  try {
    body = (await req.json()) as { endpoint?: string };
  } catch {
    body = {};
  }

  const { endpoint } = body;
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }
  if (!supabase) return NextResponse.json({ ok: false });

  try {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
