/**
 * PairHome — 4 섹션 새 진입 화면 (G1).
 * "세린이 지금 곁에서 챙기는 일" — 진행 약속·체크인 대기·놓친 약속·최근 기억 동시 노출.
 */

"use client";

import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { TemperaturePill } from "./TemperaturePill";
import { MemoryPill } from "./MemoryPill";
import { CharacterFigure } from "./CharacterFigure";
import { SpeechBubble } from "./SpeechBubble";
import { getCharacter } from "@/lib/characters";
import { getStageLabel, type Stage } from "@/lib/temperature";
import type { MemoryItem, Todo } from "@/lib/types";

type Props = {
  activeTodos: Todo[];
  dueTodos: Todo[];
  missedTodos: Todo[];
  recentMemories: MemoryItem[];
  temperature: number;
  temperatureDelta?: number;
  stage: Stage;
  serineLine?: string | null;
  serineLineMemoryIds?: string[];
  onNewPromise: () => void;
  onCheckIn: (todoId: string) => void;
};

export function PairHome({
  activeTodos,
  dueTodos,
  missedTodos,
  recentMemories,
  temperature,
  temperatureDelta,
  stage,
  serineLine,
  serineLineMemoryIds,
  onNewPromise,
  onCheckIn,
}: Props) {
  const highlightedIds = new Set(serineLineMemoryIds ?? []);
  const character = getCharacter();
  const heroBubble =
    serineLine && serineLine.length < 80
      ? serineLine
      : activeTodos[0]?.text
        ? "지금 필요한 일부터 차분히 챙겨볼게."
        : character.homeBubble;
  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "var(--bg-canvas-light)" }}
    >
      <header
        className="sticky top-0 z-40 flex items-center justify-between"
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-soft)",
          background: "rgba(245,245,247,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <Avatar size={48} bloom={false} />
          <div>
            <div
              style={{
                fontSize: 10,
                color: "var(--omc-tint-deep)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              세린 · PAIR
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-2)",
                marginTop: 2,
              }}
            >
              {getStageLabel(stage)}
            </div>
          </div>
        </div>
        <TemperaturePill temp={temperature} delta={temperatureDelta} />
      </header>

      <main
        className="flex-1 overflow-y-auto omc-scroll-y flex flex-col"
        style={{ padding: "24px", gap: 24, paddingBottom: 40 }}
      >
        <div className="flex flex-col items-center gap-3 pb-2 pt-2">
          <CharacterFigure character={character} size={180} bloom />
          <div className="flex w-full justify-center">
            <SpeechBubble
              text={heroBubble}
              variant="incoming"
              tail={false}
              className="max-w-[280px] text-center"
            />
          </div>
        </div>

        <h1
          className="font-display"
          style={{
            fontSize: 18,
            lineHeight: 1.32,
            fontWeight: 600,
            color: "var(--fg-1)",
            textWrap: "balance",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          오늘의 요약
        </h1>

        {serineLine && (
          <div
            className="rounded-card-lg"
            style={{
              background: "#FFFAF4",
              border: "1px solid rgba(255,133,82,0.22)",
              padding: "18px 20px",
              boxShadow: "var(--el-warm)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--omc-tint-deep)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              세린의 한 마디
            </div>
            <div
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--fg-1)",
                fontWeight: 500,
              }}
            >
              {serineLine}
            </div>
          </div>
        )}

        <Section
          label="진행 중"
          empty="진행 중인 약속이 아직 없어"
          count={activeTodos.length}
        >
          {activeTodos.map((todo) => (
            <ActiveTodoCard key={todo.id} todo={todo} />
          ))}
        </Section>

        {dueTodos.length > 0 && (
          <Section label="체크인 대기" count={dueTodos.length}>
            {dueTodos.map((todo) => (
              <DueTodoCard
                key={todo.id}
                todo={todo}
                onCheckIn={() => onCheckIn(todo.id)}
              />
            ))}
          </Section>
        )}

        {missedTodos.length > 0 && (
          <Section label="놓친 약속" count={missedTodos.length}>
            {missedTodos.map((todo) => (
              <MissedTodoCard key={todo.id} todo={todo} />
            ))}
          </Section>
        )}

        <Section
          label="세린이 기억하는 것"
          empty="처음부터 알아가요"
          count={recentMemories.length}
        >
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {recentMemories.slice(0, 5).map((m) => (
              <MemoryPill
                key={m.id}
                memory={m}
                highlighted={highlightedIds.has(m.id)}
              />
            ))}
          </div>
        </Section>
      </main>

      <footer
        className="flex flex-col items-center shrink-0"
        style={{
          padding: "16px 24px 24px",
          borderTop: "1px solid var(--border-soft)",
          background: "var(--bg-canvas-light)",
          gap: 8,
          position: "relative",
          zIndex: 40
        }}
      >
        <Button onClick={onNewPromise} full>
          새 약속 만들기
        </Button>
      </footer>
    </div>
  );
}

function Section({
  label,
  empty,
  count,
  children,
}: {
  label: string;
  empty?: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--omc-tint-deep)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {count === 0 && empty ? (
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-3)",
            margin: 0,
          }}
        >
          {empty}
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ActiveTodoCard({ todo }: { todo: Todo }) {
  return (
    <div
      className="rounded-card"
      style={{
        background: "var(--bg-canvas-white)",
        boxShadow: "var(--el-2)",
        padding: "16px",
      }}
    >
      <div
        style={{
          fontSize: 15,
          color: "var(--fg-1)",
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {todo.text}
      </div>
      {todo.reminder_time && (
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            marginTop: 6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          체크인{" "}
          {new Date(todo.reminder_time).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}

function DueTodoCard({
  todo,
  onCheckIn,
}: {
  todo: Todo;
  onCheckIn: () => void;
}) {
  return (
    <div
      className="rounded-card flex items-center justify-between"
      style={{
        background: "var(--omc-tint-paper)",
        boxShadow: "var(--el-warm)",
        border: "1px solid rgba(255,133,82,0.28)",
        padding: "16px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            color: "var(--omc-tint-deep)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          시간 됐어
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--fg-1)",
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          {todo.text}
        </div>
      </div>
      <button
        type="button"
        onClick={onCheckIn}
        className="rounded-capsule omc-pulse-on-tap"
        style={{
          background: "var(--omc-tint)",
          color: "white",
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        체크인
      </button>
    </div>
  );
}

function MissedTodoCard({ todo }: { todo: Todo }) {
  return (
    <div
      className="rounded-card"
      style={{
        background: "rgba(214,214,221,0.4)",
        opacity: 0.8,
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--fg-3)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        놓침
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--fg-2)",
          marginTop: 4,
        }}
      >
        {todo.text}
      </div>
    </div>
  );
}
