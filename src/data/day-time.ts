import { DAY_MAP } from "@/data/curriculum";
import { UNIT_AUDIO_SECONDS, UNIT_QUIZ_COUNT } from "@/data/day-time-data";

// 한 일차의 예상 소요시간.
//
// 근거 데이터는 추정이 아니라 실측이다 — `scripts/gen-day-time.ts` 가
// public/audio/cards/*.mp3 의 MPEG 프레임을 세어 단원별 낭독 시간을 뽑고,
// 단원별 퀴즈 문항 수를 함께 넣는다(src/data/day-time-data.ts, 자동 생성).
// 카드를 고치거나 음성을 다시 만들면 `npx tsx scripts/gen-day-time.ts` 로 갱신한다.

// 문항 하나를 읽고 답을 고르고 해설을 확인하는 데 걸리는 시간(초).
// 예전 공식은 "단원당 180초(12~14문항)" 고정이었다 → 문항당 약 14초. 단원마다 문항 수가
// 크게 다르면(통합된 선사 단원은 55문항) 단원 단위 상수가 어긋나므로, 같은 14초를 문항 수에 곱한다.
export const QUIZ_SECONDS_PER_QUESTION = 14;

// 그날 묶인 단원들의 낭독 시간 + 문항 수 × 문항당 시간, 분 단위 반올림.
export function estimatedMinutes(day: number): number {
  const units = DAY_MAP[day]?.units ?? [];
  const seconds = units.reduce(
    (sum, u) =>
      sum +
      (UNIT_AUDIO_SECONDS[u] ?? 0) +
      (UNIT_QUIZ_COUNT[u] ?? 0) * QUIZ_SECONDS_PER_QUESTION,
    0
  );
  return Math.max(1, Math.round(seconds / 60));
}
