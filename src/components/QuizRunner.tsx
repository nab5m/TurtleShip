"use client";

import Image from "next/image";
import { useState } from "react";
import type { Quiz } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { StarIcon } from "./icons";

interface Props {
  quizzes: Quiz[];
  onFinish: (score: number, wrongIds: string[]) => void;
  onProgress?: (index: number) => void; // 상단 진행바 갱신용
}

export default function QuizRunner({ quizzes, onFinish, onProgress }: Props) {
  const { toggleFavorite, isFavorite } = useProgress();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  const quiz = quizzes[idx];
  if (!quiz) return null;
  const fav = isFavorite("quiz", quiz.id);
  const answered = selected !== null;
  const correct = answered && selected === quiz.answer;
  const isLast = idx === quizzes.length - 1;

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === quiz.answer) {
      setScore((s) => s + 1);
    } else {
      setWrongIds((w) => [...w, quiz.id]);
    }
  }

  function next() {
    if (!answered) return;
    const finalScore = score;
    const finalWrong = wrongIds;
    if (isLast) {
      onFinish(finalScore, finalWrong);
      return;
    }
    setIdx((i) => {
      onProgress?.(i + 1);
      return i + 1;
    });
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-border bg-card p-5 sm:p-6">
        <button
          aria-label={fav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          onClick={() => toggleFavorite("quiz", quiz.id)}
          className={`absolute right-4 top-4 rounded-full p-1.5 ${
            fav ? "text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          <StarIcon className="h-5 w-5" filled={fav} />
        </button>

        <p className="text-xs font-semibold text-muted">
          문제 {idx + 1} / {quizzes.length}
        </p>
        <h3 className="mt-1 pr-9 text-base font-bold leading-relaxed sm:text-lg">
          {quiz.question}
        </h3>

        {quiz.image && (
          <figure className="mt-3">
            <Image
              src={quiz.image.src}
              alt={quiz.image.alt}
              width={quiz.image.width}
              height={quiz.image.height}
              className="mx-auto max-h-40 w-auto rounded-lg object-contain sm:max-h-48"
            />
            <figcaption className="mt-1 text-center text-[10px] text-muted">
              {quiz.image.alt} · 출처: Wikimedia Commons
            </figcaption>
          </figure>
        )}

        <div className="mt-4 space-y-2">
          {quiz.options.map((opt, i) => {
            let style = "border-border bg-card hover:bg-card-muted";
            if (answered) {
              if (i === quiz.answer) style = "border-good bg-good-soft";
              else if (i === selected) style = "border-bad bg-bad-soft";
              else style = "border-border opacity-60";
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`flex w-full items-start gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-colors sm:text-[15px] ${style}`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    answered && i === quiz.answer
                      ? "bg-good text-white"
                      : answered && i === selected
                        ? "bg-bad text-white"
                        : "bg-card-muted text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed ${
              correct ? "bg-good-soft text-good" : "bg-bad-soft text-bad"
            }`}
          >
            <p className="font-bold">{correct ? "정답이에요! 👏" : "아쉬워요 😢"}</p>
            <p className="mt-1 text-foreground/90">{quiz.explanation}</p>
          </div>
        )}
      </div>

      <button
        onClick={next}
        disabled={!answered}
        className="w-full rounded-xl bg-accent px-5 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
      >
        {isLast ? "결과 보기" : "다음 문제"}
      </button>
    </div>
  );
}
