import { supabase } from "./supabase";
import { DEFAULT_CHARACTER_ID } from "./characters";
import type { PairSession } from "./types";

// 폴백: 모듈-레벨 메모리 캐시 (anon_user_id → PairSession)
// production 가드레일: sessionStorage는 영속화 path가 아님 (anon_user_id 식별자만 localStorage 사용).
const memorySessionByAnonId: Map<string, PairSession> = new Map();

function safeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

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
      .insert({ anon_user_id: anonUserId, character_id: DEFAULT_CHARACTER_ID })
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
  const cached = memorySessionByAnonId.get(anonUserId);
  if (cached) return cached;

  const session: PairSession = {
    id: safeId(),
    anon_user_id: anonUserId,
    character_id: DEFAULT_CHARACTER_ID,
    status: "active",
    created_at: new Date().toISOString(),
  };
  memorySessionByAnonId.set(anonUserId, session);
  return session;
}
