// 문항 텍스트 → 선택지 단위 분해 (정답/오답 역할 포함).
//
// 왜 별도 분리기가 필요한가: 한능검 문제지는 2단 편집이고 OCR(macOS Vision)이 원문자(①~⑤)를
// 자주 놓친다(실측: 5,465개 중 4,866개만 인식 = 89%, ① 은 1,093문항 중 825개만 인식).
// 기존 splitQuestion()은 ①→②→③ 순서대로 나타난다고 가정해서, ① 하나만 놓쳐도 그 문항의
// 선택지 전부를 잃는다(58.3% 문항만 5개 분리 성공).
//
// 그래서 이 분리기는
//   1) 원문자를 순서와 무관하게 "번호가 붙은 지점"으로 취급하고(2단 편집으로 순서가 섞임),
//   2) 선택지 한 개 = 문장 한 개라는 성질을 이용해, 원문자가 유실된 선택지도
//      앞 선택지 뒤에 붙은 여분 문장(orphan)으로 되살린다.
//   3) 빠진 번호가 정확히 하나이고 여분 문장도 정확히 하나면 그 번호로 확정하고,
//      아니면 역할을 'unknown'(정답/오답 미확정)으로 남긴다 — 추측해서 정답으로 세지 않는다.
//
// ⚠️ 이 파일이 다루는 값(문항·선택지 텍스트)은 전부 로컬 전용이다. 커밋 대상 산출물에는
//    선택지 원문을 넣지 않는다(저작권: 국사편찬위원회).
const CIRCLED = "①②③④⑤";

export type ChoiceRole = "correct" | "distractor" | "unknown";

export interface ParsedChoice {
  no?: number; // 1~5 (원문자로 확인된 경우에만)
  text: string;
  role: ChoiceRole;
}

export interface ParsedChoices {
  body: string; // 발문 + 지문
  choices: ParsedChoice[];
}

// 문제지 머리말·꼬리말 등 문항 내용이 아닌 줄
function isNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/능력검정시험|문제지|^제?\s*\d+\s*회$/.test(t)) return true;
  if (/^[\[(]?\s*\d?\s*점\s*[\])]?$/.test(t)) return true; // "3점]", "12점]"
  return false;
}

// 선택지는 대개 "…하였다." / "…이다." / "…있었어요." 같이 한 문장으로 끝난다.
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[다요][.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseChoices(text: string, answer?: number): ParsedChoices {
  const segments: { no?: number; text: string }[] = [{ text: "" }];
  const seen = new Set<number>();

  for (const rawLine of text.split("\n")) {
    if (isNoiseLine(rawLine)) continue;
    let rest = rawLine;
    let guard = 0;
    while (guard++ < 10) {
      let cut = -1;
      let no = 0;
      for (let i = 0; i < rest.length; i += 1) {
        const idx = CIRCLED.indexOf(rest[i]);
        if (idx >= 0) {
          cut = i;
          no = idx + 1;
          break;
        }
      }
      if (cut < 0) break;
      const head = rest.slice(0, cut).trim();
      if (head) segments[segments.length - 1].text += ` ${head}`;
      // 같은 번호가 두 번 나오면(지문 안의 번호 등) 뒤쪽은 번호 없는 조각으로 둔다
      segments.push(seen.has(no) ? { text: "" } : { no, text: "" });
      seen.add(no);
      rest = rest.slice(cut + 1);
    }
    if (rest.trim()) segments[segments.length - 1].text += ` ${rest.trim()}`;
  }

  const body = segments[0].text.trim();
  const marked = new Map<number, string>();
  const orphans: string[] = [];
  for (const segment of segments.slice(1)) {
    const sentences = splitSentences(segment.text.trim());
    if (sentences.length === 0) continue;
    if (segment.no && !marked.has(segment.no)) {
      // 원문자 바로 뒤 첫 문장이 그 번호의 선택지이고, 남는 문장은 번호가 유실된 선택지다
      marked.set(segment.no, sentences[0]);
      orphans.push(...sentences.slice(1));
    } else {
      orphans.push(...sentences);
    }
  }

  // 한 문항의 선택지는 반드시 5개다 → 번호 없는 문장은 "빠진 번호 수"만큼만 인정한다.
  // (지문이 2단 편집으로 선택지 뒤에 붙거나 지문 안에 번호가 있는 문항에서 문장이 과하게
  //  쏟아지는 것을 막는다. 실측: 상한을 두지 않으면 한 문항에서 29개까지 나왔다.)
  const slots = 5 - marked.size;
  const usable = orphans.filter(isChoiceLike).slice(0, Math.max(0, slots));

  // 빠진 번호가 하나뿐이고 번호 없는 문장도 하나뿐이면 대응이 유일하다 → 번호를 확정한다
  const missing = [1, 2, 3, 4, 5].filter((n) => !marked.has(n));
  const recovered = [...usable];
  if (missing.length === 1 && recovered.length === 1) {
    marked.set(missing[0], recovered.pop()!);
  }

  const choices: ParsedChoice[] = [];
  for (const no of [1, 2, 3, 4, 5]) {
    const value = marked.get(no);
    if (!value) continue;
    const role: ChoiceRole = answer ? (no === answer ? "correct" : "distractor") : "unknown";
    choices.push({ no, text: value, role });
  }
  for (const orphan of recovered) choices.push({ text: orphan, role: "unknown" });
  return { body, choices };
}

// 번호를 잃은 문장이 "선택지처럼 보이는가" — 지문 조각·인용문을 걸러낸다.
function isChoiceLike(text: string): boolean {
  const flat = flattenChoice(text);
  if (flat.length < 6 || flat.length > 90) return false;
  if (/[『』「」]/.test(flat)) return false; // 인용 출처가 붙은 지문
  if (/^[-–—]/.test(text.trim())) return false; // "- 『삼국사기』 -" 형태의 출처 줄
  return /(다|요)[.?!]?$/.test(flat);
}

// 선택지 텍스트 정규화 — OCR 잡음(라틴 문자 덩어리·괄호 안 오독)과 공백을 없앤 비교용 문자열.
export function flattenChoice(text: string): string {
  return text.replace(/\s+/g, "");
}
