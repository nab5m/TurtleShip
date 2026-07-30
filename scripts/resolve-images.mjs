// 콘텐츠 파일의 카드 주제에 맞는 이미지를 찾아 src/data/content/images.ts 를 생성한다.
//
// 매칭 우선순위 (주제에 가장 잘 맞는 대표 이미지부터):
//   1) 한국어 위키백과 문서의 대표이미지 (카드 제목 기준) — 유물/지도/인물이 잘 맞음
//   2) 영어 위키백과 상위 문서의 대표이미지 (imageSearch 기준)
//   3) Wikimedia Commons 자유검색 (안내판·라벨 사진 필터 + 첫 유효 결과)
// ⚠️ 저작권: 이 스크립트가 "자동으로" 고르는 이미지는 upload.wikimedia.org/wikipedia/commons/
//    (자유 라이선스)만 채택한다. 한국어/영어 위키 자체 업로드(/wikipedia/ko|en/)는
//    공정이용(비자유)이 많아 제외.
//    반면 src/data/content/image-overrides.ts 에 손으로 등록한 항목(오버라이드·alias)은
//    운영자가 출처를 직접 확인하고 고른 것이므로 이 Commons 전용 규칙의 예외다.
//    그 id 들은 아래에서 조회 대상에서 제외하므로 이 스크립트가 덮어쓰지 않는다.
// 기존 이미지는 새 결과를 찾았을 때만 교체한다(못 찾으면 유지 → 회귀 방지).
// imageSearch 가 없는 항목은 후보로 수집되지 않는다 → 사진을 뻀 항목이 되살아나지 않는다.
//
// 사용법: node scripts/resolve-images.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "data", "content");
const OUT_FILE = join(CONTENT_DIR, "images.ts");
const OVERRIDE_FILE = join(CONTENT_DIR, "image-overrides.ts");
const THUMB = 640;
const CONCURRENCY = 2;
const RETRIES = 3;
const TIMEOUT_MS = 15000;
const UA = "korean-history-study-app/1.0 (personal study project; contact via github.com/nab5m/TurtleShip)";

const KO_API = "https://ko.wikipedia.org/w/api.php";
const EN_API = "https://en.wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

// 자유 라이선스(Commons)만 허용
const isCommons = (u) =>
  typeof u === "string" && u.includes("upload.wikimedia.org/wikipedia/commons/");

// 유물/지도가 아니라 안내판·설명·라벨 위주인 파일명 제외
const SIGNAGE =
  /(signage|sign[\s_-]?board|information|info[\s_-]?panel|info[\s_-]?board|\blabel\b|plaque|placard|nameplate|explanat|caption|notice|안내|설명문?|표지판?|간판)/i;

async function apiGet(base, paramsObj) {
  const params = new URLSearchParams({ format: "json", origin: "*", ...paramsObj });
  const url = `${base}?${params}`;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return null;
}

function pickThumb(pages) {
  if (!pages) return null;
  const pg = Object.values(pages).sort((a, b) => (a.index ?? 99) - (b.index ?? 99))[0];
  const t = pg?.thumbnail;
  if (t?.source && isCommons(t.source)) {
    return { src: t.source, width: t.width ?? THUMB, height: t.height ?? THUMB };
  }
  return null;
}

// 1) 한국어 위키백과 대표이미지 (제목)
async function koWikiLead(title) {
  if (!title) return null;
  const json = await apiGet(KO_API, {
    action: "query",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(THUMB),
    redirects: "1",
    titles: title,
  });
  return pickThumb(json?.query?.pages);
}

// 2) 영어 위키백과 상위 문서 대표이미지 (검색어)
async function enWikiLead(query) {
  if (!query) return null;
  const json = await apiGet(EN_API, {
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "1",
    gsrnamespace: "0",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(THUMB),
  });
  return pickThumb(json?.query?.pages);
}

// 검색어 간략화 변형 (구체적 → 일반적)
function queryVariants(search) {
  const words = search.split(/\s+/).filter(Boolean);
  const core = words.filter((w) => !/^(korea|korean|the|of|and|a|an)$/i.test(w));
  const v = [search];
  if (core.length && core.join(" ") !== search) v.push(core.join(" "));
  if (core.length > 3) v.push(core.slice(0, 3).join(" "));
  if (core.length > 2) v.push(core.slice(-2).join(" "));
  if (core.length > 2) v.push(core.slice(0, 2).join(" "));
  return [...new Set(v.filter(Boolean))];
}

// 3) Commons 자유검색 (안내판/라벨 제외, 첫 유효 결과)
async function commonsSearch(item) {
  for (const q of queryVariants(item.search)) {
    const json = await apiGet(COMMONS_API, {
      action: "query",
      generator: "search",
      gsrsearch: `filetype:bitmap ${q}`,
      gsrnamespace: "6",
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url|size",
      iiurlwidth: String(THUMB),
    });
    const pages = json?.query?.pages;
    if (!pages) continue;
    const cand = Object.values(pages)
      .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
      .filter((p) => !SIGNAGE.test(p.title ?? ""))
      .map((p) => p.imageinfo?.[0])
      .filter(Boolean)
      .filter((ii) => ii.thumburl && isCommons(ii.thumburl))
      .filter((ii) => ii.width >= 120 && ii.height >= 120)
      .filter((ii) => !/\.(svg|pdf|tiff?|djvu)$/i.test(ii.url ?? ""));
    const pick = cand[0];
    if (pick) {
      return {
        src: pick.thumburl,
        alt: item.title || item.search,
        width: pick.thumbwidth ?? THUMB,
        height: pick.thumbheight ?? THUMB,
      };
    }
  }
  return null;
}

