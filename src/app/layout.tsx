import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress-context";
import AppShell from "@/components/AppShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "거북선 — 한능검 심화 대비 한국사 학습",
  description:
    "하루 30분, 90일 완성 한국사능력검정시험 심화 대비 카드 학습. 망각곡선 복습과 즐겨찾기로 시대 흐름을 잡아 보세요.",
  applicationName: "거북선",
  appleWebApp: {
    capable: true,
    title: "거북선",
    statusBarStyle: "default",
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
      </body>
    </html>
  );
}
