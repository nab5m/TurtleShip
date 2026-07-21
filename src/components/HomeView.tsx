"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DAYS, DAY_MAP, ERAS, ERA_MAP, TOTAL_DAYS } from "@/data/curriculum";
import type { ProgressState } from "@/lib/types";
import { EMPTY_PROGRESS, dueReviews, studyStreak } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { learnHref } from "@/lib/day-slug";
import { CheckIcon, FlameIcon, RefreshIcon } from "@/components/icons";

// 홈 대시보드. 로그인 사용자의 진도는 서버(page.tsx)에서 미리 받아 initialProgress 로 주입되어
// 첫 렌더(SSR)부터 표시된다. 이후 클라이언트 컨텍스트가 준비되면 실시간 값으로 전환한다.
// 비로그인(게스트)은 initialProgress 가 null 이라 기존처럼 클라이언트(localStorage) 로드를 기다린다.
export default function HomeView({
  initialProgress,
}: {
  initialProgress: ProgressState | null;
}) {
  const ctx = useProgress();

  // 서버가 진도를 줬으면 컨텍스트 준비 전에도 그 값으로 즉시 표시
  const ready = ctx.ready || initialProgress != null;
  const progress = ctx.ready ? ctx.progress : initialProgress ?? EMPTY_PROGRESS;
  const due = useMemo(() => dueReviews(progress), [progress]);
  const streak = useMemo(() => studyStreak(progress), [progress]);

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 rounded-2xl bg-card-muted" />
        <div className="h-24 rounded-2xl bg-card-muted" />
        <div className="h-40 rounded-2xl bg-card-muted" />
      </div>
    );
  }

  const completedCount = Object.keys(progress.completed).length;
  const nextDay = DAYS.find((d) => !progress.completed[d.day])?.day;
  const nextMeta = nextDay ? DAY_MAP[nextDay] : undefined;
  const nextEra = nextMeta ? ERA_MAP[nextMeta.eraId] : undefined;

  // 평균 정답률
  const records = Object.values(progress.completed);
  const totalQ = records.reduce((s, r) => s + r.total, 0);
  const totalCorrect = records.reduce((s, r) => s + r.score, 0);
  const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : null;

  return (
    <div className="space-y-6">
      {/* 오늘의 학습 */}
      {nextMeta && nextEra ? (
        <section
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
          style={{ borderTopWidth: 4, borderTopColor: nextEra.color }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: nextEra.color }}>
            <span>Day {nextMeta.day}</span>
            <span className="text-muted">·</span>
            <span>{nextEra.name}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">{nextMeta.title}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {nextMeta.topics.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-card-muted px-2.5 py-1 text-xs text-muted">
                {shortTopic(t)}
              </span>
            ))}
          </div>
          <Link
            href={learnHref(nextMeta.day)}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3 font-semibold text-white hover:opacity-90 sm:w-auto"
          >
            오늘의 학습 시작하기
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-3xl">🎉</p>
          <h1 className="mt-2 text-xl font-bold">90일 커리큘럼을 모두 완료했어요!</h1>
          <p className="mt-1 text-sm text-muted">복습과 즐겨찾기로 마무리 정리를 해 보세요.</p>
        </section>
      )}

      {/* 오늘의 복습 (망각곡선) */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-bold">
            <RefreshIcon className="h-4 w-4 text-review" />
            오늘의 복습
          </h2>
          {due.length > 0 && (
            <span className="rounded-full bg-review-soft px-2 py-0.5 text-xs font-semibold text-review">
              {due.length}건
            </span>
          )}
        </div>
        {due.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
            오늘 복습할 항목이 없어요. 학습을 완료하면 망각곡선(1·3·7·14·30일)에 맞춰 복습이
            등록됩니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {due.slice(0, 5).map((r) => {
              const meta = DAY_MAP[r.day];
              const era = ERA_MAP[meta.eraId];
              return (
                <li key={r.day}>
                  <Link
                    href={`/review/${r.day}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-card-muted"
                  >
                    <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: era.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        Day {r.day} · {meta.title}
                      </span>
                      <span className="text-xs text-muted">{era.name}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-review-soft px-2.5 py-1 text-xs font-semibold text-review">
                      {r.intervalLabel}
                    </span>
                    {r.overdueDays > 0 && (
                      <span className="shrink-0 rounded-full bg-bad-soft px-2 py-1 text-[11px] font-medium text-bad">
                        +{r.overdueDays}일
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            {due.length > 5 && (
              <li className="px-1 text-xs text-muted">외 {due.length - 5}건 — 오래 밀린 순서로 표시됩니다</li>
            )}
          </ul>
        )}
      </section>

      {/* 학습 현황 */}
      <section className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<CheckIcon className="h-4 w-4 text-good" />}
          label="진도"
          value={`${completedCount}/${TOTAL_DAYS}일`}
        />
        <StatCard
          icon={<FlameIcon className="h-4 w-4 text-accent" />}
          label="연속 학습"
          value={`${streak}일`}
        />
        <StatCard
          icon={<span className="text-sm">🎯</span>}
          label="퀴즈 정답률"
          value={accuracy === null ? "—" : `${accuracy}%`}
        />
      </section>

      {/* 시대별 진행 */}
      <section>
        <h2 className="mb-2 font-bold">시대별 진행</h2>
        <div className="space-y-1.5 rounded-2xl border border-border bg-card p-4">
          {ERAS.map((era) => {
            const [start, end] = era.dayRange;
            const total = end - start + 1;
            const done = Array.from({ length: total }, (_, i) => start + i).filter(
              (d) => progress.completed[d]
            ).length;
            return (
              <Link key={era.id} href="/curriculum" className="flex items-center gap-3 py-0.5">
                <span className="w-20 shrink-0 text-xs font-medium sm:w-24">{era.name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-card-muted">
                  <span
                    className="block h-full rounded-full transition-all"
                    style={{
                      width: `${(done / total) * 100}%`,
                      backgroundColor: era.color,
                    }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-xs text-muted">
                  {done}/{total}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

// 괄호 설명이 긴 주제는 앞부분만 잘라서 칩으로 표시
function shortTopic(t: string): string {
  const cut = t.split("(")[0].trim();
  return cut.length > 16 ? `${cut.slice(0, 16)}…` : cut;
}
