import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 자동 해석(scripts/resolve-images.mjs) 결과는 Wikimedia 뿐이고,
    // 아래 나머지 호스트는 src/data/content/image-overrides.ts 에 손으로 등록한 사진의 출처다.
    // 오버라이드에 새 호스트를 추가하면 여기에도 반드시 함께 등록해야 한다(없으면 400).
    // search 를 지정하지 않았으므로 쿼리스트링이 붙은 URL 도 허용된다.
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      // 공공기관·기록기관
      { protocol: "https", hostname: "contents.history.go.kr" }, // 우리역사넷(국사편찬위원회)
      { protocol: "https", hostname: "contents.nahf.or.kr" }, // 동북아역사재단
      { protocol: "https", hostname: "www.heritage.go.kr" }, // 국가유산청
      { protocol: "https", hostname: "devin.aks.ac.kr" }, // 한국학중앙연구원
      { protocol: "https", hostname: "busan.grandculture.net" }, // 부산역사문화대전
      { protocol: "https", hostname: "minio.nculture.org" }, // 국가유산 멀티미디어 아카이브
      // 언론·백과
      { protocol: "https", hostname: "i.namu.wiki" },
      { protocol: "https", hostname: "mblogthumb-phinf.pstatic.net" },
      { protocol: "https", hostname: "img.khan.co.kr" },
      { protocol: "https", hostname: "img.hankyung.com" },
      { protocol: "https", hostname: "wimg.sedaily.com" },
      { protocol: "https", hostname: "www.yeongnam.com" },
      { protocol: "https", hostname: "www.jemin.com" },
      { protocol: "https", hostname: "cdn.koreahiti.com" },
      { protocol: "https", hostname: "www.koya-culture.com" },
    ],
  },
};

export default nextConfig;
