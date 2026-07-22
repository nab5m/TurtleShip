import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { ProgressProvider } from "@/lib/progress-context";
import AppShell from "@/components/AppShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// 배포 도메인 (canonical·og:image 등 절대 URL). SITE_URL 은 NEXT_PUBLIC_SITE_URL →
// Vercel 프로덕션 도메인 → localhost 순으로 해석된다. (src/lib/site.ts 참고)
const siteUrl = SITE_URL;
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
      "naver-site-verification": "29a68199b52578ebfb7b8d01792d4431a0602108",
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
