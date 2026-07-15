"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DAY_MAP, ERA_MAP } from "@/data/curriculum";
import { todayStr } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface DayEvent {
  type: "learn" | "review";
  day: number; // 학습 일차
  stage?: number; // 복습 단계 (1-base 표시용)
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const { progress } = useProgress();
  const today = todayStr();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month: 0-11
  });
  const [selected, setSelected] = useState<string>(today);

  // 날짜("YYYY-MM-DD") -> 그날의 학습/복습 이벤트
  const events = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const push = (date: string, ev: DayEvent) => {
      const list = map.get(date) ?? [];
      list.push(ev);
      map.set(date, list);
    };
    for (const [dayStr, rec] of Object.entries(progress.completed)) {
      const day = Number(dayStr);
      push(rec.date, { type: "learn", day });
      rec.reviewDates.forEach((d, i) => push(d, { type: "review", day, stage: i + 1 }));
    }
    return map;
  }, [progress.completed]);

  // 이번 달 그리드 (앞쪽 빈 칸 포함)
  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const startWeekday = first.getDay();
    const list: (string | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      list.push(ymd);
    }
    return list;
  }, [cursor]);

  const selectedEvents = events.get(selected) ?? [];
  const monthLabel = `${cursor.year}년 ${cursor.month + 1}월`;

  function moveMonth(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">학습 캘린더</h1>
        <p className="mt-1 text-sm text-muted">언제 학습하고 복습했는지 한눈에 확인하세요.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => moveMonth(-1)}
            aria-label="이전 달"
            className="rounded-lg p-1.5 text-muted hover:bg-card-muted"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <p className="font-bold">{monthLabel}</p>
          <button
            onClick={() => moveMonth(1)}
            aria-label="다음 달"
            className="rounded-lg p-1.5 text-muted hover:bg-card-muted"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`pb-2 text-xs font-semibold ${
                i === 0 ? "text-bad" : i === 6 ? "text-review" : "text-muted"
              }`}
            >
              {w}
            </div>
          ))}
          {cells.map((ymd, i) =>
            ymd === null ? (
              <div key={`empty-${i}`} />
            ) : (
              <button
                key={ymd}
                onClick={() => setSelected(ymd)}
                className={`mx-auto my-0.5 flex h-11 w-11 flex-col items-center justify-center rounded-xl text-sm ${
                  selected === ymd
                    ? "bg-accent-soft font-bold text-accent"
                    : ymd === today
                      ? "font-bold ring-1 ring-accent/50"
                      : "hover:bg-card-muted"
                }`}
              >
                {Number(ymd.slice(8))}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {(events.get(ymd) ?? []).slice(0, 3).map((ev, j) => (
                    <span
                      key={j}
                      className={`h-1.5 w-1.5 rounded-full ${
                        ev.type === "learn" ? "bg-accent" : "bg-review"
                      }`}
                    />
                  ))}
                </span>
              </button>
            )
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" /> 학습
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-review" /> 복습
          </span>
        </div>
      </div>

      <section>
        <h2 className="mb-2 font-bold">
          {Number(selected.slice(5, 7))}월 {Number(selected.slice(8))}일
        </h2>
        {selectedEvents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
            이 날의 학습 기록이 없어요.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((ev, i) => {
              const meta = DAY_MAP[ev.day];
              const era = ERA_MAP[meta.eraId];
              return (
                <li key={i}>
                  <Link
                    href={`/learn/${ev.day}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-card-muted"
                  >
                    <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: era.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        Day {ev.day} · {meta.title}
                      </span>
                      <span className="text-xs text-muted">{era.name}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        ev.type === "learn"
                          ? "bg-accent-soft text-accent"
                          : "bg-review-soft text-review"
                      }`}
                    >
                      {ev.type === "learn" ? "학습 완료" : `복습 ${ev.stage}회차`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
