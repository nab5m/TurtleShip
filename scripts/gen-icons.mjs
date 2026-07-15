// 거북선 PWA 아이콘 생성 (인장 붉은색 바탕 + 거북 등껍질·물결 = 거북선).
// sharp로 SVG를 PNG로 래스터화한다.
// 사용법: node scripts/gen-icons.mjs
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const RED = "#b5432f"; // 인장 붉은색
const CREAM = "#f7edd9"; // 한지 크림

// 거북선 모티프(512 캔버스 기준). 등껍질 돔 + 육각 무늬 + 머리·꼬리·발 + 물결.
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
    <path d="M256 210 L256 174"/>
    <path d="M300 236 L338 214"/>
    <path d="M212 236 L174 214"/>
    <path d="M300 288 L338 310"/>
    <path d="M212 288 L174 310"/>
  </g>`;

// 둥근 사각(파비콘·일반 아이콘)
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${RED}"/>
  ${motif}
</svg>`;

// 마스커블/애플용: 꽉 찬 사각 + 세이프존 위해 모티프 78% 축소
const masked = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${RED}"/>
  <g transform="translate(56 56) scale(0.78)">${motif}</g>
</svg>`;

async function png(svg, size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log("  ✓", outPath.replace(root + "/", ""), `${size}x${size}`);
}

// 파비콘용 SVG (Next app/icon.svg 규칙)
writeFileSync(join(root, "src/app/icon.svg"), rounded);
console.log("  ✓ src/app/icon.svg");

await png(rounded, 192, join(root, "public/icons/icon-192.png"));
await png(rounded, 512, join(root, "public/icons/icon-512.png"));
await png(masked, 512, join(root, "public/icons/maskable-512.png"));
// iOS 홈화면 아이콘 (불투명, Next app/apple-icon.png 규칙)
await png(masked, 180, join(root, "src/app/apple-icon.png"));
console.log("완료: PWA 아이콘 생성");
