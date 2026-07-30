import type { DayContent, ItemImage, UnitContent } from "@/lib/types";
import { DAYS } from "@/data/curriculum";
import { units as g01 } from "./days-01-04";
import { units as g02 } from "./days-05-08";
import { units as g03 } from "./days-09-14";
import { units as g04 } from "./days-15-20";
import { units as g05 } from "./days-21-24";
import { units as g06 } from "./days-25-29";
import { units as g07 } from "./days-30-34";
import { units as g08 } from "./days-35-39";
import { units as g09 } from "./days-40-43";
import { units as g10 } from "./days-44-48";
import { units as g11 } from "./days-49-54";
import { units as g12 } from "./days-55-59";
import { units as g13 } from "./days-60-64";
import { units as g14 } from "./days-65-69";
import { units as g15 } from "./days-70-73";
import { units as g16 } from "./days-74-78";
import { units as g17 } from "./days-79-83";
import { units as g18 } from "./days-84-90";
import { IMAGE_MAP } from "./images";
import { IMAGE_ALIASES, IMAGE_OVERRIDES } from "./image-overrides";

const ALL_UNITS: UnitContent[] = [
  ...g01, ...g02, ...g03, ...g04, ...g05, ...g06, ...g07, ...g08, ...g09,
  ...g10, ...g11, ...g12, ...g13, ...g14, ...g15, ...g16, ...g17, ...g18,
];

// 이미지 해석 우선순위
//   1) IMAGE_ALIASES — 다른 항목의 이미지를 빌려 쓴다 (id 를 바꿔치기)
//   2) IMAGE_OVERRIDES — 손으로 지정한 이미지 (자동 해석 결과보다 우선)
//   3) IMAGE_MAP — scripts/resolve-images.mjs 가 만든 자동 해석 결과
function resolveImage(id: string): ItemImage | undefined {
  const sourceId = IMAGE_ALIASES[id] ?? id;
  return IMAGE_OVERRIDES[sourceId] ?? IMAGE_MAP[sourceId];
}

// imageSearch 가 살아 있는 항목에만 이미지를 주입한다.
// → 사진을 없애려면 days-*.ts 에서 imageSearch 를 지우면 되고(오버라이드/자동 해석 모두 무력화),
//   그러면 resolve-images.mjs 도 그 항목을 다시 찾지 않는다.
for (const unit of ALL_UNITS) {
  for (const item of [...unit.cards, ...unit.quizzes]) {
    if (!item.imageSearch) continue;
    const image = resolveImage(item.id);
    if (image) item.image = image;
  }
}

export const UNIT_CONTENT_MAP: Record<number, UnitContent> = Object.fromEntries(
  ALL_UNITS.map((u) => [u.unit, u])
);

export function getUnitContent(unit: number): UnitContent | undefined {
  return UNIT_CONTENT_MAP[unit];
}

// 하루치 콘텐츠 = 그날 묶인 단원들의 카드/퀴즈를 단원 순서대로 이어 붙인 것
export const CONTENT_MAP: Record<number, DayContent> = Object.fromEntries(
  DAYS.map((d) => {
    const units = d.units.map((u) => UNIT_CONTENT_MAP[u]).filter(Boolean);
    return [
      d.day,
      {
        day: d.day,
        cards: units.flatMap((u) => u.cards),
        quizzes: units.flatMap((u) => u.quizzes),
      } satisfies DayContent,
    ];
  })
);

export function getDayContent(day: number): DayContent | undefined {
  return CONTENT_MAP[day];
}

// 즐겨찾기 화면에서 id로 카드/퀴즈를 찾기 위한 인덱스
import type { StudyCard, Quiz } from "@/lib/types";

const cardIndex = new Map<string, StudyCard>();
const quizIndex = new Map<string, Quiz>();
for (const unit of ALL_UNITS) {
  for (const c of unit.cards) cardIndex.set(c.id, c);
  for (const q of unit.quizzes) quizIndex.set(q.id, q);
}

export function getCard(id: string): StudyCard | undefined {
  return cardIndex.get(id);
}
export function getQuiz(id: string): Quiz | undefined {
  return quizIndex.get(id);
}
