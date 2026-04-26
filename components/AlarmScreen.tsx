import { Avatar } from "./Avatar";
import { Button } from "./Button";

type Props = {
  todoText: string;
  onDone: () => void;
  onSnooze: () => void;
};

export function AlarmScreen({ todoText, onDone, onSnooze }: Props) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-s-9 py-s-12 text-center"
      style={{ background: "var(--omc-tint-paper)" }}
    >
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
        약속 시간 · CHECK-IN
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
        시간 됐어.
        <br />
        다 했어?
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
          오늘 챙기고 싶었던 일
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
        <Button onClick={onDone}>다 했어</Button>
        <Button onClick={onSnooze} variant="ghost">
          다음에 알려줘
        </Button>
      </div>
    </div>
  );
}
