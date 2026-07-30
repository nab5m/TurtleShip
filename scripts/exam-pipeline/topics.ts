// 기출 선택지 → '개념 인벤토리' 추출.
//
// 목표: 22개 회차의 선택지에 실제로 등장한 개념(주제)을 전부 뽑아, 앞으로 만들 카드/퀴즈의
//       범위를 기출로 확정한다. 앱이 이미 아는 어휘(카드 제목·keywords)로 찾으면 "앱에 없는
//       개념"은 영원히 안 보이므로, 어휘 사전을 쓰지 않고 선택지 텍스트에서 직접 뽑는다.
//
// 방법 — 어절 단위 n-gram(1~3어절):
//   1) 선택지를 어절로 끊고 어절마다 조사·어미를 떼어 낸다 ("관료전을" → "관료전",
//      "지급하였다" → "지급", "하였다" → 빈 문자열 → 버림).
//   2) 연속한 어절 1~3개를 후보로 삼아 등장 선택지 수(df)를 센다.
//   3) df 가 낮은 후보(1회성 표현·OCR 오독)를 버리고, 더 구체적인 개념에 흡수되는 짧은
//      후보를 버린다 ("관료전" 이 "관료전 지급" 과 거의 같은 횟수로만 나오면 하나로 본다).
//   4) 기능어·서술어·시험 형식어(STOPWORDS)는 개념 이름 자체로는 쓰지 않는다.
//
// 글자 단위 부분문자열(maximal repeated substring)로도 해 봤지만 상위 후보가 전부
// "하였다/였다/되었다/설치하" 같은 어미·중간 조각이었다 → 어절 정렬 방식으로 바꿨다.
//
// ⚠️ 저작권 — 여기서 만드는 라벨은 "짧은 주제명"이어야 한다. 문장(지문·선택지 원문)을 그대로
//    옮기면 안 된다. 그래서 라벨 길이를 MAX_LABEL_CHARS 로 제한하고, 서술어(…하였다 등)를
//    잘라내며, 문장 부호가 남은 후보는 버린다. 산출물에는 개념명·횟수·분류만 들어간다.
import { UNIT_MAP } from "../../src/data/curriculum";
import type { EraId, StageId } from "../../src/lib/types";
import { STAGE_OF_ERA } from "./eras";
import { parseChoices, flattenChoice, type ChoiceRole } from "./choices";
import type { ClassifiedRound } from "./classify";

// 개념 라벨 길이 상한(공백 제외). 이보다 길면 '주제명'이 아니라 문장 조각이다.
const MAX_LABEL_CHARS = 14;
const MIN_LABEL_CHARS = 2;

