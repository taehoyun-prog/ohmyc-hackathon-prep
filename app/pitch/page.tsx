"use client";

/**
 * 해커톤 피치덱 v4 — 6슬라이드 5분 발표 (feedback_pitch_deck_hackathon.md 표 그대로)
 *
 * 키보드 네비: ←/→ 또는 Space (다음). 풀스크린 권장 (F11).
 * 라이브 데모는 03 슬라이드 — 라이브 URL은 G3 deploy 후 LIVE_URL 상수에 박음.
 *
 * 슬라이드에 박는 슬로건 = 1번·3번·5번. 2번·4번은 발표자 입으로 (script.md).
 * Plaitoon 비교·시간축 로드맵·"Why Us" 별도 슬라이드는 일부러 ❌ (해커톤 피치덱 한정 톤).
 */

import { useEffect, useState } from "react";

const TOTAL = 6;

// 라이브 URL — G3 Vercel deploy 완료 (2026-04-26).
const LIVE_URL = "https://ohmyc-hackathon-prep.vercel.app";

export default function PitchPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        setStep((s) => Math.min(TOTAL - 1, s + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === "Home") {
        setStep(0);
      } else if (e.key === "End") {
        setStep(TOTAL - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {step === 0 && <SlideTitle />}
      {step === 1 && <SlideProblem />}
      {step === 2 && <SlideDemo />}
      {step === 3 && <SlideHowItWorks />}
      {step === 4 && <SlideStages />}
      {step === 5 && <SlideTeam />}
      <Counter step={step} total={TOTAL} />
    </div>
  );
}

function Counter({ step, total }: { step: number; total: number }) {
  return (
    <div
      className="absolute bottom-s-8 right-s-9 rounded-tag px-s-5 py-s-3"
      style={{
        background: "rgba(0,0,0,0.4)",
        color: "rgba(255,255,255,0.7)",
        fontSize: "var(--t-control)",
        fontFamily: "var(--font-text)",
        letterSpacing: "0.08em",
      }}
    >
      {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
  );
}

/* ============================================================
   01 — 타이틀 (20초)
   슬로건 1번 *"대중의 첫 에이전트는 캐릭터다."*
   ============================================================ */
function SlideTitle() {
  return (
    <Stage background="dark" align="center">
      <div
        className="omc-breathe rounded-capsule mb-s-12"
        style={{
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(255,133,82,0.55) 0%, rgba(255,133,82,0.18) 38%, rgba(255,133,82,0) 70%)",
          filter: "blur(6px)",
        }}
      />
      <h1
        className="font-display mb-s-9"
        style={{
          fontSize: "var(--t-hero-l)",
          lineHeight: "var(--lh-hero-l)",
          letterSpacing: "var(--tr-hero-l)",
          fontWeight: 600,
          color: "var(--fg-on-dark)",
          textWrap: "balance",
        }}
      >
        대중의 첫 에이전트는
        <br />
        캐릭터다.
      </h1>
      <p
        style={{
          fontSize: "var(--t-utility)",
          color: "var(--fg-on-dark-2)",
          letterSpacing: "0.06em",
        }}
      >
        ohmyc · pair first meeting
      </p>
    </Stage>
  );
}

/* ============================================================
   02 — Problem (30초)
   "도구 vs 인격" + "stateless chat vs memory+action agent"
   슬로건 2번은 입으로.
   ============================================================ */
function SlideProblem() {
  return (
    <Stage background="light" align="center">
      <p
        className="mb-s-9"
        style={{
          fontSize: "var(--t-utility)",
          color: "var(--omc-tint-deep)",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        문제
      </p>
      <h1
        className="font-display mb-s-12"
        style={{
          fontSize: "var(--t-section)",
          lineHeight: "var(--lh-section)",
          letterSpacing: "var(--tr-section)",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
        }}
      >
        도구 vs 인격.
      </h1>
      <p
        style={{
          fontSize: "var(--t-promo)",
          lineHeight: "var(--lh-promo)",
          color: "var(--fg-2)",
          maxWidth: 720,
        }}
      >
        stateless chat <span style={{ color: "var(--fg-3)" }}>≠</span>{" "}
        <strong style={{ color: "var(--fg-1)" }}>memory + action agent</strong>
      </p>
    </Stage>
  );
}

/* ============================================================
   03 — Live Demo (70초)
   라이브 URL + 백업 영상. 새로고침→기억 입증 비트.
   ============================================================ */
function SlideDemo() {
  return (
    <Stage background="light" align="center">
      <p
        className="mb-s-7"
        style={{
          fontSize: "var(--t-utility)",
          color: "var(--omc-tint-deep)",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Live Demo · 60초
      </p>
      <h1
        className="font-display mb-s-9"
        style={{
          fontSize: "var(--t-product)",
          lineHeight: "var(--lh-product)",
          letterSpacing: "var(--tr-product)",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
        }}
      >
        직접 보세요.
      </h1>
      <div
        className="rounded-card-lg mb-s-9"
        style={{
          width: 360,
          height: 460,
          background: "var(--bg-canvas-white)",
          boxShadow: "var(--el-3)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <iframe
          src="/"
          title="ohmyc 라이브 데모"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "var(--r-card)",
          }}
        />
      </div>
      <a
        href={LIVE_URL}
        target="_blank"
        rel="noreferrer"
        style={{
          fontSize: "var(--t-control)",
          color: "var(--omc-tint-deep)",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        {LIVE_URL} →
      </a>
      <p
        className="mt-s-6"
        style={{
          fontSize: "var(--t-control)",
          color: "var(--fg-3)",
          maxWidth: 480,
        }}
      >
        새로고침해도 페어가 그대로. 기억하는 에이전트.
      </p>
    </Stage>
  );
}

/* ============================================================
   04 — How it works (60초)
   다이어그램 3노드(페어→Memory→Action) + 스택 한 줄.
   개발자 청자 앵커: persistent memory · scheduled action.
   슬로건 4번 + 오픈클로 인프라 + Growth는 입으로.
   ============================================================ */
function SlideHowItWorks() {
  return (
    <Stage background="light" align="center">
      <p
        className="mb-s-7"
        style={{
          fontSize: "var(--t-utility)",
          color: "var(--omc-tint-deep)",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        How it works
      </p>
      <h1
        className="font-display mb-s-12"
        style={{
          fontSize: "var(--t-product)",
          lineHeight: "var(--lh-product)",
          fontWeight: 600,
          color: "var(--fg-1)",
        }}
      >
        페어 → Memory → Action
      </h1>
      <div
        className="mb-s-12 flex items-center justify-center gap-s-9"
        style={{ flexWrap: "wrap" }}
      >
        <DiagramNode label="Pair" sub="anonymous · supabase" tone="dark" />
        <Arrow />
        <DiagramNode
          label="Memory"
          sub="persistent memory · Supabase"
          tone="tint"
        />
        <Arrow />
        <DiagramNode
          label="Action"
          sub="scheduled action · time-aware"
          tone="dark"
        />
      </div>
      <div
        className="rounded-control px-s-7 py-s-5"
        style={{
          background: "var(--bg-canvas-white)",
          boxShadow: "var(--el-1)",
          fontSize: "var(--t-control)",
          color: "var(--fg-2)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
        }}
      >
        Next.js 15 · Gemini 3 Flash Preview · Supabase · Vercel
      </div>
    </Stage>
  );
}

function DiagramNode({
  label,
  sub,
  tone,
}: {
  label: string;
  sub: string;
  tone: "dark" | "tint";
}) {
  const isTint = tone === "tint";
  return (
    <div
      className="rounded-card-lg px-s-9 py-s-7"
      style={{
        background: isTint ? "var(--omc-tint)" : "var(--bg-graphite-a)",
        color: isTint ? "var(--bg-canvas-white)" : "var(--fg-on-dark)",
        minWidth: 160,
        boxShadow: "var(--el-2)",
      }}
    >
      <div
        className="mb-s-2"
        style={{
          fontSize: "var(--t-card-title)",
          fontWeight: 600,
          letterSpacing: "var(--tr-card)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--t-micro)",
          opacity: 0.7,
          letterSpacing: "0.02em",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <span
      style={{
        fontSize: 32,
        color: "var(--fg-3)",
      }}
    >
      →
    </span>
  );
}

/* ============================================================
   05 — Stage 1~3 (60초)
   슬로건 3번 *"기억(Memory) + 행동(Action) + 성장(Growth)."*
   PM 기능 단계축. Stage 4(마켓플레이스)는 입으로.
   ============================================================ */
function SlideStages() {
  return (
    <Stage background="light" align="left">
      <p
        className="mb-s-7"
        style={{
          fontSize: "var(--t-utility)",
          color: "var(--omc-tint-deep)",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Roadmap · PM 기능 단계
      </p>
      <h1
        className="font-display mb-s-12"
        style={{
          fontSize: "var(--t-section)",
          lineHeight: "var(--lh-section)",
          letterSpacing: "var(--tr-section)",
          fontWeight: 600,
          color: "var(--fg-1)",
          textWrap: "balance",
        }}
      >
        기억(Memory) + 행동(Action) + 성장(Growth).
      </h1>
      <div className="flex flex-col gap-s-7" style={{ maxWidth: 720 }}>
        <StageRow
          n="1"
          name="Memory"
          status="이번 사이클 ✓"
          body="페어 세션·약속이 영속. 새로고침해도 곁에."
        />
        <StageRow
          n="2"
          name="Action"
          status="이번 사이클 ✓"
          body="입력의 시간을 알아서 잡는다. 약속을 챙긴다."
        />
        <StageRow
          n="3"
          name="Growth"
          status="다음 사이클"
          body="대화·관계 누적이 응답을 바꾼다."
        />
      </div>
    </Stage>
  );
}

function StageRow({
  n,
  name,
  status,
  body,
}: {
  n: string;
  name: string;
  status: string;
  body: string;
}) {
  return (
    <div
      className="rounded-card flex items-start gap-s-7 px-s-9 py-s-7"
      style={{
        background: "var(--bg-canvas-white)",
        boxShadow: "var(--el-1)",
      }}
    >
      <div
        className="rounded-capsule"
        style={{
          width: 40,
          height: 40,
          background: "var(--omc-tint-soft)",
          color: "var(--omc-tint-deep)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <div className="flex items-baseline gap-s-5 mb-s-3">
          <span
            style={{
              fontSize: "var(--t-card-title)",
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontSize: "var(--t-micro)",
              color: "var(--omc-tint-deep)",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {status}
          </span>
        </div>
        <p
          style={{
            fontSize: "var(--t-body)",
            lineHeight: "var(--lh-body)",
            color: "var(--fg-2)",
            margin: 0,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   06 — Team + Closing (20초)
   1인 + AI 자율경영. 슬로건 5번.
   ============================================================ */
function SlideTeam() {
  return (
    <Stage background="dark" align="center">
      <p
        className="mb-s-7"
        style={{
          fontSize: "var(--t-utility)",
          color: "var(--omc-tint)",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Team · 자율경영
      </p>
      <h1
        className="font-display mb-s-12"
        style={{
          fontSize: "var(--t-section)",
          lineHeight: "var(--lh-section)",
          letterSpacing: "var(--tr-section)",
          fontWeight: 600,
          color: "var(--fg-on-dark)",
          textWrap: "balance",
        }}
      >
        1인 + AI 에이전트.
        <br />
        그 자체가 미션의 증명.
      </h1>
      <div
        className="rounded-card-lg px-s-10 py-s-9"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--border-on-dark)",
        }}
      >
        <p
          className="font-display"
          style={{
            fontSize: "var(--t-promo)",
            lineHeight: "var(--lh-promo)",
            color: "var(--omc-tint)",
            margin: 0,
            textWrap: "balance",
          }}
        >
          개발자에겐 오픈클로,
          <br />
          대중에겐 ohmyc.
        </p>
      </div>
    </Stage>
  );
}

/* ============================================================
   Stage scaffold — 풀스크린 슬라이드 컨테이너
   ============================================================ */
function Stage({
  background,
  align,
  children,
}: {
  background: "dark" | "light";
  align: "center" | "left";
  children: React.ReactNode;
}) {
  const bg =
    background === "dark"
      ? "var(--bg-canvas-dark)"
      : "var(--bg-canvas-light)";
  return (
    <section
      className="flex h-screen w-full flex-col px-s-13 py-s-13"
      style={{
        background: bg,
        alignItems: align === "center" ? "center" : "flex-start",
        justifyContent: "center",
        textAlign: align === "center" ? "center" : "left",
      }}
    >
      {children}
    </section>
  );
}
