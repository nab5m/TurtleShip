import type { SupabaseClient } from "@supabase/supabase-js";
import type { DayRecord, ProgressState } from "./types";
import { EMPTY_PROGRESS } from "./types";

const LS_KEY = "kh-progress-v1";

// ---------- 게스트: localStorage ----------

export function loadLocal(): ProgressState {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1) return EMPTY_PROGRESS;
    return {
      version: 1,
      completed: parsed.completed ?? {},
      favoriteCards: parsed.favoriteCards ?? [],
      favoriteQuizzes: parsed.favoriteQuizzes ?? [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveLocal(p: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    // 저장 공간 부족 등은 무시 (다음 저장에서 재시도)
  }
}

// ---------- 회원: Supabase ----------

interface ProgressRow {
  day: number;
  date: string;
  score: number;
  total: number;
  wrong_quiz_ids: string[];
  review_dates: string[];
}

interface FavoriteRow {
  item_id: string;
  item_type: "card" | "quiz";
}

export async function loadRemote(
  sb: SupabaseClient,
  userId: string
): Promise<ProgressState> {
  const [progressRes, favRes] = await Promise.all([
    sb.from("progress").select("day, date, score, total, wrong_quiz_ids, review_dates").eq("user_id", userId),
    sb.from("favorites").select("item_id, item_type").eq("user_id", userId),
  ]);
  if (progressRes.error) throw progressRes.error;
  if (favRes.error) throw favRes.error;

  const completed: Record<number, DayRecord> = {};
  for (const row of (progressRes.data ?? []) as ProgressRow[]) {
    completed[row.day] = {
      date: row.date,
      score: row.score,
      total: row.total,
      wrongQuizIds: row.wrong_quiz_ids ?? [],
      reviewDates: row.review_dates ?? [],
    };
  }
  const favs = (favRes.data ?? []) as FavoriteRow[];
  return {
    version: 1,
    completed,
    favoriteCards: favs.filter((f) => f.item_type === "card").map((f) => f.item_id),
    favoriteQuizzes: favs.filter((f) => f.item_type === "quiz").map((f) => f.item_id),
  };
}

export async function upsertRemoteDay(
  sb: SupabaseClient,
  userId: string,
  day: number,
  rec: DayRecord
): Promise<void> {
  const { error } = await sb.from("progress").upsert({
    user_id: userId,
    day,
    date: rec.date,
    score: rec.score,
    total: rec.total,
    wrong_quiz_ids: rec.wrongQuizIds,
    review_dates: rec.reviewDates,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function setRemoteFavorite(
  sb: SupabaseClient,
  userId: string,
  itemId: string,
  itemType: "card" | "quiz",
  on: boolean
): Promise<void> {
  if (on) {
    const { error } = await sb
      .from("favorites")
      .upsert({ user_id: userId, item_id: itemId, item_type: itemType });
    if (error) throw error;
  } else {
    const { error } = await sb
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId);
    if (error) throw error;
  }
}

// ---------- 로그인 시 게스트 기록 병합 ----------

const mergedFlagKey = (userId: string) => `kh-merged-${userId}`;

export function alreadyMerged(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(mergedFlagKey(userId)) === "1";
}

export function markMerged(userId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(mergedFlagKey(userId), "1");
}

// 게스트(localStorage) 기록 중 서버에 없는 것만 업로드 (서버 기록 우선)
export async function mergeLocalToRemote(
  sb: SupabaseClient,
  userId: string,
  local: ProgressState,
  remote: ProgressState
): Promise<void> {
  const uploads: Promise<void>[] = [];
  for (const [dayStr, rec] of Object.entries(local.completed)) {
    const day = Number(dayStr);
    if (!remote.completed[day]) {
      uploads.push(upsertRemoteDay(sb, userId, day, rec));
    }
  }
  const remoteCardSet = new Set(remote.favoriteCards);
  const remoteQuizSet = new Set(remote.favoriteQuizzes);
  for (const id of local.favoriteCards) {
    if (!remoteCardSet.has(id)) uploads.push(setRemoteFavorite(sb, userId, id, "card", true));
  }
  for (const id of local.favoriteQuizzes) {
    if (!remoteQuizSet.has(id)) uploads.push(setRemoteFavorite(sb, userId, id, "quiz", true));
  }
  await Promise.all(uploads);
}
