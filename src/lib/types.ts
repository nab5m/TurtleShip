// 시대 구분 (시대 흐름 순서)
export type EraId =
  | "paleolithic" // 구석기
  | "neolithic" // 신석기
  | "bronze" // 청동기
  | "iron" // 철기
  | "gojoseon" // 고조선
  | "confederacy" // 연맹왕국
  | "three-kingdoms" // 삼국시대
  | "north-south" // 남북국시대
  | "later-three" // 후삼국시대
  | "goryeo" // 고려
  | "early-joseon" // 조선전기
  | "late-joseon" // 조선후기
  | "open-port" // 개항기
  | "colonial" // 일제강점기
  | "modern"; // 현대

export interface Era {
  id: EraId;
  name: string;
  period: string; // 표시용 연대 (예: "918 ~ 1392")
  color: string; // 시대 구분 색상 (hex)
  dayRange: [number, number]; // 이 시대에 배정된 학습일 범위 (1-90)
}

// 90일 커리큘럼의 하루치 메타 정보
export interface DayMeta {
  day: number; // 1 ~ 90
  eraId: EraId;
  title: string; // 예: "광개토대왕과 장수왕"
  topics: string[]; // 그날 다루는 핵심 주제/키워드 요약
}

// 카드/퀴즈에 첨부되는 이미지 (유물·문화재 등 시각자료가 중요한 경우)
export interface ItemImage {
  src: string; // 이미지 URL (Wikimedia Commons 썸네일)
  alt: string; // 대체 텍스트 (유물/자료 이름)
  width: number;
  height: number;
  credit?: string; // 출처 표기
}

// 학습 카드: 짧은 키워드 중심 지식 카드
export interface StudyCard {
  id: string; // "d09-c01" 형식 (day 9의 1번 카드)
  title: string; // 카드 키워드/주제 (예: "호우명 그릇")
  keywords: string[]; // 연관 키워드 태그
  content: string; // 2~3문장의 짧은 설명 (심화 시험 수준)
  imageSearch?: string; // Wikimedia Commons 이미지 검색어 (빌드 시 resolve)
  image?: ItemImage; // resolve된 이미지
}

// 4지선다 퀴즈
export interface Quiz {
  id: string; // "d09-q01" 형식
  question: string;
  options: string[]; // 항상 4개
  answer: number; // 정답 인덱스 (0-3)
  explanation: string; // 해설
  imageSearch?: string; // 문제에 제시할 자료 사진 검색어
  image?: ItemImage;
}

// 하루치 학습 콘텐츠
export interface DayContent {
  day: number;
  cards: StudyCard[];
  quizzes: Quiz[];
}

// ---------- 학습 상태 (게스트: localStorage / 회원: Supabase) ----------

// 망각곡선 복습 시점 (최초 학습일 기준 누적 일수) — 표시용
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
// 직전 학습/복습 이벤트 기준 간격 (누적 1,3,7,14,30일과 동일한 스케줄)
// 복습이 밀렸을 때 다음 단계가 연쇄로 즉시 도래하는 것을 막기 위해 직전 이벤트 기준으로 계산한다
const REVIEW_GAPS = [1, 2, 4, 7, 16] as const;

export interface DayRecord {
  date: string; // 최초 학습 완료일 "YYYY-MM-DD"
  score: number; // 퀴즈 정답 수
  total: number; // 퀴즈 문항 수
  wrongQuizIds: string[]; // 최근 학습/복습에서 틀린 퀴즈 id
  reviewDates: string[]; // 완료한 복습 날짜 (단계 순서대로, 최대 5회)
}

export interface ProgressState {
  version: 1;
  completed: Record<number, DayRecord>; // day 번호 -> 완료 기록
  favoriteCards: string[]; // 즐겨찾기한 카드 id
  favoriteQuizzes: string[]; // 즐겨찾기한 퀴즈 id
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  completed: {},
  favoriteCards: [],
  favoriteQuizzes: [],
};

// 오늘 복습해야 하는 항목
export interface DueReview {
  day: number;
  stage: number; // 0부터 시작하는 복습 단계 인덱스
  intervalLabel: string; // "1일차 복습" 등
  overdueDays: number; // 예정일 대비 며칠 지났는지
}

// 카드/퀴즈 id에서 day 번호 추출 ("d09-c01" -> 9)
export function dayFromItemId(id: string): number {
  const m = /^d(\d+)-/.exec(id);
  return m ? parseInt(m[1], 10) : 0;
}

// 오늘 날짜 "YYYY-MM-DD" — 한국 표준시(KST) 고정.
// 서버(UTC 등)와 클라이언트 렌더가 항상 같은 '오늘'을 쓰도록 타임존을 못박아
// SSR 하이드레이션 불일치를 막고, 한국 시험 앱 특성상 기준일도 KST 가 맞다.
export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00`);
  const to = new Date(`${toYmd}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

// 완료 기록을 바탕으로 오늘 복습할 목록 계산 (망각곡선 간격)
export function dueReviews(progress: ProgressState, today = todayStr()): DueReview[] {
  const due: DueReview[] = [];
  for (const [dayStr, rec] of Object.entries(progress.completed)) {
    const day = Number(dayStr);
    const stage = rec.reviewDates.length;
    if (stage >= REVIEW_GAPS.length) continue; // 모든 복습 완료
    const lastEvent = stage === 0 ? rec.date : rec.reviewDates[stage - 1];
    const elapsed = daysBetween(lastEvent, today);
    if (elapsed >= REVIEW_GAPS[stage]) {
      due.push({
        day,
        stage,
        intervalLabel: `${REVIEW_INTERVALS[stage]}일차 복습`,
        overdueDays: elapsed - REVIEW_GAPS[stage],
      });
    }
  }
  // 많이 밀린 복습부터
  return due.sort((a, b) => b.overdueDays - a.overdueDays);
}

// 연속 학습 일수 (학습·복습 활동일 기준, 오늘 또는 어제까지 이어진 streak)
export function studyStreak(progress: ProgressState, today = todayStr()): number {
  const dates = new Set<string>();
  for (const rec of Object.values(progress.completed)) {
    dates.add(rec.date);
    rec.reviewDates.forEach((d) => dates.add(d));
  }
  if (dates.size === 0) return 0;
  let streak = 0;
  // 오늘 활동이 없으면 어제부터 세기 시작 (오늘 아직 안 했어도 streak 유지 표시)
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function addDays(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
