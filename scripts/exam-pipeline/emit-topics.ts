// 개념 인벤토리 산출물 생성.
//
//   src/data/exam-topics.ts               기출 선택지에 등장한 개념 목록(횟수·시대·단계·단원·대응 카드)
//   docs/exam-topic-gap-2026-07-30.md     인벤토리 ↔ 기존 카드 격차 분석
//
// ⚠️ 두 산출물에는 개념명(짧은 주제명)·횟수·분류·카드 id 만 들어간다.
//    문항 지문·선택지 원문은 한 줄도 넣지 않는다 (저작권: 국사편찬위원회).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { STAGES, UNIT_MAP } from "../../src/data/curriculum";
import type { EraId, StageId } from "../../src/lib/types";
import type { ClassifiedRound } from "./classify";
import { cardMatchTerms } from "./attribute";
import { collectChoices, extractLabels, buildTopics, type TopicStat } from "./topics";

const OUT_DIR = join(process.cwd(), "src", "data");
const DOC_PATH = join(process.cwd(), "docs", "exam-topic-gap-2026-07-30.md");

// 인벤토리 채택 기준. 실측 비교(2026-07-30):
//   등장 2회 이상 → 3,413개. 그런데 2회 항목 1,317개를 표본으로 보면 절반가량이
//     "…과정 사회주의자들이", "계승 둘러싸고" 같은 문장 조각·OCR 오독이다 → 쓰기 어렵다.
//   등장 3회 이상 → 1,958개. 문장 조각이 크게 줄고 개념명이 남는다 → 이 값을 쓴다.
// minStandalone: "관료전" 이 "관료전 지급" 과 거의 같은 횟수로만 나오면 하나로 합치는 기준.
const TOPIC_OPTIONS = { minDf: 3, minDfLong: 3, minStandalone: 2 };

const PROVENANCE = `// 출처: 국사편찬위원회 한국사능력검정시험 시험 자료실(historyexam.go.kr) '심화' 기출.
// 문항 저작권은 국사편찬위원회, 사진 저작권은 원저작자에게 있다. 개인적인 학습 목적 외의
// 영리 목적(출판·온라인 이용 등) 이용은 사단법인 한국복제전송저작권협회와 협의가 필요하다.
// → 그래서 원본 PDF·문항 지문·선택지 텍스트는 저장소에 두지 않고(data/exams-raw/ 는 gitignore),
//   이 파일처럼 개념명·횟수·분류만 남긴 집계 데이터만 커밋한다.`;

export interface TopicWithCards extends TopicStat {
  cardIds: string[];
}

// 개념 ↔ 카드 대응 판정.
//   3글자 이상이면 포함 관계도 인정한다 ("녹읍" ⊂ "녹읍폐지", "관료전지급" ⊃ "관료전").
//   2글자 개념은 오탐이 너무 늘어나서 완전히 같을 때만 인정한다.
function matchCards(
  topicFlat: string,
  cards: ReturnType<typeof cardMatchTerms>
): string[] {
  const hits: { id: string; score: number }[] = [];
  for (const card of cards) {
    let score = 0;
    for (const term of card.terms) {
      if (term === topicFlat) score = Math.max(score, 100);
      else if (topicFlat.length >= 3 && term.includes(topicFlat)) {
        score = Math.max(score, 50 + topicFlat.length);
      } else if (term.length >= 3 && topicFlat.includes(term)) {
        score = Math.max(score, 40 + term.length);
      }
    }
    if (score > 0) hits.push({ id: card.id, score });
  }
  return hits
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 5)
    .map((h) => h.id);
}

export interface TopicEmitResult {
  topics: TopicWithCards[];
  cardsWithoutTopic: { id: string; unit: number; title: string }[];
  choices: number;
}

