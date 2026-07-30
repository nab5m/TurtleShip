// 분류 결과 → 커밋 대상 데이터 파일 생성.
//
//   src/data/exam-frequency.ts    카드별 기출 출제 횟수(선택지 전체 기준, 정답/오답 분리)
//   src/data/exam-distribution.ts 시대별·단계별 출제 비율(실측)
//
// ⚠️ 두 파일에는 집계 수치만 들어간다. 문항 지문·선택지 원문은 절대 넣지 않는다.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ERAS, STAGES, UNITS } from "../../src/data/curriculum";
import { UNIT_CONTENT_MAP } from "../../src/data/content";
import type { EraId, StageId } from "../../src/lib/types";
import type { ClassifiedRound } from "./classify";
import { parseChoices, flattenChoice, type ChoiceRole } from "./choices";
import { buildCardIndex, attributeChoice } from "./attribute";
import { writeTopics, writeGapDoc } from "./emit-topics";

const OUT_DIR = join(process.cwd(), "src", "data");

// 전근대 / 근·현대 경계 (docs/content-redesign-2026-07-30.md 와 같은 기준)
const MODERN_ERAS: EraId[] = ["open-port", "colonial", "modern"];

const PROVENANCE = `// 출처: 국사편찬위원회 한국사능력검정시험 시험 자료실(historyexam.go.kr) '심화' 기출.
// 문항 저작권은 국사편찬위원회, 사진 저작권은 원저작자에게 있다. 개인적인 학습 목적 외의
// 영리 목적(출판·온라인 이용 등) 이용은 사단법인 한국복제전송저작권협회와 협의가 필요하다.
// → 그래서 원본 PDF·문항 지문·선택지 텍스트는 저장소에 두지 않고(data/exams-raw/ 는 gitignore),
//   이 파일처럼 횟수·비율만 남긴 집계 데이터만 커밋한다.`;

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 1000) / 10;
}

// ---------------------------------------------------------------- 카드별 출제 횟수

// 여러 카드가 함께 달고 있는 태그성 낱말은 주제 판별에 쓰지 않는다.
// 예: "진흥왕" 은 화랑도·황룡사·『국사』 편찬·대가야 멸망 등 여러 장이 공유한다 →
// "진흥왕" 이 나왔다고 그 카드를 모두 출제로 세면 별점이 부풀려진다.
//
// 임계값 선택 근거(2026-07-30 실측 — 선택지 전체 4,699개 기준으로 후보를 비교):
//   1 → 카드 525장 · 귀속 2,101   2 → 627장 · 2,492   3 → 644장 · 2,598
//   4 → 657장 · 2,633             6 → 660장 · 2,649   제한 없음 → 662장 · 2,654
// 3 을 넘겨도 얻는 게 거의 없는데(카드 +13장, 귀속 +35건) 한 낱말을 공유하는 카드 후보만
// 늘어난다 → Phase A 의 3 을 그대로 둔다. 대신 동점일 때의 임의 선택은
// attributeChoice() 의 시대 일치 타이브레이크로 줄인다.
const MAX_CARDS_PER_TERM = 3;

// 별점 구간 — 선택지 총 등장 횟수(정답+오답) 기준의 하한값.
// 정답만 세던 때는 최대 5회여서 min(5, total) 로 충분했지만, 선택지 전체로는 최대 27회까지
// 벌어져 그 방식은 대부분을 5점으로 뭉뚱그린다. 실측 분포를 5등분에 가깝게 끊었다:
//   1회 158장 · 2회 127장 · 3~4회 143장 · 5~7회 122장 · 8회+ 94장
const STAR_STEPS = [1, 2, 3, 5, 8] as const;

function starsOf(total: number): number {
  let stars = 0;
  for (const step of STAR_STEPS) if (total >= step) stars += 1;
  return stars;
}

interface RoundTally {
  label: string;
  hoe: number;
  count: number; // 그 회차에서 이 카드에 귀속된 선택지 수 (정답+오답+미확정)
  correct: number; // 그중 정답 선택지 수
}

interface FreqEntry {
  stars: number;
  total: number; // correct + distractor + unknown
  correct: number; // 정답 선택지로 나온 횟수
  distractor: number; // 오답 선택지로 나온 횟수
  unknown: number; // OCR 이 번호를 놓쳐 정답/오답을 확정 못한 선택지 수
  rounds: RoundTally[];
}

