"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, BloomCircle } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { PairHome } from "@/components/PairHome";
import { AlarmScreen } from "@/components/AlarmScreen";
import { AppFooter } from "@/components/AppFooter";
import type { TabKey } from "@/components/TabBar";
import { ChatTab } from "@/components/ChatTab";
import { CareTab } from "@/components/CareTab";
import { CalendarView } from "@/components/CalendarView";
import { MeTab } from "@/components/MeTab";
import { SpeechBubble } from "@/components/SpeechBubble";
import { NewPromiseSheet } from "@/components/NewPromiseSheet";
import { TodoListView } from "@/components/TodoListView";
import { getCharacter } from "@/lib/characters";
import { getOrCreateAnonUserId } from "@/lib/anon-user";
import { getOrCreatePairSession } from "@/lib/pair-session";
import {
  createTodo,
  getDueTodos,
  getLatestTodo,
  listTodoHistory,
  markTodoCompleted,
  markTodoNotified,
  snoozeTodo,
} from "@/lib/todos";
import {
  addTodoEventMemory,
  createMemory,
  listRecentMemories,
  seedMemoriesForTodo,
} from "@/lib/memories";
import type { AgentExtract } from "@/lib/agent-loop";
import {
  computeReminderInfo,
  derivePromiseHeadline,
  deriveTimeLabel,
} from "@/lib/reminder-heuristic";
import { getOrCreateTemperature } from "@/lib/temperatures";
import { getStage, T_BASE, type Stage } from "@/lib/temperature";
import type { MemoryItem, PairSession, Todo } from "@/lib/types";

type Step = 0 | 1 | 2 | 3 | 4 | 5;
type SheetKind = null | "newPromise" | "alarm";
type CareView = "drawer" | "todoList" | "calendar";

function safeClientId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function makeTempTodo(
  pairSessionId: string,
  text: string,
  explicitReminderTime?: string | null,
): Todo {
  const fallbackInfo = computeReminderInfo(text);
  const reminderTime =
    explicitReminderTime &&
    !Number.isNaN(new Date(explicitReminderTime).getTime())
      ? new Date(explicitReminderTime).toISOString()
      : fallbackInfo.reminderTime;
  return {
    id: safeClientId("temp"),
    pair_session_id: pairSessionId,
    text,
    reminder_time: reminderTime,
    completed_at: null,
    checkin_state: "scheduled",
    last_notified_at: null,
    snoozed_until: null,
    notification_count: 0,
    created_at: new Date().toISOString(),
  };
}

function formatHHMM(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

async function fetchPromiseCopyWithTimeout(
  todoText: string,
  pairSessionId?: string,
  timeoutMs: number = 1500,
): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch("/api/promise-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todoText, pairSessionId }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { copy?: string };
    return data.copy ?? null;
  } catch {
    return null;
  }
}

async function fetchHomeBubbleWithTimeout(
  pairSessionId: string,
  activeTodoText: string,
  timeoutMs: number = 1500,
): Promise<{ text: string; memoryIds: string[] } | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch("/api/home-bubble", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairSessionId, activeTodoText }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string; memoryIds?: string[] };
    if (!data.text) return null;
    return { text: data.text, memoryIds: data.memoryIds ?? [] };
  } catch {
    return null;
  }
}

async function fetchAgentExtractWithTimeout(
  input: string,
  timeoutMs: number = 2800,
): Promise<AgentExtract | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch("/api/agent-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as AgentExtract;
  } catch {
    return null;
  }
}

const INTENT_LABEL: Record<AgentExtract["intent"], string> = {
  promise: "약속",
  record: "기록",
  emotion: "기분",
  pattern: "습관",
};

const IMPORTANCE_LABEL: Record<AgentExtract["importance"], string> = {
  low: "가볍게",
  medium: "보통",
  high: "중요",
};

async function persistAgentExtractMemory(
  pairSessionId: string,
  todoId: string,
  extract: AgentExtract,
): Promise<void> {
  const intent = INTENT_LABEL[extract.intent] ?? extract.intent;
  const importance = IMPORTANCE_LABEL[extract.importance] ?? extract.importance;
  const moodPiece =
    extract.emotion === "neutral" ? "" : ` · 기분 ${extract.emotion}`;
  const content = `${intent} 의도 · ${importance}${moodPiece}`;

  await createMemory({
    pair_session_id: pairSessionId,
    todo_id: todoId,
    kind: "fact",
    content,
    emotion: extract.emotion === "neutral" ? null : extract.emotion,
    meta: { source: "agent_extract", agent_extract: extract },
  });
}

