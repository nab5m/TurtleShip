// 분류 결과 → 커밋 대상 데이터 파일 생성.
//
//   src/data/exam-frequency.ts    카드별 기출 출제 횟수(정답 선택지 기준)
//   src/data/exam-distribution.ts 시대별·단계별 출제 비율(실측)
//
// ⚠️ 두 파일에는 집계 수치만 들어간다. 문항 지문·선택지 원문은 절대 넣지 않는다.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ERAS, STAGES, UNITS, UNIT_MAP } from "../../src/data/curriculum";
import { UNIT_CONTENT_MAP } from "../../src/data/content";
import type { EraId, StageId } from "../../src/lib/types";
import type { ClassifiedRound } from "./classify";

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

// 카드를 정답 선택지에서 찾아내기 위한 검색어. 너무 짧거나 흔한 말은 오탐만 늘리므로 제외한다.
function cardTerms(title: string, keywords: string[]): string[] {
  const raw = [title, ...keywords];
  const terms = new Set<string>();
  for (const item of raw) {
    const flat = item.replace(/\s+/g, "");
    // 괄호 안 보충 설명은 떼고 본체만 쓴다 ("주먹도끼(만능 석기)" → "주먹도끼")
    const head = flat.split(/[(（]/)[0];
    for (const candidate of [flat, head]) {
      const term = candidate.replace(/[^가-힣一-龥A-Za-z0-9]/g, "");
      if (term.length < 3) continue; // 2글자 이하는 다른 맥락에 너무 흔하게 걸린다
      if (/^[0-9]+$/.test(term)) continue;
      terms.add(term);
    }
  }
  return [...terms];
}

interface FreqEntry {
  stars: number;
  total: number;
  rounds: { label: string; hoe: number; count: number }[];
}

function buildFrequency(rounds: ClassifiedRound[]): Record<string, FreqEntry> {
  const index: { id: string; terms: string[] }[] = [];
  for (const meta of UNITS) {
    const content = UNIT_CONTENT_MAP[meta.unit];
    if (!content) continue;
    for (const card of content.cards) {
      index.push({ id: card.id, terms: cardTerms(card.title, card.keywords) });
    }
  }

  // 카드 id -> 회차 -> 걸린 문항 수
  const hits = new Map<string, Map<number, number>>();
  for (const round of rounds) {
    for (const q of round.questions) {
      if (!q.answerChoice) continue;
      const flat = q.answerChoice.replace(/\s+/g, "");
      if (flat.length < 6) continue; // OCR 이 선택지를 제대로 못 읽은 경우
      for (const card of index) {
        if (!card.terms.some((t) => flat.includes(t))) continue;
        let byRound = hits.get(card.id);
        if (!byRound) hits.set(card.id, (byRound = new Map()));
        byRound.set(round.hoe, (byRound.get(round.hoe) ?? 0) + 1);
      }
    }
  }

  const labelOf = new Map(rounds.map((r) => [r.hoe, r.label]));
  const out: Record<string, FreqEntry> = {};
  for (const id of [...hits.keys()].sort()) {
    const byRound = hits.get(id)!;
    const entries = [...byRound.entries()]
      .sort((a, b) => b[0] - a[0]) // 최신 회차 먼저
      .map(([hoe, count]) => ({ label: labelOf.get(hoe) ?? `${hoe}회`, hoe, count }));
    const total = entries.reduce((n, e) => n + e.count, 0);
    out[id] = { stars: Math.min(5, total), total, rounds: entries };
  }
  return out;
}

function writeFrequency(rounds: ClassifiedRound[]) {
  const freq = buildFrequency(rounds);
  const labels = rounds.map((r) => r.label);
  const hoes = rounds.map((r) => r.hoe);
  const coverage = {
    examCount: rounds.length,
    rounds: labels,
    hoe: hoes,
    note: `${hoes[hoes.length - 1]}~${hoes[0]}회 문제지를 macOS Vision OCR 로 읽어 정답표와 맞춘 결과입니다.`,
  };
  const lines = [
    "// 자동 생성 파일 — scripts/gen-exam-frequency.ts 가 생성합니다. 직접 수정하지 마세요.",
    "// 한국사능력검정시험 '심화' 기출의 '정답 선택지'에 각 학습 카드 주제가 출제된 횟수.",
    "// stars = 총 출제횟수(최대 5). rounds 는 최신순. (정답이 아닌 오답 선택지는 제외)",
    "//",
    `// 커버리지: 자료실이 공개 중인 심화 ${rounds.length}개 회차 전부 (${hoes[hoes.length - 1]}~${hoes[0]}회).`,
    "// 문제지 텍스트는 회차별 형식 차이를 없애기 위해 전 회차를 OCR(macOS Vision, ko-KR)로 읽는다.",
    "//",
    PROVENANCE,
    "export interface ExamFreq { stars: number; total: number; rounds: { label: string; hoe: number; count: number }[] }",
    `export const EXAM_COVERAGE = ${JSON.stringify(coverage)} as const;`,
    "export const EXAM_FREQUENCY: Record<string, ExamFreq> = {",
  ];
  const body = Object.entries(freq).map(
    ([id, entry]) => `  ${JSON.stringify(id)}: ${JSON.stringify(entry)},`
  );
  const text = [...lines, ...body, "};", ""].join("\n");
  writeFileSync(join(OUT_DIR, "exam-frequency.ts"), text, "utf8");
  console.log(`  src/data/exam-frequency.ts — 카드 ${Object.keys(freq).length}장에 출제 기록`);
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
    "import type { EraId, StageId } from '@/lib/types';",
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
  writeFrequency(rounds);
  writeDistribution(rounds);
}
