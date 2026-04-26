"use client";
/**
 * ChatTab — 캐릭터-사용자 직접 대화 채널.
 * 2026-04-26 design pivot 신규 (R6 정책 변경 후).
 * 메시지 영속화: chat_messages 테이블 (sessionStorage 미사용).
 * chip 메타는 화면 상태로만 유지 (DB 저장 안 함 — 새로고침 시 칩은 사라지고 텍스트만 남음).
 *
 * 약속 플로우:
 *   사용자 입력 → looksLikePromise() → /api/promise-flow
 *   ask_time → 시간 후보 칩 → 사용자 탭 → 다시 promise-flow (rebuild_headline)
 *   confirm → "응, 맡길게" 칩 → /api/promise-flow phase=save → todos INSERT
 * 잡담:
 *   /api/chat (사용자 발화 → chat_messages INSERT + memories/todos 합류 + 세린 응답)
 */

import { useEffect, useRef, useState } from "react";
import { CharacterFigure } from "./CharacterFigure";
import { SpeechBubble, OutgoingBubble, TypingBubble } from "./SpeechBubble";
import { getCharacter } from "@/lib/characters";
import { looksLikePromise } from "@/lib/promise-keywords";
import { appendChatMessage } from "@/lib/chat-messages";
import type { ChatMessage } from "@/lib/types";

type TimeCandidate = { label: string; iso: string };
type ConfirmChip = {
  label: string;
  action: "save" | "shift" | "pick";
  deltaMinutes?: number;
  primary?: boolean;
};

type ChipRow =
  | { kind: "time_pick"; candidates: TimeCandidate[]; exhausted?: boolean }
  | {
      kind: "confirm";
      chips: ConfirmChip[];
      reminderTime: string;
      headline: string;
      exhausted?: boolean;
    };

// 클라이언트 메시지 = ChatMessage + 휘발성 chipRow
type ChatMessageWithChips = ChatMessage & { chipRow?: ChipRow | null };

type PromiseFlowState =
  | { kind: "idle" }
  | { kind: "awaiting_time"; originalText: string }
  | {
      kind: "awaiting_confirm";
      originalText: string;
      reminderTime: string;
    };

function safeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

type Props = { pairSessionId: string | null };

