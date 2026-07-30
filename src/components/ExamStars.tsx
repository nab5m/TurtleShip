import { EXAM_FREQUENCY, EXAM_COVERAGE } from "@/data/exam-frequency";

// 학습 카드에 표시하는 '기출 별점'.
// 별점 = 한능검 심화 기출 22개 회차의 **선택지 전체**(정답+오답)에 이 주제가 등장한 횟수의
// 구간 점수(1/2/3/5/8회 이상 = 1~5점). 한능검 선택지는 정답이든 오답이든 그 자체로 사실인
// 문장이라 오답 선택지도 '출제된 개념' 한 개로 센다 — 정답으로 나온 횟수는 따로 표시한다.
// 별점 아래에 언제·얼마나 나왔는지 표기하고, 등장 기록이 없는 카드는 렌더하지 않는다.
export default function ExamStars({
  cardId,
  className = "",
}: {
  cardId: string;
  className?: string;
}) {
  const freq = EXAM_FREQUENCY[cardId];
  if (!freq) return null;

  const first = EXAM_COVERAGE.rounds[0];
  const last = EXAM_COVERAGE.rounds[EXAM_COVERAGE.rounds.length - 1];
  const coverageHint = `한능검 심화 기출 최근 ${EXAM_COVERAGE.examCount}개 회차(${last}~${first})의 선택지 전체(정답+오답) 기준입니다. 오답 선택지도 그 자체로는 사실인 문장이므로 출제된 개념 한 개로 셉니다. ${EXAM_COVERAGE.note}`;
  const roundsText = freq.rounds
    .map((r) => (r.count > 1 ? `${r.label}(${r.count})` : r.label))
    .join(", ");

  return (
    <div className={className} title={coverageHint}>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex"
          role="img"
          aria-label={`기출 선택지 별점 5점 만점에 ${freq.stars}점`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} filled={i <= freq.stars} />
          ))}
        </span>
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">
          기출 선택지 {freq.total}회
          {freq.correct > 0 ? ` (정답 ${freq.correct}회)` : ""}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">
        {roundsText} 출제
      </p>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 ${filled ? "text-amber-500" : "text-border"}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95z" />
    </svg>
  );
}
