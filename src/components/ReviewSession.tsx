"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDayContent } from "@/data/content";
import { DAY_MAP, ERA_MAP } from "@/data/curriculum";
import type { DayContent, DayRecord, Quiz } from "@/lib/types";
import { REVIEW_INTERVALS } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { learnHref } from "@/lib/day-slug";
import CardView from "./CardView";
import QuizRunner from "./QuizRunner";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { ResultView, SessionHeader } from "./SessionUI";

type Phase = "cards" | "quiz" | "result";

const REVIEW_QUIZ_COUNT = 8;

// 로더: 데이터가 준비되면 내부 세션을 마운트한다.
// (준비 시점의 rec를 prop으로 넘겨 내부에서 1회만 고정 → setState/ref-in-render 회피)
export default function ReviewSession({ day }: { day: number }) {
  const content = getDayContent(day);
  const { ready, progress } = useProgress();
  const rec = progress.completed[day];

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-card-muted" />;
  }

  if (!rec) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-bold">아직 학습하지 않은 일차예요.</p>
        <p className="mt-1 text-sm text-muted">먼저 학습을 완료하면 복습이 등록됩니다.</p>
        <Link
          href={learnHref(day)}
          className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 font-semibold text-white"
        >
          Day {day} 학습하기
        </Link>
      </div>
    );
  }

  if (!content || content.cards.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-bold">이 일차의 복습 콘텐츠가 아직 준비되지 않았어요.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 font-semibold text-white">
          홈으로
        </Link>
      </div>
    );
  }

  return <ReviewSessionInner day={day} content={content} initialRec={rec} />;
}

function ReviewSessionInner({
  day,
  content,
  initialRec,
}: {
  day: number;
  content: DayContent;
  initialRec: DayRecord;
}) {
  const meta = DAY_MAP[day];
  const era = ERA_MAP[meta.eraId];
  const { completeReview } = useProgress();

  const [phase, setPhase] = useState<Phase>("cards");
  const [cardIdx, setCardIdx] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [result, setResult] = useState<{ score: number; wrongIds: string[] } | null>(null);

  // 세션 시작 시점의 복습 단계/오답을 마운트 시 1회 고정
  // (완료 처리 후 progress가 갱신돼도 이 세션의 문제 세트는 바뀌지 않는다)
  const [snapshot] = useState(() => ({
    stage: initialRec.reviewDates.length,
    wrongIds: initialRec.wrongQuizIds,
  }));

  const cards = content.cards;
  const allQuizzes = content.quizzes;

  // 복습 퀴즈 구성: 지난번 틀린 문제 우선 + 단계별로 회전하며 나머지 채움
  const quizzes: Quiz[] = useMemo(() => {
    const wrongSet = new Set(snapshot.wrongIds);
    const wrong = allQuizzes.filter((q) => wrongSet.has(q.id));
    const rest = allQuizzes.filter((q) => !wrongSet.has(q.id));
    const offset = rest.length > 0 ? (snapshot.stage * 5) % rest.length : 0;
    const rotated = [...rest.slice(offset), ...rest.slice(0, offset)];
    const target = Math.max(REVIEW_QUIZ_COUNT, wrong.length);
    return [...wrong, ...rotated].slice(0, Math.min(target, allQuizzes.length));
  }, [snapshot, allQuizzes]);

  // 카드 단계 키보드 내비게이션
  useEffect(() => {
    if (phase !== "cards") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setCardIdx((i) => Math.min(i + 1, cards.length - 1));
      if (e.key === "ArrowLeft") setCardIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, cards.length]);

  const stageLabel =
    snapshot.stage < REVIEW_INTERVALS.length
      ? `${REVIEW_INTERVALS[snapshot.stage]}일차 복습`
      : "자유 복습";
  const isLastCard = cardIdx === cards.length - 1;
  const nextStage = snapshot.stage + 1;
  const nextReviewText =
    nextStage < REVIEW_INTERVALS.length
      ? `다음 복습은 ${REVIEW_INTERVALS[nextStage]}일차에 등록됩니다`
      : "이 일차의 망각곡선 복습을 모두 마쳤어요! 🎓";

  return (
    <div className="mx-auto max-w-xl">
      {phase === "cards" && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            eraName={era.name}
            eraColor={era.color}
            badge={stageLabel}
            current={cardIdx + 1}
            total={cards.length}
          />
          <p className="mb-2 text-center text-xs font-medium text-muted">
            카드 훑어보기 {cardIdx + 1} / {cards.length}
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
              {isLastCard ? `복습 퀴즈 (${quizzes.length}문항)` : "다음 카드"}
              {!isLastCard && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={() => setPhase("quiz")}
            className="mt-2 w-full py-2 text-center text-sm font-medium text-muted hover:text-foreground"
          >
            카드 건너뛰고 바로 퀴즈 풀기 →
          </button>
        </>
      )}

      {phase === "quiz" && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            eraName={era.name}
            eraColor={era.color}
            badge={stageLabel}
            current={quizIdx + 1}
            total={quizzes.length}
          />
          <QuizRunner
            quizzes={quizzes}
            onProgress={setQuizIdx}
            onFinish={(score, wrongIds) => {
              completeReview(day, wrongIds);
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
            badge={stageLabel}
            current={quizzes.length}
            total={quizzes.length}
          />
          <ResultView
            score={result.score}
            total={quizzes.length}
            wrongQuizzes={quizzes.filter((q) => result.wrongIds.includes(q.id))}
            nextReviewText={nextReviewText}
            retryHref={`/review/${day}`}
          />
        </>
      )}
    </div>
  );
}
