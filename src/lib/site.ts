// 배포 도메인 — canonical / OpenGraph / sitemap / robots / JSON-LD 의 절대 URL 에 사용.
//
// 우선순위:
//  1) NEXT_PUBLIC_SITE_URL — 명시적 지정(스테이징 등 override 용).
//  2) 로컬 개발 → http://localhost:3000
//  3) 프로덕션 기본값 → https://turtle-ship.kr
//     (환경변수가 빠져도 프로덕션 절대 URL 이 항상 올바른 도메인이 되도록 박아둠)
const PRODUCTION_URL = "https://turtle-ship.kr";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return PRODUCTION_URL;
}

export const SITE_URL = resolveSiteUrl();