export interface FrequencyStats {
  cards: number; // 출제 기록이 붙은 카드 수
  cardTotal: number; // 전체 카드 수
  choices: number; // 귀속 대상이 된 선택지 수
  attributed: number; // 그중 카드에 귀속된 수
  role: Record<ChoiceRole, number>; // 선택지 역할별 개수 (귀속 여부와 무관)
  attributedRole: Record<ChoiceRole, number>;
  starHistogram: number[]; // 1~5점 카드 수
}

function buildFrequency(rounds: ClassifiedRound[]): {
  freq: Record<string, FreqEntry>;
  stats: FrequencyStats;
} {
  const index = buildCardIndex(MAX_CARDS_PER_TERM);

  // 카드 id -> 회차 -> 역할별 횟수
  const hits = new Map<string, Map<number, { count: number; correct: number }>>();
  const roleOf = new Map<string, Record<ChoiceRole, number>>();
  const role: Record<ChoiceRole, number> = { correct: 0, distractor: 0, unknown: 0 };
  const attributedRole: Record<ChoiceRole, number> = { correct: 0, distractor: 0, unknown: 0 };
  let choices = 0;
  let attributed = 0;

  for (const round of rounds) {
    for (const q of round.questions) {
      for (const choice of parseChoices(q.text, q.answer).choices) {
        const flat = flattenChoice(choice.text);
        if (flat.length < 6) continue; // OCR 이 선택지를 제대로 못 읽은 경우
        choices += 1;
        role[choice.role] += 1;
        // 선택지 하나는 카드 한 장에만 센다 — 가장 구체적으로 걸린 카드 하나.
        const best = attributeChoice(index, flat, q.eraId);
        if (!best) continue;
        attributed += 1;
        attributedRole[choice.role] += 1;
        let byRound = hits.get(best.id);
        if (!byRound) hits.set(best.id, (byRound = new Map()));
        const tally = byRound.get(round.hoe) ?? { count: 0, correct: 0 };
        tally.count += 1;
        if (choice.role === "correct") tally.correct += 1;
        byRound.set(round.hoe, tally);
        const roles = roleOf.get(best.id) ?? { correct: 0, distractor: 0, unknown: 0 };
        roles[choice.role] += 1;
        roleOf.set(best.id, roles);
      }
    }
  }

  const labelOf = new Map(rounds.map((r) => [r.hoe, r.label]));
  const out: Record<string, FreqEntry> = {};
  const starHistogram = [0, 0, 0, 0, 0];
  for (const id of [...hits.keys()].sort()) {
    const byRound = hits.get(id)!;
    const entries = [...byRound.entries()]
      .sort((a, b) => b[0] - a[0]) // 최신 회차 먼저
      .map(([hoe, tally]) => ({
        label: labelOf.get(hoe) ?? `${hoe}회`,
        hoe,
        count: tally.count,
        correct: tally.correct,
      }));
    const roles = roleOf.get(id)!;
    const total = roles.correct + roles.distractor + roles.unknown;
    const stars = starsOf(total);
    starHistogram[stars - 1] += 1;
    out[id] = {
      stars,
      total,
      correct: roles.correct,
      distractor: roles.distractor,
      unknown: roles.unknown,
      rounds: entries,
    };
  }
  const cardTotal = UNITS.reduce((n, m) => n + (UNIT_CONTENT_MAP[m.unit]?.cards.length ?? 0), 0);
  return {
    freq: out,
    stats: {
      cards: Object.keys(out).length,
      cardTotal,
      choices,
      attributed,
      role,
      attributedRole,
      starHistogram,
    },
  };
}

