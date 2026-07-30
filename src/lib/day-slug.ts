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

// 2026-07-30 커리큘럼 재배분(전근대 20일→17일 / 근·현대 8일→11일) 이전의 일차 제목 슬러그.
// 슬러그가 제목에서 파생되므로 제목이 바뀌면 URL 도 바뀐다 → 옛 URL 은 그 내용이 옮겨 간
// 현재 일차로 연결한다. 연결 기준은 옛 일차의 첫 단원 번호이며(단원 번호는 재배분에서도 유지),
// 제목이 그대로인 일차는 위 루프에서 이미 등록되므로 자동으로 건너뛴다.
const LEGACY_DAY_TITLES: { title: string; unit: number }[] = [
  { title: "선사 시대의 생활", unit: 1 },
  { title: "고조선과 연맹 왕국", unit: 5 },
  { title: "고구려의 성장과 백제의 건국", unit: 9 },
  { title: "백제의 중흥과 신라의 발전", unit: 12 },
  { title: "가야 연맹과 삼국의 체제·항쟁", unit: 15 },
  { title: "삼국 통일과 삼국의 문화", unit: 18 },
  { title: "통일 신라의 발전과 동요", unit: 21 },
  { title: "발해의 발전과 문화", unit: 25 },
  { title: "후삼국의 성립과 고려의 건국", unit: 28 },
  { title: "고려의 통치 체제 정비", unit: 31 },
  { title: "거란·여진의 침입과 무신 정권", unit: 34 },
  { title: "몽골 항쟁과 원 간섭기", unit: 37 },
  { title: "고려의 경제·문화와 왕조 교체", unit: 40 },
  { title: "조선의 건국과 통치 기반", unit: 44 },
  { title: "조선의 통치 체제와 사림의 성장", unit: 47 },
  { title: "붕당의 형성과 조선 전기의 사회", unit: 50 },
  { title: "조선 전기의 문화와 임진왜란", unit: 53 },
  { title: "호란과 조선 후기 정치의 변화", unit: 55 },
  { title: "수취 체제 개편과 경제·사회 변동", unit: 58 },
  { title: "세도 정치와 실학·문화의 새 기운", unit: 61 },
  { title: "흥선대원군의 정치와 개항", unit: 65 },
  { title: "개화 정책과 동학 농민 운동", unit: 68 },
  { title: "근대 개혁과 국권 피탈", unit: 71 },
  { title: "무단 통치와 3·1 운동, 임시정부", unit: 74 },
  { title: "1920년대 수탈과 무장·의열 투쟁", unit: 77 },
  { title: "민족 말살 통치와 항일 투쟁의 확대", unit: 80 },
  { title: "광복과 분단, 6·25 전쟁", unit: 84 },
  { title: "민주주의의 발전과 통일 노력", unit: 87 },
];

for (const { title, unit } of LEGACY_DAY_TITLES) {
  const slug = slugifyTitle(title);
  const day = dayOfUnit(unit);
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
