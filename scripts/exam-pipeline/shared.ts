// 기출 분석 파이프라인 공용 상수·타입.
//
// ⚠️ data/exams-raw/ 는 gitignore 대상이다. 원본 PDF·추출 텍스트·문항 본문은 절대 커밋하지 않는다.
//    (문항 저작권: 국사편찬위원회 / 사진 저작권: 원저작자 — 개인 학습 목적 외 이용은 협의 필요)
import { join } from "node:path";

export const EXAM_RAW_DIR = join(process.cwd(), "data", "exams-raw");
export const PDF_DIR = join(EXAM_RAW_DIR, "pdf");
export const TEXT_DIR = join(EXAM_RAW_DIR, "text");

// 회차 하나의 원본 파일 위치
export interface ExamPaper {
  hoe: number; // 회차 (예: 78)
  title: string; // 자료실 게시글 제목
  paperPath: string; // 문제지 PDF
  answerPath: string; // 정답표 PDF
}

// 추출된 문항 하나 — 본문(지문/선택지)은 로컬 분석용으로만 들고 다니며 커밋하지 않는다.
export interface ParsedQuestion {
  hoe: number;
  no: number; // 문항 번호 (1~50)
  text: string; // 문항 전체 텍스트 (지문+선택지) — 로컬 전용
  answer?: number; // 정답 번호 (1~5)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 회차 → "26년 1회" 형태의 표시 라벨.
// 시행 횟수가 해마다 달라(2022·2023년 6회, 2024·2025년 4회) 계산식으로 뽑을 수 없다.
// 자료실 등록일(시험 직후 게시)로 확인한 표를 둔다: 22년 57~62 · 23년 63~68 · 24년 69~72 · 25년 73~76 · 26년 77~
const ROUND_LABELS: Record<number, string> = {
  57: "22년 1회", 58: "22년 2회", 59: "22년 3회", 60: "22년 4회", 61: "22년 5회",
  62: "22년 6회", 63: "23년 1회", 64: "23년 2회", 65: "23년 3회", 66: "23년 4회",
  67: "23년 5회", 68: "23년 6회", 69: "24년 1회", 70: "24년 2회", 71: "24년 3회",
  72: "24년 4회", 73: "25년 1회", 74: "25년 2회", 75: "25년 3회", 76: "25년 4회",
  77: "26년 1회", 78: "26년 2회",
};

export function roundLabel(hoe: number): string {
  return ROUND_LABELS[hoe] ?? `${hoe}회`;
}
