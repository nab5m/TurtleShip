// 학습 일차(1~90)를 그 날 내용(제목) 기반 한글 슬러그 URL 로 매핑.
// 예: 1일차 "구석기 시대의 생활" → /learn/구석기-시대의-생활
// 클라이언트/서버 양쪽에서 쓰이므로 커리큘럼 메타(가벼운 데이터)만 참조한다.
import { DAYS, DAY_MAP } from "@/data/curriculum";
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

export function daySlug(day: number): string {
  return DAY_TO_SLUG.get(day) ?? String(day);
}

// 슬러그 또는 레거시 숫자("1")로 일차 번호를 조회. 없으면 undefined.
export function dayFromSlug(slugOrNumber: string): number | undefined {
  const key = safeDecode(slugOrNumber);
  const bySlug = SLUG_TO_DAY.get(key);
  if (bySlug !== undefined) return bySlug;
  const n = Number(key);
  if (Number.isInteger(n) && DAY_MAP[n]) return n;
  return undefined;
}

// 학습 페이지 경로 (href/사이트맵용, 퍼센트 인코딩)
export function learnHref(day: number): string {
  return `/learn/${encodeURIComponent(daySlug(day))}`;
}

export const allDaySlugs = DAYS.map((d) => daySlug(d.day));
