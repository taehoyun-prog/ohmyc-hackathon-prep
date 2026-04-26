/**
 * CharacterFigure — 일러스트 인격체 표시 (Avatar 추상 placeholder 대체).
 * 2026-04-26 design pivot.
 */
import Image from "next/image";
import type { Character } from "@/lib/characters";

type Props = {
  character: Character;
  size?: number;
  bloom?: boolean;
  priority?: boolean;
};

export function CharacterFigure({
  character,
  size = 220,
  bloom = true,
  priority = false,
}: Props) {
  return (
    <div
      className="omc-breathe relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {bloom && (
        <div
          aria-hidden
          className="absolute rounded-capsule"
          style={{
            inset: -10,
            background: `radial-gradient(circle, ${hexToRgba(character.tint, 0.14)} 0%, ${hexToRgba(character.tint, 0)} 60%)`,
            filter: "blur(1px)",
          }}
        />
      )}
      <Image
        src={character.imageUrl}
        alt={character.nameKo}
        width={size}
        height={size}
        priority={priority}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: "drop-shadow(0 3px 10px rgba(255,133,82,0.10))",
        }}
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