// 개념으로 보지 않는 말 — 시대·주제를 가리지 않고 쓰이는 일반어와 시험 형식어.
const STOPWORDS = new Set([
  "왕", "국가", "나라", "정치", "사회", "경제", "문화", "제도", "설치", "파견", "편찬",
  "시행", "실시", "반란", "전투", "사건", "개혁", "성립", "발전", "변화", "생활", "구조",
  "체제", "정책", "운동", "조직", "인물", "지역", "수도", "왕조", "시대", "전기", "후기",
  "초기", "중기", "말기", "이후", "당시", "사용", "중심", "확대", "강화", "정비", "교류",
  "문제", "자료", "내용", "사실", "설명", "옳은", "다음", "밑줄", "가장", "적절한",
  "이때", "이곳", "이후에", "그리고", "그러나", "또한", "함께", "위해", "위한", "통해",
  "대한", "따라", "모두", "각각", "다시", "결과", "과정", "시기", "이를", "우리",
  "사람", "사람들", "백성", "지배층", "주장", "요구", "활동", "참여", "노력", "성격",
  "목적", "기구", "관청", "관리", "군대", "군사", "지방", "중앙", "전국", "당시에",
  "처음", "최초", "최고", "이러한", "이와", "같은", "다른", "여러", "다양한", "새로운",
  "기존", "일부", "대부분", "전개", "추진", "수립",
  // 서술어에서 조사·어미를 떼면 남는 일반 명사들 — 개념 이름이 아니라 동작이다.
  // ("관료전 지급" 처럼 다른 낱말과 붙은 형태는 그대로 개념으로 남는다.)
  "지급", "반포", "건립", "창설", "결성", "개최", "체결", "발표", "제정", "폐지", "개편",
  "확립", "정벌", "진압", "파병", "주도", "개설", "창건", "축조", "발간", "간행", "창간",
  "발행", "조사", "반대", "지원", "계획", "시작", "완성", "도입", "마련", "설립", "임명",
  "선출", "반환", "부과", "징수", "발생", "제작", "제출", "선포", "선언", "공포", "개정",
  "확대", "축소", "감소", "증가", "이동", "이주", "귀국", "입국", "출범", "해체", "해산",
  "구성", "편성", "배치", "동원", "징발", "공격", "점령", "격퇴", "승리", "패배", "함락",
  "포함", "제외", "허용", "금지", "제한", "명령", "지시", "보고", "논의", "결정", "합의",
  "발견", "출토", "복원", "보존", "지정", "등록",
  // 실측 상위 후보(df 13 이상)를 훑어 고른 일반어. 고유명사(지명·인명·기구명)는 남긴다 —
  // 지역·인물 연계 카드(재설계 문서 §4-1·4-2)가 바로 그 개념을 필요로 한다.
  "무역", "위원회", "정리", "회의", "계기", "저술", "부대", "제시", "정부", "이용", "교육",
  "국민", "작전", "건의", "조약", "양성", "영향", "외교", "작성", "공동", "민족", "파악",
  "사업", "통치", "국왕", "국제", "대비", "창립", "철폐", "처형", "침입", "학교", "학생",
  "기관", "토지", "행정", "인재", "강조", "대학", "무장", "연구", "제국", "투쟁", "행사",
  "건국", "검색", "기본", "개발", "고문", "공인", "기록", "보급", "왕족", "재정", "준비",
  "평화", "확산", "공사", "국내", "권력", "분석", "전사", "장소", "주관", "집필", "채택",
  "규정", "여성", "요청", "장인", "출신", "치안", "탄압", "성사", "반발", "방문", "방향",
  "번성", "차별", "활약", "주조", "문서", "물품", "상품", "외국", "대회", "규범", "관직",
  "개척", "격파", "지방관", "빈민", "임시", "장악", "통일", "항전", "봉기", "농민", "상인",
  "화폐", "연호", "불교", "일제", "항일", "독립", "자유", "시위", "민주", "개헌", "대통령",
  "국회", "남북", "동맹", "교역", "동북", "사신", "광산", "근거지", "정변", "학당", "국권",
  "보상", "왕명", "한국", "독재", "기자", "시장", "도읍", "유교", "무역항", "지주", "노동",
  "농업", "상업", "공업", "수출", "수입", "생산", "재배", "개간", "간척", "유물", "유적",
  // 2차 선별(격차 문서 초안을 읽고 추가) — 뜻이 넓어 카드 주제가 될 수 없는 말
  "거주", "식량", "정복", "석기", "경계", "구역", "혼인", "아래", "유명", "의미", "재상",
  "방식", "장군", "복속", "수용", "영토", "확장", "천도", "무덤", "상대", "장수", "위치",
  "이름", "주요", "유통", "선발", "관제", "경전", "교재", "답사", "내부", "수확", "철제",
  "왜군", "당군", "몽골군", "감독", "담당", "비판", "제거", "등용", "협력", "형성", "회사",
  "견제", "교환", "경찰", "국경", "저항", "전선", "조치", "지침", "축출", "특별", "강제",
  "국정", "기초", "세계", "역사", "유행", "자금", "장기", "전쟁", "공연", "가입", "개창",
  "원인", "신문", "불법", "질서", "존재", "발단", "국호", "대승", "혁파", "중대사", "관등",
  "왕족", "백성들", "우리", "고장", "지역민", "당시인", "사람들", "주민", "가족", "자녀",
  "친척", "형제", "부모", "자손", "후손", "제자", "스승", "동료", "일행", "무리",
  "대표", "방해", "중단", "통제", "진상", "서술", "단체", "교사", "모금", "자치", "서적",
  "학회", "단원", "폭탄", "농촌", "취재", "개통식", "고공", "사회적", "국문", "미군",
  // 국가·왕조명은 단독으로는 개념이 아니다 ("조선 총독부" 처럼 결합형은 그대로 남는다)
  "조선", "고려", "신라", "백제", "고구려", "발해", "부여", "가야", "일본", "중국", "미국",
  "러시아", "소련", "영국", "프랑스", "독일", "청나라", "명나라", "몽골", "거란", "여진",
]);

