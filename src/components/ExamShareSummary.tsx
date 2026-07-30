"use client";

import { useState } from "react";
import { DAYS, STAGES, TOTAL_DAYS } from "@/data/curriculum";
import { EXAM_DISTRIBUTION } from "@/data/exam-distribution";
import { ChevronRightIcon } from "@/components/icons";

// 실측 출제 비중 패널.
//
// 숫자는 전부 이 앱이 직접 측정한 값이다 — 국사편찬위원회 시험 자료실이 공개 중인 심화 기출
// 전 회차를 내려받아 문항 단위로 시대를 분류한 결과(src/data/exam-distribution.ts, 자동 생성).
// 남의 요약치를 옮겨 쓰지 않는다. 비교용으로만 '흔히 인용되는 추정치'를 옆에 둔다.

const DIST = EXAM_DISTRIBUTION;

// 흔히 인용되는 추정 비중(참고용). 하위 구간 합이 최대 55% 인데 전근대를 60% 라고 말해
// 그 자체로 앞뒤가 맞지 않는다 → 그래서 앱이 직접 측정한다. 표에는 참고 열로만 남긴다.
const REFERENCE: { key: string; label: string; ref: string; stageIds: string[] }[] = [
  { key: "ancient", label: "선사·고대", ref: "10~15%", stageIds: ["prehistory", "gojoseon-confederacy", "three-kingdoms", "north-south"] },
  { key: "goryeo", label: "고려", ref: "14~15%", stageIds: ["goryeo"] },
  { key: "joseon", label: "조선", ref: "20~25%", stageIds: ["early-joseon", "late-joseon"] },
  { key: "modern", label: "근대·일제", ref: "25~31%", stageIds: ["open-port", "colonial"] },
  { key: "contemporary", label: "현대", ref: "12~14%", stageIds: ["modern"] },
];

// 정적 데이터끼리의 계산이므로 모듈 로드 시 한 번만 한다 (렌더마다 다시 계산하지 않는다).
const STAGE_ROWS = STAGES.map((stage) => {
  const share = DIST.byStage.find((s) => s.stageId === stage.id);
  const days = DAYS.filter(
    (d) => d.day >= stage.dayRange[0] && d.day <= stage.dayRange[1]
  ).length;
  return {
    id: stage.id,
    name: stage.name,
    color: stage.color,
    questions: share?.questions ?? 0,
    percent: share?.percent ?? 0,
    days,
    dayPercent: Math.round((days / TOTAL_DAYS) * 1000) / 10,
  };
});

const MAX_STAGE_PERCENT = Math.max(...STAGE_ROWS.map((r) => r.percent));

const COARSE_ROWS = REFERENCE.map((group) => {
  const rows = STAGE_ROWS.filter((r) => group.stageIds.includes(r.id));
  const questions = rows.reduce((n, r) => n + r.questions, 0);
  const days = rows.reduce((n, r) => n + r.days, 0);
  return {
    key: group.key,
    label: group.label,
    ref: group.ref,
    questions,
    percent: Math.round((questions / DIST.classified) * 1000) / 10,
    days,
  };
});

const PREMODERN_DAYS = STAGE_ROWS.filter(
  (r) => !["open-port", "colonial", "modern"].includes(r.id)
).reduce((n, r) => n + r.days, 0);
const PREMODERN_DAY_PERCENT = Math.round((PREMODERN_DAYS / TOTAL_DAYS) * 1000) / 10;

