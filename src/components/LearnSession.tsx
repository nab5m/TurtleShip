"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDayContent } from "@/data/content";
import { DAY_MAP, ERA_MAP } from "@/data/curriculum";
import { REVIEW_INTERVALS } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { learnHref } from "@/lib/day-slug";
import { AUDIO_CARD_IDS } from "@/data/audio-manifest";
import CardView from "./CardView";
import QuizRunner from "./QuizRunner";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { ResultView, SessionHeader } from "./SessionUI";

type Phase = "cards" | "quiz" | "result";

// 낭독 후 다음 카드로 넘어가기 전 쉼 (ms)
const AUTO_ADVANCE_DELAY = 800;

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

  // ---------- 선생님 음성 자동재생 (사전 생성 오디오) ----------
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoplaying, setAutoplaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 해당 일차의 모든 카드에 오디오가 있을 때만 자동재생 UI 노출
  const audioAvailable = cards.length > 0 && cards.every((c) => AUDIO_CARD_IDS.has(c.id));
  const currentCard = cards[cardIdx];
  const audioSrc =
    audioAvailable && currentCard ? `/audio/cards/${currentCard.id}.mp3` : undefined;

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

  // 자동재생 중 카드가 바뀌면 그 카드 오디오를 처음부터 재생 / 끄면 정지
  useEffect(() => {
    const el = audioRef.current;
    if (!el || phase !== "cards" || !audioSrc) return;
    if (autoplaying) {
      el.src = audioSrc;
      el.currentTime = 0;
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setAutoplaying(false);
          setIsPlaying(false);
        });
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [autoplaying, cardIdx, phase, audioSrc]);

  // 낭독이 끝나면 다음 카드로 자동 넘김 (마지막 카드면 자동재생 종료 — 퀴즈로 자동 진입하지 않음)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    function onEnded() {
      setIsPlaying(false);
      if (!autoplaying) return;
      if (cardIdx < cards.length - 1) {
        advanceTimer.current = setTimeout(
          () => setCardIdx((i) => Math.min(i + 1, cards.length - 1)),
          AUTO_ADVANCE_DELAY
        );
      } else {
        setAutoplaying(false);
      }
    }
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("ended", onEnded);
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }
    };
  }, [autoplaying, cardIdx, cards.length]);

  // 카드 단계를 벗어나면(퀴즈·결과) 오디오 정지
  useEffect(() => {
    if (phase !== "cards") {
      audioRef.current?.pause();
      setAutoplaying(false);
      setIsPlaying(false);
    }
  }, [phase]);

  // 잠금화면·백그라운드 재생 컨트롤 (MediaSession)
  useEffect(() => {
    if (!audioAvailable || phase !== "cards" || !currentCard) return;
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: currentCard.title,
      artist: `${day}일차 · ${meta.title}`,
      album: "거북선 · 한국사 학습",
      artwork: [{ src: "/og.png", sizes: "1200x630", type: "image/png" }],
    });
    ms.playbackState = isPlaying ? "playing" : "paused";
    ms.setActionHandler("play", () => setAutoplaying(true));
    ms.setActionHandler("pause", () => setAutoplaying(false));
    ms.setActionHandler("nexttrack", () =>
      setCardIdx((i) => Math.min(i + 1, cards.length - 1))
    );
    ms.setActionHandler("previoustrack", () => setCardIdx((i) => Math.max(i - 1, 0)));
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("nexttrack", null);
      ms.setActionHandler("previoustrack", null);
    };
  }, [audioAvailable, phase, cardIdx, currentCard, day, meta.title, cards.length, isPlaying]);

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
      {/* 사전 생성된 낭독 오디오 (숨김) */}
      <audio ref={audioRef} preload="none" />

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

          {audioAvailable && (
            <div className="mb-3 flex justify-center">
              <button
                onClick={() => setAutoplaying((v) => !v)}
                aria-pressed={autoplaying}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  autoplaying
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-card text-foreground hover:bg-card-muted"
                }`}
              >
                {autoplaying ? (
                  <>
                    <PauseIcon />
                    {isPlaying ? "일시정지" : "재생 준비 중…"}
                  </>
                ) : (
                  <>
                    <PlayIcon />
                    선생님 음성 자동재생
                  </>
                )}
              </button>
            </div>
          )}

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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