export function ChatTab({ pairSessionId }: Props) {
  const character = getCharacter();
  const [messages, setMessages] = useState<ChatMessageWithChips[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [flow, setFlow] = useState<PromiseFlowState>({ kind: "idle" });
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // 마운트 시 chat_messages에서 로드. 비어있으면 환영 메시지 (DB 시드 X)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!pairSessionId) {
        const hello: ChatMessageWithChips = {
          id: safeId(),
          pair_session_id: "",
          role: "character",
          text: character.homeBubble,
          meta: { local: true },
          created_at: nowIso(),
        };
        if (alive) setMessages([hello]);
        return;
      }
      try {
        const res = await fetch(
          `/api/chat?pairSessionId=${encodeURIComponent(pairSessionId)}`,
        );
        if (!alive) return;
        if (res.ok) {
          const data = (await res.json()) as { messages?: ChatMessage[] };
          const list = data.messages ?? [];
          if (list.length > 0) {
            setMessages(list);
            return;
          }
        }
      } catch {
        // 폴백: 환영 메시지
      }
      if (!alive) return;
      const hello: ChatMessageWithChips = {
        id: safeId(),
        pair_session_id: pairSessionId,
        role: "character",
        text: character.homeBubble,
        meta: { local: true },
        created_at: nowIso(),
      };
      setMessages([hello]);
    })();
    return () => {
      alive = false;
    };
  }, [pairSessionId, character.homeBubble]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function exhaustLastChipRow() {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].chipRow && !next[i].chipRow!.exhausted) {
          next[i] = {
            ...next[i],
            chipRow: { ...next[i].chipRow!, exhausted: true } as ChipRow,
          };
          break;
        }
      }
      return next;
    });
  }

  function pushOptimistic(
    role: "character" | "user" | "system",
    text: string,
    chipRow?: ChipRow | null,
  ): string {
    const id = safeId();
    const msg: ChatMessageWithChips = {
      id,
      pair_session_id: pairSessionId ?? "",
      role,
      text,
      meta: { optimistic: true },
      created_at: nowIso(),
      chipRow: chipRow ?? null,
    };
    setMessages((prev) => [...prev, msg]);
    return id;
  }

  // promise-flow 안의 캐릭터 발화 — DB에 저장 (chip은 휘발)
  function pushCharacterMessage(text: string, chipRow?: ChipRow | null) {
    const id = pushOptimistic("character", text, chipRow);
    if (pairSessionId) {
      void appendChatMessage({
        pair_session_id: pairSessionId,
        role: "character",
        text,
        meta: { source: "promise_flow" },
      })
        .then((saved) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...saved,
                    chipRow: chipRow ?? null,
                  }
                : m,
            ),
          );
        })
        .catch(() => {
          // 무시: 화면엔 이미 떠 있음
        });
    }
  }

  // promise-flow 안의 사용자 칩 탭 발화 — DB 저장
  function pushUserMessage(text: string) {
    const id = pushOptimistic("user", text);
    if (pairSessionId) {
      void appendChatMessage({
        pair_session_id: pairSessionId,
        role: "user",
        text,
        meta: { source: "promise_flow_chip" },
      })
        .then((saved) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...saved } : m)),
          );
        })
        .catch(() => {
          // 무시
        });
    }
  }

  async function callPromiseFlow(payload: Record<string, unknown>) {
    const res = await fetch("/api/promise-flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("promise-flow failed");
    return res.json();
  }

  async function startPromiseFlow(text: string) {
    if (!pairSessionId) {
      await fallbackChat(text);
      return;
    }
    setPending(true);
    try {
      const data = await callPromiseFlow({ pairSessionId, userMessage: text });
      if (data?.phase === "ask_time") {
        setFlow({ kind: "awaiting_time", originalText: text });
        pushCharacterMessage(data.characterReply, {
          kind: "time_pick",
          candidates: data.candidates as TimeCandidate[],
        });
      } else if (data?.phase === "confirm") {
        setFlow({
          kind: "awaiting_confirm",
          originalText: text,
          reminderTime: data.reminderTime,
        });
        pushCharacterMessage(data.characterReply, {
          kind: "confirm",
          chips: data.chips as ConfirmChip[],
          reminderTime: data.reminderTime,
          headline: data.headline,
        });
      } else {
        await fallbackChat(text);
      }
    } catch {
      await fallbackChat(text);
    } finally {
      setPending(false);
    }
  }

  // 일반 잡담 — /api/chat 통해 사용자 발화 + 세린 응답을 chat_messages에 기록 + memories/todos 합류
  async function fallbackChat(text: string) {
    if (!pairSessionId) {
      pushOptimistic(
        "character",
        "방금 말은 기억해둘게. 다음 흐름에서 같이 이어가자.",
      );
      return;
    }
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairSessionId, userMessage: text }),
      });
      if (!res.ok) throw new Error(`chat_post_failed_${res.status}`);
      const data = (await res.json()) as {
        userMessage: ChatMessage;
        replyMessage: ChatMessage;
      };
      // optimistic user 1건을 서버 정본 + reply로 교체
      setMessages((prev) => {
        const clone = [...prev];
        // 마지막에 들어간 optimistic user 메시지를 서버 user 메시지로 치환
        for (let i = clone.length - 1; i >= 0; i--) {
          const m = clone[i];
          if (
            m.role === "user" &&
            (m.meta as { optimistic?: boolean }).optimistic
          ) {
            clone[i] = { ...data.userMessage };
            break;
          }
        }
        clone.push({ ...data.replyMessage });
        return clone;
      });
    } catch {
      pushOptimistic(
        "character",
        "지금 잠깐 응답이 늦네. 곧 다시 들을게.",
      );
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || pending) return;

    // 사용자 입력은 일단 optimistic으로 띄움
    pushOptimistic("user", text);
    setInput("");

    if (flow.kind !== "idle") {
      exhaustLastChipRow();
      setFlow({ kind: "idle" });
    }

    if (looksLikePromise(text)) {
      // promise-flow는 자체적으로 todos INSERT 함. user 발화도 promise_flow에서 저장.
      // optimistic user → DB user로 치환
      if (pairSessionId) {
        void appendChatMessage({
          pair_session_id: pairSessionId,
          role: "user",
          text,
          meta: { source: "promise_flow_user" },
        })
          .then((saved) => {
            setMessages((prev) => {
              for (let i = prev.length - 1; i >= 0; i--) {
                const m = prev[i];
                if (
                  m.role === "user" &&
                  (m.meta as { optimistic?: boolean }).optimistic &&
                  m.text === text
                ) {
                  const next = [...prev];
                  next[i] = { ...saved };
                  return next;
                }
              }
              return prev;
            });
          })
          .catch(() => {
            // 무시
          });
      }
      await startPromiseFlow(text);
    } else {
      setPending(true);
      try {
        await fallbackChat(text);
      } finally {
        setPending(false);
      }
    }
  }

  async function handleTimePickChip(cand: TimeCandidate) {
    if (flow.kind !== "awaiting_time" || pending) return;
    exhaustLastChipRow();

    if (cand.iso === "") {
      const picked = await openNativeTimePicker();
      if (!picked) {
        setFlow({ kind: "idle" });
        return;
      }
      pushUserMessage(picked.label);
      await advanceToConfirm(flow.originalText, picked.iso);
      return;
    }

    pushUserMessage(cand.label);
    await advanceToConfirm(flow.originalText, cand.iso);
  }

  async function advanceToConfirm(originalText: string, reminderIso: string) {
    if (!pairSessionId) {
      pushCharacterMessage("저장 채널이 아직 안 열렸어.");
      setFlow({ kind: "idle" });
      return;
    }
    setPending(true);
    try {
      const data = await callPromiseFlow({
        phase: "rebuild_headline",
        reminderTime: reminderIso,
      });
      const headline = (data?.headline as string) ?? "한번 물어볼게.";
      setFlow({ kind: "awaiting_confirm", originalText, reminderTime: reminderIso });
      pushCharacterMessage(`${headline} 맞아?`, {
        kind: "confirm",
        chips: [
          { label: "응, 맡길게", action: "save", primary: true },
          { label: "30분 일찍", action: "shift", deltaMinutes: -30 },
          { label: "30분 늦게", action: "shift", deltaMinutes: 30 },
          { label: "다른 시간으로", action: "pick" },
        ],
        reminderTime: reminderIso,
        headline,
      });
    } catch {
      pushCharacterMessage("잠깐 응답이 늦네. 다시 한 번 말해줄래?");
      setFlow({ kind: "idle" });
    } finally {
      setPending(false);
    }
  }

  async function handleConfirmChip(chip: ConfirmChip, currentReminder: string) {
    if (flow.kind !== "awaiting_confirm" || pending) return;

    if (chip.action === "save") {
      exhaustLastChipRow();
      pushUserMessage(chip.label);
      setPending(true);
      try {
        const data = await callPromiseFlow({
          phase: "save",
          pairSessionId,
          originalText: flow.originalText,
          reminderTime: currentReminder,
        });
        const reply =
          (data?.characterReply as string) ??
          "좋아. 이 일은 흐름 안에서 같이 챙겨볼게.";
        pushCharacterMessage(reply);
      } catch {
        pushCharacterMessage("저장이 잠깐 막혔어. 다시 한 번 말해줄래?");
      } finally {
        setPending(false);
        setFlow({ kind: "idle" });
      }
      return;
    }

    if (chip.action === "shift" && typeof chip.deltaMinutes === "number") {
      exhaustLastChipRow();
      pushUserMessage(chip.label);
      const shifted = new Date(
        new Date(currentReminder).getTime() + chip.deltaMinutes * 60_000,
      ).toISOString();
      await advanceToConfirm(flow.originalText, shifted);
      return;
    }

    if (chip.action === "pick") {
      exhaustLastChipRow();
      pushUserMessage(chip.label);
      const picked = await openNativeTimePicker();
      if (!picked) {
        setFlow({ kind: "idle" });
        return;
      }
      pushUserMessage(picked.label);
      await advanceToConfirm(flow.originalText, picked.iso);
    }
  }

  const inputDisabled = pending || !pairSessionId;
  const inputPlaceholder = pairSessionId
    ? "세린에게 약속 맡기기"
    : "페어 연결을 기다리는 중";

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: "var(--bg-canvas-light)" }}
    >
      <header className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-white/85 px-4 py-3 backdrop-blur-xl">
        <CharacterFigure character={character} size={36} bloom={false} />
        <div className="flex flex-col">
          <span
            className="text-[15px] font-semibold tracking-[-0.02em]"
            style={{ color: "var(--fg-1)" }}
          >
            {character.nameKo}
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.14em]"
            style={{ color: "var(--omc-tint-deep, #d8623a)" }}
          >
            PAIR
          </span>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{ paddingBottom: 96 }}
      >
        <div className="flex flex-col gap-3">
          {messages.map((m) => {
            if (m.role === "system") {
              return <SpeechBubble key={m.id} text={m.text} variant="system" />;
            }
            if (m.role === "user") {
              return <OutgoingBubble key={m.id} text={m.text} />;
            }
            return (
              <div key={m.id} className="flex flex-col gap-1.5">
                <SpeechBubble text={m.text} variant="incoming" />
                {m.chipRow && (
                  <ChipRowView
                    row={m.chipRow}
                    onTimePick={handleTimePickChip}
                    onConfirm={handleConfirmChip}
                  />
                )}
              </div>
            );
          })}
          {pending && <TypingBubble />}
        </div>
      </div>

      <div
        className="fixed bottom-[58px] left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-[rgba(0,0,0,0.06)] bg-white/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <form
          className="flex items-center gap-2 px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={inputPlaceholder}
            className="flex-1 rounded-capsule border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-[15px] outline-none focus:border-[var(--omc-tint)]"
            style={{ color: "var(--fg-1)" }}
            disabled={inputDisabled}
          />
          <button
            type="submit"
            disabled={inputDisabled || !input.trim()}
            className="omc-pulse-on-tap rounded-capsule px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--omc-tint)" }}
          >
            보내기
          </button>
        </form>
      </div>
    </div>
  );
}

