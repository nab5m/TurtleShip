import type { SupabaseClient } from "@supabase/supabase-js";
import { DAYS } from "@/data/curriculum";
import type { DayProgress, DayRecord, ProgressState } from "./types";
import { EMPTY_PROGRESS } from "./types";

const LS_KEY = "kh-progress-v1";

// 저장된 원본(버전이 섞여 있을 수 있다)
interface StoredProgress {
  version?: number;
  completed?: Record<number, DayRecord>;
  dayProgress?: Record<number, DayProgress>; // 나중에 추가된 필드 — 옛 저장본에는 없다
  favoriteCards?: string[];
  favoriteQuizzes?: string[];
}

// ---------- 게스트: localStorage ----------

export function loadLocal(): ProgressState {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as StoredProgress;
    if (parsed.version === 1) return migrateV1(parsed); // 90일 커리큘럼 기록
    if (parsed.version !== 2) return EMPTY_PROGRESS;
    return {
      version: 2,
      completed: parsed.completed ?? {},
      // 단원 단위 중간 저장은 v2 도중에 추가되었다 → 없으면 '진행 중인 일차 없음'
      dayProgress: parsed.dayProgress ?? {},
      favoriteCards: parsed.favoriteCards ?? [],
      favoriteQuizzes: parsed.favoriteQuizzes ?? [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

// 90일 커리큘럼(v1) 기록 → 28일 커리큘럼(v2) 변환.
// v1 의 completed 키는 단원 번호(1~90)였다. 새 일차는 단원 2~4개를 묶으므로,
// 묶인 단원을 '모두' 학습했을 때만 그 일차를 완료로 본다(부분 학습은 다시 학습하게 둔다).
// 점수는 합산, 최초 학습일은 가장 늦은 날, 복습 단계는 가장 적게 복습한 단원 기준(보수적).
function migrateV1(old: StoredProgress): ProgressState {
  const unitRecords = old.completed ?? {};
  const completed: Record<number, DayRecord> = {};

  for (const d of DAYS) {
    const recs = d.units.map((u) => unitRecords[u]);
    if (recs.some((r) => !r)) continue; // 한 단원이라도 미완료면 그 일차는 미완료
    const done = recs as DayRecord[];
    const fewestReviews = done.reduce((a, b) =>
      a.reviewDates.length <= b.reviewDates.length ? a : b
    );
    completed[d.day] = {
      date: done.map((r) => r.date).sort().slice(-1)[0],
      score: done.reduce((s, r) => s + r.score, 0),
      total: done.reduce((s, r) => s + r.total, 0),
      wrongQuizIds: done.flatMap((r) => r.wrongQuizIds),
      reviewDates: fewestReviews.reviewDates,
    };
  }

  const migrated: ProgressState = {
    version: 2,
    completed,
    // v1 에는 단원 단위 진행 개념이 없었다 (부분 학습 일차는 처음부터 다시 학습)
    dayProgress: {},
    favoriteCards: old.favoriteCards ?? [],
    favoriteQuizzes: old.favoriteQuizzes ?? [],
  };
  saveLocal(migrated);
  return migrated;
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

interface DayProgressRow {
  day: number;
  studied_units: number[];
  updated_at: string;
}

interface FavoriteRow {
  item_id: string;
  item_type: "card" | "quiz";
}

export async function loadRemote(
  sb: SupabaseClient,
  userId: string
): Promise<ProgressState> {
  const [progressRes, favRes, dayProgressRes] = await Promise.all([
    sb.from("progress").select("day, date, score, total, wrong_quiz_ids, review_dates").eq("user_id", userId),
    sb.from("favorites").select("item_id, item_type").eq("user_id", userId),
    sb.from("day_progress").select("day, studied_units, updated_at").eq("user_id", userId),
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

  // day_progress 는 나중에 추가된 테이블이다. 마이그레이션 적용 전이라도 완료 기록·즐겨찾기
  // 로드는 계속되어야 하므로, 이 조회 실패는 경고만 남기고 '중간 저장 없음'으로 처리한다.
  const dayProgress: Record<number, DayProgress> = {};
  if (dayProgressRes.error) {
    console.warn(
      "단원 진행(day_progress) 로드 실패 — 마이그레이션 적용 여부를 확인하세요:",
      dayProgressRes.error.message
    );
  } else {
    for (const row of (dayProgressRes.data ?? []) as DayProgressRow[]) {
      dayProgress[row.day] = {
        studiedUnits: row.studied_units ?? [],
        updatedAt: row.updated_at,
      };
    }
  }

  const favs = (favRes.data ?? []) as FavoriteRow[];
  return {
    version: 2,
    completed,
    dayProgress,
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

// 단원 단위 중간 저장 (진행 중인 일차) — 완료 기록과 별도 테이블
export async function upsertRemoteDayProgress(
  sb: SupabaseClient,
  userId: string,
  day: number,
  rec: DayProgress
): Promise<void> {
  const { error } = await sb.from("day_progress").upsert({
    user_id: userId,
    day,
    studied_units: rec.studiedUnits,
    updated_at: rec.updatedAt,
  });
  if (error) throw error;
}

// 일차를 완료하면 중간 저장은 완료 기록으로 대체된다 → 남기지 않는다
export async function deleteRemoteDayProgress(
  sb: SupabaseClient,
  userId: string,
  day: number
): Promise<void> {
  const { error } = await sb
    .from("day_progress")
    .delete()
    .eq("user_id", userId)
    .eq("day", day);
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
  // 진행 중(단원 단위) 기록도 함께 올린다 — 서버에 이미 완료·진행 기록이 있으면 서버 우선
  for (const [dayStr, rec] of Object.entries(local.dayProgress ?? {})) {
    const day = Number(dayStr);
    if (remote.completed[day] || remote.dayProgress?.[day]) continue;
    if (rec.studiedUnits.length === 0) continue;
    uploads.push(upsertRemoteDayProgress(sb, userId, day, rec));
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
