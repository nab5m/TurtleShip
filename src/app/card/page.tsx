import type { Metadata } from "next";
import Link from "next/link";
import { ERAS } from "@/data/curriculum";
import { cardEntries } from "@/lib/card-index";
import { learnHref } from "@/lib/day-slug";

const title = "한국사 키워드 전체 보기 · 90일 카드 | 거북선";
const description =
  "구석기부터 현대까지 한국사능력검정시험 심화 핵심 키워드를 시대·일차별로 정리했습니다. 원하는 개념을 골라 바로 학습하세요.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "한국사 키워드",
    "한국사 정리",
    "한국사 요약",
    "한능검",
    "한국사능력검정시험",
    "한국사 심화",
    "시대별 한국사",
  ],
  alternates: { canonical: "/card" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/card",
    siteName: "거북선",
    locale: "ko_KR",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function CardHubPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold sm:text-3xl">한국사 키워드 전체 보기</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        선사시대부터 현대까지, 한국사능력검정시험 심화 대비 핵심 키워드{" "}
        {cardEntries.length.toLocaleString()}개를 시대·일차별로 정리했습니다.
        궁금한 개념을 눌러 자세한 설명을 확인하세요.
      </p>

      <div className="mt-6 space-y-3">
        {ERAS.map((era) => {
          const eraEntries = cardEntries.filter((e) => e.era.id === era.id);
          if (eraEntries.length === 0) return null;
          const days = Array.from(
            new Set(eraEntries.map((e) => e.day))
          ).sort((a, b) => a - b);

          return (
            <details
              key={era.id}
              className="rounded-2xl border border-border bg-card p-4"
              style={{ borderLeftWidth: 4, borderLeftColor: era.color }}
            >
              <summary className="cursor-pointer font-bold">
                {era.name}
                <span className="ml-2 text-xs font-normal text-muted">
                  {era.period} · {eraEntries.length}개 키워드
                </span>
              </summary>

              <div className="mt-3 space-y-4">
                {days.map((day) => {
                  const dayEntries = eraEntries.filter((e) => e.day === day);
                  const dm = dayEntries[0].dayMeta;
                  return (
                    <div key={day}>
                      <h2 className="text-sm font-semibold">
                        <Link
                          href={learnHref(day)}
                          className="hover:text-accent"
                        >
                          {day}일차 · {dm.title}
                        </Link>
                      </h2>
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {dayEntries.map((e) => (
                          <li key={e.slug}>
                            <Link
                              href={`/card/${encodeURIComponent(e.slug)}`}
                              className="inline-block rounded-lg border border-border bg-card-muted px-2.5 py-1 text-sm hover:bg-accent-soft hover:text-accent"
                            >
                              {e.card.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