export function writeTopics(rounds: ClassifiedRound[]): TopicEmitResult {
  const records = collectChoices(rounds);
  const labelOf = new Map(rounds.map((r) => [r.hoe, r.label]));
  const labels = extractLabels(records, TOPIC_OPTIONS);
  const stats = buildTopics(records, labels, labelOf);
  const cards = cardMatchTerms();

  const topics: TopicWithCards[] = stats.map((topic) => ({
    ...topic,
    cardIds: matchCards(topic.label.replace(/\s/g, ""), cards),
  }));

  // 반대 방향: 인벤토리 개념이 하나도 걸리지 않는 카드 (감량 후보)
  const covered = new Set<string>();
  for (const topic of topics) for (const id of topic.cardIds) covered.add(id);
  const cardsWithoutTopic = cards
    .filter((card) => !covered.has(card.id))
    .map((card) => ({ id: card.id, unit: card.unit, title: card.title }));

  const hoes = rounds.map((r) => r.hoe);
  const summary = {
    examCount: rounds.length,
    hoe: hoes,
    choices: records.length,
    topics: topics.length,
    minAppearances: TOPIC_OPTIONS.minDf,
    topicsWithCard: topics.filter((t) => t.cardIds.length > 0).length,
    cardTotal: cards.length,
    cardsWithoutTopic: cardsWithoutTopic.length,
  };

  const lines = [
    "// 자동 생성 파일 — scripts/gen-exam-frequency.ts 가 생성합니다. 직접 수정하지 마세요.",
    "// 한국사능력검정시험 '심화' 기출 선택지에 실제로 등장한 '개념 인벤토리'.",
    "// 앞으로 만들 카드·퀴즈의 범위를 기출로 확정하기 위한 목록이다.",
    "//",
    `// 대상: 심화 ${rounds.length}개 회차(${hoes[hoes.length - 1]}~${hoes[0]}회)에서 복원한 선택지 ${records.length}개.`,
    "//   정답 선택지만 보지 않는다 — 한능검 선택지는 정답이든 오답이든 그 자체로 사실인 문장이라",
    "//   오답 선택지도 '출제된 개념' 한 개다. correct/distractor 로 나눠 세고 total 은 합이다.",
    "//",
    "// 추출 방법: 선택지를 어절로 끊고 조사·어미를 떼어(데이터로 검증한 절단) 1~3어절 후보를 만들고,",
    `//   등장 선택지 수가 ${TOPIC_OPTIONS.minDf}개 이상인 것만 남긴다. 더 구체적인 개념에 흡수되는 짧은 후보는 버린다.`,
    "//   앱의 카드 어휘를 쓰지 않고 기출 텍스트에서만 뽑는다 — 그래야 '앱에 아직 없는 개념'이 보인다.",
    "//",
    "// eraId/stageId/unit: 문항의 시대 분류(exam-distribution.ts 와 동일한 분류) 다수결.",
    "//   단 오답 선택지는 일부러 다른 시대의 사실을 섞으므로 그 문항의 시대를 그대로 쓰면 틀린다.",
    "//   그래서 정답으로 등장한 적이 있으면 그 문항들만으로 시대를 정하고(eraSource: 'correct'),",
    "//   오답으로만 등장한 개념은 전체 등장 문항의 다수결을 쓰되 eraSource: 'any' 로 표시한다",
    "//   (= 시대가 틀릴 수 있다는 뜻).",
    "// cardIds: 이 개념에 대응하는 기존 카드(최대 5개). 빈 배열 = 아직 카드가 없는 개념.",
    "//",
    "// 한계(그대로 남긴다):",
    "//   - 선택지는 사건명을 쓰지 않고 서술로 표현하는 경우가 많다(예: '병인양요' 는 선택지에",
    "//     2회만 직접 등장). 즉 이 목록에 없다고 시험에 안 나오는 개념이 아니다.",
    "//   - 등장 2회 이하 후보(1,317개)는 문장 조각·OCR 오독이 절반가량이라 제외했다.",
    "//   - 3어절 후보에는 서술 조각이 섞일 수 있다(예: '…개간권 요구').",
    "//",
    PROVENANCE,
    'import type { EraId, StageId } from "@/lib/types";',
    "",
    "export interface ExamTopic {",
    "  label: string; // 개념명 (짧은 주제명)",
    "  total: number; // 등장 선택지 수 (correct + distractor + unknown)",
    "  correct: number; // 정답 선택지로 등장",
    "  distractor: number; // 오답 선택지로 등장",
    "  unknown: number; // OCR 이 번호를 놓쳐 정답·오답을 확정 못한 선택지",
    "  questions: number; // 등장 문항 수",
    "  rounds: string[]; // 등장 회차 (최신순)",
    "  hoe: number[];",
    "  eraId?: EraId;",
    "  eraSource?: \"correct\" | \"any\"; // any = 오답 선택지로만 등장 → 시대 신뢰도 낮음",
    "  stageId?: StageId;",
    "  unit?: number;",
    "  cardIds: string[];",
    "}",
    "",
    `export const EXAM_TOPIC_SUMMARY = ${JSON.stringify(summary)} as const;`,
    "",
    "export const EXAM_TOPICS: ExamTopic[] = [",
    ...topics.map((topic) => `  ${JSON.stringify(topic)},`),
    "];",
    "",
  ];
  writeFileSync(join(OUT_DIR, "exam-topics.ts"), lines.join("\n"), "utf8");
  console.log(
    `  src/data/exam-topics.ts — 개념 ${topics.length}개 (카드 있음 ${summary.topicsWithCard} · 없음 ${topics.length - summary.topicsWithCard})`
  );
  console.log(
    `    인벤토리에 걸리지 않는 기존 카드 ${cardsWithoutTopic.length}/${cards.length}장`
  );
  return { topics, cardsWithoutTopic, choices: records.length };
}