// 어절 끝에서 그냥 잘라도 되는 조사·어미 (2글자 이상 — 이 형태로 끝나는 고유명사는 없다).
const SAFE_SUFFIXES = [
  "하였습니다", "되었습니다", "하였어요", "되었어요", "이었어요", "하였으며", "되었으며",
  "하였고", "되었고", "시켰다", "하였다", "되었다", "이었다", "였습니다", "합니다", "입니다",
  "하였", "되었", "하여", "되어", "했다", "한다", "된다", "이다", "였다", "이라는", "라는",
  "이라고", "라고", "으로써", "로써", "에서는", "에서도", "에서", "으로", "로서", "에게",
  "에는", "에도", "까지", "부터", "보다", "처럼", "만을", "만이", "등의", "등을", "등이",
  "등은", "등과", "와의", "과의", "하는", "되는", "하며", "되며", "하고", "되고", "하기",
  "되기", "하지", "되지", "시키", "시킨", "당한", "당해", "받은", "받아", "이나", "하게", "되게",
  "라도", "마다", "조차", "이라도", "에서의", "으로의",
];

// 1글자 조사 절단. 명사가 그 글자로 끝나는 일이 없는 조사는 그냥 자른다.
const ALWAYS_STRIP = ["을", "를", "은", "는", "에"];
// 반면 이 글자들은 낱말의 일부일 수 있어(사출도·박제가·민족주의·놀이·깊이·영흥만·군인)
// 데이터로 검증해서 자른다 — 잘라낸 형태가 코퍼스에서 낱말로 쓰일 때만.
const ATTESTED_STRIP = ["의", "이", "가", "와", "과", "도", "로", "만", "등", "인"];
const SINGLE_PARTICLES = [...ALWAYS_STRIP, ...ATTESTED_STRIP];

// 어절이 이렇게 끝나면 서술어(관형형·연결형) 조각이다 → 개념의 일부로도 쓰지 않는다.
// 드물게 명사도 걸린다("피난" 등)는 것을 감수한다 — 문장 조각이 섞이는 손해가 더 크다.
const VERBAL_TAIL = /(는|던|며|하|되|켜|았|었|였|랐|렀|켰|한|된|난|운|린|긴|킨|히|도록|고자)$/;

