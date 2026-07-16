import { EXAM_FREQUENCY, EXAM_COVERAGE } from "@/data/exam-frequency";

// 학습 카드에 표시하는 '기출 정답 별점'.
// 별점 = 한능검 심화 기출(텍스트 추출 가능한 최근 회차)의 정답 선택지에 이 주제가
// 출제된 횟수(최대 5). 별점 아래에 언제·얼마나 출제됐는지 표기. 미출제 카드는 렌더 안 함.
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
  const coverageHint = `한능검 심화 기출 최근 ${EXAM_COVERAGE.examCount}개 회차(${last}~${first})의 정답 선택지 기준입니다. ${EXAM_COVERAGE.note}`;
  const roundsText = freq.rounds
    .map((r) => (r.count > 1 ? `${r.label}(${r.count})` : r.label))
    .join(", ");

  return (
    <div className={className} title={coverageHint}>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex"
          role="img"
          aria-label={`기출 정답 별점 5점 만점에 ${freq.stars}점`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} filled={i <= freq.stars} />
          ))}
        </span>
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">
          기출 정답 {freq.total}회
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
