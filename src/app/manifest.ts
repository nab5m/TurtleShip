import type { MetadataRoute } from "next";

// PWA 매니페스트 → /manifest.webmanifest (Next가 자동으로 <link rel="manifest"> 삽입)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "거북선 — 한능검 심화 대비 한국사 학습",
    short_name: "거북선",
    description:
      "하루 30분, 90일 완성 한국사능력검정시험 심화 대비 카드 학습. 망각곡선 복습과 즐겨찾기.",
    lang: "ko",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9f5",
    theme_color: "#faf9f5",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
