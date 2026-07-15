import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 로그인·개인화·인증 콜백 등 색인 가치가 없는 경로는 제외
      disallow: ["/login", "/favorites", "/review/", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
