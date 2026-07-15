"use client";

import Link from "next/link";
import { DAYS, ERAS } from "@/data/curriculum";
import { REVIEW_INTERVALS } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { learnHref } from "@/lib/day-slug";
import { CheckIcon } from "@/components/icons";

export default function CurriculumPage() {
  const { ready, progress } = useProgress();
  const nextDay = DAYS.find((d) => !progress.completed[d.day])?.day;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">90일 커리큘럼</h1>
        <p className="mt-1 text-sm text-muted">
          구석기부터 현대까지 시대 흐름을 따라 하루 30분씩 학습합니다.
        </p>
      </div>

      {ERAS.map((era) => {
        const daysInEra = DAYS.filter((d) => d.eraId === era.id);
        const doneCount = daysInEra.filter((d) => progress.completed[d.day]).length;
        return (
          <section key={era.id}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="flex items-center gap-2 font-bold">
                <span className="h-4 w-1.5 rounded-full" style={{ backgroundColor: era.color }} />
                {era.name}
                <span className="text-xs font-normal text-muted">{era.period}</span>
              </h2>
              <span className="text-xs text-muted">
                {doneCount}/{daysInEra.length}
              </span>
            </div>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {daysInEra.map((d, i) => {
                const rec = ready ? progress.completed[d.day] : undefined;
                const isNext = ready && d.day === nextDay;
                return (
                  <li
                    key={d.day}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-card-muted ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <Link
                      href={learnHref(d.day)}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          rec ? "text-white" : "bg-card-muted text-muted"
                        }`}
                        style={rec ? { backgroundColor: era.color } : undefined}
                      >
                        {rec ? <CheckIcon className="h-4 w-4" /> : d.day}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          Day {d.day} · {d.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {rec
                            ? `${rec.date} 학습 · ${rec.score}/${rec.total}점 · 복습 ${rec.reviewDates.length}/${REVIEW_INTERVALS.length}`
                            : d.topics[0]}
                        </span>
                      </span>
                      {isNext && (
                        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
                          오늘의 학습
                        </span>
                      )}
                    </Link>
                    {rec && rec.reviewDates.length < REVIEW_INTERVALS.length && (
                      <Link
                        href={`/review/${d.day}`}
                        className="shrink-0 rounded-full bg-review-soft px-2.5 py-1 text-[11px] font-bold text-review hover:opacity-80"
                      >
                        복습
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