// 조사·어미를 떼도 남는 기능어·연결어·서술형 조각 — 개념의 일부로도 쓰지 않는다(n-gram 을 끊는다).
// 실측 상위 후보를 훑어 모았다.
const FUNCTION_WORDS = new Set([
  "의해", "되어", "하여", "지어", "보내", "일으켜", "시켜", "삼아", "맞서", "이어", "대해",
  "통해", "위해", "따라", "관해", "하며", "되며", "하고", "되고", "하는", "되는", "하지",
  "않아", "않고", "못해", "가져", "이루", "이룩", "거쳐", "걸쳐", "비롯", "더불", "아울러",
  "등의", "등을", "등이", "등은", "등과", "등에", "등도", "여러", "각종", "모든", "온갖",
  "이러", "그러", "저러", "어떤", "무슨", "누가", "언제", "어디", "얼마", "많은", "적은",
  "높은", "낮은", "넓은", "좁은", "같이", "함께", "서로", "직접", "간접", "특히", "주로",
  "이른", "소위", "이라", "라고", "하기", "되기", "하려", "되려", "하도", "받아", "주어",
  "알아", "알아본", "살펴본", "살펴", "찾아", "만들", "만든", "펼친", "펼쳐", "이끈", "이끌",
  "당한", "당해", "받은", "받는", "치른", "치러", "벌인", "벌어", "일으킨", "일어난",
  "올려", "올린", "세워", "세운", "두어", "옮겨", "옮긴", "읽고", "담은", "담긴", "구성된",
  "정리한", "주장한", "비롯한", "이끌고", "들이", "간의", "지역인", "만나", "만난", "삼은",
  "삼고", "힘쓴", "힘써", "물러난", "이룬", "얻은", "얻어", "잃은", "잃고", "남긴", "남은",
  "늘려", "늘어", "줄여", "줄어", "맡은", "맡아", "지낸", "지내", "지어진", "세워진",
  "만들어", "이어진", "붙여", "불린", "불리", "여겨", "알려", "열린", "열어", "잡은",
  "잡아", "몰아", "몰린", "퍼진", "내린", "내려", "오른", "올라", "떠난", "떠나", "갔던",
  "왔던", "했던", "됐던", "있던", "없던", "다룬", "다뤄", "따른", "따라서", "맞은", "맞아",
  "크게", "당의", "이끄", "에서", "곳을", "곳에", "소를", "이곳", "그곳", "이것", "그것", "여기", "거기",
]);

export interface TopicStat {
  label: string;
  total: number; // 등장 선택지 수
  correct: number;
  distractor: number;
  unknown: number;
  questions: number; // 등장 문항 수
  rounds: string[]; // 등장 회차 라벨 (최신순)
  hoe: number[];
  eraId?: EraId;
  eraSource?: "correct" | "any"; // 시대 판정 근거 (correct = 정답으로 등장한 문항만 사용)
  stageId?: StageId;
  unit?: number;
}

export interface ChoiceRecord {
  hoe: number;
  no: number;
  role: ChoiceRole;
  eraId?: EraId;
  unit?: number;
  text: string; // 로컬 전용
  flat: string; // 로컬 전용 (공백 제거)
}

// 회차별 문항 → 선택지 레코드 (로컬 전용)
export function collectChoices(rounds: ClassifiedRound[]): ChoiceRecord[] {
  const out: ChoiceRecord[] = [];
  for (const round of rounds) {
    for (const q of round.questions) {
      for (const choice of parseChoices(q.text, q.answer).choices) {
        const flat = flattenChoice(choice.text);
        if (flat.length < 6) continue;
        out.push({
          hoe: round.hoe,
          no: q.no,
          role: choice.role,
          eraId: q.eraId,
          unit: q.unit,
          text: normalizeChoice(choice.text),
          flat,
        });
      }
    }
  }
  return out;
}

// 개념 추출용 정규화 — OCR 라틴 잡음·문항 형식 표기·문장부호를 공백으로 바꾼다.
function normalizeChoice(text: string): string {
  return text
    .replace(/\([^)]*\)/g, " ") // 괄호 보충 (OCR 오독이 많다)
    .replace(/\([가-힣]\)/g, " ")
    .replace(/[A-Za-z]+/g, " ")
    // 문제지 머리말·꼬리말 조각. OCR 이 "한국사능 / 력검정시험" 처럼 줄을 갈라 놓아
    // 줄 단위 필터(choices.ts)를 통과해 선택지 끝에 붙는 경우가 있다.
    .replace(/한국사능|력검정시험|능력검정시험|문제지|제\s*\d+\s*회|점\s*\]/g, " ")
    .replace(/[^가-힣0-9·\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isKoreanish(s: string): boolean {
  return (s.match(/[가-힣]/g) ?? []).length >= 2;
}

// 2글자 이상 조사·어미 제거 (반복 적용)
function stripSafeSuffixes(raw: string): string {
  let s = raw.trim().replace(/^[·\s]+|[·\s]+$/g, "");
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of SAFE_SUFFIXES) {
      if (!s.endsWith(suffix)) continue;
      // 떼고 나면 1글자만 남는 어절은 낱말이 아니라 조사 덩어리다("왕으로" → "왕").
      if (s.length - suffix.length < MIN_LABEL_CHARS) return "";
      s = s.slice(0, -suffix.length);
      changed = true;
      break;
    }
  }
  return s;
}

