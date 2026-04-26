"use client";
/**
 * CalendarView — 월 그리드 6주 × 7칸 + 일자별 약속 점/카운트.
 * supabase todos 테이블의 reminder_time을 시각적으로 보여주는 뷰.
 * 라이브러리 미사용 (가드레일).
 */

import { useEffect, useMemo, useState } from "react";
import type { Todo } from "@/lib/types";

type Props = {
  pairSessionId: string | null;
  refreshKey?: number;
  onBack: () => void;
  onAdd: (date: Date) => void;
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseYmd(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildMonthCells(monthDate: Date): { date: Date; inMonth: boolean }[] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // 일요일 시작
  return Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d, inMonth: d.getMonth() === monthDate.getMonth() };
  });
}

function groupByDay(todos: Todo[]): Map<string, Todo[]> {
  const m = new Map<string, Todo[]>();
  for (const t of todos) {
    if (!t.reminder_time) continue;
    const d = new Date(t.reminder_time);
    const key = ymd(d);
    const arr = m.get(key) ?? [];
    arr.push(t);
    m.set(key, arr);
  }
  return m;
}

export function CalendarView({
  pairSessionId,
  refreshKey = 0,
  onBack,
  onAdd,
}: Props) {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pairSessionId) {
      setTodos([]);
      return;
    }
    setLoading(true);
    fetch(`/api/todos?pair_session_id=${encodeURIComponent(pairSessionId)}`)
      .then((r) => (r.ok ? r.json() : { todos: [] }))
      .then((data) => setTodos((data?.todos as Todo[]) ?? []))
      .catch(() => setTodos([]))
      .finally(() => setLoading(false));
  }, [pairSessionId, refreshKey]);

  const cells = useMemo(() => buildMonthCells(monthDate), [monthDate]);
  const byDay = useMemo(() => groupByDay(todos), [todos]);

  const monthLabel = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`;
  const todayKey = ymd(new Date());
  const selectedDate = selectedDay !== null ? parseYmd(selectedDay) : null;
  const selectedTodos =
    selectedDay !== null ? byDay.get(selectedDay) ?? [] : [];

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // 무시
    }
  }

  return (
    <div
      className="min-h-screen px-5 pt-10"
      style={{ background: "var(--bg-canvas-light)", paddingBottom: 96 }}
    >
      <header className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="omc-pulse-on-tap text-[14px]"
          style={{ color: "var(--fg-2)" }}
        >
          ← 기능 모음
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setMonthDate(
                new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
              )
            }
            className="omc-pulse-on-tap text-[18px]"
            style={{ color: "var(--fg-2)" }}
          >
            ‹
          </button>
          <span
            className="font-display text-[15px] font-semibold"
            style={{ color: "var(--fg-1)" }}
          >
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() =>
              setMonthDate(
                new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
              )
            }
            className="omc-pulse-on-tap text-[18px]"
            style={{ color: "var(--fg-2)" }}
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => onAdd(selectedDate ?? new Date())}
          className="omc-pulse-on-tap"
          aria-label="선택한 날에 새 약속 추가"
          style={{
            width: 60,
            border: "none",
            background: "transparent",
            color: "var(--omc-tint-deep)",
            fontSize: 24,
            lineHeight: 1,
            fontWeight: 500,
            cursor: "pointer",
            textAlign: "right",
          }}
        >
          +
        </button>
      </header>

      <div
        className="grid grid-cols-7 mb-2 text-center text-[11px]"
        style={{ color: "var(--fg-3)" }}
      >
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map(({ date, inMonth }) => {
          const key = ymd(date);
          const dayTodos = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className="omc-pulse-on-tap rounded-card-md flex flex-col items-center justify-center"
              style={{
                aspectRatio: "1 / 1.05",
                background: isSelected
                  ? "var(--omc-tint-paper)"
                  : inMonth
                  ? "white"
                  : "transparent",
                opacity: inMonth ? 1 : 0.35,
                border: isToday
                  ? "1.5px solid var(--omc-tint)"
                  : "1px solid rgba(0,0,0,0.04)",
                boxShadow: isSelected
                  ? "0 4px 12px rgba(255,133,82,0.18)"
                  : "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <span
                className="text-[13px]"
                style={{
                  color: isToday ? "var(--omc-tint-deep)" : "var(--fg-1)",
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {date.getDate()}
              </span>
              {dayTodos.length > 0 && (
                <span className="mt-0.5 flex gap-0.5">
                  {Array.from({ length: Math.min(dayTodos.length, 3) }).map(
                    (_, i) => (
                      <span
                        key={i}
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--omc-tint)" }}
                      />
                    ),
                  )}
                  {dayTodos.length > 3 && (
                    <span
                      className="text-[9px] ml-0.5"
                      style={{ color: "var(--omc-tint-deep)" }}
                    >
                      +{dayTodos.length - 3}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <p
          className="mt-6 text-center text-[12px]"
          style={{ color: "var(--fg-3)" }}
        >
          약속 가져오는 중…
        </p>
      )}

      {selectedDay && selectedTodos.length > 0 && (
        <div className="mt-7">
          <h3
            className="mb-3 text-[12px] uppercase tracking-[0.14em]"
            style={{ color: "var(--omc-tint-deep)" }}
          >
            그날 세린이 챙길 약속
          </h3>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onAdd(selectedDate ?? new Date())}
              className="omc-pulse-on-tap rounded-card-md"
              style={{
                background: "var(--omc-tint-paper)",
                border: "1px solid rgba(255,133,82,0.18)",
                color: "var(--omc-tint-deep)",
                fontSize: 14,
                fontWeight: 600,
                padding: "12px 14px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              이 날에 약속 추가
            </button>
            {selectedTodos
              .sort((a, b) =>
                (a.reminder_time ?? "").localeCompare(b.reminder_time ?? ""),
              )
              .map((t) => (
                <div
                  key={t.id}
                  className="rounded-card-md bg-white px-4 py-3 flex items-center justify-between"
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex flex-col">
                    <span
                      className="text-[12px]"
                      style={{ color: "var(--omc-tint-deep)" }}
                    >
                      {t.reminder_time ? formatHHMM(t.reminder_time) : ""}
                    </span>
                    <span
                      className="text-[15px]"
                      style={{
                        color: t.completed_at
                          ? "var(--fg-3)"
                          : "var(--fg-1)",
                        textDecoration: t.completed_at
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {t.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="omc-pulse-on-tap text-[12px]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    삭제
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {selectedDay && selectedTodos.length === 0 && !loading && (
        <div className="mt-7 flex flex-col items-center" style={{ gap: 14 }}>
          <p
            className="text-center text-[13px]"
            style={{ color: "var(--fg-3)", margin: 0 }}
          >
            이 날엔 아직 약속이 없어.
          </p>
          <button
            type="button"
            onClick={() => onAdd(selectedDate ?? new Date())}
            className="omc-pulse-on-tap rounded-capsule"
            style={{
              background: "var(--omc-tint)",
              color: "white",
              border: "none",
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            이 날에 약속 추가
          </button>
        </div>
      )}
    </div>
  );
}
