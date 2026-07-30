// 추출된 기출 문항을 앱의 분류 체계(시대 15개 / 단계 10개 / 단원 90개)에 매핑한다.
//
// 방법: 앱이 이미 가진 어휘로 사전을 만들고 키워드 매칭 점수를 매긴다.
//   사전 = 단원 제목 + 단원 topics + 카드 제목 + 카드 keywords  (외부 자료 없음)
//   - 여러 단원에 등장하는 흔한 낱말은 자동으로 가중치가 낮아진다(등장 단원 수로 나눔).
//   - 문항 안 위치에 따라 가중치를 다르게 준다:
//       발문·지문 ×3   (문항의 시대를 결정하는 본체)
//       정답 선택지 ×2 (반드시 알아야 하는 사실)
//       오답 선택지 ×0.5 (일부러 다른 시대를 섞으므로 신호가 약하다)
//   - 시대 점수 = 그 시대 단원 점수의 **제곱 합**. 점수가 한 단원에 몰린 시대를 우대해,
//     약한 매칭이 여러 단원에 퍼진 시대가 이겨 버리는 현상을 눌린다.
//
// 정확도(수동 채점): 77회·70회 100문항 중 98문항을 손으로 라벨링해 비교한 결과
//   시대(15분류) 94%(92/98) · 전근대/근현대 2분류 98%(96/98).
//   틀린 6문항은 모두 앱 콘텐츠에 그 주제가 아예 없는 문항(예: 아리랑, 국민기초생활보장법)이거나
//   시대를 넘나드는 통합형이었다.
//
// 한계(보고서에 그대로 남긴다):
//   - 통합·비교형 문항(여러 시대를 한 문항에서 묻는 유형)은 어느 한쪽으로 배정된다.
//   - OCR 오독·자료(사진/지도)만으로 성립하는 문항은 점수가 낮거나 0이 될 수 있다.
//   - 앱이 다루지 않는 주제는 신호가 없어 엉뚱한 시대로 갈 수 있다(위 6문항이 그 경우다).
import { UNITS, UNIT_MAP, ERA_MAP, STAGES } from "../../src/data/curriculum";
import { UNIT_CONTENT_MAP } from "../../src/data/content";
import type { EraId, StageId } from "../../src/lib/types";
import type { ExtractedRound } from "./extract";

// ---------------------------------------------------------------- 사전

// 시대를 가리지 않고 쓰이는 말 — 넣으면 노이즈만 늘어난다.
const STOPWORDS = new Set([
  "왕", "국가", "나라", "정치", "사회", "경제", "문화", "제도", "설치", "파견", "편찬",
  "시행", "실시", "반란", "전투", "사건", "개혁", "성립", "발전", "변화", "생활", "구조",
  "체제", "정책", "운동", "조직", "인물", "지역", "수도", "왕조", "시대", "전기", "후기",
  "초기", "중기", "말기", "이후", "당시", "사용", "중심", "확대", "강화", "정비", "교류",
  "문제", "자료", "내용", "사실", "설명", "옳은", "다음", "밑줄", "가장", "적절한",
]);

interface Term {
  text: string;
  units: number[];
  weight: number; // 낱말 하나가 한 번 걸릴 때 단원 하나에 주는 점수
}

