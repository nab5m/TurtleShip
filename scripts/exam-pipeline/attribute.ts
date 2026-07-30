// 선택지 하나 → 학습 카드 한 장 귀속(attribution).
//
// 규칙(Phase A 에서 정한 부풀림 방지 장치를 그대로 유지한다):
//   1) 선택지 하나는 카드 한 장에만 센다 — 가장 구체적으로(길게) 걸린 카드를 고른다.
//   2) 여러 카드가 공유하는 태그성 낱말(예: '진흥왕')은 검색어에서 뺀다.
//      기준: 같은 낱말을 달고 있는 카드가 MAX_CARDS_PER_TERM 장을 넘으면 버린다.
//   3) 2글자 이하 낱말·숫자만 있는 낱말은 검색어로 쓰지 않는다.
//   4) 그래도 같은 낱말을 공유하는 카드끼리는 동점이 생긴다(실측 귀속의 14.2%). 이때는
//      문항이 다루는 시대와 같은 시대의 카드를 고른다 — 안 그러면 색인 순서상 늘 앞 시대
//      카드가 이겨서 이른 시대로 쏠린다.
import { UNIT_MAP, UNITS } from "../../src/data/curriculum";
import { UNIT_CONTENT_MAP } from "../../src/data/content";
import type { EraId } from "../../src/lib/types";

export interface CardTerm {
  text: string;
  fromTitle: boolean;
}

export interface IndexedCard {
  id: string;
  unit: number;
  eraId?: EraId;
  terms: CardTerm[];
}

// 카드를 선택지에서 찾아내기 위한 검색어. 너무 짧거나 흔한 말은 오탐만 늘리므로 제외한다.
// 제목에서 나온 검색어는 그 카드의 주제 자체라서, 같은 낱말 길이면 keywords 보다 우선한다.
export function cardTerms(title: string, keywords: string[]): CardTerm[] {
  const terms = new Map<string, boolean>();
  for (const [index, item] of [title, ...keywords].entries()) {
    const fromTitle = index === 0;
    const flat = item.replace(/\s+/g, "");
    // 괄호 안 보충 설명은 떼고 본체만 쓴다 ("주먹도끼(만능 석기)" → "주먹도끼")
    const head = flat.split(/[(（]/)[0];
    for (const candidate of [flat, head]) {
      const term = candidate.replace(/[^가-힣一-龥A-Za-z0-9]/g, "");
      if (term.length < 3) continue; // 2글자 이하는 다른 맥락에 너무 흔하게 걸린다
      if (/^[0-9]+$/.test(term)) continue;
      terms.set(term, (terms.get(term) ?? false) || fromTitle);
    }
  }
  return [...terms].map(([text, fromTitle]) => ({ text, fromTitle }));
}

// 카드 전체의 검색어 목록 (태그성 낱말 제거 전)
export function allCards(): IndexedCard[] {
  const out: IndexedCard[] = [];
  for (const meta of UNITS) {
    const content = UNIT_CONTENT_MAP[meta.unit];
    if (!content) continue;
    for (const card of content.cards) {
      out.push({
        id: card.id,
        unit: meta.unit,
        eraId: UNIT_MAP[meta.unit]?.eraId,
        terms: cardTerms(card.title, card.keywords),
      });
    }
  }
  return out;
}

// 검색어별로 그 낱말을 달고 있는 카드 수
export function cardsPerTerm(cards: IndexedCard[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const term of card.terms) counts.set(term.text, (counts.get(term.text) ?? 0) + 1);
  }
  return counts;
}

// 개념 ↔ 카드 대응 판정용 낱말 집합. 귀속(attribution)과 달리 여기서는 태그성 낱말을
// 걸러내지 않고 2글자 낱말도 쓴다 — "이 개념을 다루는 카드가 하나라도 있는가"를 보는 것이므로
// 넓게 잡는 편이 맞다(카드 제목이 "녹읍" 처럼 2글자인 경우도 있다).
export function cardMatchTerms(): { id: string; unit: number; title: string; terms: string[] }[] {
  const out: { id: string; unit: number; title: string; terms: string[] }[] = [];
  for (const meta of UNITS) {
    const content = UNIT_CONTENT_MAP[meta.unit];
    if (!content) continue;
    for (const card of content.cards) {
      const terms = new Set<string>();
      for (const item of [card.title, ...card.keywords]) {
        const flat = item.replace(/\s+/g, "");
        for (const candidate of [flat, flat.split(/[(（]/)[0]]) {
          const term = candidate.replace(/[^가-힣一-龥A-Za-z0-9]/g, "");
          if (term.length >= 2 && !/^[0-9]+$/.test(term)) terms.add(term);
        }
      }
      out.push({ id: card.id, unit: meta.unit, title: card.title, terms: [...terms] });
    }
  }
  return out;
}

// 태그성 낱말을 걸러낸 검색 색인
export function buildCardIndex(maxCardsPerTerm: number): IndexedCard[] {
  const cards = allCards();
  const counts = cardsPerTerm(cards);
  return cards.map((card) => ({
    ...card,
    terms: card.terms.filter((t) => (counts.get(t.text) ?? 0) <= maxCardsPerTerm),
  }));
}

// 선택지(공백 제거 문자열) → 귀속 카드. 없으면 undefined.
// questionEra 를 주면 동점일 때 그 시대의 카드를 고른다(위 규칙 4).
export function attributeChoice(
  index: IndexedCard[],
  flatChoice: string,
  questionEra?: EraId
): { id: string; term: string } | undefined {
  let best: { id: string; term: string; rank: number } | undefined;
  for (const card of index) {
    const eraMatch = questionEra !== undefined && card.eraId === questionEra ? 1 : 0;
    for (const term of card.terms) {
      if (!flatChoice.includes(term.text)) continue;
      // 길이(구체성) > 제목 출신 > 시대 일치 순으로 우선한다
      const rank = term.text.length * 4 + (term.fromTitle ? 2 : 0) + eraMatch;
      if (!best || rank > best.rank) best = { id: card.id, term: term.text, rank };
    }
  }
  return best ? { id: best.id, term: best.term } : undefined;
}
