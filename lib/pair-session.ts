import { supabase } from "./supabase";
import type { PairSession } from "./types";

const SESSION_FALLBACK_KEY = "ohmyc.pair_session_fallback";

export async function getOrCreatePairSession(
  anonUserId: string,
): Promise<PairSession> {
  if (!supabase) {
    return getFallbackSession(anonUserId);
  }

  try {
    const { data: existing } = await supabase
      .from("pair_sessions")
      .select("*")
      .eq("anon_user_id", anonUserId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing as PairSession;

    const { data: created, error } = await supabase
      .from("pair_sessions")
      .insert({ anon_user_id: anonUserId, character_id: "serine" })
      .select()
      .single();

    if (error || !created) {
      return getFallbackSession(anonUserId);
    }

    return created as PairSession;
  } catch {
    return getFallbackSession(anonUserId);
  }
}

function getFallbackSession(anonUserId: string): PairSession {
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(SESSION_FALLBACK_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as PairSession;
      } catch {
        // 파손된 데이터 — 새로 만든다
      }
    }
  }

  const session: PairSession = {
    id: crypto.randomUUID(),
    anon_user_id: anonUserId,
    character_id: "serine",
    status: "active",
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_FALLBACK_KEY, JSON.stringify(session));
  }

  return session;
}
