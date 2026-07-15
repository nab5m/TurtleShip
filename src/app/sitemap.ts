import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TOTAL_DAYS } from "@/data/curriculum";
import { cardEntries } from "@/lib/card-index";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/card`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/curriculum`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/calendar`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const learn: MetadataRoute.Sitemap = Array.from(
    { length: TOTAL_DAYS },
    (_, i) => ({
      url: `${SITE_URL}/learn/${i + 1}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  const cards: MetadataRoute.Sitemap = cardEntries.map((e) => ({
    url: `${SITE_URL}/card/${encodeURIComponent(e.slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...core, ...learn, ...cards];
}
