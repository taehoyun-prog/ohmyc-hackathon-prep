import { Avatar } from "./Avatar";
import { Button } from "./Button";

type Props = {
  todoText: string;
  timeLabel?: string;
  onDone: () => void;
  onSnooze: () => void;
};

export function AlarmScreen({ todoText, timeLabel, onDone, onSnooze }: Props) {
  return (
    <div
      className="flex h-full flex-col items-center justify-start px-s-9 py-s-12 text-center overflow-y-auto omc-scroll-y"
      style={{ background: "var(--omc-tint-paper)" }}
    >
      <div className="flex min-h-full flex-col items-center justify-center w-full">
        <Avatar size={132} />

      <p
        className="mt-s-9 mb-s-7"
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--omc-tint-deep)",
        }}
      >
        세린 체크인 · 지금 확인해요
      </p>

      <h1
        className="font-display mb-s-9"
        style={{
          fontSize: 32,
          lineHeight: 1.2,
          letterSpacing: "-0.3px",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
          maxWidth: 320,
        }}
      >
        약속한 시간이 왔어.
        <br />
        지금 상태 알려줘.
      </h1>

      <div
        className="rounded-card-lg mb-s-12"
        style={{
          maxWidth: 320,
          background: "#FFFAF4",
          border: "1px solid rgba(255,133,82,0.22)",
          padding: "20px 24px",
          boxShadow: "var(--el-warm)",
        }}
      >
        <div
          className="mb-s-2"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--omc-tint-deep)",
          }}
        >
          {timeLabel ? `체크인 시간 ${timeLabel}` : "세린이 기억한 약속"}
        </div>
        <div
          className="font-display"
          style={{
            fontSize: 22,
            lineHeight: 1.32,
            fontWeight: 600,
            color: "var(--fg-1)",
            textWrap: "balance",
          }}
        >
          {todoText}
        </div>
      </div>

        <div className="flex flex-col items-center gap-s-5">
          <Button onClick={onDone}>다 했어요</Button>
          <Button onClick={onSnooze} variant="ghost">
            30분 뒤에 다시 확인해요
          </Button>
        </div>
      </div>
    </div>
  );
}
