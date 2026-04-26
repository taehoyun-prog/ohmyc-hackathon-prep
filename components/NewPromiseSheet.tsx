"use client";
/**
 * NewPromiseSheet — step 5 이후 추가 새 약속 작성 sheet (2-page).
 * page 0: 텍스트 입력 (구 MemoScreen)
 * page 1: warm-paper 카드 미리보기 (구 PromiseScreen, 결정타 카피 R-006 보존)
 *
 * 구 step 2/3/4는 첫 온보딩 한정으로 강등됨 (page.tsx 통합 단계 처리).
 */

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import {
  computeReminderInfo,
  derivePromiseHeadline,
  deriveTimeLabel,
} from "@/lib/reminder-heuristic";

type Props = {
  pairSessionId: string | null;
  open: boolean;
  initialDate?: Date | null;
  onClose: () => void;
  onSubmit: (payload: {
    text: string;
    reminderTime?: string | null;
  }) => Promise<void> | void;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatTimeInput(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function isSameYmd(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function defaultTimeForDate(d: Date): string {
  const now = new Date();
  if (!isSameYmd(d, now)) return "09:00";
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return isSameYmd(next, now) ? formatTimeInput(next) : "23:30";
}

function buildLocalReminderTime(
  dateValue: string,
  timeValue: string,
): string | null {
  if (!dateValue || !timeValue) return null;
  const d = new Date(`${dateValue}T${timeValue}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatManualHeadline(iso: string | null): string {
  if (!iso) return "시간을 정해서 한번 물어볼게.";
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const hhmm = formatTimeInput(d);
  if (isSameYmd(d, now)) return `이따 ${hhmm}에 한번 물어볼게.`;
  if (isSameYmd(d, tomorrow)) return `내일 ${hhmm}에 한번 물어볼게.`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hhmm}에 한번 물어볼게.`;
}

function formatManualTimeLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${formatTimeInput(d)}`;
}

async function fetchPromiseCopyWithTimeout(
  todoText: string,
  pairSessionId: string | null,
  timeoutMs = 1500,
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

export function NewPromiseSheet({
  pairSessionId,
  open,
  initialDate = null,
  onClose,
  onSubmit,
}: Props) {
  const [page, setPage] = useState<0 | 1>(0);
  const [text, setText] = useState("");
  const [dateValue, setDateValue] = useState(() => formatDateInput(new Date()));
  const [timeValue, setTimeValue] = useState(() => defaultTimeForDate(new Date()));
  const [promiseCopy, setPromiseCopy] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const usesManualSchedule = initialDate !== null;

  useEffect(() => {
    if (open) {
      const baseDate = initialDate ?? new Date();
      setPage(0);
      setText("");
      setDateValue(formatDateInput(baseDate));
      setTimeValue(defaultTimeForDate(baseDate));
      setPromiseCopy(null);
      setSubmitting(false);
    }
  }, [open, initialDate]);

  const trimmed = text.trim();
  const manualReminderTime = usesManualSchedule
    ? buildLocalReminderTime(dateValue, timeValue)
    : null;

  const { headline, timeLabel } = useMemo(() => {
    if (usesManualSchedule) {
      return {
        headline: formatManualHeadline(manualReminderTime),
        timeLabel: formatManualTimeLabel(manualReminderTime),
      };
    }
    if (!trimmed) {
      return { headline: "3시간 뒤에 한번 물어볼게.", timeLabel: "" };
    }
    const info = computeReminderInfo(trimmed);
    return {
      headline: derivePromiseHeadline(info),
      timeLabel: deriveTimeLabel(info, new Date()),
    };
  }, [manualReminderTime, trimmed, usesManualSchedule]);

  const supportingCopy =
    promiseCopy ??
    (trimmed
      ? "이 일은 흐름 안에서 같이 챙겨볼게."
      : "등록한 일은 필요한 순간에 다시 꺼내볼게.");

  function goNext() {
    if (!trimmed) return;
    setPage(1);
    void fetchPromiseCopyWithTimeout(trimmed, pairSessionId).then((copy) => {
      if (copy) setPromiseCopy(copy);
    });
  }

  async function handleSubmit() {
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        text: trimmed,
        reminderTime: usesManualSchedule ? manualReminderTime : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (page === 1) {
      setPage(0);
      return;
    }
    onClose();
  }

  return (
    <Sheet
      open={open}
      title={page === 0 ? "새 약속 적기" : "세린 체크인 예약"}
      cancelLabel={page === 0 ? "취소" : "이전"}
      primaryLabel={
        page === 0 ? "다음" : submitting ? "저장 중" : "이 약속 맡길게요"
      }
      primaryDisabled={page === 0 ? !trimmed : submitting}
      onCancel={handleCancel}
      onPrimary={page === 0 ? goNext : handleSubmit}
    >
      {page === 0 ? (
        <MemoPage
          value={text}
          onChange={setText}
          showScheduleControls={usesManualSchedule}
          dateValue={dateValue}
          timeValue={timeValue}
          onDateChange={setDateValue}
          onTimeChange={setTimeValue}
        />
      ) : (
        <PromisePage
          headline={headline}
          timeLabel={timeLabel}
          supportingCopy={supportingCopy}
        />
      )}
    </Sheet>
  );
}

function MemoPage({
  value,
  onChange,
  showScheduleControls,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: {
  value: string;
  onChange: (s: string) => void;
  showScheduleControls: boolean;
  dateValue: string;
  timeValue: string;
  onDateChange: (s: string) => void;
  onTimeChange: (s: string) => void;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ padding: "36px 24px 32px" }}
    >
      <h2
        className="font-display"
        style={{
          fontSize: 22,
          lineHeight: 1.32,
          fontWeight: 600,
          color: "var(--fg-1)",
          textAlign: "center",
          textWrap: "balance",
          marginBottom: 28,
        }}
      >
        오늘 꼭 챙기고 싶은
        <br />
        한 가지만 적어줘
      </h2>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={30}
        autoFocus
        placeholder="예: 저녁에 단백질 챙기기"
        className="w-full bg-transparent text-center"
        style={{
          fontSize: 20,
          fontFamily: "var(--font-text)",
          fontWeight: 500,
          color: "var(--fg-1)",
          border: "none",
          borderBottom: "1.5px solid var(--border-mid)",
          outline: "none",
          padding: "10px 4px",
          maxWidth: 320,
          marginBottom: 24,
        }}
      />

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          maxWidth: 280,
          textAlign: "center",
        }}
      >
        세린이 기억해두고 시간 맞춰 먼저 확인할게.
      </p>

      {showScheduleControls && (
        <div
          className="w-full"
          style={{
            maxWidth: 320,
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "1fr 112px",
            gap: 10,
          }}
        >
          <label className="flex flex-col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>날짜</span>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => onDateChange(e.target.value)}
              style={{
                height: 44,
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                background: "white",
                color: "var(--fg-1)",
                fontSize: 14,
                padding: "0 10px",
                outline: "none",
              }}
            />
          </label>
          <label className="flex flex-col" style={{ gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>시간</span>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => onTimeChange(e.target.value)}
              style={{
                height: 44,
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                background: "white",
                color: "var(--fg-1)",
                fontSize: 14,
                padding: "0 10px",
                outline: "none",
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function PromisePage({
  headline,
  timeLabel,
  supportingCopy,
}: {
  headline: string;
  timeLabel: string;
  supportingCopy: string;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{
        padding: "36px 24px 36px",
        background: "var(--omc-tint-paper)",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--omc-tint-deep)",
          marginBottom: 20,
        }}
      >
        세린이 챙길 예약
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
          className="font-display"
          style={{
            fontSize: 26,
            lineHeight: 1.25,
            letterSpacing: "-0.2px",
            fontWeight: 600,
            color: "var(--fg-1)",
            textWrap: "balance",
            marginBottom: 14,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--fg-2)",
          }}
        >
          {supportingCopy}
        </div>
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: 18,
            paddingTop: 14,
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
        style={{
          marginTop: 28,
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          maxWidth: 280,
          textAlign: "center",
        }}
      >
        지금 저장하면 세린이 먼저 확인해요.
      </p>
    </div>
  );
}