// 코퍼스의 어절 형태 통계 — 1글자 조사를 잘라도 되는지 판정하는 근거.
//   bare      그 형태가 조사 없이 그대로 등장한 횟수
//   particles 그 형태에 붙어 나온 1글자 조사의 종류
// "결과" 는 결과를·결과가·결과로 로 나타나므로 조사 종류가 2개 이상 → 낱말로 인정한다.
// "사출" 은 사출도 하나뿐이라 조사 종류가 1개 → 낱말이 아니라고 보고 "사출도" 를 지킨다.
export interface StemContext {
  bare: Map<string, number>;
  particles: Map<string, Set<string>>;
}

export function buildStemContext(records: ChoiceRecord[]): StemContext {
  const bare = new Map<string, number>();
  const particles = new Map<string, Set<string>>();
  for (const record of records) {
    for (const raw of record.text.split(/[\s·]+/)) {
      const form = stripSafeSuffixes(raw);
      if (form.length < MIN_LABEL_CHARS) continue;
      bare.set(form, (bare.get(form) ?? 0) + 1);
      const last = form.slice(-1);
      if (!SINGLE_PARTICLES.includes(last)) continue;
      const stem = form.slice(0, -1);
      if (stem.length < MIN_LABEL_CHARS) continue;
      let seen = particles.get(stem);
      if (!seen) particles.set(stem, (seen = new Set()));
      seen.add(last);
    }
  }
  return { bare, particles };
}

// 그 형태가 코퍼스에서 '낱말' 로 쓰이는가
function isAttestedWord(stem: string, ctx: StemContext): boolean {
  if ((ctx.bare.get(stem) ?? 0) >= 2) return true;
  return (ctx.particles.get(stem)?.size ?? 0) >= 2;
}

// ---------------------------------------------------------------- 어절 n-gram 빈도

const MAX_WORDS = 3; // 개념 이름은 3어절까지

// 어절에서 조사·어미를 떼어 낸 줄기. 남는 게 1글자 이하면 기능어로 보고 버린다(빈 문자열).
function stemWord(word: string, ctx: StemContext): string {
  let stem = stripSafeSuffixes(word);
  for (;;) {
    const last = stem.slice(-1);
    const stripped = stem.slice(0, -1);
    if (ALWAYS_STRIP.includes(last)) {
      // 조사가 확실하므로 자른다. 자르면 1글자만 남는 말은 개념이 아니다("난을" 등).
      if (stripped.length < MIN_LABEL_CHARS) return "";
      stem = stripped;
      continue;
    }
    if (!ATTESTED_STRIP.includes(last)) break;
    if (stripped.length < MIN_LABEL_CHARS) break;
    // 잘라낸 형태가 코퍼스에서 낱말로 쓰이는 경우에만 자른다.
    // ("고구려의"→"고구려" 는 자르고, "사출도"→"사출"·"박제가"→"박제" 는 자르지 않는다)
    if (!isAttestedWord(stripped, ctx)) break;
    stem = stripped;
  }
  if (stem.length < MIN_LABEL_CHARS) return "";
  if (!/[가-힣0-9]/.test(stem)) return "";
  // 조사·어미를 떼고도 서술어로 끝나면 개념 이름이 아니다 (이 시험 문장은 "…하였다/…어요" 로 끝난다).
  // 이 도메인에 '다' 로 끝나는 명사는 사실상 없다.
  if (/다$/.test(stem)) return "";
  if (/(어요|아요|여요|에요|예요|세요)$/.test(stem)) return "";
  if (VERBAL_TAIL.test(stem)) return "";
  if (FUNCTION_WORDS.has(stem)) return "";
  return stem;
}

