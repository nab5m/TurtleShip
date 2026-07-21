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

  // 초기 로드 + 인증 상태 구독.
  // onAuthStateChange 를 단일 진입점으로 사용한다. @supabase/ssr 는 로드 시
  // INITIAL_SESSION 이벤트로 복원된 세션을 전달하므로 getSession 을 따로 호출하지 않는다
  // (두 경로가 동시에 로드하며 생기던 레이스 제거).
  // ⚠️ 콜백 안에서 supabase async 호출(DB/auth)을 직접 await 하면 auth 잠금과 맞물려
  //    간헐적 데드락이 생길 수 있다 → 무거운 로드는 setTimeout 으로 콜백 밖에서 실행.
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setProgress(loadLocal());
      setReady(true);
      return;
    }

    let cancelled = false;
    // 어떤 사용자의 원격 데이터를 이미 로드했는지 동기적으로 추적 (userRef 는 갱신이 지연되어 부적합)
    let loadedUserId: string | null = null;

    async function loadForUser(u: AppUser, attempt = 0): Promise<void> {
      try {
        let remote = await loadRemote(sb!, u.id);
        // 게스트 시절 기록을 최초 1회 병합
        if (!alreadyMerged(u.id)) {
          await mergeLocalToRemote(sb!, u.id, loadLocal(), remote);
          markMerged(u.id);
          remote = await loadRemote(sb!, u.id);
        }
        if (!cancelled) setProgress(remote);
      } catch (e) {
        console.error("Supabase 동기화 실패:", e);
        // 네트워크 순단 등 일시적 오류는 1회 재시도 (조용히 빈 화면으로 남지 않도록)
        if (attempt < 1 && !cancelled) {
          await new Promise((r) => setTimeout(r, 1500));
          if (!cancelled) {
            await loadForUser(u, attempt + 1);
            return;
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      // 로그아웃 / 세션 없음(비로그인 초기 로드) → 게스트 데이터
      if (event === "SIGNED_OUT" || !session?.user) {
        loadedUserId = null;
        setUser(null);
        setProgress(loadLocal());
        setReady(true);
        return;
      }
      // 세션 있음 (INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED 등)
      const u = toAppUser(session.user);
      setUser(u);
      if (loadedUserId === u.id) {
        setReady(true); // 토큰 갱신 등 — 이미 로드함
        return;
      }
      loadedUserId = u.id;
      setTimeout(() => {
        if (!cancelled) void loadForUser(u);
      }, 0);
    });

    // 안전장치: 인증 이벤트가 오지 않는 예외 상황에서도 스켈레톤이 무한 지속되지 않게
    const safety = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(safety);
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
