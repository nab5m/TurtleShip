// 예상 학습 시간의 근거 데이터 생성기 — src/data/day-time-data.ts 를 만든다.
//
// 카드 낭독 mp3(public/audio/cards/*.mp3)의 **실제 재생 시간**을 단원별로 합산한다.
// 파일 크기 ÷ 비트레이트 같은 추정이 아니라 MPEG 오디오 프레임 헤더를 직접 훑어 프레임 수를 세므로,
// 오차는 마지막 프레임 하나(24kHz Layer3 = 576샘플 = 24ms) 수준이다. ffprobe/ffmpeg 이 없는
// 환경에서도 돌아가야 해서 외부 도구를 쓰지 않는다(의존성 추가 없음).
//
// 사용법: npx tsx scripts/gen-day-time.ts
// 산출물: src/data/day-time-data.ts (자동 생성 — 직접 수정 금지)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getUnitContent } from "@/data/content";
import { UNIT_NUMBERS } from "@/data/curriculum";

const AUDIO_DIR = join(process.cwd(), "public", "audio", "cards");
const OUT_FILE = join(process.cwd(), "src", "data", "day-time-data.ts");

// MPEG 1/2/2.5 Layer III 비트레이트 표 (kbps)
const BITRATES: Record<string, number[]> = {
  "1": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  "2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
};
const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000, 0], // MPEG1
  2: [22050, 24000, 16000, 0], // MPEG2
  0: [11025, 12000, 8000, 0], // MPEG2.5
};

/** mp3 의 재생 시간(초). 프레임 헤더를 끝까지 훑어 샘플 수를 누적한다. */
function mp3Seconds(path: string): number {
  const buf = readFileSync(path);
  let i = 0;

  // ID3v2 태그가 있으면 건너뛴다 (크기는 synchsafe 정수 7비트×4)
  if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const size = (buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9];
    i = 10 + size;
  }

  let samples = 0;
  let rate = 0;
  while (i + 4 <= buf.length) {
    // 프레임 싱크워드 11비트
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) {
      i++;
      continue;
    }
    const versionBits = (buf[i + 1] >> 3) & 0x03; // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
    const layerBits = (buf[i + 1] >> 1) & 0x03; // 1 = Layer III
    const bitrateIdx = (buf[i + 2] >> 4) & 0x0f;
    const rateIdx = (buf[i + 2] >> 2) & 0x03;
    const padding = (buf[i + 2] >> 1) & 0x01;
    if (layerBits !== 1 || versionBits === 1 || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) {
      i++; // 유효한 헤더가 아니다 → 다음 바이트에서 다시 싱크를 찾는다
      continue;
    }
    const sampleRate = SAMPLE_RATES[versionBits][rateIdx];
    const bitrate = BITRATES[versionBits === 3 ? "1" : "2"][bitrateIdx] * 1000;
    if (!sampleRate || !bitrate) {
      i++;
      continue;
    }
    // MPEG1 Layer3 = 1152샘플/프레임, MPEG2·2.5 Layer3 = 576샘플/프레임
    const samplesPerFrame = versionBits === 3 ? 1152 : 576;
    const frameLen =
      Math.floor((samplesPerFrame / 8) * (bitrate / sampleRate)) + padding;
    if (frameLen < 4) {
      i++;
      continue;
    }
    samples += samplesPerFrame;
    rate = sampleRate;
    i += frameLen;
  }
  return rate > 0 ? samples / rate : 0;
}

const audioSeconds: Record<number, number> = {};
const quizCounts: Record<number, number> = {};
let missing = 0;
let measured = 0;
let totalSeconds = 0;

for (const unit of UNIT_NUMBERS) {
  const uc = getUnitContent(unit);
  if (!uc) continue;
  let sum = 0;
  for (const card of uc.cards) {
    const path = join(AUDIO_DIR, `${card.id}.mp3`);
    if (!existsSync(path)) {
      missing++;
      continue;
    }
    sum += mp3Seconds(path);
    measured++;
  }
  audioSeconds[unit] = Math.round(sum);
  quizCounts[unit] = uc.quizzes.length;
  totalSeconds += sum;
}

const fmt = (rec: Record<number, number>) =>
  Object.entries(rec)
    .map(([u, v]) => `  ${u}: ${v},`)
    .join("\n");

const out = `// 자동 생성 파일 — scripts/gen-day-time.ts 가 생성합니다. 직접 수정하지 마세요.
//
// 예상 학습 시간(src/data/day-time.ts)의 근거 데이터.
// UNIT_AUDIO_SECONDS: 단원 카드 낭독 mp3 의 실제 재생 시간 합(초) — MPEG 프레임 헤더를 세어 측정.
// UNIT_QUIZ_COUNT   : 단원 퀴즈 문항 수. 문제 풀이 시간을 문항 수에 비례해 잡기 위한 값.
export const UNIT_AUDIO_SECONDS: Record<number, number> = {
${fmt(audioSeconds)}
};

export const UNIT_QUIZ_COUNT: Record<number, number> = {
${fmt(quizCounts)}
};
`;
writeFileSync(OUT_FILE, out, "utf8");

console.log(
  `측정 ${measured}개 mp3 · 누락 ${missing}개 · 총 ${Math.round(totalSeconds / 60)}분 ` +
    `(단원 ${Object.keys(audioSeconds).length}개)`
);
if (missing > 0) {
  console.error(
    `⚠️ mp3 가 없는 카드 ${missing}장은 0초로 잡혔습니다. gen-audio.ts 를 먼저 완료하세요.`
  );
  process.exitCode = 1;
}
