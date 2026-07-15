// 카카오톡/트위터/페이스북 링크 미리보기용 OG 이미지 생성.
// 표준 권장 크기 1200×630 (1.91:1). sharp로 SVG → PNG.
// 사용법: node scripts/gen-og.mjs
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const RED = "#b5432f";
const CREAM = "#f7edd9";
const PAPER = "#faf9f5";
const INK = "#22201c";
const MUTED = "#877e70";
const FONT = "'Apple SD Gothic Neo', AppleGothic, 'Noto Sans CJK KR', sans-serif";

// 거북선 로고 모티프(512 기준) — 앱 아이콘과 동일
const motif = `
  <g stroke="${CREAM}" stroke-width="15" stroke-linecap="round" fill="none">
    <path d="M92 380 q41 -28 82 0 t82 0 t82 0 t82 0"/>
    <path d="M110 418 q37 -24 74 0 t74 0 t74 0" opacity="0.55"/>
  </g>
  <path d="M124 330 L94 322 L122 346 Z" fill="${CREAM}"/>
  <ellipse cx="182" cy="352" rx="20" ry="14" fill="${CREAM}"/>
  <ellipse cx="322" cy="352" rx="20" ry="14" fill="${CREAM}"/>
  <path d="M118 338 Q118 158 256 158 Q394 158 394 338 Z" fill="${CREAM}"/>
  <rect x="110" y="330" width="292" height="20" rx="10" fill="${CREAM}"/>
  <ellipse cx="420" cy="300" rx="28" ry="21" fill="${CREAM}"/>
  <circle cx="429" cy="293" r="4.5" fill="${RED}"/>
  <g stroke="${RED}" stroke-width="13" fill="none" stroke-linejoin="round" stroke-linecap="round">
    <path d="M256 210 L300 236 L300 288 L256 314 L212 288 L212 236 Z"/>
    <path d="M256 210 L256 174"/><path d="M300 236 L338 214"/><path d="M212 236 L174 214"/>
    <path d="M300 288 L338 310"/><path d="M212 288 L174 310"/>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="24" y="24" width="1152" height="582" rx="30" fill="none" stroke="#e4e0d5" stroke-width="3"/>
  <rect x="0" y="618" width="1200" height="12" fill="${RED}"/>

  <g transform="translate(122 175) scale(0.508)">
    <rect width="512" height="512" rx="112" fill="${RED}"/>
    ${motif}
  </g>

  <text x="470" y="308" font-family="${FONT}" font-size="150" font-weight="800" fill="${RED}">거북선</text>
  <rect x="476" y="336" width="168" height="9" rx="4.5" fill="${RED}"/>
  <text x="476" y="418" font-family="${FONT}" font-size="48" font-weight="700" fill="${INK}">한국사능력검정시험 심화 대비</text>
  <text x="476" y="480" font-family="${FONT}" font-size="37" font-weight="500" fill="${MUTED}">하루 30분 · 90일 완성 · 오프라인 학습</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(root, "public/og.png"));
console.log("완료: public/og.png (1200×630)");
