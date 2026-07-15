// 카드 낭독 오디오(TTS) 생성기.
//
// 무료 뉴럴 TTS(edge-tts, Microsoft Edge 읽어주기 보이스)로 학습 카드를 mp3 로 만든다.
// 보이스: ko-KR-SunHiNeural (여성, 따뜻/친근) · 차분함을 위해 속도 -8%.
//
// 사전 준비(1회):
//   python3 -m venv .venv-tts && .venv-tts/bin/pip install edge-tts
// 실행:
//   EDGE_TTS=.venv-tts/bin/edge-tts npx tsx scripts/gen-audio.ts          # 전체(1~90일)
//   EDGE_TTS=.venv-tts/bin/edge-tts npx tsx scripts/gen-audio.ts 1 2 3    # 특정 일차만
// 옵션(환경변수): CONCURRENCY(기본 5), FORCE=1(기존 파일 덮어쓰기), TTS_VOICE, TTS_RATE
//
// 이미 생성된 파일은 건너뛰므로(FORCE=1 제외) 중단 후 재실행하면 이어서 진행된다.
// 산출물: public/audio/cards/<카드id>.mp3, src/data/audio-manifest.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, writeFileSync, readdirSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getDayContent } from "@/data/content";

const execFileP = promisify(execFile);
const EDGE_TTS = process.env.EDGE_TTS ?? "edge-tts";
const VOICE = process.env.TTS_VOICE ?? "ko-KR-SunHiNeural";
const RATE = process.env.TTS_RATE ?? "-8%";
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? "5"));
const FORCE = process.env.FORCE === "1";
const MAX_RETRY = 4;

const argDays = process.argv
  .slice(2)
  .map(Number)
  .filter((n) => Number.isInteger(n) && n >= 1 && n <= 90);
const targetDays = argDays.length ? argDays : Array.from({ length: 90 }, (_, i) => i + 1);

const OUT_DIR = join(process.cwd(), "public", "audio", "cards");
mkdirSync(OUT_DIR, { recursive: true });

// 카드 낭독 텍스트: 제목을 먼저 짚고(마침표로 쉼), 이어서 본문을 읽는다.
function ttsText(title: string, content: string): string {
  return `${title}.\n${content}`;
}

type Task = { id: string; text: string; out: string };
const tasks: Task[] = [];
for (const day of targetDays) {
  const dc = getDayContent(day);
  if (!dc) continue;
  for (const card of dc.cards) {
    tasks.push({
      id: card.id,
      text: ttsText(card.title, card.content),
      out: join(OUT_DIR, `${card.id}.mp3`),
    });
  }
}

const total = tasks.length;
let done = 0;
let ok = 0;
let skip = 0;
let fail = 0;
const failed: string[] = [];

async function runOne(t: Task): Promise<void> {
  if (!FORCE && existsSync(t.out)) {
    skip++;
    done++;
    return;
  }
  const tmp = join(tmpdir(), `gen-audio-${t.id}.txt`);
  writeFileSync(tmp, t.text, "utf8");
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      await execFileP(
        EDGE_TTS,
        ["--voice", VOICE, `--rate=${RATE}`, "--file", tmp, "--write-media", t.out],
        { timeout: 60000 }
      );
      ok++;
      done++;
      try {
        unlinkSync(tmp);
      } catch {
        // 무시
      }
      if (done % 50 === 0 || done === total) {
        console.log(`  ${done}/${total} · 성공 ${ok} 스킵 ${skip} 실패 ${fail}`);
      }
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * attempt)); // 백오프
    }
  }
  fail++;
  done++;
  failed.push(t.id);
  try {
    unlinkSync(tmp);
  } catch {
    // 무시
  }
  console.error(`  ✗ ${t.id}: ${(lastErr as Error)?.message?.slice(0, 140)}`);
}

async function main() {
  console.log(
    `대상 ${total}개 카드 · voice=${VOICE} rate=${RATE} concurrency=${CONCURRENCY} force=${FORCE}`
  );
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const t = tasks[cursor++];
      await runOne(t);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker)
  );

  // 매니페스트: 디스크에 실제로 존재하는 카드 오디오 id 집합
  const ids = readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => f.replace(/\.mp3$/, ""))
    .sort();
  const manifest = `// 자동 생성 파일 — scripts/gen-audio.ts 가 생성합니다. 직접 수정하지 마세요.
// TTS 낭독 오디오가 준비된 카드 id 집합 (보이스: ${VOICE}).
export const AUDIO_CARD_IDS: ReadonlySet<string> = new Set([
${ids.map((id) => `  "${id}",`).join("\n")}
]);
`;
  writeFileSync(join(process.cwd(), "src", "data", "audio-manifest.ts"), manifest, "utf8");

  console.log(`\n완료: 성공 ${ok}, 스킵 ${skip}, 실패 ${fail} · 매니페스트 ${ids.length}개`);
  if (failed.length) {
    console.log("실패 목록:", failed.join(", "));
    process.exitCode = 1;
  }
}

main();
