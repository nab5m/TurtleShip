"use client";

import Image from "next/image";
import type { StudyCard } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { StarIcon } from "./icons";

interface Props {
  card: StudyCard;
  eraColor?: string;
  compact?: boolean; // 즐겨찾기 목록 등에서 작게 표시
}

export default function CardView({ card, eraColor, compact }: Props) {
  const { toggleFavorite, isFavorite } = useProgress();
  const fav = isFavorite("card", card.id);

  return (
    <div
      className={`relative rounded-2xl border border-border bg-card ${
        compact ? "p-4" : "flex min-h-[22rem] flex-col p-6 sm:min-h-[24rem]"
      }`}
      style={eraColor ? { borderTopWidth: 4, borderTopColor: eraColor } : undefined}
    >
      <button
        aria-label={fav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        onClick={() => toggleFavorite("card", card.id)}
        className={`absolute right-4 top-4 rounded-full p-1.5 transition-colors ${
          fav ? "text-accent" : "text-muted hover:text-foreground"
        }`}
      >
        <StarIcon className="h-5 w-5" filled={fav} />
      </button>

      <h3 className={`pr-9 font-bold ${compact ? "text-base" : "text-xl sm:text-2xl"}`}>
        {card.title}
      </h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {card.keywords.map((k) => (
          <span
            key={k}
            className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
          >
            {k}
          </span>
        ))}
      </div>

      {card.image && !compact && (
        <figure className="mt-4">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            width={card.image.width}
            height={card.image.height}
            className="mx-auto max-h-44 w-auto rounded-lg object-contain sm:max-h-52"
          />
          <figcaption className="mt-1 text-center text-[10px] text-muted">
            {card.image.alt}
            {card.image.credit ? ` · ${card.image.credit}` : " · 출처: Wikimedia Commons"}
          </figcaption>
        </figure>
      )}

      <p className={`mt-4 leading-relaxed ${compact ? "text-sm" : "text-[15px] sm:text-base"}`}>
        {card.content}
      </p>
    </div>
  );
}
