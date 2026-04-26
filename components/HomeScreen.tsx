import { useMemo } from "react";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import {
  computeReminderInfo,
  derivePromiseHeadline,
  deriveTimeLabel,
} from "@/lib/reminder-heuristic";

type Props = {
  todoText: string;
  todoCreatedAt: string | null;
  completedAt: string | null;
  promiseCopy: string | null;
  onNewPromise: () => void;
  onCheckAlarm: () => void;
};

export function HomeScreen({
  todoText,
  todoCreatedAt,
  completedAt,
  promiseCopy,
  onNewPromise,
  onCheckAlarm,
}: Props) {
  const { headline, timeLabel } = useMemo(() => {
    if (!todoCreatedAt || !todoText) {
      return { headline: "", timeLabel: "" };
    }
    const createdAt = new Date(todoCreatedAt);
    const info = computeReminderInfo(todoText, createdAt);
    return {
      headline: derivePromiseHeadline(info),
      timeLabel: deriveTimeLabel(info, createdAt),
    };
  }, [todoText, todoCreatedAt]);

  const supportingCopy =
    promiseCopy ?? (todoText ? "이 일은 흐름 안에서 같이 챙겨볼게." : "");

  const isCompleted = Boolean(completedAt);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-s-9 py-s-12"
      style={{ background: "var(--bg-canvas-light)" }}
    >
      <Avatar size={96} />
      <p
        className="mt-s-7 mb-s-9"
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--omc-tint-deep)",
        }}
      >
        오늘의 페어 · 세린
      </p>

      <h1
        className="mb-s-9 font-display text-center"
        style={{
          fontSize: "var(--t-card-title)",
          lineHeight: "var(--lh-card)",
          letterSpacing: "var(--tr-card)",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
        }}
      >
        {isCompleted
          ? "완료한 약속을 세린이 기억했어요."
          : "세린이 지금 이 약속을 챙기고 있어요."}
      </h1>

      {todoText && (
        <div
          className="rounded-card-lg w-full mb-s-12"
          style={{
            maxWidth: 360,
            background: "var(--bg-canvas-white)",
            padding: "24px 24px 18px",
            boxShadow: "var(--el-2)",
            position: "relative",
          }}
        >
          <div
            className="mb-s-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: isCompleted ? "var(--fg-3)" : "var(--omc-tint-deep)",
            }}
          >
            {isCompleted ? "완료" : "진행 중"}
          </div>
          <div
            className="font-display mb-s-4"
            style={{
              fontSize: "var(--t-card-title)",
              lineHeight: "var(--lh-card)",
              fontWeight: 600,
              color: isCompleted ? "var(--fg-3)" : "var(--fg-1)",
              textDecoration: isCompleted ? "line-through" : "none",
              textWrap: "balance",
            }}
          >
            {headline}
          </div>
          <div
            className="mb-s-5"
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {supportingCopy}
          </div>
          <div
            className="flex items-center justify-between pt-s-4"
            style={{
              borderTop: "1px solid var(--border-soft)",
              fontSize: 11,
              color: "var(--fg-3)",
            }}
          >
            <span>지금 챙기는 약속</span>
            <span>{timeLabel}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-s-5">
        <Button onClick={onNewPromise}>새 약속 맡기기</Button>
        {!isCompleted && todoText && (
          <Button onClick={onCheckAlarm} variant="ghost">
            지금 체크인 받기
          </Button>
        )}
      </div>
    </div>
  );
}