async function resolveOne(item) {
  const ko = await koWikiLead(item.title);
  if (ko) return { ...ko, alt: item.title || item.search };
  const en = await enWikiLead(item.search);
  if (en) return { ...en, alt: item.title || item.search };
  return await commonsSearch(item);
}

// 기존 images.ts 를 읽어 병합 (새 결과 없으면 유지)
function loadExisting() {
  if (!existsSync(OUT_FILE)) return {};
  const text = readFileSync(OUT_FILE, "utf8");
  const map = {};
  const re =
    /"(d\d+-[cq]\d+)": \{ src: "([^"]*)", alt: "((?:[^"\\]|\\.)*)", width: (\d+), height: (\d+) \}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    map[m[1]] = { src: m[2], alt: m[3].replace(/\\"/g, '"'), width: Number(m[4]), height: Number(m[5]) };
  }
  return map;
}

// image-overrides.ts 에 손으로 등록한 id (IMAGE_OVERRIDES · IMAGE_ALIASES 양쪽 키)
// → 조회도 하지 않고 images.ts 에도 손대지 않는다 (API 호출 낭비·덮어쓰기 방지)
function loadCuratedIds() {
  if (!existsSync(OVERRIDE_FILE)) return new Set();
  const text = readFileSync(OVERRIDE_FILE, "utf8");
  return new Set([...text.matchAll(/^\s*"(d\d+-[cq]\d+)":/gm)].map((m) => m[1]));
}

// 콘텐츠에서 (id, title, imageSearch) 추출
function extractItems() {
  const files = readdirSync(CONTENT_DIR).filter((f) => /^days-.*\.ts$/.test(f));
  const items = [];
  for (const f of files) {
    const text = readFileSync(join(CONTENT_DIR, f), "utf8");
    const fieldRe = /(id|title|imageSearch):\s*"((?:[^"\\]|\\.)*)"/g;
    let cur = null;
    let m;
    while ((m = fieldRe.exec(text)) !== null) {
      const [, key, rawVal] = m;
      const val = rawVal.replace(/\\"/g, '"');
      if (key === "id") cur = { id: val, title: "", search: null };
      else if (key === "title" && cur && !cur.title) cur.title = val;
      else if (key === "imageSearch" && cur && !cur.search) {
        cur.search = val;
        items.push({ ...cur });
      }
    }
  }
  return items;
}

function serialize(map, total, itemsLen) {
  const entries = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([id, img]) =>
        `  "${id}": { src: "${img.src}", alt: "${img.alt.replace(/"/g, '\\"')}", width: ${img.width}, height: ${img.height} },`
    )
    .join("\n");
  return (
    `import type { ItemImage } from "@/lib/types";\n\n` +
    `// scripts/resolve-images.mjs 가 자동 생성하는 파일 (직접 수정하지 말 것)\n` +
    `// 위키백과 대표이미지 우선 · Wikimedia Commons(자유 라이선스)만 · 생성 항목: ${total}/${itemsLen}\n` +
    `export const IMAGE_MAP: Record<string, ItemImage> = {\n${entries}\n};\n`
  );
}

async function main() {
  const items = extractItems();
  const map = loadExisting();
  const curated = loadCuratedIds();
  const onlyMissing = process.argv.includes("--missing");
  const candidates = items.filter((it) => !curated.has(it.id));
  const queue = onlyMissing ? candidates.filter((it) => !map[it.id]) : [...candidates];
  console.log(
    `imageSearch ${items.length}개 · 손지정 제외 ${items.length - candidates.length}개 · ` +
      `기존 ${Object.keys(map).length}개 · 이번 처리 ${queue.length}개` +
      (onlyMissing ? " (누락만)" : " (전체 재조회)")
  );
  const searchable = new Set(items.map((it) => it.id));
  const stale = Object.keys(map).filter((id) => !searchable.has(id));
  if (stale.length > 0) {
    console.log(`  참고: imageSearch 가 사라진 잔여 엔트리 ${stale.length}개 (노출에는 쓰이지 않음)`);
  }
  let done = 0;
  let replaced = 0;

  function flush() {
    writeFileSync(OUT_FILE, serialize(map, Object.keys(map).length, items.length));
  }

  const q = [...queue];
  async function worker() {
    while (q.length > 0) {
      const item = q.shift();
      const img = await resolveOne(item);
      done++;
      if (img) {
        const before = map[item.id]?.src;
        map[item.id] = img;
        if (before !== img.src) replaced++;
        if (replaced % 5 === 0) flush();
      }
      if (done % 20 === 0) console.log(`  ${done}/${queue.length} (교체/신규 ${replaced})`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  flush();
  console.log(`완료: 누적 ${Object.keys(map).length}/${items.length} · 교체/신규 ${replaced} → ${OUT_FILE}`);
}

main();