// ---------------------------------------------------------------- 격차 분석 문서

const MODERN_ERAS: EraId[] = ["open-port", "colonial", "modern"];

function stageName(stageId: StageId | undefined): string {
  return STAGES.find((s) => s.id === stageId)?.name ?? "분류 실패";
}

export function writeGapDoc(
  result: TopicEmitResult,
  freq: Record<string, { total: number; correct: number }>,
  rounds: ClassifiedRound[]
) {
  const { topics, cardsWithoutTopic } = result;
  const hoes = rounds.map((r) => r.hoe);
  const stageOrder = STAGES.map((s) => s.id);
  const byStage = new Map<StageId | undefined, TopicWithCards[]>();
  for (const topic of topics) {
    const list = byStage.get(topic.stageId) ?? [];
    list.push(topic);
    byStage.set(topic.stageId, list);
  }

  const withCard = topics.filter((t) => t.cardIds.length > 0);
  const withoutCard = topics.filter((t) => t.cardIds.length === 0);
  const cardTotal = cardMatchTerms().length;

  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);

  push(
    "# 기출 개념 인벤토리 ↔ 카드 격차 분석 (2026-07-30)",
    "",
    "> 자동 생성 문서 — `npm run gen:exam -- --emit` 이 갱신한다. 직접 수정하면 다음 실행에서 덮어써진다.",
    "> 근거 데이터: `src/data/exam-topics.ts`(개념 인벤토리) · `src/data/exam-frequency.ts`(카드별 출제 횟수)",
    "",
    "⚠️ 문항 저작권은 국사편찬위원회, 사진은 원저작자에게 있다. 개인 학습 목적 외 영리 목적",
    "(출판·온라인 이용 등)은 한국복제전송저작권협회 협의 대상이다. 그래서 이 문서에는 지문·선택지",
    "원문이 한 줄도 없고, 개념명·횟수·카드 id 같은 파생 데이터만 있다.",
    "",
    "## 0. 무엇을 셌나",
    "",
    `- 대상: 심화 ${rounds.length}개 회차(${hoes[hoes.length - 1]}~${hoes[0]}회) · 문항 ${rounds.reduce((n, r) => n + r.questions.length, 0)}개 · 복원 선택지 ${result.choices}개`,
    "- 정답 선택지만 세지 않는다. 한능검 선택지는 정답이든 오답이든 그 자체로 사실인 문장이므로,",
    "  오답 선택지도 '출제된 개념' 한 개로 센다(정답/오답 횟수는 따로 보관).",
    `- 개념 인벤토리: 선택지에 ${TOPIC_OPTIONS.minDf}회 이상 등장한 개념 **${topics.length}개**`,
    `- 이 중 대응 카드가 있는 개념 **${withCard.length}개(${pct(withCard.length, topics.length)}%)** · 없는 개념 **${withoutCard.length}개(${pct(withoutCard.length, topics.length)}%)**`,
    `- 반대로 인벤토리 개념이 하나도 걸리지 않는 기존 카드 **${cardsWithoutTopic.length}장** (전체 ${cardTotal}장 중 ${pct(cardsWithoutTopic.length, cardTotal)}%)`,
    "",
    "## 1. 단계별 요약",
    "",
    "| 단계 | 기출 개념 | 카드 있음 | 카드 없음 | 커버율 |",
    "| --- | --- | --- | --- | --- |"
  );

  for (const stageId of [...stageOrder, undefined]) {
    const list = byStage.get(stageId) ?? [];
    if (list.length === 0) continue;
    const has = list.filter((t) => t.cardIds.length > 0).length;
    push(
      `| ${stageName(stageId)} | ${list.length} | ${has} | ${list.length - has} | ${pct(has, list.length)}% |`
    );
  }
  const premodern = topics.filter((t) => t.eraId && !MODERN_ERAS.includes(t.eraId));
  const modern = topics.filter((t) => t.eraId && MODERN_ERAS.includes(t.eraId));
  push(
    `| **전근대 합계** | ${premodern.length} | ${premodern.filter((t) => t.cardIds.length > 0).length} | ${premodern.filter((t) => t.cardIds.length === 0).length} | ${pct(premodern.filter((t) => t.cardIds.length > 0).length, premodern.length)}% |`,
    `| **근현대 합계** | ${modern.length} | ${modern.filter((t) => t.cardIds.length > 0).length} | ${modern.filter((t) => t.cardIds.length === 0).length} | ${pct(modern.filter((t) => t.cardIds.length > 0).length, modern.length)}% |`,
    "",
    `개념 수 기준 전근대 : 근현대 = **${pct(premodern.length, premodern.length + modern.length)} : ${pct(modern.length, premodern.length + modern.length)}**`,
    "(문항 수 기준 실측치 58.5 : 41.5 와 비교해 읽는다 — `src/data/exam-distribution.ts`)",
    ""
  );

  // 2. 카드가 없는 개념
  const CAP = 60;
  push(
    "## 2. 카드가 없는 기출 개념 — 추가 대상",
    "",
    `단계별로 등장 횟수 내림차순. 각 단계 상위 ${CAP}개만 싣는다(전체는 \`src/data/exam-topics.ts\` 의 \`cardIds: []\` 항목).`,
    "표기: \`개념 (총등장/정답)\`",
    ""
  );
  for (const stageId of [...stageOrder, undefined]) {
    const list = (byStage.get(stageId) ?? [])
      .filter((t) => t.cardIds.length === 0)
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "ko"));
    if (list.length === 0) continue;
    push(`### ${stageName(stageId)} — ${list.length}개`, "");
    const shown = list.slice(0, CAP);
    push(shown.map((t) => `\`${t.label} (${t.total}/${t.correct})\``).join(" · "));
    if (list.length > CAP) push("", `…그 외 ${list.length - CAP}개.`);
    push("");
  }

  // 3. 인벤토리에 없는 기존 카드
  const zeroFreq = cardsWithoutTopic.filter((c) => !freq[c.id]);
  push(
    "## 3. 기출 인벤토리에 없는 기존 카드 — 감량 후보",
    "",
    `인벤토리 개념이 하나도 걸리지 않는 카드 **${cardsWithoutTopic.length}장**.`,
    `그중 \`exam-frequency.ts\` 의 선택지 귀속도 0회인 카드 **${zeroFreq.length}장** = 감량 1순위.`,
    "(귀속 기록이 있는데 인벤토리에 없는 카드는, 표현이 달라 개념 추출에서 다른 이름으로 잡힌 경우다.)",
    ""
  );
  const cardsByStage = new Map<StageId | undefined, typeof cardsWithoutTopic>();
  for (const card of cardsWithoutTopic) {
    const eraId = UNIT_MAP[card.unit]?.eraId;
    const stageId = eraId ? STAGES.find((s) => s.eraIds.includes(eraId))?.id : undefined;
    const list = cardsByStage.get(stageId) ?? [];
    list.push(card);
    cardsByStage.set(stageId, list);
  }
  push("| 단계 | 미대응 카드 | 그중 귀속 0회 |", "| --- | --- | --- |");
  for (const stageId of [...stageOrder, undefined]) {
    const list = cardsByStage.get(stageId) ?? [];
    if (list.length === 0) continue;
    push(`| ${stageName(stageId)} | ${list.length} | ${list.filter((c) => !freq[c.id]).length} |`);
  }
  push("");
  const CARD_CAP = 40;
  for (const stageId of [...stageOrder, undefined]) {
    const list = (cardsByStage.get(stageId) ?? [])
      .filter((c) => !freq[c.id])
      .sort((a, b) => a.id.localeCompare(b.id));
    if (list.length === 0) continue;
    push(`### ${stageName(stageId)} — 귀속 0회 + 인벤토리 미대응 ${list.length}장`, "");
    push(
      list
        .slice(0, CARD_CAP)
        .map((c) => `\`${c.id}\` ${c.title}`)
        .join(" · ")
    );
    if (list.length > CARD_CAP) push("", `…그 외 ${list.length - CARD_CAP}장.`);
    push("");
  }

  push(
    "## 4. 읽는 법 — 이 숫자로 무엇을 결정하고 무엇을 결정하지 않는가",
    "",
    "1. **추가는 §2 를 근거로 한다.** 카드가 없는 개념은 기출 선택지에 실제로 3회 이상 나온 것들이다.",
    "   등장 횟수가 큰 것부터 채우면 같은 노력으로 더 많은 문항을 덮는다.",
    "2. **감량은 §3 만으로 결정하지 않는다.** 선택지는 사건명을 쓰지 않고 서술로 표현하는 일이 많아",
    "   (예: '병인양요' 는 선택지에 직접 2회만 등장) 인벤토리 미대응이 곧 '시험에 안 나옴'은 아니다.",
    "   §3 은 '교과서 핵심도 아니고 기출 신호도 없는 카드'를 찾는 1차 후보 목록으로만 쓴다.",
    "3. **개념명은 짧은 주제명이다.** 선택지 문장을 옮긴 것이 아니라 어절 단위로 뽑아 다듬은 이름이므로,",
    "   카드 제목으로 쓰기 전에 사람이 다듬어야 한다(예: '독자적 연호' → '발해의 독자적 연호').",
    "4. 3어절 개념에는 서술 조각이 섞여 있다. 카드로 옮길 때 개념 단위로 다시 끊는다.",
    "",
    "## 5. 한계",
    "",
    "- OCR(macOS Vision)이 원문자(①~⑤)를 놓치는 문항이 있어 선택지 복원율은 이론상 최대치의 약 90%다.",
    "- 문항의 시대 분류는 앱 어휘 기반 키워드 매칭이다(수동 채점 정확도 94%). 개념의 시대는 그 문항",
    "  분류의 다수결이라 통합형 문항에서는 한쪽으로 쏠린다.",
    "- 개념 ↔ 카드 대응은 문자열 포함 관계로 판정한다. 2글자 개념은 완전 일치만 인정해 오탐을 줄였지만,",
    "  표현이 다른 같은 개념(예: '조선 총독부' vs '총독부')은 별개로 잡힐 수 있다.",
    `- 시대 판정 근거: 정답으로 등장한 문항으로 정한 개념 ${topics.filter((t) => t.eraSource === "correct").length}개 · 오답으로만 등장해 신뢰도가 낮은 개념 ${topics.filter((t) => t.eraSource === "any").length}개.`,
    "  후자는 단계 분류가 틀릴 수 있으니 표에서 옆 단계로 넘어간 항목이 보이면 그 탓이다.",
    "- 개념명 자동 추출의 한계: 어절 n-gram 이므로 서술 조각이 일부 남는다(표본 60개 눈검사에서",
    "  약 3할). 카드로 옮길 때 사람이 개념 단위로 다시 끊는다.",
    ""
  );

  writeFileSync(DOC_PATH, lines.join("\n"), "utf8");
  console.log(
    `  docs/exam-topic-gap-2026-07-30.md — 개념 ${topics.length}개 · 미대응 카드 ${cardsWithoutTopic.length}장`
  );
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 1000) / 10;
}