function ChipRowView({
  row,
  onTimePick,
  onConfirm,
}: {
  row: ChipRow;
  onTimePick: (cand: TimeCandidate) => void;
  onConfirm: (chip: ConfirmChip, reminderTime: string) => void;
}) {
  const dimmed = row.exhausted === true;
  const baseStyle: React.CSSProperties = {
    opacity: dimmed ? 0.5 : 1,
    pointerEvents: dimmed ? "none" : "auto",
  };

  if (row.kind === "time_pick") {
    return (
      <div
        className="flex flex-wrap gap-1.5 self-start pl-1"
        style={baseStyle}
      >
        {row.candidates.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onTimePick(c)}
            disabled={dimmed}
            className="omc-pulse-on-tap rounded-capsule border bg-white px-3 py-1.5 text-[13px]"
            style={{
              borderColor: "var(--omc-tint)",
              color: "var(--omc-tint-deep)",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 self-start pl-1" style={baseStyle}>
      {row.chips.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onConfirm(c, row.reminderTime)}
          disabled={dimmed}
          className="omc-pulse-on-tap rounded-capsule border px-3 py-1.5 text-[13px]"
          style={
            c.primary
              ? {
                  background: "var(--omc-tint)",
                  borderColor: "var(--omc-tint)",
                  color: "white",
                  fontWeight: 600,
                }
              : {
                  background: "white",
                  borderColor: "var(--omc-tint)",
                  color: "var(--omc-tint-deep)",
                }
          }
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// 모바일 native time picker — hidden input 띄우고 사용자 선택 받음
async function openNativeTimePicker(): Promise<
  { iso: string; label: string } | null
> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "time";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);
    let settled = false;

    const finish = (val: string | null) => {
      if (settled) return;
      settled = true;
      document.body.removeChild(input);
      if (!val) {
        resolve(null);
        return;
      }
      const [hh, mm] = val.split(":").map((v) => parseInt(v, 10));
      const now = new Date();
      const target = new Date(now);
      target.setHours(hh, mm, 0, 0);
      if (target.getTime() < now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const isTomorrow = target.getDate() !== now.getDate();
      const label = `${isTomorrow ? "내일 " : "이따 "}${val}`;
      resolve({ iso: target.toISOString(), label });
    };

    input.addEventListener("change", () => finish(input.value));
    input.addEventListener("blur", () => setTimeout(() => finish(input.value || null), 120));
    setTimeout(() => {
      try {
        input.focus();
        input.click();
      } catch {
        finish(null);
      }
    }, 0);
  });
}