export default function ExamShareSummary() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card-muted"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">기출 실측 출제 비중</span>
          <span className="block text-xs text-muted">
            심화 {DIST.examCount}개 회차 {DIST.classified.toLocaleString()}문항 직접 분류 · 전근대{" "}
            {DIST.premodern.percent}% : 근현대 {DIST.modern.percent}%
          </span>
        </span>
        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {/* 전근대 : 근현대 — 학습일 배분과 나란히 */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-semibold">전근대 : 근현대</span>
              <span className="text-muted">
                출제 {DIST.premodern.percent}% : {DIST.modern.percent}% · 학습일{" "}
                {PREMODERN_DAY_PERCENT}% : {Math.round((100 - PREMODERN_DAY_PERCENT) * 10) / 10}%
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-card-muted">
              <div
                className="bg-bronze"
                style={{ width: `${DIST.premodern.percent}%` }}
                title={`전근대 ${DIST.premodern.questions}문항`}
              />
              <div
                className="bg-accent"
                style={{ width: `${DIST.modern.percent}%` }}
                title={`근현대 ${DIST.modern.questions}문항`}
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              전근대 {DIST.premodern.questions.toLocaleString()}문항 · 근현대{" "}
              {DIST.modern.questions.toLocaleString()}문항. 현재 커리큘럼은 전근대{" "}
              {PREMODERN_DAYS}일 / 근현대 {TOTAL_DAYS - PREMODERN_DAYS}일입니다.
            </p>
          </div>

          {/* 단계별 실측 비중 */}
          <div>
            <h3 className="mb-2 text-xs font-semibold">단계별 출제 비중 (실측)</h3>
            <ul className="space-y-1.5">
              {STAGE_ROWS.map((row) => (
                <li key={row.id} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-[11px]">{row.name}</span>
                  <span className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-card-muted">
                    <span
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.percent / MAX_STAGE_PERCENT) * 100}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </span>
                  <span className="w-11 shrink-0 text-right text-[11px] font-semibold tabular-nums">
                    {row.percent}%
                  </span>
                  <span className="w-14 shrink-0 text-right text-[11px] text-muted tabular-nums">
                    {row.days}일
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 참고 추정치와의 비교 */}
          <div>
            <h3 className="mb-2 text-xs font-semibold">흔히 인용되는 추정치와 비교</h3>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-1 text-left font-medium">
                    구분
                  </th>
                  <th scope="col" className="py-1 text-right font-medium">
                    실측
                  </th>
                  <th scope="col" className="py-1 text-right font-medium">
                    문항
                  </th>
                  <th scope="col" className="py-1 text-right font-medium">
                    참고 추정
                  </th>
                </tr>
              </thead>
              <tbody>
                {COARSE_ROWS.map((row) => (
                  <tr key={row.key} className="border-t border-border">
                    <td className="py-1">{row.label}</td>
                    <td className="py-1 text-right font-semibold tabular-nums">{row.percent}%</td>
                    <td className="py-1 text-right text-muted tabular-nums">{row.questions}</td>
                    <td className="py-1 text-right text-muted tabular-nums">{row.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              참고 추정치는 하위 구간을 다 더해도 전근대가 55% 를 넘지 못해 &lsquo;전근대 60%&rsquo;
              라는 설명과 앞뒤가 맞지 않습니다. 그래서 앱은 기출을 직접 세어 씁니다.
            </p>
          </div>

          {/* 측정 근거 */}
          <div className="rounded-xl bg-card-muted/60 px-3 py-2.5">
            <h3 className="text-[11px] font-semibold">측정 범위</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              국사편찬위원회 시험 자료실이 공개 중인 심화 기출 전 회차({DIST.hoe[DIST.hoe.length - 1]}
              ~{DIST.hoe[0]}회, {DIST.rounds[DIST.rounds.length - 1]}~{DIST.rounds[0]}) 문제지
              {DIST.questionTotal.toLocaleString()}문항을 문항 단위로 읽어 시대를 분류했습니다. 상당수
              회차의 문제지가 이미지로만 제공돼, 회차 간 편차를 없애기 위해 전 회차를 OCR 로
              읽었습니다. 통합형(여러 시대를 함께 묻는 문항)은 비중이 큰 시대 한 곳으로만 집계됩니다.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              문항 저작권은 국사편찬위원회에 있으며, 이 앱은 집계 수치만 사용합니다.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
