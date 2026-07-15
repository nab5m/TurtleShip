"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DayRecord, DueReview, ProgressState } from "./types";
import {
  EMPTY_PROGRESS,
  REVIEW_INTERVALS,
  dueReviews,
  studyStreak,
  todayStr,
} from "./types";
import { isAuthAvailable, supabaseBrowser } from "./supabase/client";
import {
  alreadyMerged,
  loadLocal,
  loadRemote,
  markMerged,
  mergeLocalToRemote,
  saveLocal,
  setRemoteFavorite,
  upsertRemoteDay,
} from "./progress-store";

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

interface ProgressContextValue {
  ready: boolean; // 초기 로드 완료 여부
  progress: ProgressState;
  user: AppUser | null;
  authAvailable: boolean; // Supabase 환경변수 설정 여부
  due: DueReview[]; // 오늘의 복습 목록
  streak: number;
  completeDay: (day: number, score: number, total: number, wrongQuizIds: string[]) => void;
  completeReview: (day: number, wrongQuizIds: string[]) => void;
  toggleFavorite: (type: "card" | "quiz", id: string) => void;
  isFavorite: (type: "card" | "quiz", id: string) => boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [user, setUser] = useState<AppUser | null>(null);
  const userRef = useRef<AppUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 초기 로드 + 인증 상태 구독
  useEffect(() => {
    const sb = supabaseBrowser();
    let cancelled = false;

    async function initForUser(u: AppUser) {
      if (!sb) return;
      try {
        let remote = await loadRemote(sb, u.id);
        // 게스트 시절 기록을 1회 병합
        if (!alreadyMerged(u.id)) {
          const local = loadLocal();
          await mergeLocalToRemote(sb, u.id, local, remote);
          markMerged(u.id);
          remote = await loadRemote(sb, u.id);
        }
        if (!cancelled) setProgress(remote);
      } catch (e) {
        console.error("Supabase 동기화 실패, 로컬 데이터로 동작합니다:", e);
        if (!cancelled) setProgress(loadLocal());
      }
    }

    async function init() {
      await Promise.resolve(); // 효과 본문 동기 setState 방지 (외부 저장소 로드)
      if (cancelled) return;
      if (!sb) {
        setProgress(loadLocal());
        setReady(true);
        return;
      }
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      const session = data.session;
      if (session?.user) {
        const u = toAppUser(session.user);
        setUser(u);
        await initForUser(u);
      } else {
        setProgress(loadLocal());
      }
      if (!cancelled) setReady(true);
    }
    void init();

    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        const u = toAppUser(session.user);
        if (userRef.current?.id === u.id) return; // 토큰 갱신 등은 무시
        setUser(u);
        await initForUser(u);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProgress(loadLocal());
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 상태 변경 반영: 게스트는 localStorage, 회원은 Supabase
  const applyDayRecord = useCallback(
    (day: number, rec: DayRecord) => {
      setProgress((prev) => {
        const next = { ...prev, completed: { ...prev.completed, [day]: rec } };
        if (!userRef.current) saveLocal(next);
        return next;
      });
      const u = userRef.current;
      const sb = supabaseBrowser();
      if (u && sb) {
        upsertRemoteDay(sb, u.id, day, rec).catch((e) =>
          console.error("학습 기록 저장 실패:", e)
        );
      }
    },
    []
  );

  const completeDay = useCallback(
    (day: number, score: number, total: number, wrongQuizIds: string[]) => {
      const prev = progress.completed[day];
      // 재학습 시 최초 완료일·복습 기록은 유지하고 점수/오답만 갱신
      const rec: DayRecord = prev
        ? { ...prev, score, total, wrongQuizIds }
        : { date: todayStr(), score, total, wrongQuizIds, reviewDates: [] };
      applyDayRecord(day, rec);
    },
    [progress.completed, applyDayRecord]
  );

  const completeReview = useCallback(
    (day: number, wrongQuizIds: string[]) => {
      const prev = progress.completed[day];
      if (!prev) return;
      if (prev.reviewDates.length >= REVIEW_INTERVALS.length) return;
      const today = todayStr();
      // 같은 날 중복 복습은 단계로 인정하지 않음
      if (prev.reviewDates[prev.reviewDates.length - 1] === today || prev.date === today) {
        applyDayRecord(day, { ...prev, wrongQuizIds });
        return;
      }
      applyDayRecord(day, {
        ...prev,
        wrongQuizIds,
        reviewDates: [...prev.reviewDates, today],
      });
    },
    [progress.completed, applyDayRecord]
  );

  const toggleFavorite = useCallback((type: "card" | "quiz", id: string) => {
    let turnedOn = false;
    setProgress((prev) => {
      const key = type === "card" ? "favoriteCards" : "favoriteQuizzes";
      const list = prev[key];
      turnedOn = !list.includes(id);
      const next = {
        ...prev,
        [key]: turnedOn ? [...list, id] : list.filter((x) => x !== id),
      };
      if (!userRef.current) saveLocal(next);
      return next;
    });
    const u = userRef.current;
    const sb = supabaseBrowser();
    if (u && sb) {
      setRemoteFavorite(sb, u.id, id, type, turnedOn).catch((e) =>
        console.error("즐겨찾기 저장 실패:", e)
      );
    }
  }, []);

  const isFavorite = useCallback(
    (type: "card" | "quiz", id: string) =>
      (type === "card" ? progress.favoriteCards : progress.favoriteQuizzes).includes(id),
    [progress.favoriteCards, progress.favoriteQuizzes]
  );

  const signInWithGoogle = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signOut = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    await sb.auth.signOut();
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ready,
      progress,
      user,
      authAvailable: isAuthAvailable(),
      due: dueReviews(progress),
      streak: studyStreak(progress),
      completeDay,
      completeReview,
      toggleFavorite,
      isFavorite,
      signInWithGoogle,
      signOut,
    }),
    [ready, progress, user, completeDay, completeReview, toggleFavorite, isFavorite, signInWithGoogle, signOut]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress는 ProgressProvider 안에서만 사용할 수 있습니다");
  return ctx;
}

interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
}

function toAppUser(u: SupabaseAuthUser): AppUser {
  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name ?? u.user_metadata?.name,
    avatarUrl: u.user_metadata?.avatar_url,
  };
}
