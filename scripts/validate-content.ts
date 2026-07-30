// 학습 콘텐츠 무결성 검증
// 사용법: npx tsx scripts/validate-content.ts
import { UNIT_CONTENT_MAP } from "../src/data/content";
import { DAYS, TOTAL_UNITS, UNITS } from "../src/data/curriculum";

let errors = 0;
let warnings = 0;

function err(msg: string) {
  errors++;
  console.error(`  ERROR: ${msg}`);
}
function warn(msg: string) {
  warnings++;
  console.warn(`  warn : ${msg}`);
}

const seenIds = new Set<string>();
let totalCards = 0;
let totalQuizzes = 0;

for (const meta of UNITS) {
  const content = UNIT_CONTENT_MAP[meta.unit];
  const dd = String(meta.unit).padStart(2, "0");
  if (!content) {
    err(`단원 ${meta.unit}: 콘텐츠 없음`);
    continue;
  }
  const { cards, quizzes } = content;
  totalCards += cards.length;
  totalQuizzes += quizzes.length;

  if (cards.length < 18) warn(`단원 ${meta.unit}: 카드 ${cards.length}장 (<18)`);
  if (cards.length > 30) warn(`단원 ${meta.unit}: 카드 ${cards.length}장 (>30)`);
  if (quizzes.length < 10) warn(`단원 ${meta.unit}: 퀴즈 ${quizzes.length}문항 (<10)`);

  for (const c of cards) {
    if (seenIds.has(c.id)) err(`중복 id: ${c.id}`);
    seenIds.add(c.id);
    if (!c.id.startsWith(`d${dd}-c`)) err(`단원 ${meta.unit}: 카드 id 형식 오류 ${c.id}`);
    if (!c.title.trim()) err(`${c.id}: title 비어 있음`);
    if (!c.content.trim()) err(`${c.id}: content 비어 있음`);
    if (c.keywords.length === 0) warn(`${c.id}: keywords 없음`);
  }

  const answerDist = [0, 0, 0, 0];
  for (const q of quizzes) {
    if (seenIds.has(q.id)) err(`중복 id: ${q.id}`);
    seenIds.add(q.id);
    if (!q.id.startsWith(`d${dd}-q`)) err(`단원 ${meta.unit}: 퀴즈 id 형식 오류 ${q.id}`);
    if (q.options.length !== 4) err(`${q.id}: 선지 ${q.options.length}개 (4개 필요)`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3)
      err(`${q.id}: answer 범위 오류 (${q.answer})`);
    else answerDist[q.answer]++;
    if (!q.explanation.trim()) warn(`${q.id}: 해설 없음`);
  }
  const maxSame = Math.max(...answerDist);
  if (quizzes.length >= 10 && maxSame / quizzes.length > 0.55)
    warn(`단원 ${meta.unit}: 정답 인덱스 편중 (${answerDist.join("/")})`);
}

// 커리큘럼 배분 검증 — 28일이 90단원을 빠짐없이 한 번씩 다뤄야 한다
const assigned = DAYS.flatMap((d) => d.units);
const assignedSet = new Set(assigned);
if (assigned.length !== assignedSet.size) err("커리큘럼: 여러 일차에 중복 배정된 단원이 있음");
for (const u of UNITS) {
  if (!assignedSet.has(u.unit)) err(`커리큘럼: 단원 ${u.unit} 이 어느 일차에도 배정되지 않음`);
}
for (const u of assignedSet) {
  if (u < 1 || u > TOTAL_UNITS) err(`커리큘럼: 존재하지 않는 단원 ${u} 배정`);
}
for (const d of DAYS) {
  if (d.units.length < 2) warn(`day ${d.day}: 단원 ${d.units.length}개 (<2)`);
  if (d.units.length > 4) warn(`day ${d.day}: 단원 ${d.units.length}개 (>4)`);
}

console.log(
  `\n총 ${DAYS.length}일 / ${Object.keys(UNIT_CONTENT_MAP).length}단원 / 카드 ${totalCards}장 / 퀴즈 ${totalQuizzes}문항`
);
console.log(`검증 결과: 오류 ${errors}건, 경고 ${warnings}건`);
if (errors > 0) process.exit(1);
