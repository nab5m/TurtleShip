// 콘텐츠 파일의 imageSearch 검색어를 Wikimedia Commons 실제 이미지 URL로 변환해
// src/data/content/images.ts 를 생성한다.
//
// 사용법: node scripts/resolve-images.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "data", "content");
const OUT_FILE = join(CONTENT_DIR, "images.ts");
const THUMB_WIDTH = 640;
const CONCURRENCY = 4;
const RETRIES = 3;
const TIMEOUT_MS = 15000;
const UA = "korean-history-study-app/1.0 (personal study project)";

// 이미 resolve된 항목을 정규식으로 읽어 병합한다 (네트워크가 불안정해도 여러 번 실행하며 누적).
function loadExisting() {
  if (!existsSync(OUT_FILE)) return {};
  const text = readFileSync(OUT_FILE, "utf8");
  const map = {};
  const re =
    /"(d\d+-[cq]\d+)": \{ src: "([^"]*)", alt: "((?:[^"\\]|\\.)*)", width: (\d+), height: (\d+) \}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    map[m[1]] = {
      src: m[2],
      alt: m[3].replace(/\\"/g, '"'),
      width: Number(m[4]),
      height: Number(m[5]),
    };
  }
  return map;
}

// 1) 콘텐츠 파일에서 (id, title, imageSearch) 추출
function extractItems() {
  const files = readdirSync(CONTENT_DIR).filter((f) => /^days-.*\.ts$/.test(f));
  const items = [];
  for (const f of files) {
    const text = readFileSync(join(CONTENT_DIR, f), "utf8");
    // id / title / imageSearch 필드를 위치 기반으로 스캔해 가장 가까운 선행 id에 연결
    const fieldRe = /(id|title|imageSearch):\s*"((?:[^"\\]|\\.)*)"/g;
    let cur = null;
    let m;
    while ((m = fieldRe.exec(text)) !== null) {
      const [, key, rawVal] = m;
      const val = rawVal.replace(/\\"/g, '"');
      if (key === "id") {
        cur = { id: val, title: "", search: null };
      } else if (key === "title" && cur && !cur.title) {
        cur.title = val;
      } else if (key === "imageSearch" && cur && !cur.search) {
        cur.search = val;
        items.push({ ...cur });
      }
    }
  }
  return items;
}

// 검색어가 실패하면 시도할 간략화 변형들을 만든다 (구체적 → 일반적).
// 핵심 명사가 앞/뒤 어디에 있든 잡히도록 앞·뒤 n-gram을 모두 시도한다.
function queryVariants(search) {
  const words = search.split(/\s+/).filter(Boolean);
  const core = words.filter((w) => !/^(korea|korean|the|of|and|a|an)$/i.test(w));
  const variants = [search];
  if (core.length && core.join(" ") !== search) variants.push(core.join(" "));
  if (core.length > 3) variants.push(core.slice(0, 3).join(" "));
  if (core.length > 2) variants.push(core.slice(-2).join(" ")); // 뒤쪽 2어절(주로 명사구)
  if (core.length > 2) variants.push(core.slice(0, 2).join(" "));
  if (core.length > 3) variants.push(core.slice(-3).join(" "));
  return [...new Set(variants.filter(Boolean))];
}

// 여러 변형을 순서대로 시도해 첫 결과를 반환
async function resolveOne(item) {
  for (const q of queryVariants(item.search)) {
    const found = await queryCommons(q, item);
    if (found) return found;
  }
  return null;
}

// 2) Commons 검색 → 640px 썸네일 URL
async function queryCommons(search, item) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `filetype:bitmap ${search}`,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|size",
    iiurlwidth: String(THUMB_WIDTH),
    origin: "*",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params}`;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) {
        // 429/5xx는 잠시 쉬고 재시도
        if (res.status === 429 || res.status >= 500) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        return null;
      }
      const json = await res.json();
      const pages = json?.query?.pages;
      if (!pages) return null; // 검색 결과 없음
      const candidates = Object.values(pages)
        .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
        .map((p) => p.imageinfo?.[0])
        .filter(Boolean)
        .filter((ii) => ii.thumburl && ii.width >= 120 && ii.height >= 120)
        .filter((ii) => !/\.(svg|pdf|tiff?|djvu)$/i.test(ii.url ?? ""));
      const pick = candidates[0];
      if (!pick) return null;
      return {
        src: pick.thumburl,
        alt: item.title || item.search,
        width: pick.thumbwidth ?? THUMB_WIDTH,
        height: pick.thumbheight ?? THUMB_WIDTH,
      };
    } catch {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return null;
}

async function main() {
  const items = extractItems();
  const map = loadExisting(); // 기존 결과에 누적
  const existingCount = Object.keys(map).length;
  const pending = items.filter((it) => !map[it.id]);
  console.log(
    `imageSearch 항목 ${items.length}개 (기존 ${existingCount}개 유지, ${pending.length}개 조회)`
  );
  let done = 0;
  let ok = 0;

  // 현재 map을 파일로 저장 (중간 저장으로 타임아웃돼도 누적 보존)
  function flush() {
    const entries = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([id, img]) =>
          `  "${id}": { src: "${img.src}", alt: "${img.alt.replace(/"/g, '\\"')}", width: ${img.width}, height: ${img.height} },`
      )
      .join("\n");
    const total = Object.keys(map).length;
    writeFileSync(
      OUT_FILE,
      `import type { ItemImage } from "@/lib/types";\n\n` +
        `// scripts/resolve-images.mjs 가 자동 생성하는 파일 (직접 수정하지 말 것)\n` +
        `// 생성 항목: ${total}/${items.length}\n` +
        `export const IMAGE_MAP: Record<string, ItemImage> = {\n${entries}\n};\n`
    );
  }

  // 제한 동시성으로 순회 (Wikimedia rate limit 배려)
  const queue = [...pending];
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      const img = await resolveOne(item);
      done++;
      if (img) {
        map[item.id] = img;
        ok++;
        if (ok % 5 === 0) flush(); // 5건마다 중간 저장
      }
      if (done % 25 === 0) console.log(`  ${done}/${pending.length} 조회 (신규 성공 ${ok})`);
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const entries = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([id, img]) =>
        `  "${id}": { src: "${img.src}", alt: "${img.alt.replace(/"/g, '\\"')}", width: ${img.width}, height: ${img.height} },`
    )
    .join("\n");

  const total = Object.keys(map).length;
  const out = `import type { ItemImage } from "@/lib/types";

// scripts/resolve-images.mjs 가 자동 생성하는 파일 (직접 수정하지 말 것)
// 생성 항목: ${total}/${items.length}
export const IMAGE_MAP: Record<string, ItemImage> = {
${entries}
};
`;
  writeFileSync(OUT_FILE, out);
  console.log(`완료: 누적 ${total}/${items.length} (이번 신규 ${ok}) → ${OUT_FILE}`);
}

main();
