import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import {
  cardEntries,
  getCardEntryBySlug,
  getCardEntriesByDay,
} from "@/lib/card-index";

// 미리 생성된 슬러그만 허용 (그 외 URL 은 404)
export const dynamicParams = false;

export function generateStaticParams() {
  return cardEntries.map((e) => ({ slug: e.slug }));
}

function safeDecode(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

// 메타 설명/구조화 데이터용 텍스트 정리
function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCardEntryBySlug(safeDecode(slug));
  if (!entry) return {};

  const { card, era, dayMeta } = entry;
  const title = `${card.title} · ${era.name} | 한능검 한국사 - 거북선`;
  const description = clip(card.content, 155);
  const path = `/card/${encodeURIComponent(entry.slug)}`;
  const keywords = Array.from(
    new Set([
      card.title,
      ...card.keywords,
      era.name,
      dayMeta.title,
      "한국사",
      "한국사능력검정시험",
      "한능검",
      "한국사 심화",
      "한국사 정리",
      "한국사 요약",
    ])
  );

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description,
      url: path,
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
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getCardEntryBySlug(safeDecode(slug));
  if (!entry) notFound();

  const { card, era, day, dayMeta, indexInDay } = entry;
  const siblings = getCardEntriesByDay(day);
  const prev = siblings[indexInDay - 1];
  const next = siblings[indexInDay + 1];
  const others = siblings.filter((s) => s.slug !== entry.slug);
  const canonical = `${SITE_URL}/card/${encodeURIComponent(entry.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${SITE_URL}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "한국사 키워드",
            item: `${SITE_URL}/card`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${day}일차 ${dayMeta.title}`,
            item: `${SITE_URL}/learn/${day}`,
          },
          { "@type": "ListItem", position: 4, name: card.title, item: canonical },
        ],
      },
      {
        "@type": ["Article", "LearningResource"],
        headline: card.title,
        name: card.title,
        description: clip(card.content, 300),
        articleBody: card.content,
        keywords: [card.title, ...card.keywords, era.name].join(", "),
        inLanguage: "ko",
        educationalLevel: "한국사능력검정시험 심화",
        learningResourceType: "학습 카드",
        about: { "@type": "Thing", name: card.title },
        isPartOf: {
          "@type": "Course",
          name: "거북선 — 90일 한국사",
          url: `${SITE_URL}/`,
        },
        url: canonical,
        ...(card.image ? { image: card.image.src } : {}),
      },
    ],
  };

  return (
    <article className="mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="위치"
        className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted"
      >
        <Link href="/" className="hover:text-foreground">
          홈
        </Link>
        <span aria-hidden>›</span>
        <Link href="/card" className="hover:text-foreground">
          한국사 키워드
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/learn/${day}`} className="hover:text-foreground">
          {day}일차 · {dayMeta.title}
        </Link>
      </nav>

      <div
        className="rounded-2xl border border-border bg-card p-6"
        style={{ borderTopWidth: 4, borderTopColor: era.color }}
      >
        <div className="text-sm font-semibold" style={{ color: era.color }}>
          {era.name} · {era.period}
        </div>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{card.title}</h1>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.keywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
            >
              {k}
            </span>
          ))}
        </div>

        {card.image && (
          <figure className="mt-5">
            <Image
              src={card.image.src}
              alt={card.image.alt}
              width={card.image.width}
              height={card.image.height}
              className="mx-auto max-h-64 w-auto rounded-lg object-contain"
            />
            <figcaption className="mt-1 text-center text-[11px] text-muted">
              {card.image.alt}
              {card.image.credit
                ? ` · ${card.image.credit}`
                : " · 출처: Wikimedia Commons"}
            </figcaption>
          </figure>
        )}

        <p className="mt-5 text-[15px] leading-relaxed sm:text-base">
          {card.content}
        </p>
      </div>

      <Link
        href={`/learn/${day}`}
        className="mt-4 flex items-center justify-center rounded-xl bg-accent px-5 py-3 font-semibold text-white hover:opacity-90"
      >
        {day}일차 「{dayMeta.title}」 학습하기
      </Link>

      {(prev || next) && (
        <div className="mt-4 flex gap-2">
          {prev ? (
            <Link
              href={`/card/${encodeURIComponent(prev.slug)}`}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-card-muted"
            >
              <div className="text-[11px] text-muted">← 이전 카드</div>
              <div className="font-semibold">{prev.card.title}</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/card/${encodeURIComponent(next.slug)}`}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-right text-sm hover:bg-card-muted"
            >
              <div className="text-[11px] text-muted">다음 카드 →</div>
              <div className="font-semibold">{next.card.title}</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      )}

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-muted">
            {day}일차 · {dayMeta.title} 의 다른 키워드
          </h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/card/${encodeURIComponent(s.slug)}`}
                  className="inline-block rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-card-muted"
                >
                  {s.card.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
