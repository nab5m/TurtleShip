"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDayContent } from "@/data/content";
import { DAY_MAP, UNIT_MAP, eraOfUnit, stageOfDay } from "@/data/curriculum";
import { REVIEW_INTERVALS, unitFromItemId, type StudyCard } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { learnHref } from "@/lib/day-slug";
import { estimatedMinutes } from "@/data/day-time";
import CardView from "./CardView";
import CardAudioPlayer from "./CardAudioPlayer";
import QuizRunner from "./QuizRunner";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { ResultView, SessionHeader } from "./SessionUI";

// "unit-done" = 한 단원의 카드를 다 본 직후의 중간 지점.
// 하루치가 단원 2~4개라 여기서 끊고 다음에 이어서 할 수 있게 한다.
type Phase = "cards" | "unit-done" | "quiz" | "result";

interface UnitSegment {
  unit: number;
  cards: StudyCard[];
}

// 하루치 카드를 단원 단위로 끊는다. 순서는 커리큘럼의 단원 순서를 따르고,
// 어느 단원에도 속하지 않는 카드가 생기면 뒤에 붙여 유실을 막는다.
//
// 입력이 day 하나뿐인 순수 계산이라 컴포넌트 밖에서 캐싱한다.
// (useMemo 를 쓰면 React Compiler 가 수동 메모이제이션과 충돌해 최적화를 건너뛴다)
const SEGMENT_CACHE = new Map<number, UnitSegment[]>();

function segmentsOfDay(day: number): UnitSegment[] {
  const cached = SEGMENT_CACHE.get(day);
  if (cached) return cached;

  const meta = DAY_MAP[day];
  const cards = getDayContent(day)?.cards ?? [];
  if (!meta || cards.length === 0) return [];

  const byUnit = new Map<number, StudyCard[]>();
  for (const card of cards) {
    const unit = unitFromItemId(card.id);
    const list = byUnit.get(unit);
    if (list) list.push(card);
    else byUnit.set(unit, [card]);
  }

  const ordered: UnitSegment[] = meta.units
    .filter((u) => byUnit.has(u))
    .map((u) => ({ unit: u, cards: byUnit.get(u)! }));
  for (const u of byUnit.keys()) {
    if (!meta.units.includes(u)) ordered.push({ unit: u, cards: byUnit.get(u)! });
  }

  const result = ordered.length > 0 ? ordered : [{ unit: meta.units[0], cards }];
  SEGMENT_CACHE.set(day, result);
  return result;
}

