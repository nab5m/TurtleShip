// 배포 도메인 — canonical / OpenGraph / sitemap / JSON-LD 의 절대 URL 에 사용.
// 프로덕션에서는 .env 에 NEXT_PUBLIC_SITE_URL 을 실제 도메인으로 설정하세요.
// (미설정 시 http://localhost:3000 로 대체되어 절대 URL 이 올바르지 않습니다.)
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
