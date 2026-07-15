// 카드 낭독 오디오(TTS) 생성기.
//
// 무료 뉴럴 TTS(edge-tts, Microsoft Edge 읽어주기 보이스)로 학습 카드를 mp3 로 만든다.
// 보이스: ko-KR-SunHiNeural (여성, 따뜻/친근) · 차분함을 위해 속도 -8%.
//
// 사전 준비(1회):
//   python3 -m venv .venv-tts && .venv-tts/bin/pip install edge-tts
// 실행(예: 1일차):
//   EDGE_TTS=.venv-tts/bin/edge-tts npx tsx scripts/gen-audio.ts 1
//   (여러 일차: ... scripts/gen-audio.ts 1 2 3)
//
// 산출물: public/audio/cards/<카드id>.mp3, src/data/audio-manifest.ts
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getDayContent } from "@/data/content";

const EDGE_TTS = process.env.EDGE_TTS ?? "edge-tts";
const VOICE = process.env.TTS_VOICE ?? "ko-KR-SunHiNeural";
const RATE = process.env.TTS_RATE ?? "-8%";

const argDays = process.argv
  .slice(2)
  .map(Number)
  .filter((n) => Number.isInteger(n) && n >= 1 && n <= 90);
const targetDays = argDays.length ? argDays : [1];

const OUT_DIR = join(process.cwd(), "public", "audio", "cards");
const TMP = join(tmpdir(), "gen-audio-tts.txt");
mkdirSync(OUT_DIR, { recursive: true });

// 카드 낭독 텍스트: 제목을 먼저 짚고(마침표로 쉼), 이어서 본문을 읽는다.
function ttsText(title: string, content: string): string {
  return `${title}.\n${content}`;
}

let ok = 0;
let fail = 0;
for (const day of targetDays) {
  const dc = getDayContent(day);
  if (!dc) {
    console.warn(`day ${day}: 콘텐츠 없음, 건너뜀`);
    continue;
  }
  console.log(`\n=== Day ${day} · ${dc.cards.length}개 카드 (voice=${VOICE}, rate=${RATE}) ===`);
  for (const card of dc.cards) {
    const out = join(OUT_DIR, `${card.id}.mp3`);
    writeFileSync(TMP, ttsText(card.title, card.content), "utf8");
    try {
      execFileSync(
        EDGE_TTS,
        ["--voice", VOICE, `--rate=${RATE}`, "--file", TMP, "--write-media", out],
        { stdio: "pipe" }
      );
      ok++;
      console.log(`  ✓ ${card.id}  ${card.title}`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${card.id}  ${(e as Error).message}`);
    }
  }
}

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

try {
  unlinkSync(TMP);
} catch {
  // 무시
}

console.log(`\n완료: 성공 ${ok}, 실패 ${fail} · 매니페스트 ${ids.length}개 (public/audio/cards)`);
