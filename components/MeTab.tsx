"use client";
/**
 * MeTab — 마이 탭 (캐릭터 프로필 + 기억 카운트 read-only).
 * 2026-04-26 design pivot 신규. 편집·실시간 정보 연동 토글은 다음 사이클.
 */

import { CharacterFigure } from "./CharacterFigure";
import { getCharacter } from "@/lib/characters";

type Props = {
  memoryCount: number;
  todoCount: number;
  onManageMemories?: () => void;
  onManagePromises?: () => void;
  onToggleSync?: () => void;
};

export function MeTab({
  memoryCount,
  todoCount,
  onManageMemories,
  onManagePromises,
  onToggleSync,
}: Props) {
  const character = getCharacter();
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--bg-canvas-light)" }}
    >
      <div className="flex-1 overflow-y-auto omc-scroll-y px-5 pt-10 pb-32">
        <div className="flex flex-col items-center text-center">
        <CharacterFigure character={character} size={120} bloom />
        <div
          className="mt-3 text-[11px] uppercase tracking-[0.14em]"
          style={{ color: "var(--omc-tint-deep, #d8623a)" }}
        >
          PAIR
        </div>
        <h2
          className="mt-1 font-display"
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "var(--fg-1)",
            letterSpacing: "-0.2px",
          }}
        >
          {character.nameKo}
        </h2>
        <p
          className="mt-2 text-[14px]"
          style={{ color: "var(--fg-2)", maxWidth: 260, lineHeight: 1.5 }}
        >
          오늘부터 너를 알아가는 중.
        </p>
      </div>

      <ul
        className="mt-9 overflow-hidden rounded-card-md bg-white"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
      >
        <Row
          label="기억 관리"
          value={`${memoryCount}개`}
          onClick={onManageMemories}
        />
        <Row
          label="맡긴 약속"
          value={`${todoCount}개`}
          onClick={onManagePromises}
        />
        <Row
          label="실시간 정보 연동"
          value="ON"
          muted
          onClick={onToggleSync}
        />
      </ul>

      <p
        className="mt-6 text-center text-[12px]"
        style={{ color: "var(--fg-3)" }}
      >
        편집·내보내기는 다음에 함께 알아가자.
      </p>
    </div>
  </div>
);
}

function Row({
  label,
  value,
  muted = false,
  onClick,
}: {
  label: string;
  value: string;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className={`flex items-center justify-between border-b border-[rgba(0,0,0,0.05)] px-4 py-4 last:border-b-0 ${
        onClick ? "cursor-pointer active:bg-gray-50 transition-colors" : ""
      }`}
    >
      <span className="text-[15px] font-medium" style={{ color: "var(--fg-1)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className="text-[15px] font-medium"
          style={{
            color: muted ? "var(--fg-3)" : "var(--omc-tint-deep, #d8623a)",
          }}
        >
          {value}
        </span>
        {onClick && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--fg-4)", opacity: 0.4 }}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </div>
    </li>
  );
}
