"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDayContent } from "@/data/content";
import { DAY_MAP, ERA_MAP } from "@/data/curriculum";
import { REVIEW_INTERVALS } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { learnHref } from "@/lib/day-slug";
import CardView from "./CardView";
import QuizRunner from "./QuizRunner";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { ResultView, SessionHeader } from "./SessionUI";

type Phase = "cards" | "quiz" | "result";

export default function LearnSession({ day }: { day: number }) {
  const meta = DAY_MAP[day];
  const era = ERA_MAP[meta.eraId];
  const content = getDayContent(day);
  const { completeDay } = useProgress();

  const [phase, setPhase] = useState<Phase>("cards");
  const [cardIdx, setCardIdx] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [result, setResult] = useState<{ score: number; wrongIds: string[] } | null>(null);

  const cards = content?.cards ?? [];
  const quizzes = content?.quizzes ?? [];

  // 카드 단계 키보드 내비게이션 (데스크탑)
  useEffect(() => {
    if (phase !== "cards") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setCardIdx((i) => Math.min(i + 1, cards.length - 1));
      if (e.key === "ArrowLeft") setCardIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, cards.length]);

  if (!content || cards.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-bold">이 일차의 콘텐츠가 아직 준비되지 않았어요.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 font-semibold text-white">
          홈으로
        </Link>
      </div>
    );
  }

  const isLastCard = cardIdx === cards.length - 1;

  return (
    <div className="mx-auto max-w-xl">
      {phase === "cards" && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            eraName={era.name}
            eraColor={era.color}
            current={cardIdx + 1}
            total={cards.length}
          />
          <p className="mb-2 text-center text-xs font-medium text-muted">
            카드 {cardIdx + 1} / {cards.length}
          </p>
          <CardView card={cards[cardIdx]} eraColor={era.color} />
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setCardIdx((i) => Math.max(i - 1, 0))}
              disabled={cardIdx === 0}
              className="flex items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 py-3 font-semibold text-muted hover:bg-card-muted disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              이전
            </button>
            <button
              onClick={() =>
                isLastCard ? setPhase("quiz") : setCardIdx((i) => Math.min(i + 1, cards.length - 1))
              }
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:opacity-90"
            >
              {isLastCard ? `퀴즈 풀기 (${quizzes.length}문항)` : "다음 카드"}
              {!isLastCard && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </>
      )}

      {phase === "quiz" && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            eraName={era.name}
            eraColor={era.color}
            current={quizIdx + 1}
            total={quizzes.length}
          />
          <QuizRunner
            quizzes={quizzes}
            onProgress={setQuizIdx}
            onFinish={(score, wrongIds) => {
              completeDay(day, score, quizzes.length, wrongIds);
              setResult({ score, wrongIds });
              setPhase("result");
            }}
          />
        </>
      )}

      {phase === "result" && result && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            eraName={era.name}
            eraColor={era.color}
            current={quizzes.length}
            total={quizzes.length}
          />
          <ResultView
            score={result.score}
            total={quizzes.length}
            wrongQuizzes={quizzes.filter((q) => result.wrongIds.includes(q.id))}
            nextReviewText={`내일 ${REVIEW_INTERVALS[0]}일차 복습이 홈 화면에 등록됩니다 (망각곡선 1·3·7·14·30일)`}
            retryHref={learnHref(day)}
          />
        </>
      )}
    </div>
  );
}