// 선택지 하나 → 줄기 어절 배열 (기능어 자리는 끊어 준다 → n-gram 이 문장을 넘지 않게)
export function stemWords(text: string, ctx: StemContext): (string | null)[] {
  return text
    .split(/[\s·]+/)
    .filter(Boolean)
    .map((word) => stemWord(word, ctx) || null);
}

export interface ExtractOptions {
  minDf: number; // 최소 등장 선택지 수 (1~2어절 개념 기준)
  minDfLong: number; // 3어절 개념의 최소 등장 선택지 수
  minStandalone: number; // 더 긴 개념에 흡수되지 않기 위한 추가 등장 수
}

// 선택지 하나에서 뽑은 개념 후보 — 공백 제거 형태(키) → 표기(값).
// 같은 개념의 표기 변형("화폐 정리 사업" / "화폐정리사업")을 합치려고 키를 공백 제거형으로 둔다.
export function recordCandidates(text: string, ctx: StemContext): Map<string, string> {
  const words = stemWords(text, ctx);
  const out = new Map<string, string>();
  for (let i = 0; i < words.length; i += 1) {
    const head = words[i];
    if (!head) continue;
    const parts: string[] = [];
    for (let n = 0; n < MAX_WORDS && i + n < words.length; n += 1) {
      const word = words[i + n];
      if (!word) break; // 기능어 자리에서 n-gram 을 끊는다
      parts.push(word);
      // 일반어(조선·정부·설치 …)만으로 된 이름은 개념이 아니다. 단 "조선 총독부" 처럼
      // 고유한 낱말과 붙으면 개념이 되므로, n-gram 의 일부로 쓰이는 것은 허용한다.
      if (parts.every((p) => STOPWORDS.has(p))) continue;
      if (VERBAL_TAIL.test(word)) continue; // 서술어로 끝나는 조각은 개념 이름이 아니다
      const label = parts.join(" ");
      const flat = label.replace(/\s/g, "");
      if (flat.length < MIN_LABEL_CHARS || flat.length > MAX_LABEL_CHARS) continue;
      if (!isKoreanish(flat)) continue;
      if (!out.has(flat)) out.set(flat, label);
    }
  }
  return out;
}

// 후보 라벨 목록 (통계 없이 라벨만) — 임계값 실험용으로 분리해 둔다.
export function extractLabels(records: ChoiceRecord[], opts: ExtractOptions): string[] {
  const df = new Map<string, number>(); // flat -> 등장 선택지 수
  const surface = new Map<string, Map<string, number>>(); // flat -> 표기별 횟수

  const ctx = buildStemContext(records);
  for (const record of records) {
    for (const [flat, label] of recordCandidates(record.text, ctx)) {
      df.set(flat, (df.get(flat) ?? 0) + 1);
      let byLabel = surface.get(flat);
      if (!byLabel) surface.set(flat, (byLabel = new Map()));
      byLabel.set(label, (byLabel.get(label) ?? 0) + 1);
    }
  }

  // 3어절 후보는 문장 조각일 확률이 높다("황무지 개간권 요구" 같은 유용한 것도 있지만
  // "관련 기록물이 세계" 처럼 지문을 잘라 온 것도 섞인다) → 더 높은 빈도를 요구한다.
  const wordsOf = new Map<string, number>();
  for (const byLabel of surface.values()) {
    const top = pickTop(byLabel);
    if (top) wordsOf.set(top.replace(/\s/g, ""), top.split(" ").length);
  }
  const frequent = [...df.entries()].filter(
    ([flat, count]) => count >= ((wordsOf.get(flat) ?? 1) >= 3 ? opts.minDfLong : opts.minDf)
  );

  // 더 구체적인 개념에 흡수되는 조각 버리기:
  // "관료전" 이 "관료전 지급" 과 거의 같은 횟수로만 등장하면 별도 개념으로 두지 않는다.
  const sorted = frequent.sort((a, b) => b[0].length - a[0].length);
  const kept: string[] = [];
  const dropped = new Set<string>();
  for (const [flat, count] of sorted) {
    let absorbed = false;
    for (const [otherFlat, otherCount] of sorted) {
      if (otherFlat === flat || dropped.has(otherFlat)) continue;
      if (otherFlat.length <= flat.length) continue;
      if (!otherFlat.includes(flat)) continue;
      if (count - otherCount < opts.minStandalone) {
        absorbed = true;
        break;
      }
    }
    if (absorbed) dropped.add(flat);
    else kept.push(flat);
  }

  return kept
    .map((flat) => pickTop(surface.get(flat)!) ?? flat)
    .sort((a, b) => a.localeCompare(b, "ko"));
}

