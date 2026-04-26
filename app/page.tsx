"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, BloomCircle } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { HomeScreen } from "@/components/HomeScreen";
import { AlarmScreen } from "@/components/AlarmScreen";
import { getOrCreateAnonUserId } from "@/lib/anon-user";
import { getOrCreatePairSession } from "@/lib/pair-session";
import {
  createTodo,
  getLatestTodo,
  markTodoCompleted,
} from "@/lib/todos";
import {
  computeReminderInfo,
  derivePromiseHeadline,
  deriveTimeLabel,
} from "@/lib/reminder-heuristic";
import type { PairSession, Todo } from "@/lib/types";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function makeTempTodo(pairSessionId: string, text: string): Todo {
  const info = computeReminderInfo(text);
  return {
    id: "temp-" + (typeof crypto !== "undefined" ? crypto.randomUUID() : Date.now().toString()),
    pair_session_id: pairSessionId,
    text,
    reminder_time: info.reminderTime,
    completed_at: null,
    created_at: new Date().toISOString(),
  };
}

async function fetchPromiseCopyWithTimeout(
  todoText: string,
  timeoutMs: number = 1500,
): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch("/api/promise-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todoText }),
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

export default function Page() {
  // step null = 초기 로딩 (깜빡임 방지). 데이터 로드 후 0 또는 5로.
  const [step, setStepRaw] = useState<Step | null>(null);
  const setStep = (s: Step) => setStepRaw(s);
  const [pairSession, setPairSession] = useState<PairSession | null>(null);
  const [todoText, setTodoText] = useState("");
  const [latestTodo, setLatestTodo] = useState<Todo | null>(null);
  const [promiseCopy, setPromiseCopy] = useState<string | null>(null);

  // 진입: 익명 ID + 페어 세션 + 직전 약속 복원 (새로고침 시 "기억" 입증)
  useEffect(() => {
    let alive = true;
    (async () => {
      const id = getOrCreateAnonUserId();
      const session = await getOrCreatePairSession(id);
      if (!alive) return;
      setPairSession(session);
      const last = await getLatestTodo(session.id);
      if (!alive) return;
      if (last) {
        setLatestTodo(last);
        setTodoText(last.text);
        // 새로고침으로 다시 들어왔으면 Home 으로 복귀 (페어 + 약속 그대로)
        setStepRaw(5);
        // 보조 카피도 백그라운드 재생성 (자연 한국어)
        fetchPromiseCopyWithTimeout(last.text).then((copy) => {
          if (alive && copy) setPromiseCopy(copy);
        });
      } else {
        setStepRaw(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 초기 로딩 — 빈 다크 캔버스 (깜빡임 방지)
  if (step === null) {
    return (
      <main
        className="mx-auto flex min-h-screen items-center justify-center"
        style={{
          maxWidth: 430,
          background: "var(--bg-canvas-dark)",
        }}
      >
        <div
          className="omc-breathe rounded-capsule"
          style={{
            width: 80,
            height: 80,
            background:
              "radial-gradient(circle, rgba(255,133,82,0.28) 0%, rgba(255,133,82,0) 70%)",
            filter: "blur(4px)",
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto" style={{ maxWidth: 430 }}>
      {step === 0 && <WelcomeScreen onNext={() => setStep(1)} />}
      {step === 1 && <MeetingScreen onNext={() => setStep(2)} />}
      {step === 2 && (
        <MemoScreen
          value={todoText}
          onChange={setTodoText}
          onNext={() => {
            if (!pairSession || !todoText.trim()) return;
            const text = todoText.trim();
            // 1. 임시 todo 즉시 생성 + Promise 화면 즉시 진입 (UX: 클릭=즉각 반응)
            const tempTodo = makeTempTodo(pairSession.id, text);
            setLatestTodo(tempTodo);
            setPromiseCopy(null);
            setStep(3);
            // 2. Supabase 저장 + flash-lite 보조 카피 모두 백그라운드
            createTodo(pairSession.id, text).then((real) => {
              if (real) setLatestTodo(real);
            });
            fetchPromiseCopyWithTimeout(text).then((copy) => {
              if (copy) setPromiseCopy(copy);
            });
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
      {step === 5 && (
        <HomeScreen
          todoText={latestTodo?.text ?? ""}
          todoCreatedAt={latestTodo?.created_at ?? null}
          completedAt={latestTodo?.completed_at ?? null}
          promiseCopy={promiseCopy}
          onNewPromise={() => {
            setTodoText("");
            setPromiseCopy(null);
            setStep(2);
          }}
          onCheckAlarm={() => setStep(6)}
        />
      )}
      {step === 6 && (
        <AlarmScreen
          todoText={latestTodo?.text ?? ""}
          onDone={() => {
            // UX: 즉시 갱신 + 화면 전환, Supabase update는 백그라운드
            if (latestTodo) {
              setLatestTodo({
                ...latestTodo,
                completed_at: new Date().toISOString(),
              });
              markTodoCompleted(latestTodo.id);
            }
            setStep(5);
          }}
          onSnooze={() => setStep(5)}
        />
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
      style={{ background, backgroundColor: bg }}
    >
      {children}
    </div>
  );
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <ScreenShell background="dark">
      <BloomCircle size={220} />
      <h1
        className="mt-s-12 mb-s-6 font-display"
        style={{
          fontSize: 36,
          lineHeight: 1.18,
          letterSpacing: "-0.4px",
          fontWeight: 600,
          color: "var(--fg-on-dark)",
          textWrap: "balance",
        }}
      >
        처음 만날 준비 됐어요
      </h1>
      <p
        className="mb-s-13"
        style={{
          fontSize: "var(--t-body)",
          lineHeight: "var(--lh-body)",
          color: "var(--fg-on-dark-2)",
          maxWidth: 280,
        }}
      >
        곁에 있을 페어를 소개할게요.
        <br />
        처음부터 천천히 알아가요.
      </p>
      <Button onClick={onNext}>시작하기</Button>
    </ScreenShell>
  );
}

function MeetingScreen({ onNext }: { onNext: () => void }) {
  return (
    <ScreenShell background="dark">
      <Avatar size={184} />
      <div
        className="mt-s-9 mb-s-6"
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--omc-tint)",
        }}
      >
        PAIR · 세린
      </div>
      <h1
        className="mb-s-6 font-display"
        style={{
          fontSize: 28,
          lineHeight: 1.32,
          letterSpacing: "-0.2px",
          fontWeight: 600,
          color: "var(--fg-on-dark)",
          textWrap: "balance",
          maxWidth: 300,
        }}
      >
        처음 만나서 반가워.
        <br />
        나는 세린이야.
      </h1>
      <p
        className="mb-s-13"
        style={{
          fontSize: 16,
          lineHeight: 1.55,
          color: "var(--fg-on-dark-2)",
          maxWidth: 280,
        }}
      >
        오늘부터 곁에서 같이 알아가고 싶어.
      </p>
      <Button onClick={onNext}>페어링하기</Button>
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
        일은 뭐야?
      </h1>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={30}
        placeholder="한 문장으로 적어줘"
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
        세린이 곁에서 챙길게.
      </p>
      <Button onClick={onNext} disabled={!value.trim()}>
        약속 만들기
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
      return { headline: "이따 한번 물어볼게.", timeLabel: "" };
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
      ? `${todoText}, 잊지 않게 곁에서 챙겨줄게.`
      : "등록한 일을 잊지 않게 시간에 맞춰 곁에서 챙겨줄게.");

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
        약속 · PROMISE
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
        약속은 한번 하면 기억해요. 같이 지켜가요.
      </p>
      <div className="flex flex-col items-center gap-s-5">
        <Button onClick={onNext}>약속할게</Button>
        <Button onClick={onBack} variant="ghost" full>
          다음에
        </Button>
      </div>
    </ScreenShell>
  );
}

function ConfirmScreen({ onNext }: { onNext: () => void }) {
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
        기억할게요.
        <br />
        같이 알아가요.
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
        세린이 곁에서 처음을 함께해요.
      </p>
      <Button onClick={onNext}>이제 만나러 가기</Button>
    </ScreenShell>
  );
}
