import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress-context";
import AppShell from "@/components/AppShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// 배포 도메인 (카카오톡 등 링크 미리보기의 og:image 절대 URL에 필요).
// 배포 시 .env 에 NEXT_PUBLIC_SITE_URL 을 실제 도메인으로 설정하세요.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteTitle = "거북선 — 한능검 심화 대비 한국사 학습";
const siteDescription =
  "하루 30분, 90일 완성 한국사능력검정시험 심화 대비 카드 학습. 망각곡선 복습과 즐겨찾기로 시대 흐름을 잡아 보세요.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: "거북선",
  appleWebApp: {
    capable: true,
    title: "거북선",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "거북선",
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    locale: "ko_KR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "거북선 — 한능검 심화 대비 한국사 학습",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og.png"],
  },
  verification: {
    google: "8jJ5eAowBxbr0e79oERoy_K170ygktOvZf0ghgRmbzI",
    other: {
      "naver-site-verification": "843b87b1968ac7747692949c28ef32c47ed9feee",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#14120e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ProgressProvider>
          <AppShell>{children}</AppShell>
        </ProgressProvider>
        <ServiceWorkerRegister />
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZV35XQZF0Y"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZV35XQZF0Y');
          `}
        </Script>
      </body>
    </html>
  );
}
