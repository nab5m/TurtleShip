import type { DayContent } from "@/lib/types";
import { days as g01 } from "./days-01-04";
import { days as g02 } from "./days-05-08";
import { days as g03 } from "./days-09-14";
import { days as g04 } from "./days-15-20";
import { days as g05 } from "./days-21-24";
import { days as g06 } from "./days-25-29";
import { days as g07 } from "./days-30-34";
import { days as g08 } from "./days-35-39";
import { days as g09 } from "./days-40-43";
import { days as g10 } from "./days-44-48";
import { days as g11 } from "./days-49-54";
import { days as g12 } from "./days-55-59";
import { days as g13 } from "./days-60-64";
import { days as g14 } from "./days-65-69";
import { days as g15 } from "./days-70-73";
import { days as g16 } from "./days-74-78";
import { days as g17 } from "./days-79-83";
import { days as g18 } from "./days-84-90";
import { IMAGE_MAP } from "./images";

const ALL_DAYS: DayContent[] = [
  ...g01, ...g02, ...g03, ...g04, ...g05, ...g06, ...g07, ...g08, ...g09,
  ...g10, ...g11, ...g12, ...g13, ...g14, ...g15, ...g16, ...g17, ...g18,
];

// imageSearch가 resolve된 항목에 이미지 URL을 주입
for (const day of ALL_DAYS) {
  for (const item of [...day.cards, ...day.quizzes]) {
    if (item.imageSearch && IMAGE_MAP[item.id]) {
      item.image = IMAGE_MAP[item.id];
    }
  }
}

export const CONTENT_MAP: Record<number, DayContent> = Object.fromEntries(
  ALL_DAYS.map((d) => [d.day, d])
);

export function getDayContent(day: number): DayContent | undefined {
  return CONTENT_MAP[day];
}

// 즐겨찾기 화면에서 id로 카드/퀴즈를 찾기 위한 인덱스
import type { StudyCard, Quiz } from "@/lib/types";

const cardIndex = new Map<string, StudyCard>();
const quizIndex = new Map<string, Quiz>();
for (const day of ALL_DAYS) {
  for (const c of day.cards) cardIndex.set(c.id, c);
  for (const q of day.quizzes) quizIndex.set(q.id, q);
}

export function getCard(id: string): StudyCard | undefined {
  return cardIndex.get(id);
}
export function getQuiz(id: string): Quiz | undefined {
  return quizIndex.get(id);
}
