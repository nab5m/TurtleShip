// 시대 구분 (시대 흐름 순서)
export type EraId =
  | "prehistory" // 선사 (구석기·신석기·청동기·철기 — 2026-07-31 통합)
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
  unitRange: [number, number]; // 이 시대에 배정된 단원 범위 (1-90)
}

// 커리큘럼 단계 — 시대를 묶은 그룹. 하루가 여러 시대를 걸치므로(2일차 = 고조선~연맹왕국)
// 커리큘럼/홈 화면의 그룹 단위는 시대가 아니라 이 단계다.
export type StageId =
  | "prehistory"
  | "gojoseon-confederacy"
  | "three-kingdoms"
  | "north-south"
  | "goryeo"
  | "early-joseon"
  | "late-joseon"
  | "open-port"
  | "colonial"
  | "modern";

export interface Stage {
  id: StageId;
  name: string; // 예: "후삼국과 고려"
  period: string;
  color: string;
  eraIds: EraId[]; // 이 단계가 다루는 시대
  dayRange: [number, number]; // 이 단계에 배정된 학습일 범위 (1-28)
}

// 학습 단원 — 콘텐츠(카드/퀴즈)의 최소 단위. 카드 id 의 dNN 이 이 번호다.
export interface UnitMeta {
  unit: number; // 1 · 5 · 7 ~ 90 (연속 아님 — 옛 단원 2~4 는 1 로, 옛 단원 6 은 5 로 통합됨)
  eraId: EraId;
  title: string; // 예: "광개토대왕과 장수왕"
  topics: string[]; // 그 단원이 다루는 핵심 주제/키워드 요약
}

// 28일 커리큘럼의 하루치 메타 정보 — 단원 2~4개를 묶은 것
export interface DayMeta {
  day: number; // 1 ~ 28
  stageId: StageId;
  title: string; // 예: "고구려의 성장과 백제의 건국"
  units: number[]; // 그날 학습하는 단원 번호 (순서 유지)
  unitTitles: string[]; // units 의 제목 (표시용)
  topics: string[]; // units 의 topics 전체 (메타데이터·키워드용)
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

// 단원 하나의 학습 콘텐츠 (src/data/content/days-*.ts 의 원본 단위)
export interface UnitContent {
  unit: number;
  cards: StudyCard[];
  quizzes: Quiz[];
}

// 하루치 학습 콘텐츠 — 그날 묶인 단원들의 카드/퀴즈를 순서대로 이어 붙인 것
export interface DayContent {
  day: number;
  cards: StudyCard[];
  quizzes: Quiz[];
}

// ---------- 학습 상태 (게스트: localStorage / 회원: Supabase) ----------

// 망각곡선 복습 시점 (최초 학습일 기준 누적 일수) — 표시용
// 커리큘럼이 28일이므로 마지막 30일차 복습은 커리큘럼을 벗어나 등록되지 않는다 → 14일차까지만 둔다
export const REVIEW_INTERVALS = [1, 3, 7, 14] as const;
// 직전 학습/복습 이벤트 기준 간격 (누적 1,3,7,14일과 동일한 스케줄)
// 복습이 밀렸을 때 다음 단계가 연쇄로 즉시 도래하는 것을 막기 위해 직전 이벤트 기준으로 계산한다
const REVIEW_GAPS = [1, 2, 4, 7] as const;

export interface DayRecord {
  date: string; // 최초 학습 완료일 "YYYY-MM-DD"
  score: number; // 퀴즈 정답 수
  total: number; // 퀴즈 문항 수
  wrongQuizIds: string[]; // 최근 학습/복습에서 틀린 퀴즈 id
  reviewDates: string[]; // 완료한 복습 날짜 (단계 순서대로, 최대 4회)
}

// 하루치 학습의 '중간 저장' — 그 일차에서 카드를 끝까지 본 단원 목록.
// DayRecord(완료 기록)와 분리한 이유:
//  - DayRecord 는 퀴즈까지 마친 완료 상태이며 복습 스케줄(망각곡선)의 기준이 된다.
//  - 단원 진행은 완료 전의 '부분' 상태라 수명·의미가 달라서, 완료(completeDay) 시점에 지워진다.
// 옛 저장본에는 이 필드가 아예 없으므로 읽을 때는 항상 studiedUnitsOfDay() 로 폴백한다.
export interface DayProgress {
  studiedUnits: number[]; // 카드를 모두 본 단원 번호 (오름차순·중복 없음)
  updatedAt: string; // 마지막 갱신 시각 (ISO 8601)
}

// version 2 = 28일 커리큘럼 기준 (1 은 90일 커리큘럼 = 단원 번호 기준, progress-store 에서 변환)
export interface ProgressState {
  version: 2;
  completed: Record<number, DayRecord>; // day 번호(1~28) -> 완료 기록
  dayProgress: Record<number, DayProgress>; // day 번호 -> 진행 중인 단원 단위 중간 저장
  favoriteCards: string[]; // 즐겨찾기한 카드 id
  favoriteQuizzes: string[]; // 즐겨찾기한 퀴즈 id
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 2,
  completed: {},
  dayProgress: {},
  favoriteCards: [],
  favoriteQuizzes: [],
};

// 그 일차에서 카드를 끝까지 본 단원 번호.
// dayProgress 는 나중에 추가된 필드라 옛 저장본·SSR 로 넘어온 객체에는 없을 수 있고,
// 손상된 값이 들어 있을 수도 있다 → 어떤 경우에도 빈 배열로 폴백한다(읽기 경로의 단일 방어 지점).
export function studiedUnitsOfDay(progress: ProgressState, day: number): number[] {
  const units = progress.dayProgress?.[day]?.studiedUnits;
  return Array.isArray(units) ? units : [];
}

// 하루치 단원 진행 요약 — 진도 UI(홈·커리큘럼)와 학습 세션의 '이어서 하기' 판단에 함께 쓴다.
export interface DayUnitProgress {
  studied: number; // 학습을 마친 단원 수
  total: number; // 그 일차의 단원 수
  nextUnitIndex: number; // 이어서 학습할 단원의 인덱스 (-1 = 모든 단원 학습 완료)
  studiedFlags: boolean[]; // units 와 같은 순서의 단원별 학습 여부
}

// units 는 커리큘럼상 그 일차의 단원 목록(DayMeta.units). 커리큘럼에서 빠진 단원의
// 옛 기록은 세지 않으므로, 커리큘럼이 바뀌어도 표시가 total 을 넘지 않는다.
export function dayUnitProgress(
  progress: ProgressState,
  day: number,
  units: number[]
): DayUnitProgress {
  const studiedSet = new Set(studiedUnitsOfDay(progress, day));
  const studiedFlags = units.map((u) => studiedSet.has(u));
  return {
    studied: studiedFlags.filter(Boolean).length,
    total: units.length,
    nextUnitIndex: studiedFlags.indexOf(false),
    studiedFlags,
  };
}

// 오늘 복습해야 하는 항목
export interface DueReview {
  day: number;
  stage: number; // 0부터 시작하는 복습 단계 인덱스
  intervalLabel: string; // "1일차 복습" 등
  overdueDays: number; // 예정일 대비 며칠 지났는지
}

// 카드/퀴즈 id에서 단원 번호 추출 ("d09-c01" -> 9)
export function unitFromItemId(id: string): number {
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
