/**
 * Chat messages — Supabase 1차 영속화. 폴백은 모듈-레벨 in-memory Map.
 * sessionStorage 절대 사용 금지 (production 가드레일 #2).
 */

import { supabase } from "./supabase";
import type { ChatMessage, ChatRole } from "./types";

function safeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

const fallbackStore: Map<string, ChatMessage[]> = new Map();
let fallbackSeqCounter = 0;

function nextFallbackSeq(): number {
  fallbackSeqCounter += 1;
  return fallbackSeqCounter;
}

type AppendInput = {
  pair_session_id: string;
  role: ChatRole;
  text: string;
  meta?: Record<string, unknown>;
};

export async function listChatMessages(
  pairSessionId: string,
  limit: number = 200,
  ascending: boolean = true,
): Promise<ChatMessage[]> {
  if (!supabase) {
    const list = fallbackStore.get(pairSessionId) ?? [];
    const sorted = [...list].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    if (!ascending) sorted.reverse();
    return sorted.slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("pair_session_id", pairSessionId)
      .order("seq", { ascending })
      .limit(limit);

    if (error || !data) {
      const list = fallbackStore.get(pairSessionId) ?? [];
      return [...list]
        .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
        .slice(0, limit);
    }

    return data.map(normalizeChatMessage);
  } catch {
    const list = fallbackStore.get(pairSessionId) ?? [];
    return [...list]
      .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
      .slice(0, limit);
  }
}

export async function appendChatMessage(
  payload: AppendInput,
): Promise<ChatMessage> {
  const insertPayload = {
    pair_session_id: payload.pair_session_id,
    role: payload.role,
    text: payload.text,
    meta: payload.meta ?? {},
  };

  if (!supabase) {
    return saveFallback(insertPayload);
  }

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      return saveFallback(insertPayload);
    }

    return normalizeChatMessage(data);
  } catch {
    return saveFallback(insertPayload);
  }
}

function saveFallback(payload: {
  pair_session_id: string;
  role: ChatRole;
  text: string;
  meta: Record<string, unknown>;
}): ChatMessage {
  const item: ChatMessage = {
    id: safeId(),
    pair_session_id: payload.pair_session_id,
    role: payload.role,
    text: payload.text,
    meta: payload.meta,
    created_at: new Date().toISOString(),
    seq: nextFallbackSeq(),
  };

  const list = fallbackStore.get(payload.pair_session_id) ?? [];
  list.push(item);
  fallbackStore.set(payload.pair_session_id, list);
  return item;
}

function normalizeChatMessage(raw: Partial<ChatMessage>): ChatMessage {
  const role: ChatRole =
    raw.role === "character" || raw.role === "user" || raw.role === "system"
      ? raw.role
      : "system";
  return {
    id: raw.id ?? safeId(),
    pair_session_id: raw.pair_session_id ?? "",
    role,
    text: raw.text ?? "",
    meta: raw.meta ?? {},
    created_at: raw.created_at ?? new Date().toISOString(),
    seq: typeof raw.seq === "number" ? raw.seq : undefined,
  };
}