function partitionTodos(todos: Todo[], now: Date): {
  active: Todo[];
  due: Todo[];
  missed: Todo[];
} {
  const active: Todo[] = [];
  const due: Todo[] = [];
  const missed: Todo[] = [];
  const tNow = now.getTime();
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  for (const todo of todos) {
    if (todo.completed_at) continue;
    if (!todo.reminder_time) {
      active.push(todo);
      continue;
    }
    const reminderMs = new Date(todo.reminder_time).getTime();
    if (reminderMs > tNow) {
      active.push(todo);
    } else if (tNow - reminderMs > SIX_HOURS) {
      missed.push(todo);
    } else {
      due.push(todo);
    }
  }

  return { active, due, missed };
}

export default function Page() {
  const [step, setStepRaw] = useState<Step>(0);
  const [tab, setTab] = useState<TabKey>("home");
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [careView, setCareView] = useState<CareView>("drawer");
  const [pairSession, setPairSession] = useState<PairSession | null>(null);
  const [todoText, setTodoText] = useState("");
  const [latestTodo, setLatestTodo] = useState<Todo | null>(null);
  const [activeAlarmTodo, setActiveAlarmTodo] = useState<Todo | null>(null);
  const [todoHistory, setTodoHistory] = useState<Todo[]>([]);
  const [recentMemories, setRecentMemories] = useState<MemoryItem[]>([]);
  const [temperature, setTemperature] = useState<number>(T_BASE);
  const [temperatureLevel, setTemperatureLevel] = useState<number>(0);
  const [promiseCopy, setPromiseCopy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [serineLine, setSerineLine] = useState<string | null>(null);
  const [serineLineMemoryIds, setSerineLineMemoryIds] = useState<string[]>([]);
  const [newPromiseInitialDate, setNewPromiseInitialDate] =
    useState<Date | null>(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const hasUserAdvancedRef = useRef(false);

  const setStep = (s: Step) => {
    hasUserAdvancedRef.current = true;
    setStepRaw(s);
  };

  function openNewPromise(initialDate: Date | null = null) {
    setNewPromiseInitialDate(initialDate);
    setSheet("newPromise");
  }

  const stage = useMemo<Stage>(
    () => getStage(temperature, temperatureLevel),
    [temperature, temperatureLevel],
  );

  const partitioned = useMemo(
    () => partitionTodos(todoHistory, new Date()),
    [todoHistory],
  );

  async function refreshLoopData(pairSessionId: string) {
    const [history, memories, temp] = await Promise.all([
      listTodoHistory(pairSessionId, 12),
      listRecentMemories(pairSessionId, 8),
      getOrCreateTemperature(pairSessionId),
    ]);
    setTodoHistory(history);
    setRecentMemories(memories);
    setTemperature(Number(temp.current_temp));
    setTemperatureLevel(Number(temp.level));
    if (!latestTodo && history.length > 0) {
      setLatestTodo(history[0]);
    }
  }

  async function ensurePairSession(): Promise<PairSession | null> {
    if (pairSession) return pairSession;
    try {
      const anonId = getOrCreateAnonUserId();
      const created = await getOrCreatePairSession(anonId);
      setPairSession(created);
      return created;
    } catch {
      return null;
    }
  }

  async function submitNewPromise(
    text: string,
    explicitReminderTime?: string | null,
  ): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    const session = await ensurePairSession();
    if (!session) return;

    const tempTodo = makeTempTodo(session.id, trimmed, explicitReminderTime);
    setLatestTodo(tempTodo);
    setTodoHistory((prev) => [tempTodo, ...prev].slice(0, 12));
    setPromiseCopy(null);

    const [saved, extract] = await Promise.all([
      createTodo(session.id, trimmed, explicitReminderTime),
      fetchAgentExtractWithTimeout(trimmed),
    ]);
    setLatestTodo(saved);
    setTodoHistory((prev) => {
      const cleaned = prev.filter((t) => t.id !== tempTodo.id);
      return [saved, ...cleaned.filter((t) => t.id !== saved.id)].slice(0, 12);
    });
    await seedMemoriesForTodo(session.id, saved);
    if (extract) {
      await persistAgentExtractMemory(session.id, saved.id, extract);
    }
    await refreshLoopData(session.id);
    setCalendarRefreshKey((key) => key + 1);

    fetchPromiseCopyWithTimeout(trimmed, session.id).then((copy) => {
      if (copy) setPromiseCopy(copy);
    });
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const session = await ensurePairSession();
      if (!alive || !session) return;

      const [last, history, memories, temp] = await Promise.all([
        getLatestTodo(session.id),
        listTodoHistory(session.id, 12),
        listRecentMemories(session.id, 8),
        getOrCreateTemperature(session.id),
      ]);
      if (!alive) return;

      setTodoHistory(history);
      setRecentMemories(memories);
      setTemperature(Number(temp.current_temp));
      setTemperatureLevel(Number(temp.level));

      if (last && !hasUserAdvancedRef.current) {
        setLatestTodo(last);
        setTodoText(last.text);
        setStepRaw(5);
        fetchPromiseCopyWithTimeout(last.text, session.id).then((copy) => {
          if (alive && copy) setPromiseCopy(copy);
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (step !== 5 || !pairSession) return;
    let alive = true;

    const run = async () => {
      const due = await getDueTodos(pairSession.id, new Date());
      if (!alive || due.length === 0) return;

      const next = due[0];
      const nowIso = new Date().toISOString();
      const updated: Todo = {
        ...next,
        checkin_state: "due",
        last_notified_at: nowIso,
        notification_count: (next.notification_count ?? 0) + 1,
      };

      setActiveAlarmTodo(updated);
      setLatestTodo((prev) => (prev?.id === updated.id ? updated : prev));
      setTodoHistory((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setToast("세린이 약속 시간에 맞춰 먼저 왔어");
      setSheet("alarm");
      void markTodoNotified(next.id, next.notification_count);
    };

    void run();
    const timer = window.setInterval(() => {
      void run();
    }, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [step, pairSession]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (step !== 5 || !pairSession) return;
    if (partitioned.active[0]?.text) return;
    let alive = true;

    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 4000);
    fetch("/api/next-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairSessionId: pairSession.id }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { text?: string; memoryIds?: string[] } | null) => {
          if (!alive || !data?.text) return;
          setSerineLine(data.text);
          setSerineLineMemoryIds(data.memoryIds ?? []);
        },
      )
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      alive = false;
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [step, pairSession, partitioned.active]);

  useEffect(() => {
    if (step !== 5 || tab !== "home" || !pairSession) return;
    const activeTodo = partitioned.active[0];
    if (!activeTodo?.text) return;

    let alive = true;
    fetchHomeBubbleWithTimeout(pairSession.id, activeTodo.text).then((result) => {
      if (alive && result) {
        setSerineLine(result.text);
        setSerineLineMemoryIds(result.memoryIds);
      }
    });

    return () => {
      alive = false;
    };
  }, [step, tab, pairSession, partitioned.active]);

  const alarmTarget = activeAlarmTodo ?? latestTodo;
  const alarmTimeLabel = formatHHMM(alarmTarget?.reminder_time ?? null);

  return (
    <main className="mx-auto relative" style={{ maxWidth: 430 }}>
      {step === 0 && <WelcomeScreen onNext={() => setStep(1)} />}
      {step === 1 && <MeetingScreen onNext={() => setStep(2)} />}
      {step === 2 && (
        <MemoScreen
          value={todoText}
          onChange={setTodoText}
          onNext={() => {
            if (!todoText.trim()) return;
            setStep(3);
            void submitNewPromise(todoText);
          }}
        />
      )}
      {step === 3 && (
        <PromiseScreen
          todoText={latestTodo?.text ?? todoText}
          todoCreatedAt={latestTodo?.created_at ?? null}
          promiseCopy={promiseCopy}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <ConfirmScreen
          onNext={() => setStep(5)}
        />
      )}
      {step === 5 && tab === "home" && (
        <PairHome
          activeTodos={partitioned.active}
          dueTodos={partitioned.due}
          missedTodos={partitioned.missed}
          recentMemories={recentMemories}
          temperature={temperature}
          stage={stage}
          serineLine={serineLine}
          serineLineMemoryIds={serineLineMemoryIds}
          onNewPromise={() => openNewPromise()}
          onCheckIn={(todoId) => {
            void (async () => {
              const session = await ensurePairSession();
              if (!session) return;
              const target = todoHistory.find((t) => t.id === todoId);
              if (!target) return;

              const nowIso = new Date().toISOString();
              const updated: Todo = {
                ...target,
                checkin_state: "due",
                last_notified_at: nowIso,
                notification_count: (target.notification_count ?? 0) + 1,
              };
              setActiveAlarmTodo(updated);
              setTodoHistory((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item)),
              );
              setLatestTodo((prev) => (prev?.id === updated.id ? updated : prev));
              setSheet("alarm");
              await markTodoNotified(target.id, target.notification_count);
            })();
          }}
        />
      )}
      {sheet === "alarm" && (
        <div
          className="fixed inset-0 z-[55]"
          style={{ background: "var(--omc-tint-paper)" }}
        >
          <AlarmScreen
            todoText={alarmTarget?.text ?? ""}
            timeLabel={alarmTimeLabel}
            onDone={() => {
              if (!alarmTarget) {
                setSheet(null);
                return;
              }

              const completedAt = new Date().toISOString();
              const updated: Todo = {
                ...alarmTarget,
                completed_at: completedAt,
                checkin_state: "completed",
                snoozed_until: null,
              };
              setLatestTodo((prev) =>
                prev?.id === updated.id ? updated : prev,
              );
              setActiveAlarmTodo(updated);
              setTodoHistory((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item)),
              );
              setToast("좋아. 완료로 기록했어");
              setSheet(null);

              void markTodoCompleted(updated.id);
              if (pairSession) {
                void (async () => {
                  await addTodoEventMemory(
                    pairSession.id,
                    updated,
                    "completed",
                  );
                  await fetch("/api/check-in", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      todoId: updated.id,
                      pairSessionId: pairSession.id,
                      responseKind: "done",
                    }),
                  }).catch(() => {});
                  await refreshLoopData(pairSession.id);
                })();
              }
            }}
            onSnooze={() => {
              if (!alarmTarget) {
                setSheet(null);
                return;
              }

              const snoozedUntil = new Date(
                Date.now() + 30 * 60 * 1000,
              ).toISOString();
              const updated: Todo = {
                ...alarmTarget,
                checkin_state: "snoozed",
                snoozed_until: snoozedUntil,
              };
              setLatestTodo((prev) =>
                prev?.id === updated.id ? updated : prev,
              );
              setActiveAlarmTodo(updated);
              setTodoHistory((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item)),
              );
              setToast("알겠어. 30분 뒤에 다시 올게");
              setSheet(null);

              void snoozeTodo(updated.id, 30);
              if (pairSession) {
                void (async () => {
                  await addTodoEventMemory(
                    pairSession.id,
                    updated,
                    "snoozed",
                  );
                  await fetch("/api/check-in", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      todoId: updated.id,
                      pairSessionId: pairSession.id,
                      responseKind: "snooze",
                    }),
                  }).catch(() => {});
                  await refreshLoopData(pairSession.id);
                })();
              }
            }}
          />
        </div>
      )}

      {step >= 5 && tab === "chat" && (
        <ChatTab pairSessionId={pairSession?.id ?? null} />
      )}
      {step >= 5 && tab === "care" && careView === "drawer" && (
        <CareTab
          onOpenTodo={() => setCareView("todoList")}
          onOpenCalendar={() => setCareView("calendar")}
        />
      )}
      {step >= 5 && tab === "care" && careView === "calendar" && (
        <CalendarView
          pairSessionId={pairSession?.id ?? null}
          refreshKey={calendarRefreshKey}
          onBack={() => setCareView("drawer")}
          onAdd={(date) => openNewPromise(date)}
        />
      )}
      {step >= 5 && tab === "care" && careView === "todoList" && (
        <TodoListView
          activeTodos={partitioned.active}
          dueTodos={partitioned.due}
          missedTodos={partitioned.missed}
          completedCount={todoHistory.filter((t) => t.completed_at).length}
          onBack={() => setCareView("drawer")}
          onAdd={() => openNewPromise()}
          onCheckIn={(todoId) => {
            void (async () => {
              const session = await ensurePairSession();
              if (!session) return;
              const target = todoHistory.find((t) => t.id === todoId);
              if (!target) return;

              const nowIso = new Date().toISOString();
              const updated: Todo = {
                ...target,
                checkin_state: "due",
                last_notified_at: nowIso,
                notification_count: (target.notification_count ?? 0) + 1,
              };
              setActiveAlarmTodo(updated);
              setTodoHistory((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item)),
              );
              setLatestTodo((prev) => (prev?.id === updated.id ? updated : prev));
              setSheet("alarm");
              await markTodoNotified(target.id, target.notification_count);
            })();
          }}
        />
      )}
      {step >= 5 && tab === "me" && (
        <MeTab
          memoryCount={recentMemories.length}
          todoCount={todoHistory.length}
        />
      )}
      {step >= 5 && <AppFooter currentTab={tab} onTabChange={setTab} />}

      <NewPromiseSheet
        pairSessionId={pairSession?.id ?? null}
        open={sheet === "newPromise"}
        initialDate={newPromiseInitialDate}
        onClose={() => {
          setSheet(null);
          setNewPromiseInitialDate(null);
        }}
        onSubmit={async ({ text, reminderTime }) => {
          await submitNewPromise(text, reminderTime);
          setToast("세린이 약속을 저장했어");
        }}
      />

      {toast && (
        <div
          className="rounded-capsule"
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 16px",
            background: "rgba(29,29,31,0.88)",
            color: "var(--fg-on-dark)",
            fontSize: 13,
            zIndex: 50,
            maxWidth: 360,
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}

function ScreenShell({
  background,
  children,
}: {
  background: "dark" | "light" | "paper";
  children: React.ReactNode;
}) {
  const bg =
    background === "dark"
      ? "var(--bg-canvas-dark)"
      : background === "paper"
        ? "var(--omc-tint-paper)"
        : "var(--bg-canvas-light)";
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-s-9 py-s-12 text-center"
      style={{ backgroundColor: bg }}
    >
      {children}
    </div>
  );
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <ScreenShell background="light">
      <BloomCircle size={220} />
      <h1
        className="mt-s-12 mb-s-6 font-display"
        style={{
          fontSize: 36,
          lineHeight: 1.18,
          letterSpacing: "-0.4px",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
        }}
      >
        세린이 약속을 기억하고
        <br />
        먼저 확인해요
      </h1>
      <p
        className="mb-s-13"
        style={{
          fontSize: "var(--t-body)",
          lineHeight: "var(--lh-body)",
          color: "var(--fg-2)",
          maxWidth: 280,
        }}
      >
        오늘 챙길 일을 적어두면
        <br />
        맞는 시간에 세린이 먼저 물어봐요.
        <br />
        처음이라도 부담 없이 시작해요.
      </p>
      <Button onClick={onNext}>세린 만나기</Button>
    </ScreenShell>
  );
}

