// 기출 분석 파이프라인 — 다운로드 → 텍스트 추출 → 시대·단원 분류 → 데이터 생성.
//
// 산출물(커밋 대상, 집계값만):
//   src/data/exam-frequency.ts    카드별 기출 출제 횟수(정답 선택지 기준) + EXAM_COVERAGE
//   src/data/exam-distribution.ts 시대별·단계별 문항 수와 비율(실측 출제 비중)
//
// 원본(커밋 금지, data/exams-raw/ 는 gitignore):
//   data/exams-raw/pdf/<회차>-paper.pdf   문제지
//   data/exams-raw/pdf/<회차>-answer.pdf  정답표
//   data/exams-raw/text/<회차>.json       추출 텍스트(문항 단위)
//
// ⚠️ 저작권 — 문항 저작권은 국사편찬위원회, 사진 저작권은 원저작자에게 있다.
//    개인적인 학습 목적 외의 영리 목적(출판·온라인 이용 등)은
//    사단법인 한국복제전송저작권협회와 협의가 필요하다(자료실 고지).
//    그래서 PDF·페이지 이미지·문항 본문·선택지 텍스트는 저장소에 넣지 않고,
//    커밋하는 것은 횟수·분류·비율 같은 **집계 파생 데이터**뿐이다.
//
// 사전 준비(1회) — PDF 텍스트 추출용 로컬 venv (gitignore 됨):
//   python3 -m venv .venv-exam && .venv-exam/bin/pip install pypdf
//
// 사용법:
//   npx tsx scripts/gen-exam-frequency.ts             # 전체 (내려받은 것은 건너뜀)
//   npx tsx scripts/gen-exam-frequency.ts --fetch     # 다운로드만
//   npx tsx scripts/gen-exam-frequency.ts --extract   # 텍스트 추출만
//   npx tsx scripts/gen-exam-frequency.ts --emit      # 이미 추출된 텍스트로 데이터만 재생성
//   FORCE=1 ... : 이미 있는 PDF/텍스트도 다시 만든다
import { mkdirSync } from "node:fs";
import { EXAM_RAW_DIR } from "./exam-pipeline/shared";
import { fetchExams } from "./exam-pipeline/fetch";
import { extractAll, loadExtracted } from "./exam-pipeline/extract";
import { classifyAll } from "./exam-pipeline/classify";
import { emitData } from "./exam-pipeline/emit";

const args = new Set(process.argv.slice(2));
const force = process.env.FORCE === "1";
const only = (name: string) => args.has(`--${name}`);
const anyStage = only("fetch") || only("extract") || only("emit");
const runFetch = !anyStage || only("fetch");
const runExtract = !anyStage || only("extract");
const runEmit = !anyStage || only("emit");

async function main() {
  mkdirSync(EXAM_RAW_DIR, { recursive: true });

  if (runFetch) await fetchExams({ force });
  if (runExtract) await extractAll({ force });

  if (runEmit) {
    const rounds = loadExtracted();
    if (rounds.length === 0) {
      console.error("추출된 회차가 없습니다. --fetch → --extract 를 먼저 실행하세요.");
      process.exit(1);
    }
    const classified = classifyAll(rounds);
    emitData(classified);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