function splitTerms(source: string): string[] {
  // "부여: 5부족 연맹과 사출도(마가·우가·저가·구가)" → 조각들로 쪼갠다.
  return source
    .split(/[·,()\[\]{}:;/→~<>「」『』"'’”]|\s-\s/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildLexicon(): Term[] {
  const byText = new Map<string, Set<number>>();
  const add = (raw: string, unit: number) => {
    for (const piece of splitTerms(raw)) {
      // 조각 전체 + 조각 안의 낱말(2글자 이상 한글/한자 덩어리)
      const candidates = [piece, ...piece.split(/\s+/)];
      for (const cand of candidates) {
        const term = cand.replace(/[^가-힣一-龥A-Za-z0-9]/g, "");
        if (term.length < 2) continue;
        if (/^[0-9]+$/.test(term)) continue;
        if (STOPWORDS.has(term)) continue;
        if (!/[가-힣一-龥]/.test(term)) continue; // 순수 영문/숫자 제외
        let set = byText.get(term);
        if (!set) byText.set(term, (set = new Set()));
        set.add(unit);
      }
    }
  };

  for (const meta of UNITS) {
    add(meta.title, meta.unit);
    for (const topic of meta.topics) add(topic, meta.unit);
    const content = UNIT_CONTENT_MAP[meta.unit];
    if (!content) continue;
    for (const card of content.cards) {
      add(card.title, meta.unit);
      for (const keyword of card.keywords) add(keyword, meta.unit);
    }
    // 카드 본문·퀴즈 해설(산문)까지 넣어 봤지만 흔한 낱말이 늘어 정확도가 떨어졌다
    // (2회차 100문항 수동 채점: 시대 정확도 94% → 90%). 제목·keywords·topics 만 쓴다.
  }

  const terms: Term[] = [];
  for (const [text, unitSet] of byText) {
    const units = [...unitSet];
    // 너무 많은 단원에 퍼진 낱말은 시대 판별에 쓸모가 없다.
    if (units.length > 12) continue;
    // 긴 낱말일수록 특정적이다(고유명사·사건명). 등장 단원 수로 나눠 흔한 말을 눌린다.
    const specificity = Math.min(text.length, 8) / 2;
    terms.push({ text, units, weight: specificity / units.length });
  }
  // 긴 낱말을 먼저 보게 정렬(부분 문자열 중복 매칭은 허용한다 — 가중치로 상쇄)
  terms.sort((a, b) => b.text.length - a.text.length);
  return terms;
}

// ---------------------------------------------------------------- 문항 분해

const CIRCLED = ["①", "②", "③", "④", "⑤"];

// 문항 텍스트를 (발문+지문) / 선택지 5개로 가른다. OCR 이 원문자를 놓친 줄은 앞 선택지에 붙는다.
export function splitQuestion(text: string): { body: string; choices: string[] } {
  const lines = text.split("\n");
  const bodyLines: string[] = [];
  const choices: string[] = [];
  let expected = 0;
  for (const line of lines) {
    const idx = expected < 5 ? line.indexOf(CIRCLED[expected]) : -1;
    if (idx >= 0) {
      if (idx > 0 && choices.length === 0) bodyLines.push(line.slice(0, idx));
      else if (idx > 0) choices[choices.length - 1] += " " + line.slice(0, idx);
      choices.push(line.slice(idx + 1).trim());
      expected += 1;
      continue;
    }
    if (choices.length > 0) choices[choices.length - 1] += " " + line;
    else bodyLines.push(line);
  }
  return { body: bodyLines.join(" "), choices };
}

// ---------------------------------------------------------------- 채점

const LEXICON = buildLexicon();

const ERA_OF_STAGE = new Map<EraId, StageId>();
for (const stage of STAGES) for (const eraId of stage.eraIds) ERA_OF_STAGE.set(eraId, stage.id);

export interface ClassifiedQuestion {
  hoe: number;
  no: number;
  answer?: number;
  unit?: number; // 최고점 단원
  eraId?: EraId;
  stageId?: StageId;
  score: number; // 최고점 시대의 점수 (0 = 분류 실패)
  margin: number; // 1등 - 2등 시대 점수차 (신뢰도 참고)
  answerChoice?: string; // 정답 선택지 텍스트 (로컬 전용 — 커밋 금지)
}

function scoreUnits(parts: { text: string; weight: number }[]): Map<number, number> {
  const scores = new Map<number, number>();
  for (const part of parts) {
    if (!part.text) continue;
    const flat = part.text.replace(/\s+/g, "");
    for (const term of LEXICON) {
      if (!flat.includes(term.text)) continue;
      const gain = term.weight * part.weight;
      for (const unit of term.units) scores.set(unit, (scores.get(unit) ?? 0) + gain);
    }
  }
  return scores;
}

export function classifyQuestion(
  hoe: number,
  question: { no: number; text: string; answer?: number }
): ClassifiedQuestion {
  const { body, choices } = splitQuestion(question.text);
  const answerIndex = question.answer ? question.answer - 1 : -1;
  const answerChoice = answerIndex >= 0 ? choices[answerIndex] : undefined;
  const wrongChoices = choices.filter((_, i) => i !== answerIndex).join(" ");

  const unitScores = scoreUnits([
    { text: body, weight: 3 },
    { text: answerChoice ?? "", weight: 2 },
    { text: wrongChoices, weight: 0.5 },
  ]);

  const eraScores = new Map<EraId, number>();
  let bestUnit: number | undefined;
  let bestUnitScore = 0;
  for (const [unit, score] of unitScores) {
    const eraId = UNIT_MAP[unit]?.eraId;
    if (!eraId) continue;
    eraScores.set(eraId, (eraScores.get(eraId) ?? 0) + score * score);
    if (score > bestUnitScore) {
      bestUnitScore = score;
      bestUnit = unit;
    }
  }
  const ranked = [...eraScores.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const second = ranked[1];
  return {
    hoe,
    no: question.no,
    answer: question.answer,
    unit: bestUnit,
    eraId: top?.[0],
    stageId: top ? ERA_OF_STAGE.get(top[0]) : undefined,
    score: top?.[1] ?? 0,
    margin: (top?.[1] ?? 0) - (second?.[1] ?? 0),
    answerChoice,
  };
}

export interface ClassifiedRound {
  hoe: number;
  label: string;
  questions: ClassifiedQuestion[];
}

export function classifyAll(rounds: ExtractedRound[]): ClassifiedRound[] {
  console.log(`[3/4] 시대·단원 분류 (사전 ${LEXICON.length}개 낱말)`);
  const out = rounds.map((round) => ({
    hoe: round.hoe,
    label: round.label,
    questions: round.questions.map((q) => classifyQuestion(round.hoe, q)),
  }));
  const total = out.reduce((n, r) => n + r.questions.length, 0);
  const failed = out.reduce((n, r) => n + r.questions.filter((q) => q.score === 0).length, 0);
  console.log(`  문항 ${total}개 중 분류 성공 ${total - failed}개 · 실패 ${failed}개`);
  return out;
}
