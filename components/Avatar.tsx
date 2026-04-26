/**
 * Avatar — 2026-04-26 design pivot 후 일러스트 캐릭터 래퍼.
 * 호출처 변경 없이 추상 placeholder → 일러스트 인격체로 전환.
 */
import { CharacterFigure } from "./CharacterFigure";
import { getCharacter } from "@/lib/characters";

type AvatarProps = { size?: number; bloom?: boolean };

export function Avatar({ size = 184, bloom = true }: AvatarProps) {
  return <CharacterFigure character={getCharacter()} size={size} bloom={bloom} />;
}

export function BloomCircle({ size = 220 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="omc-breathe rounded-capsule"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, rgba(255,133,82,0.55) 0%, rgba(255,133,82,0.18) 38%, rgba(255,133,82,0) 70%)",
        filter: "blur(6px)",
      }}
    />
  );
}