function MeetingScreen({ onNext }: { onNext: () => void }) {
  const character = getCharacter();
  return (
    <ScreenShell background="light">
      <div
        className="mb-s-3"
        style={{
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.06em",
          color: "var(--fg-3)",
        }}
      >
        오늘의 페어
      </div>
      <Avatar size={184} />
      <div
        className="mt-s-7 mb-s-5"
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--omc-tint-deep)",
        }}
      >
        {character.pairLabel}
      </div>
      <div className="mb-s-7 flex w-full justify-center">
        <SpeechBubble
          text={character.introBubble}
          variant="incoming"
          tail={false}
          className="max-w-[300px]"
        />
      </div>
      <p
        className="mb-s-13"
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          maxWidth: 280,
        }}
      >
        천천히 알아가자.
        <br />
        네가 말하면 나는 기억할게.
      </p>
      <Button onClick={onNext}>약속 맡겨보기</Button>
    </ScreenShell>
  );
}

function MemoScreen({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (s: string) => void;
  onNext: () => void;
}) {
  return (
    <ScreenShell background="light">
      <h1
        className="mb-s-9 font-display"
        style={{
          fontSize: 28,
          lineHeight: 1.32,
          letterSpacing: "-0.2px",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
          maxWidth: 320,
        }}
      >
        오늘 꼭 챙기고 싶은
        <br />
        한 가지만 적어줘
      </h1>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={30}
        placeholder="예: 저녁에 단백질 챙기기"
        className="mb-s-9 w-full bg-transparent text-center"
        style={{
          fontSize: "var(--t-card-title)",
          fontFamily: "var(--font-text)",
          fontWeight: 500,
          color: "var(--fg-1)",
          border: "none",
          borderBottom: "1.5px solid var(--border-mid)",
          outline: "none",
          padding: "10px 4px",
          maxWidth: 320,
        }}
      />
      <p
        className="mb-s-13"
        style={{
          fontSize: "var(--t-body)",
          lineHeight: "var(--lh-body)",
          color: "var(--fg-2)",
          maxWidth: 280,
        }}
      >
        세린이 기억해두고 시간 맞춰 먼저 확인할게.
      </p>
      <Button onClick={onNext} disabled={!value.trim()}>
        이 약속 맡길게요
      </Button>
    </ScreenShell>
  );
}

