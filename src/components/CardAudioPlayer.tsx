"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { StudyCard } from "@/lib/types";
import { AUDIO_CARD_IDS } from "@/data/audio-manifest";

// 카드 낭독 자동재생 + 자동 카드 넘김 (학습·복습 세션 공용).
//
// iOS(PWA) 백그라운드/잠금화면 연속재생을 위해 '명령형'으로 구현한다:
//  - setTimeout 지연 없음 (iOS 백그라운드에서 타이머가 멈춰 다음 카드로 못 넘어가는 원인)
//  - 다음 카드 파일을 미리 로드(preload)
//  - 낭독 종료(ended) 이벤트 핸들러 안에서 '동기적으로' 즉시 다음 파일을 재생
//    (React 이펙트에 의존하면 백그라운드에서 지연/중단됨)
// 개별 카드 파일을 그대로 쓰므로 카드 경계가 깨끗하다(탐색 오차·새로고침 문제 없음).

const AUDIO_SRC = (id: string) => `/audio/cards/${id}.mp3`;

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
  const preloadRef = useRef<HTMLAudioElement | null>(null); // 다음 카드 미리 로드
  const [autoplaying, setAutoplaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 이벤트 핸들러(백그라운드에서 동기 실행)에서 최신 값을 읽기 위한 refs
  const autoplayingRef = useRef(false);
  const cardIdxRef = useRef(cardIdx);
  const lastPlayedRef = useRef(-1); // 현재 오디오가 재생 중인 카드 인덱스
  useEffect(() => {
    autoplayingRef.current = autoplaying;
  }, [autoplaying]);
  useEffect(() => {
    cardIdxRef.current = cardIdx;
  }, [cardIdx]);

  const audioAvailable =
    cards.length > 0 && cards.every((c) => AUDIO_CARD_IDS.has(c.id));
  const currentCard = cards[cardIdx];

  function preloadNext(idx: number) {
    const el = preloadRef.current;
    if (!el || idx + 1 >= cards.length) return;
    el.src = AUDIO_SRC(cards[idx + 1].id);
    try {
      el.load();
    } catch {
      // 무시
    }
  }

  // 특정 카드를 처음부터 재생 (미리 로드된 캐시 재사용)
  function playFrom(idx: number) {
    const el = audioRef.current;
    if (!el || !cards[idx]) return;
    el.src = AUDIO_SRC(cards[idx].id);
    el.currentTime = 0;
    lastPlayedRef.current = idx;
    el.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setAutoplaying(false);
        setIsPlaying(false);
      });
    preloadNext(idx);
  }

  // 낭독 종료 → 지연 없이 '동기적으로' 다음 카드 재생 (iOS 백그라운드에서도 이어지도록)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    function onEnded() {
      if (!autoplayingRef.current) {
        setIsPlaying(false);
        return;
      }
      const nxt = cardIdxRef.current + 1;
      if (nxt < cards.length) {
        // 핸들러 안에서 즉시 src 교체 + play (프리로드로 캐시되어 있어 바로 재생)
        const a = audioRef.current;
        if (a) {
          a.src = AUDIO_SRC(cards[nxt].id);
          a.currentTime = 0;
          a.play().catch(() => {});
        }
        lastPlayedRef.current = nxt;
        cardIdxRef.current = nxt;
        setCardIdx(nxt); // 시각 갱신 (포그라운드에서 반영)
        preloadNext(nxt);
      } else {
        setAutoplaying(false);
        setIsPlaying(false);
      }
    }
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [cards, setCardIdx]);

  // 자동재생 on/off + 수동 카드 이동 반영
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!autoplaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }
    if (cardIdx !== lastPlayedRef.current) {
      // 시작 또는 사용자의 수동 이동 → 그 카드부터 재생
      // (ended 로 인한 자동 advance 는 lastPlayedRef 를 이미 갱신하므로 여기서 재생 안 함)
      playFrom(cardIdx);
    } else {
      // 같은 카드에서 재개 → 이어재생
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplaying, cardIdx]);

  // 카드 단계 이탈(언마운트) 시 정지
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
  }, [audioAvailable, currentCard, day, dayTitle, cards.length, isPlaying, setCardIdx]);

  if (!audioAvailable) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <audio ref={audioRef} preload="auto" />
      <audio ref={preloadRef} preload="auto" className="hidden" aria-hidden />
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
