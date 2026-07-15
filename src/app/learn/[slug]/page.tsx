import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LearnSession from "@/components/LearnSession";
import { DAY_MAP, ERA_MAP } from "@/data/curriculum";
import { allDaySlugs, dayFromSlug, learnHref } from "@/lib/day-slug";

export function generateStaticParams() {
  return allDaySlugs.map((slug) => ({ slug }));
}

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
  const day = dayFromSlug(slug);
  if (!day) return {};

  const meta = DAY_MAP[day];
  const era = ERA_MAP[meta.eraId];
  const title = `${meta.title} (${day}일차) · ${era.name} | 한능검 한국사 - 거북선`;
  const description = clip(
    `${era.name} 「${meta.title}」 핵심 정리 — ${meta.topics.join(", ")}`,
    155
  );
  const path = learnHref(day);
  const keywords = Array.from(
    new Set([
      meta.title,
      era.name,
      ...meta.topics,
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

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const day = dayFromSlug(slug);
  if (!day) notFound();

  // 슬러그·레거시 숫자(/learn/1) 모두 렌더. 정규 URL 은 canonical(generateMetadata)로 슬러그를 가리킨다.
  return <LearnSession day={day} />;
}