function writeFrequency(rounds: ClassifiedRound[]): FrequencyStats & {
  entries: Record<string, FreqEntry>;
} {
  const { freq, stats } = buildFrequency(rounds);
  const labels = rounds.map((r) => r.label);
  const hoes = rounds.map((r) => r.hoe);
  const coverage = {
    examCount: rounds.length,
    rounds: labels,
    hoe: hoes,
    choices: stats.choices,
    correctChoices: stats.role.correct,
    note: `${hoes[hoes.length - 1]}~${hoes[0]}회 문제지를 macOS Vision OCR 로 읽어 선택지 ${stats.choices}개를 뽑고 정답표와 맞춘 결과입니다.`,
  };
  const lines = [
    "// 자동 생성 파일 — scripts/gen-exam-frequency.ts 가 생성합니다. 직접 수정하지 마세요.",
    "// 한국사능력검정시험 '심화' 기출의 '선택지'에 각 학습 카드 주제가 등장한 횟수.",
    "//",
    "// 정답 선택지만 세지 않는다 — 한능검은 선택지 4~5개가 그 자체로는 모두 사실인 문장이고,",
    "// 제시문 키워드와 맞는 것을 고르는 시험이다. 즉 오답 선택지도 '출제된 개념' 한 개다.",
    "// 그래서 정답/오답을 각각 따로 세고(correct / distractor), total 은 둘의 합이다.",
    "// unknown = OCR 이 원문자(①~⑤)를 놓쳐 정답·오답을 확정하지 못한 선택지(전체의 1.4%).",
    `// stars = total 구간 점수 (${STAR_STEPS.join("/")}회 이상 = 1~5점). rounds 는 최신순.`,
    "//",
    "// 매칭 방식: 선택지 텍스트에 카드 제목·keywords 가 그대로 나오는지 본다. 선택지 하나는",
    "//   카드 한 장에만 세고(가장 구체적으로 걸린 카드), 여러 카드가 공유하는 태그성 낱말",
    `//   (예: '진흥왕')은 검색어에서 뺀다(같은 낱말을 ${MAX_CARDS_PER_TERM}장 넘게 공유하면 버림).`,
    "//   동점이면 문항이 다루는 시대의 카드를 고른다(이른 시대 쏠림 방지).",
    "//",
    `// 커버리지: 자료실이 공개 중인 심화 ${rounds.length}개 회차 전부 (${hoes[hoes.length - 1]}~${hoes[0]}회).`,
    `//   문항 ${rounds.reduce((n, r) => n + r.questions.length, 0)}개에서 선택지 ${stats.choices}개를 복원해`,
    `//   ${stats.attributed}개(${pct(stats.attributed, stats.choices)}%)를 카드에 귀속시켰다 → 카드 ${stats.cards}/${stats.cardTotal}장에 기록.`,
    "//",
    "// '출제 0회'의 뜻(정답만 셀 때보다 훨씬 좁아졌다): 표본이 문항당 1개(1,093개)에서",
    `//   선택지 ${stats.choices}개로 늘어, 앱에 카드가 있는 주제라면 대체로 한 번은 걸린다.`,
    "//   남은 0회 카드는 (a) 기출이 다른 표현을 써서 문자열로 못 잡은 경우와",
    "//   (b) 22회차 선택지에 실제로 안 나온 주제다. 둘을 가르는 근거는 src/data/exam-topics.ts",
    "//   (기출 선택지에서 뽑은 개념 인벤토리)와 docs/exam-topic-gap-2026-07-30.md 에 있다.",
    "// 한계: 카드 keywords 에 '지배층'처럼 일반적인 말이 있으면 그 카드로 잘못 귀속될 수 있다",
    "//   (표본 26건 눈검사: 22건 정확 · 4건은 같은 시대의 다른 카드로 귀속).",
    "//",
    PROVENANCE,
    "export interface ExamFreqRound { label: string; hoe: number; count: number; correct: number }",
    "export interface ExamFreq {",
    "  stars: number;",
    "  total: number;",
    "  correct: number;",
    "  distractor: number;",
    "  unknown: number;",
    "  rounds: ExamFreqRound[];",
    "}",
    `export const EXAM_COVERAGE = ${JSON.stringify(coverage)} as const;`,
    "export const EXAM_FREQUENCY: Record<string, ExamFreq> = {",
  ];
  const body = Object.entries(freq).map(
    ([id, entry]) => `  ${JSON.stringify(id)}: ${JSON.stringify(entry)},`
  );
  const text = [...lines, ...body, "};", ""].join("\n");
  writeFileSync(join(OUT_DIR, "exam-frequency.ts"), text, "utf8");
  console.log(
    `  src/data/exam-frequency.ts — 선택지 ${stats.choices}개 중 ${stats.attributed}개 귀속 → 카드 ${stats.cards}/${stats.cardTotal}장`
  );
  console.log(
    `    역할: 정답 ${stats.role.correct} · 오답 ${stats.role.distractor} · 미확정 ${stats.role.unknown}`
  );
  console.log(
    `    별점 분포: ${stats.starHistogram.map((n, i) => `${i + 1}점 ${n}장`).join(" · ")}`
  );
  return { ...stats, entries: freq };
}

// ---------------------------------------------------------------- 시대별 출제 비율

