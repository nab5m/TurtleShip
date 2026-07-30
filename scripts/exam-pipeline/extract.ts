// 기출 PDF → 문항 텍스트 추출 단계.
//
// 실제 추출은 파이썬(scripts/exam-pipeline/extract_pdf.py)이 한다.
//  - 문제지: macOS Vision OCR (ko-KR). 22회차 중 14회차는 문제지에 텍스트 레이어가 아예 없고,
//    있는 회차도 2단 편집 때문에 지문-문항 연결이 불안정해 전 회차를 같은 방법으로 처리한다.
//  - 정답표: PDF 텍스트 레이어 + 표 순서 파싱(배점 합계 100점으로 검증).
// 준비: python3 -m venv .venv-exam && .venv-exam/bin/pip install pypdf pyobjc-framework-Vision pyobjc-framework-Quartz
//
// ⚠️ 산출물(data/exams-raw/text/*.json)에는 문항 본문이 들어 있다 → gitignore. 커밋 금지.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EXAM_RAW_DIR, TEXT_DIR, roundLabel, type ExamPaper } from "./shared";

const execFileP = promisify(execFile);
const PYTHON = process.env.EXAM_PYTHON ?? ".venv-exam/bin/python";
const SCRIPT = join("scripts", "exam-pipeline", "extract_pdf.py");

// 회차 하나의 추출 결과 (로컬 전용)
export interface ExtractedRound {
  hoe: number;
  label: string;
  questionCount: number;
  answerCount: number;
  answerPoints: number; // 100 이면 정답표 파싱 정상
  missing: number[]; // OCR 이 머리를 놓쳐 분리하지 못한 문항 번호
  questions: { no: number; text: string; answer?: number; merged: boolean }[];
}

async function runPython(mode: string, pdf: string): Promise<unknown> {
  const { stdout } = await execFileP(PYTHON, [SCRIPT, mode, pdf], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

export async function extractAll(opts: { force: boolean }): Promise<void> {
  mkdirSync(TEXT_DIR, { recursive: true });
  const papersPath = join(EXAM_RAW_DIR, "papers.json");
  if (!existsSync(papersPath)) {
    throw new Error("data/exams-raw/papers.json 이 없습니다. --fetch 를 먼저 실행하세요.");
  }
  const papers = JSON.parse(readFileSync(papersPath, "utf8")) as ExamPaper[];
  console.log(`[2/4] 문항 텍스트 추출 (${papers.length}회차)`);

  for (const paper of papers) {
    const out = join(TEXT_DIR, `${paper.hoe}.json`);
    if (!opts.force && existsSync(out)) {
      console.log(`  ${paper.hoe}회 — 이미 추출됨 (건너뜀)`);
      continue;
    }
    const answer = (await runPython("answer", paper.answerPath)) as {
      answers: Record<string, number>;
      totalPoints: number;
    };
    const ocr = (await runPython("ocr", paper.paperPath)) as {
      questions: { no: number; text: string; merged: boolean }[];
      missing: number[];
    };
    const round: ExtractedRound = {
      hoe: paper.hoe,
      label: roundLabel(paper.hoe),
      questionCount: ocr.questions.length,
      answerCount: Object.keys(answer.answers).length,
      answerPoints: answer.totalPoints,
      missing: ocr.missing,
      questions: ocr.questions.map((q) => ({ ...q, answer: answer.answers[String(q.no)] })),
    };
    writeFileSync(out, JSON.stringify(round), "utf8");
    const warn = round.questionCount === 50 && round.answerPoints === 100 ? "" : "  ← 확인 필요";
    const miss = round.missing.length ? ` · 미분리 ${round.missing.join(",")}` : "";
    console.log(
      `  ${paper.hoe}회 (${round.label}) — 문항 ${round.questionCount}개 · 정답 ${round.answerCount}개 · 배점합 ${round.answerPoints}${miss}${warn}`
    );
  }
}

// 추출 결과 로드 (최신 회차 우선)
export function loadExtracted(): ExtractedRound[] {
  if (!existsSync(TEXT_DIR)) return [];
  return readdirSync(TEXT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(TEXT_DIR, f), "utf8")) as ExtractedRound)
    .sort((a, b) => b.hoe - a.hoe);
}
