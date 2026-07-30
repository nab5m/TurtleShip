// 학습 일차(1~28)를 그 날 내용(제목) 기반 한글 슬러그 URL 로 매핑.
// 예: 1일차 "선사 시대의 생활" → /learn/선사-시대의-생활
// 클라이언트/서버 양쪽에서 쓰이므로 커리큘럼 메타(가벼운 데이터)만 참조한다.
import { DAYS, DAY_MAP, UNITS, dayOfUnit } from "@/data/curriculum";
import { slugifyTitle, safeDecode } from "@/lib/slug";

const DAY_TO_SLUG = new Map<number, string>();
const SLUG_TO_DAY = new Map<string, number>();

for (const d of DAYS) {
  let slug = slugifyTitle(d.title);
  // 제목이 겹치면(현재는 없음) 일차로 유일화 — URL 안정성 보장
  if (SLUG_TO_DAY.has(slug)) slug = `${slug}-${d.day}일차`;
  DAY_TO_SLUG.set(d.day, slug);
  SLUG_TO_DAY.set(slug, d.day);
}

// 90일 커리큘럼 시절의 단원 제목 슬러그(/learn/구석기-시대의-생활 등)도 계속 받아
// 그 단원을 학습하는 일차로 연결한다. 이미 색인된 URL 이 깨지지 않게 하기 위한 호환 경로.
for (const u of UNITS) {
  const slug = slugifyTitle(u.title);
  const day = dayOfUnit(u.unit);
  if (day !== undefined && !SLUG_TO_DAY.has(slug)) SLUG_TO_DAY.set(slug, day);
}

export function daySlug(day: number): string {
  return DAY_TO_SLUG.get(day) ?? String(day);
}

// 슬러그 또는 숫자로 일차 번호를 조회. 없으면 undefined.
// 숫자는 1~28 이면 일차, 그보다 크면 90일 커리큘럼 시절의 단원 번호로 보고 해당 일차로 연결한다.
export function dayFromSlug(slugOrNumber: string): number | undefined {
  const key = safeDecode(slugOrNumber);
  const bySlug = SLUG_TO_DAY.get(key);
  if (bySlug !== undefined) return bySlug;
  const n = Number(key);
  if (!Number.isInteger(n)) return undefined;
  if (DAY_MAP[n]) return n;
  return dayOfUnit(n);
}

// 학습 페이지 경로 (href/사이트맵용, 퍼센트 인코딩)
export function learnHref(day: number): string {
  return `/learn/${encodeURIComponent(daySlug(day))}`;
}

export const allDaySlugs = DAYS.map((d) => daySlug(d.day));