function writeDistribution(rounds: ClassifiedRound[]) {
  const questions = rounds.flatMap((r) => r.questions);
  const classified = questions.filter((q) => q.eraId);
  const eraCount = new Map<EraId, number>();
  const stageCount = new Map<StageId, number>();
  const unitCount = new Map<number, number>();
  for (const q of classified) {
    eraCount.set(q.eraId!, (eraCount.get(q.eraId!) ?? 0) + 1);
    if (q.stageId) stageCount.set(q.stageId, (stageCount.get(q.stageId) ?? 0) + 1);
    if (q.unit) unitCount.set(q.unit, (unitCount.get(q.unit) ?? 0) + 1);
  }
  const total = classified.length;

  const byEra = ERAS.map((era) => ({
    eraId: era.id,
    name: era.name,
    questions: eraCount.get(era.id) ?? 0,
    percent: pct(eraCount.get(era.id) ?? 0, total),
  }));
  const byStage = STAGES.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    questions: stageCount.get(stage.id) ?? 0,
    percent: pct(stageCount.get(stage.id) ?? 0, total),
  }));
  const modernQuestions = byEra
    .filter((e) => MODERN_ERAS.includes(e.eraId))
    .reduce((n, e) => n + e.questions, 0);
  const premodernQuestions = total - modernQuestions;
  const byUnit = Object.fromEntries(
    UNITS.map((u) => [u.unit, unitCount.get(u.unit) ?? 0]).filter(([, n]) => (n as number) > 0)
  );

  const distribution = {
    examCount: rounds.length,
    rounds: rounds.map((r) => r.label),
    hoe: rounds.map((r) => r.hoe),
    questionTotal: questions.length,
    classified: total,
    unclassified: questions.length - total,
    byEra,
    byStage,
    premodern: { questions: premodernQuestions, percent: pct(premodernQuestions, total) },
    modern: { questions: modernQuestions, percent: pct(modernQuestions, total) },
    byUnit,
  };

  const text = [
    "// 자동 생성 파일 — scripts/gen-exam-frequency.ts 가 생성합니다. 직접 수정하지 마세요.",
    "// 한국사능력검정시험 '심화' 기출의 시대별·단계별 출제 비율 (실측).",
    "//",
    `// 측정 대상: 심화 ${rounds.length}개 회차 ${questions.length}문항 (${rounds
      .map((r) => `${r.hoe}회`)
      .join(", ")}).`,
    "// 방법: 문제지를 OCR(macOS Vision, ko-KR)로 읽어 문항 단위로 자르고, 앱의 단원 제목·topics·",
    "//      카드 제목·keywords 로 만든 사전에 키워드 매칭해 시대(ERAS)·단계(STAGES)에 배정한다.",
    "//      발문·지문에 가장 큰 가중치, 정답 선택지에 그 다음, 오답 선택지에 가장 작은 가중치를 준다.",
    "//      percent 는 분류에 성공한 문항(classified) 대비 비율이다.",
    "// 한계: 여러 시대를 한 문항에서 묻는 통합형은 한쪽으로만 집계되고, 사진·지도만으로 성립하는",
    "//      문항은 분류되지 않을 수 있다(unclassified).",
    "//",
    PROVENANCE,
    "import type { EraId, StageId } from \"@/lib/types\";",
    "",
    "export interface ExamEraShare { eraId: EraId; name: string; questions: number; percent: number }",
    "export interface ExamStageShare { stageId: StageId; name: string; questions: number; percent: number }",
    "export interface ExamGroupShare { questions: number; percent: number }",
    "export interface ExamDistribution {",
    "  examCount: number;",
    "  rounds: string[];",
    "  hoe: number[];",
    "  questionTotal: number;",
    "  classified: number;",
    "  unclassified: number;",
    "  byEra: ExamEraShare[];",
    "  byStage: ExamStageShare[];",
    "  premodern: ExamGroupShare;",
    "  modern: ExamGroupShare;",
    "  byUnit: Record<number, number>;",
    "}",
    "",
    `export const EXAM_DISTRIBUTION: ExamDistribution = ${JSON.stringify(distribution, null, 2)};`,
    "",
  ].join("\n");
  writeFileSync(join(OUT_DIR, "exam-distribution.ts"), text, "utf8");

  console.log(
    `  src/data/exam-distribution.ts — ${questions.length}문항 중 ${total}문항 분류 (전근대 ${distribution.premodern.percent}% / 근현대 ${distribution.modern.percent}%)`
  );
  console.log("  단계별:");
  for (const s of byStage) console.log(`    ${s.name.padEnd(12)} ${String(s.questions).padStart(4)}문항  ${s.percent}%`);
}

export function emitData(rounds: ClassifiedRound[]) {
  console.log("[4/4] 데이터 파일 생성");
  const freq = writeFrequency(rounds);
  writeDistribution(rounds);
  const topics = writeTopics(rounds);
  writeGapDoc(topics, freq.entries, rounds);
}
