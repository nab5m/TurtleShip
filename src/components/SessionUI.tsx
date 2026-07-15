"use client";

import Link from "next/link";
import type { Quiz } from "@/lib/types";
import { XIcon } from "./icons";

// 학습/복습 세션 상단 헤더 + 진행바
export function SessionHeader({
  day,
  title,
  eraName,
  eraColor,
  badge,
  current,
  total,
}: {
  day: number;
  title: string;
  eraName: string;
  eraColor: string;
  badge?: string;
  current: number; // 진행 중인 항목 (1-base)
  total: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: eraColor }}>
            Day {day} · {eraName}
            {badge && (
              <span className="rounded-full bg-review-soft px-2 py-0.5 text-[11px] font-bold text-review">
                {badge}
              </span>
            )}
          </p>
          <h1 className="truncate text-lg font-bold">{title}</h1>
        </div>
        <Link
          href="/"
          aria-label="세션 종료"
          className="rounded-full p-2 text-muted hover:bg-card-muted hover:text-foreground"
        >
          <XIcon className="h-5 w-5" />
        </Link>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, (current / Math.max(total, 1)) * 100)}%`,
            backgroundColor: eraColor,
          }}
        />
      </div>
    </div>
  );
}

// 세션 결과 화면
export function ResultView({
  score,
  total,
  wrongQuizzes,
  nextReviewText,
  retryHref,
}: {
  score: number;
  total: number;
  wrongQuizzes: Quiz[];
  nextReviewText: string;
  retryHref: string;
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const msg =
    pct === 100 ? "완벽해요! 🏆" : pct >= 80 ? "훌륭해요! 👏" : pct >= 60 ? "좋아요, 오답을 확인해 보세요" : "오답 위주로 복습해 보세요";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold text-muted">퀴즈 결과</p>
        <p className="mt-2 text-4xl font-bold">
          {score}
          <span className="text-xl text-muted"> / {total}</span>
        </p>
        <p className="mt-2 font-medium">{msg}</p>
        <p className="mt-3 rounded-xl bg-review-soft px-3 py-2 text-sm font-medium text-review">
          {nextReviewText}
        </p>
      </div>

      {wrongQuizzes.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-bold">틀린 문제 다시 보기</h3>
          <ul className="mt-3 space-y-3">
            {wrongQuizzes.map((q) => (
              <li key={q.id} className="rounded-xl bg-card-muted p-3 text-sm">
                <p className="font-semibold leading-relaxed">{q.question}</p>
                <p className="mt-1.5 text-good">
                  정답: {q.answer + 1}번 — {q.options[q.answer]}
                </p>
                <p className="mt-1 leading-relaxed text-muted">{q.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={retryHref}
          className="flex-1 rounded-xl border border-border bg-card px-5 py-3 text-center font-semibold hover:bg-card-muted"
        >
          다시 학습
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-xl bg-accent px-5 py-3 text-center font-semibold text-white hover:opacity-90"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
