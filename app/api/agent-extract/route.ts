/**
 * Agent extract API — 사용자 입력 → intent/time/emotion/importance 4 필드 JSON.
 * G2 Real Agent Loop 진입점.
 */

import { NextResponse } from "next/server";
import { extractAgentSignal } from "@/lib/agent-loop";

export const runtime = "nodejs";

type Body = { input?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const input = (body.input ?? "").trim();
  if (!input) {
    return NextResponse.json({ error: "input required" }, { status: 400 });
  }

  const result = await extractAgentSignal(input);
  return NextResponse.json(result);
}