function PromiseScreen({
  todoText,
  todoCreatedAt,
  promiseCopy,
  onNext,
  onBack,
}: {
  todoText: string;
  todoCreatedAt: string | null;
  promiseCopy: string | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const { headline, timeLabel } = useMemo(() => {
    if (!todoCreatedAt || !todoText) {
      return { headline: "3시간 뒤에 한번 물어볼게.", timeLabel: "" };
    }
    const createdAt = new Date(todoCreatedAt);
    const info = computeReminderInfo(todoText, createdAt);
    return {
      headline: derivePromiseHeadline(info),
      timeLabel: deriveTimeLabel(info, createdAt),
    };
  }, [todoText, todoCreatedAt]);

  const supportingCopy =
    promiseCopy ??
    (todoText
      ? "이 일은 흐름 안에서 같이 챙겨볼게."
      : "등록한 일은 필요한 순간에 다시 꺼내볼게.");

  return (
    <ScreenShell background="paper">
      <div
        className="mb-s-8"
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--omc-tint-deep)",
        }}
      >
        세린 체크인 예약
      </div>
      <div
        className="relative w-full rounded-card-lg"
        style={{
          maxWidth: 320,
          background: "#FFFAF4",
          border: "1px solid rgba(255,133,82,0.22)",
          padding: "32px 28px",
          boxShadow:
            "0 14px 36px rgba(255,133,82,0.22), 0 2px 6px rgba(255,133,82,0.10)",
          transform: "rotate(-1.4deg)",
          backgroundImage:
            "radial-gradient(circle at 18% 14%, rgba(255,133,82,0.06) 0%, rgba(255,133,82,0) 40%), radial-gradient(circle at 82% 88%, rgba(255,133,82,0.05) 0%, rgba(255,133,82,0) 36%)",
        }}
      >
        <div
          aria-hidden
          className="absolute rounded-tag"
          style={{
            top: -10,
            left: "50%",
            transform: "translateX(-50%) rotate(2deg)",
            width: 56,
            height: 18,
            background: "rgba(255,133,82,0.28)",
          }}
        />
        <div
          className="font-display mb-s-5"
          style={{
            fontSize: 28,
            lineHeight: 1.25,
            letterSpacing: "-0.2px",
            fontWeight: 600,
            color: "var(--fg-1)",
            textWrap: "balance",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: "var(--fg-2)",
          }}
        >
          {supportingCopy}
        </div>
        <div
          className="mt-s-8 pt-s-7 flex items-center justify-between"
          style={{
            borderTop: "1px dashed rgba(255,133,82,0.32)",
            fontSize: 12,
            color: "var(--fg-3)",
          }}
        >
          <span>세린 · PAIR</span>
          <span>{timeLabel}</span>
        </div>
      </div>
      <p
        className="mt-s-11 mb-s-9"
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          maxWidth: 280,
        }}
      >
        지금 저장하면 세린이 먼저 확인해요.
      </p>
      <div className="flex flex-col items-center gap-s-5">
        <Button onClick={onNext}>이 약속 세린에게 맡길게요</Button>
        <Button onClick={onBack} variant="ghost" full>
          다시 적어볼게요
        </Button>
      </div>
    </ScreenShell>
  );
}

function ConfirmScreen({
  onNext,
}: {
  onNext: () => void;
}) {
  return (
    <ScreenShell background="light">
      <Avatar size={132} />
      <h1
        className="mt-s-11 mb-s-6 font-display"
        style={{
          fontSize: 32,
          lineHeight: 1.2,
          letterSpacing: "-0.3px",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
          maxWidth: 300,
        }}
      >
        약속 저장했어요.
        <br />
        이제 세린이 챙겨요.
      </h1>
      <p
        className="mb-s-13"
        style={{
          fontSize: "var(--t-body)",
          lineHeight: "var(--lh-body)",
          color: "var(--fg-2)",
          maxWidth: 280,
        }}
      >
        이제부터 세린이 먼저 확인하고 기억해요.
      </p>
      <Button onClick={onNext}>홈에서 진행 보기</Button>
    </ScreenShell>
  );
}
