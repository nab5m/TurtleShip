// 정답 인덱스가 한쪽으로 편중된 날의 퀴즈에서, 4개 보기를 순환 이동(rotation)하여
// 정답 위치를 0~3으로 고르게 분산한다. 회전은 보기 집합·정답 내용을 보존하므로 안전하다.
// 한 줄 배열(["a","b","c","d"])과 여러 줄 배열을 모두 처리한다.
// 해설이 보기 번호("N번"/①②③④)를 참조하는 퀴즈는 건드리지 않는다(방어).
//
// 사용법: node scripts/rebalance-answers.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "src", "data", "content");

// 편중이 확인되어 재배치할 날들 (직접 작성분)
const TARGET_DAYS = new Set([
  12, 13, 14, 40, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64,
  82, 83, 84, 85, 86, 87, 88, 89, 90,
]);

// 문자열 리터럴 텍스트(따옴표 포함)를 순서대로 추출
function extractLiterals(arrText) {
  const re = /"(?:[^"\\]|\\.)*"/g;
  const out = [];
  let m;
  while ((m = re.exec(arrText)) !== null) out.push(m[0]);
  return out;
}

const files = readdirSync(DIR).filter((f) => /^days-.*\.ts$/.test(f));
let changed = 0;
let skipped = 0;

for (const file of files) {
  const path = join(DIR, file);
  let text = readFileSync(path, "utf8");
  const perDayCounter = new Map();

  // id ... options: [ ... ], answer: N, ... explanation: "..."
  const quizRe =
    /(id: "d(\d+)-q\d+",\n[\s\S]*?options: )(\[[\s\S]*?\])(,\n\s*answer: )(\d+)(,\n\s*explanation: ")([^"]*)(")/g;

  text = text.replace(
    quizRe,
    (m, pre, dayStr, arrText, midAns, ansNum, preExpl, explanation, postExpl) => {
      const day = Number(dayStr);
      if (!TARGET_DAYS.has(day)) return m;
      if (/[0-9]번|[①②③④]/.test(explanation)) {
        skipped++;
        return m;
      }
      const lits = extractLiterals(arrText);
      if (lits.length !== 4) return m;
      const answer = Number(ansNum);
      const idx = perDayCounter.get(day) ?? 0;
      const target = idx % 4;
      perDayCounter.set(day, idx + 1);
      const k = (((answer - target) % 4) + 4) % 4; // 왼쪽 회전량
      const rotated = lits.map((_, j) => lits[(j + k) % 4]);
      if (rotated[target] !== lits[answer]) throw new Error(`mismatch day ${day}`);

      let newArr;
      if (arrText.includes("\n")) {
        // 여러 줄: 10칸 들여쓰기 + 후행 쉼표
        newArr = "[\n" + rotated.map((l) => "          " + l + ",").join("\n") + "\n        ]";
      } else {
        newArr = "[" + rotated.join(", ") + "]";
      }
      changed++;
      return pre + newArr + midAns + target + preExpl + explanation + postExpl;
    }
  );

  writeFileSync(path, text);
}

console.log(`재배치한 퀴즈: ${changed}개, 번호 참조로 건너뛴 퀴즈: ${skipped}개`);
