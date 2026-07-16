// 배포 도메인 — canonical / OpenGraph / sitemap / robots / JSON-LD 의 절대 URL 에 사용.
//
// 우선순위:
//  1) NEXT_PUBLIC_SITE_URL            — 권장. 커스텀 도메인을 명시적으로 지정.
//  2) VERCEL_PROJECT_PRODUCTION_URL   — Vercel 배포 시 자동 주입되는 프로덕션 도메인.
//  3) http://localhost:3000           — 로컬 개발 폴백.
//
// ⚠️ 이 값이 실제 도메인이 아니면 sitemap.xml 의 <loc> 가 localhost 로 찍혀
//    구글 서치 콘솔이 "사이트맵을 가져올 수 없음" 으로 표시한다. 커스텀 도메인을
//    쓰거나 Vercel 이 아닌 곳에 배포하면 반드시 1) 을 설정할 것.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) {
    return `https://${vercelProd.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
