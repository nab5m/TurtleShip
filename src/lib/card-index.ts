// 카드(개념/키워드) 하나하나를 고유 URL 로 색인하기 위한 슬러그 레지스트리.
// 서버 전용(데이터만 사용) — 빌드 시 1회 계산되어 정적 생성/메타데이터/사이트맵에서 공유된다.
// 색인 단위는 '단원'이다(하루에 단원 3~4개가 묶이므로 카드 이웃/목록은 단원 기준이 자연스럽다).
import type { StudyCard, DayMeta, Era, UnitMeta } from "@/lib/types";
import { UNIT_CONTENT_MAP } from "@/data/content";
import { DAY_MAP, ERA_MAP, UNIT_MAP, dayOfUnit } from "@/data/curriculum";
import { slugifyTitle } from "@/lib/slug";

export { slugifyTitle };

export interface CardEntry {
  slug: string; // 한글 슬러그 (예: "슴베찌르개", 충돌 시 "비파형-동검-5일차")
  card: StudyCard;
  unit: number;
  unitMeta: UnitMeta;
  day: number; // 이 단원을 학습하는 일차 (1~28)
  dayMeta: DayMeta;
  era: Era;
  indexInUnit: number; // 해당 단원 카드 배열에서의 위치
}

function build(): { entries: CardEntry[]; bySlug: Map<string, CardEntry> } {
  const units = Object.keys(UNIT_CONTENT_MAP)
    .map(Number)
    .sort((a, b) => a - b);

  // 1) 원본 수집 + 기본 슬러그 산출 (단원 → 카드 순서로 결정적)
  type Raw = { card: StudyCard; unit: number; idx: number; base: string };
  const raws: Raw[] = [];
  for (const unit of units) {
    UNIT_CONTENT_MAP[unit].cards.forEach((card, idx) => {
      raws.push({ card, unit, idx, base: slugifyTitle(card.title) });
    });
  }

  // 2) 기본 슬러그 충돌 집계 (같은 주제가 여러 단원에 재등장하는 경우)
  const baseCount = new Map<string, number>();
  for (const r of raws) baseCount.set(r.base, (baseCount.get(r.base) ?? 0) + 1);

  // 3) 최종 슬러그 확정 — 충돌 시 "-N일차", 그래도 겹치면 카드 id 로 유일화.
  //    접미사의 N 은 단원 번호다. 90일 커리큘럼 시절 색인된 카드 URL 을 그대로 유지하기 위해
  //    ("비파형-동검-5일차" 등) 표기와 값을 바꾸지 않는다.
  const bySlug = new Map<string, CardEntry>();
  const entries: CardEntry[] = [];
  for (const r of raws) {
    let slug = r.base || r.card.id; // 이론상 빈 슬러그 방지
    if ((baseCount.get(r.base) ?? 0) > 1) {
      slug = `${r.base}-${r.unit}일차`;
      if (bySlug.has(slug)) slug = `${r.base}-${r.card.id}`; // 같은 제목·같은 단원(희귀)
    }
    while (bySlug.has(slug)) slug = `${slug}-x`; // 최후 안전망
    const unitMeta = UNIT_MAP[r.unit];
    const day = dayOfUnit(r.unit)!;
    const entry: CardEntry = {
      slug,
      card: r.card,
      unit: r.unit,
      unitMeta,
      day,
      dayMeta: DAY_MAP[day],
      era: ERA_MAP[unitMeta.eraId],
      indexInUnit: r.idx,
    };
    bySlug.set(slug, entry);
    entries.push(entry);
  }
  return { entries, bySlug };
}

const { entries: ENTRIES, bySlug: BY_SLUG } = build();

export const cardEntries: readonly CardEntry[] = ENTRIES;

export function getCardEntryBySlug(slug: string): CardEntry | undefined {
  return BY_SLUG.get(slug);
}

export function getCardEntriesByUnit(unit: number): CardEntry[] {
  return ENTRIES.filter((e) => e.unit === unit);
}
