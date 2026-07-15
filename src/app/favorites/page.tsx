"use client";

import Link from "next/link";
import { useState } from "react";
import { getCard, getQuiz } from "@/data/content";
import { DAY_MAP, ERA_MAP } from "@/data/curriculum";
import { dayFromItemId } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import CardView from "@/components/CardView";
import { StarIcon } from "@/components/icons";

type Tab = "cards" | "quizzes";

export default function FavoritesPage() {
  const { ready, progress, toggleFavorite } = useProgress();
  const [tab, setTab] = useState<Tab>("cards");

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-card-muted" />;
  }

  const favCards = progress.favoriteCards
    .map((id) => ({ id, card: getCard(id) }))
    .filter((x) => x.card);
  const favQuizzes = progress.favoriteQuizzes
    .map((id) => ({ id, quiz: getQuiz(id) }))
    .filter((x) => x.quiz);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">즐겨찾기</h1>
        <p className="mt-1 text-sm text-muted">
          학습 중 별표한 카드와 퀴즈를 모아서 다시 볼 수 있어요.
        </p>
      </div>

      <div className="flex rounded-xl border border-border bg-card p-1">
        {(
          [
            ["cards", `카드 ${favCards.length}`],
            ["quizzes", `퀴즈 ${favQuizzes.length}`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              tab === key ? "bg-accent-soft text-accent" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "cards" &&
        (favCards.length === 0 ? (
          <EmptyState text="학습 카드 오른쪽 위 별표를 누르면 여기에 모여요." />
        ) : (
          <ul className="space-y-3">
            {favCards.map(({ id, card }) => {
              const day = dayFromItemId(id);
              const meta = DAY_MAP[day];
              const era = meta ? ERA_MAP[meta.eraId] : undefined;
              return (
                <li key={id} className="space-y-1">
                  {meta && era && (
                    <Link
                      href={`/learn/${day}`}
                      className="inline-flex items-center gap-1.5 px-1 text-xs font-semibold hover:underline"
                      style={{ color: era.color }}
                    >
                      Day {day} · {meta.title}
                    </Link>
                  )}
                  <CardView card={card!} eraColor={era?.color} compact />
                </li>
              );
            })}
          </ul>
        ))}

      {tab === "quizzes" &&
        (favQuizzes.length === 0 ? (
          <EmptyState text="퀴즈 오른쪽 위 별표를 누르면 여기에 모여요." />
        ) : (
          <ul className="space-y-3">
            {favQuizzes.map(({ id, quiz }) => {
              const day = dayFromItemId(id);
              const meta = DAY_MAP[day];
              const era = meta ? ERA_MAP[meta.eraId] : undefined;
              return (
                <li key={id} className="rounded-2xl border border-border bg-card p-4">
                  {meta && era && (
                    <Link
                      href={`/learn/${day}`}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: era.color }}
                    >
                      Day {day} · {meta.title}
                    </Link>
                  )}
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-relaxed">{quiz!.question}</p>
                    <button
                      aria-label="즐겨찾기 해제"
                      onClick={() => toggleFavorite("quiz", id)}
                      className="shrink-0 rounded-full p-1 text-accent"
                    >
                      <StarIcon className="h-5 w-5" filled />
                    </button>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-foreground">
                      정답과 해설 보기
                    </summary>
                    <div className="mt-2 rounded-xl bg-card-muted p-3 text-sm">
                      <p className="font-semibold text-good">
                        정답: {quiz!.answer + 1}번 — {quiz!.options[quiz!.answer]}
                      </p>
                      <p className="mt-1 leading-relaxed text-muted">{quiz!.explanation}</p>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <StarIcon className="mx-auto h-8 w-8 text-muted" />
      <p className="mt-2 text-sm text-muted">{text}</p>
    </div>
  );
}
