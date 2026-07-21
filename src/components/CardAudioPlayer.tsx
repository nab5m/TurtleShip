"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { StudyCard } from "@/lib/types";
import { AUDIO_CARD_IDS } from "@/data/audio-manifest";

// 카드 낭독 자동재생 + 자동 카드 넘김 (학습·복습 세션 공용).
// 사전 생성된 mp3(/audio/cards/<id>.mp3)를 재생하고, 끝나면 다음 카드로 넘어간다.
// 마지막 카드에서 종료(퀴즈로 자동 진입하지 않음). 잠금화면/백그라운드 재생(MediaSession) 지원.
// 카드 단계에서만 마운트하면 단계 이탈 시 언마운트되어 자동 정지된다.

const AUTO_ADVANCE_DELAY = 800; // 낭독 후 다음 카드로 넘어가기 전 쉼(ms)

interface Props {
  cards: StudyCard[];
  cardIdx: number;
  setCardIdx: Dispatch<SetStateAction<number>>;
  day: number;
  dayTitle: string;
  className?: string;
}

export default function CardAudioPlayer({
  cards,
  cardIdx,
  setCardIdx,
  day,
  dayTitle,
  className = "",
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoplaying, setAutoplaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioAvailable =
    cards.length > 0 && cards.every((c) => AUDIO_CARD_IDS.has(c.id));
  const currentCard = cards[cardIdx];
  const audioSrc =
    audioAvailable && currentCard ? `/audio/cards/${currentCard.id}.mp3` : undefined;

  // 자동재생 중 카드가 바뀌면 그 카드 오디오를 처음부터 재생 / 끄면 정지
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioSrc) return;
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
  }, [autoplaying, cardIdx, audioSrc]);

  // 낭독이 끝나면 다음 카드로 자동 넘김 (마지막 카드면 자동재생 종료)
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
  }, [autoplaying, cardIdx, cards.length, setCardIdx]);

  // 언마운트(카드 단계 이탈) 시 정지
  useEffect(() => {
    const el = audioRef.current;
    return () => el?.pause();
  }, []);

  // 잠금화면·백그라운드 재생 컨트롤 (MediaSession)
  useEffect(() => {
    if (!audioAvailable || !currentCard) return;
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: currentCard.title,
      artist: `${day}일차 · ${dayTitle}`,
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
  }, [audioAvailable, cardIdx, currentCard, day, dayTitle, cards.length, isPlaying, setCardIdx]);

  if (!audioAvailable) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <audio ref={audioRef} preload="none" />
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
