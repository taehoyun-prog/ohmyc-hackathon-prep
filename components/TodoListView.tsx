"use client";
/**
 * TodoListView — 케어 탭 안의 투두 목록 서브화면.
 * iOS HIG Push 패턴: 좌상단 chevron + "케어" 부모 라벨, 탭바 유지, 우상단 + 버튼 (새 약속 sheet 트리거).
 */

import type { Todo } from "@/lib/types";

type Props = {
  activeTodos: Todo[];
  dueTodos: Todo[];
  missedTodos: Todo[];
  completedCount?: number;
  onBack: () => void;
  onAdd: () => void;
  onCheckIn: (id: string) => void;
};

export function TodoListView({
  activeTodos,
  dueTodos,
  missedTodos,
  completedCount = 0,
  onBack,
  onAdd,
  onCheckIn,
}: Props) {
  const totalOpen = activeTodos.length + dueTodos.length + missedTodos.length;

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--bg-canvas-light)" }}
    >
      <header
        className="sticky top-0 z-30 flex items-center justify-between"
        style={{
          padding: "10px 6px",
          background: "rgba(245,245,247,0.78)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="omc-pulse-on-tap flex items-center"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--omc-tint-deep)",
            fontSize: 15,
            fontWeight: 500,
            padding: "6px 8px 6px 4px",
            cursor: "pointer",
          }}
          aria-label="케어로 돌아가기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M14.5 6L8.5 12L14.5 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ marginLeft: 2 }}>케어</span>
        </button>

        <div
          className="font-display"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--fg-1)",
            letterSpacing: "-0.01em",
          }}
        >
          투두
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="omc-pulse-on-tap"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--omc-tint-deep)",
            padding: "6px 12px",
            cursor: "pointer",
          }}
          aria-label="새 약속 적기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <main
        className="flex-1 overflow-y-auto omc-scroll-y flex flex-col"
        style={{ padding: "20px 24px", gap: 24, paddingBottom: 120 }}
      >
        {totalOpen === 0 && completedCount === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <>
            {dueTodos.length > 0 && (
              <Section label="체크인 대기" count={dueTodos.length}>
                {dueTodos.map((t) => (
                  <DueTodoCard
                    key={t.id}
                    todo={t}
                    onCheckIn={() => onCheckIn(t.id)}
                  />
                ))}
              </Section>
            )}

            <Section
              label="진행 중"
              empty="진행 중인 약속이 아직 없어"
              count={activeTodos.length}
            >
              {activeTodos.map((t) => (
                <ActiveTodoCard key={t.id} todo={t} />
              ))}
            </Section>

            {missedTodos.length > 0 && (
              <Section label="놓친 약속" count={missedTodos.length}>
                {missedTodos.map((t) => (
                  <MissedTodoCard key={t.id} todo={t} />
                ))}
              </Section>
            )}

            {completedCount > 0 && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--fg-3)",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                완료 {completedCount}개 · 세린이 모두 기억하고 있어
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center"
      style={{ padding: "48px 16px" }}
    >
      <div
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "var(--omc-tint-paper)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect
            x="3.5"
            y="3.5"
            width="17"
            height="17"
            rx="3.5"
            stroke="var(--omc-tint)"
            strokeWidth="1.7"
          />
          <path
            d="M7.5 12.2l3.2 3.2 6.1-6.4"
            stroke="var(--omc-tint)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p
        className="font-display"
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "var(--fg-1)",
          marginBottom: 6,
        }}
      >
        아직 맡긴 약속이 없어
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--fg-2)",
          textAlign: "center",
          maxWidth: 240,
          lineHeight: 1.55,
          marginBottom: 20,
        }}
      >
        오늘 꼭 챙기고 싶은 한 가지를 적으면 세린이 먼저 알려줄게.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="omc-pulse-on-tap rounded-capsule"
        style={{
          background: "var(--omc-tint)",
          color: "white",
          border: "none",
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        첫 약속 맡기기
      </button>
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
        <p style={{ fontSize: 13, color: "var(--fg-3)", margin: 0 }}>{empty}</p>
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