// 라벨별 통계(역할·회차·시대) 집계
export function buildTopics(
  records: ChoiceRecord[],
  labels: string[],
  labelOf: Map<number, string>
): TopicStat[] {
  const stats = new Map<
    string,
    {
      total: number;
      role: Record<ChoiceRole, number>;
      questions: Set<string>;
      hoe: Set<number>;
      era: Map<EraId, number>;
      eraCorrect: Map<EraId, number>;
      unit: Map<number, number>;
    }
  >();
  const labelOfFlat = new Map(labels.map((label) => [label.replace(/\s/g, ""), label]));
  const ctx = buildStemContext(records);

  for (const record of records) {
    for (const flat of recordCandidates(record.text, ctx).keys()) {
      const label = labelOfFlat.get(flat);
      if (!label) continue;
      let stat = stats.get(label);
      if (!stat) {
        stat = {
          total: 0,
          role: { correct: 0, distractor: 0, unknown: 0 },
          questions: new Set(),
          hoe: new Set(),
          era: new Map(),
          eraCorrect: new Map(),
          unit: new Map(),
        };
        stats.set(label, stat);
      }
      stat.total += 1;
      stat.role[record.role] += 1;
      stat.questions.add(`${record.hoe}-${record.no}`);
      stat.hoe.add(record.hoe);
      if (record.eraId) {
        stat.era.set(record.eraId, (stat.era.get(record.eraId) ?? 0) + 1);
        if (record.role === "correct") {
          stat.eraCorrect.set(record.eraId, (stat.eraCorrect.get(record.eraId) ?? 0) + 1);
        }
      }
      if (record.unit) stat.unit.set(record.unit, (stat.unit.get(record.unit) ?? 0) + 1);
    }
  }

  const out: TopicStat[] = [];
  for (const [label, stat] of stats) {
    // 오답 선택지는 일부러 다른 시대의 사실을 섞으므로, 그 문항의 시대는 이 개념의 시대가
    // 아니다. 정답으로 등장한 적이 있으면 그 문항들만으로 시대를 정하고(eraSource "correct"),
    // 없으면 전체 등장 문항의 다수결로 정하되 신뢰도가 낮음을 표시한다("any").
    const fromCorrect = pickTop(stat.eraCorrect);
    const era = fromCorrect ?? pickTop(stat.era);
    const unit = pickTop(stat.unit);
    const hoe = [...stat.hoe].sort((a, b) => b - a);
    out.push({
      label,
      total: stat.total,
      correct: stat.role.correct,
      distractor: stat.role.distractor,
      unknown: stat.role.unknown,
      questions: stat.questions.size,
      rounds: hoe.map((h) => labelOf.get(h) ?? `${h}회`),
      hoe,
      eraId: era,
      eraSource: era === undefined ? undefined : fromCorrect ? "correct" : "any",
      stageId: era ? STAGE_OF_ERA.get(era) : undefined,
      // 단원은 시대가 일치할 때만 신뢰한다 (문항 분류의 최고점 단원)
      unit: unit !== undefined && UNIT_MAP[unit]?.eraId === era ? unit : undefined,
    });
  }
  return out.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "ko"));
}

function pickTop<T>(counts: Map<T, number>): T | undefined {
  let best: T | undefined;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  }
  return best;
}

export type { ChoiceRole };