export default function LearnSession({ day }: { day: number }) {
  const meta = DAY_MAP[day];
  const stage = stageOfDay(day);
  const content = getDayContent(day);
  const { completeDay } = useProgress();

  const cards = content?.cards ?? [];
  const quizzes = content?.quizzes ?? [];

  const segments = segmentsOfDay(day);

  const [phase, setPhase] = useState<Phase>("cards");
  const [segIdx, setSegIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [result, setResult] = useState<{ score: number; wrongIds: string[] } | null>(null);

  const segment = segments[Math.min(segIdx, segments.length - 1)];
  const segCards = segment?.cards ?? [];

  // 카드 단계 키보드 내비게이션 (데스크탑) — 현재 단원 안에서만 이동한다
  useEffect(() => {
    if (phase !== "cards") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setCardIdx((i) => Math.min(i + 1, segCards.length - 1));
      if (e.key === "ArrowLeft") setCardIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, segCards.length]);

  if (!content || cards.length === 0 || !segment) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-bold">이 일차의 콘텐츠가 아직 준비되지 않았어요.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 font-semibold text-white">
          홈으로
        </Link>
      </div>
    );
  }

  const unitMeta = UNIT_MAP[segment.unit];
  const cardEra = unitMeta ? eraOfUnit(segment.unit) : undefined;
  const unitStep = segIdx + 1;
  const isLastSegment = segIdx === segments.length - 1;
  const isLastCardOfSegment = cardIdx === segCards.length - 1;
  // 하루 전체 기준 진행도 (진행바·카드 번호 표시용)
  const cardsBefore = segments.slice(0, segIdx).reduce((sum, s) => sum + s.cards.length, 0);
  const globalCardNo = cardsBefore + cardIdx + 1;

  const goPrev = () => {
    if (cardIdx > 0) {
      setCardIdx((i) => i - 1);
      return;
    }
    // 단원 첫 카드에서 이전을 누르면 앞 단원의 마지막 카드로 돌아간다
    if (segIdx > 0) {
      const prev = segments[segIdx - 1];
      setSegIdx(segIdx - 1);
      setCardIdx(prev.cards.length - 1);
    }
  };

  const goNext = () => {
    if (!isLastCardOfSegment) {
      setCardIdx((i) => i + 1);
      return;
    }
    // 단원의 마지막 카드 → 마지막 단원이면 퀴즈로, 아니면 중간 지점으로
    setPhase(isLastSegment ? "quiz" : "unit-done");
  };

  return (
    <div className="mx-auto max-w-xl">
      {phase === "cards" && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            stageName={stage.name}
            stageColor={stage.color}
            current={globalCardNo}
            total={cards.length}
          />
          <p className="mb-1 text-center text-xs text-muted">
            예상 소요시간 약 {estimatedMinutes(day)}분 · 단원 단위로 끊어 학습할 수 있어요
          </p>
          {unitMeta && (
            <p className="mb-1 text-center text-xs font-semibold" style={{ color: cardEra?.color }}>
              {unitStep}/{segments.length}단원 · {unitMeta.title}
            </p>
          )}
          <p className="mb-2 text-center text-xs font-medium text-muted">
            이 단원 {cardIdx + 1} / {segCards.length} · 오늘 전체 {globalCardNo} / {cards.length}
          </p>

          <CardAudioPlayer
            cards={segCards}
            cardIdx={cardIdx}
            setCardIdx={setCardIdx}
            day={day}
            dayTitle={meta.title}
            className="mb-3"
          />

          <CardView card={segCards[cardIdx]} eraColor={cardEra?.color ?? stage.color} />
          <div className="mt-4 flex gap-2">
            <button
              onClick={goPrev}
              disabled={segIdx === 0 && cardIdx === 0}
              className="flex items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 py-3 font-semibold text-muted hover:bg-card-muted disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              이전
            </button>
            <button
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:opacity-90"
            >
              {isLastCardOfSegment
                ? isLastSegment
                  ? `퀴즈 풀기 (${quizzes.length}문항)`
                  : "이 단원 마치기"
                : "다음 카드"}
              {!isLastCardOfSegment && <ChevronRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </>
      )}

      {phase === "unit-done" && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            stageName={stage.name}
            stageColor={stage.color}
            current={cardsBefore + segCards.length}
            total={cards.length}
          />
          <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold" style={{ color: cardEra?.color }}>
              {unitStep}/{segments.length}단원 완료
            </p>
            <p className="mt-1 text-lg font-bold">{unitMeta?.title}</p>
            <p className="mt-3 text-sm text-muted">
              카드 {segCards.length}장을 봤어요. 오늘 남은 분량은{" "}
              {cards.length - (cardsBefore + segCards.length)}장이에요.
            </p>
            <p className="mt-1 text-xs text-muted">
              퀴즈는 오늘 단원을 모두 본 뒤에 풀어요.
            </p>

            <button
              onClick={() => {
                setSegIdx(segIdx + 1);
                setCardIdx(0);
                setPhase("cards");
              }}
              className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:opacity-90"
            >
              다음 단원 계속하기
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <Link
              href="/"
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 font-semibold text-muted hover:bg-card-muted"
            >
              오늘은 여기까지
            </Link>
          </div>
        </>
      )}

      {phase === "quiz" && (
        <>
          <SessionHeader
            day={day}
            title={meta.title}
            stageName={stage.name}
            stageColor={stage.color}
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
            stageName={stage.name}
            stageColor={stage.color}
            current={quizzes.length}
            total={quizzes.length}
          />
          <ResultView
            score={result.score}
            total={quizzes.length}
            wrongQuizzes={quizzes.filter((q) => result.wrongIds.includes(q.id))}
            nextReviewText={`내일 ${REVIEW_INTERVALS[0]}일차 복습이 홈 화면에 등록됩니다 (망각곡선 1·3·7·14일)`}
            retryHref={learnHref(day)}
          />
        </>
      )}
    </div>
  );
}
