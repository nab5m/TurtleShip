"use client";

import Link from "next/link";
import { useState } from "react";
import { DAYS, ERA_MAP, STAGES, TOTAL_DAYS } from "@/data/curriculum";
import { REVIEW_INTERVALS, dayUnitProgress } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { learnHref } from "@/lib/day-slug";
import { estimatedMinutes } from "@/data/day-time";
import { CheckIcon, ChevronRightIcon } from "@/components/icons";
import ExamShareSummary from "@/components/ExamShareSummary";

export default function CurriculumPage() {
  const { ready, progress } = useProgress();
  const nextDay = DAYS.find((d) => !progress.completed[d.day])?.day;
  // 펼쳐진 일차 (한 번에 하나) — 그 일차가 어떤 단원으로 이뤄지는지 보여 준다
  const [openDay, setOpenDay] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{TOTAL_DAYS}일 커리큘럼</h1>
        <p className="mt-1 text-sm text-muted">
          구석기부터 현대까지 시대 흐름을 따라 하루 30분씩 학습합니다. 하루에 소주제 2~4개를
          묶어 4주 만에 한 바퀴 돌립니다.
        </p>
      </div>

      <ExamShareSummary />

      {STAGES.map((stage) => {
        const daysInStage = DAYS.filter(
          (d) => d.day >= stage.dayRange[0] && d.day <= stage.dayRange[1]
        );
        const doneCount = daysInStage.filter((d) => progress.completed[d.day]).length;
        return (
          <section key={stage.id}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="flex items-center gap-2 font-bold">
                <span className="h-4 w-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                {stage.name}
                <span className="text-xs font-normal text-muted">{stage.period}</span>
              </h2>
              <span className="text-xs text-muted">
                {doneCount}/{daysInStage.length}
              </span>
            </div>
            {stage.eraIds.length > 1 && (
              <p className="mb-1.5 px-1 text-[11px] text-muted">
                {stage.eraIds.map((id) => ERA_MAP[id].name).join(" · ")}
              </p>
            )}
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {daysInStage.map((d, i) => {
                const rec = ready ? progress.completed[d.day] : undefined;
                const isNext = ready && d.day === nextDay;
                const unitProg = ready ? dayUnitProgress(progress, d.day, d.units) : null;
                // 완료 전 일차의 단원 단위 중간 저장 진행도 (0 < studied < total 일 때만 노출)
                const inProgress = !rec && unitProg !== null && unitProg.studied > 0;
                const open = openDay === d.day;
                return (
                  <li key={d.day} className={i > 0 ? "border-t border-border" : ""}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-card-muted">
                    <button
                      type="button"
                      onClick={() => setOpenDay(open ? null : d.day)}
                      aria-expanded={open}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          rec ? "text-white" : "bg-card-muted text-muted"
                        }`}
                        style={rec ? { backgroundColor: stage.color } : undefined}
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
                            : inProgress
                              ? `${unitProg.studied}/${unitProg.total}단원 학습 완료 · 이어서 학습하기`
                              : d.unitTitles.join(" · ")}
                        </span>
                      </span>
                      {isNext && (
                        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
                          오늘의 학습
                        </span>
                      )}
                      <ChevronRightIcon
                        className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                          open ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {inProgress ? (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
                        {unitProg.studied}/{unitProg.total}단원
                      </span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-muted">
                        약 {estimatedMinutes(d.day)}분
                      </span>
                    )}
                    {rec && rec.reviewDates.length < REVIEW_INTERVALS.length && (
                      <Link
                        href={`/review/${d.day}`}
                        className="shrink-0 rounded-full bg-review-soft px-2.5 py-1 text-[11px] font-bold text-review hover:opacity-80"
                      >
                        복습
                      </Link>
                    )}
                    </div>

                    {open && (
                      <div className="border-t border-border bg-card-muted/40 px-4 py-3">
                        <ul className="space-y-1.5">
                          {d.units.map((u, idx) => {
                            // 완료된 일차는 모든 단원을 마친 것으로 본다
                            const done = rec ? true : (unitProg?.studiedFlags[idx] ?? false);
                            return (
                              <li key={u} className="flex items-center gap-2">
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                    done ? "text-white" : "bg-card text-muted"
                                  }`}
                                  style={done ? { backgroundColor: stage.color } : undefined}
                                >
                                  {done ? <CheckIcon className="h-3 w-3" /> : idx + 1}
                                </span>
                                <span
                                  className={`min-w-0 flex-1 truncate text-xs ${
                                    done ? "font-semibold" : "text-muted"
                                  }`}
                                >
                                  {d.unitTitles[idx]}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <Link
                          href={learnHref(d.day)}
                          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                        >
                          {rec ? "다시 학습하기" : inProgress ? "이어서 학습하기" : "학습 시작하기"}
                          <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                      </div>
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
