import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card-muted/40">
      <div className="mx-auto w-full max-w-3xl px-4 py-7 text-xs leading-relaxed text-muted">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-bold text-foreground">거북선</span>
          <Link href="/terms" className="hover:text-foreground hover:underline">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            개인정보처리방침
          </Link>
        </div>
        <p className="mt-3">
          문의 · 김준영{" "}
          <a href="mailto:disnwkdl420@gmail.com" className="hover:text-foreground hover:underline">
            disnwkdl420@gmail.com
          </a>
        </p>
        <p className="mt-1">© 2026 거북선 (김준영). All rights reserved.</p>
        <p className="mt-2 text-[11px] text-muted/80">
          한국사능력검정시험 심화 대비 학습 서비스 · 콘텐츠는 학습 참고용이며 시험 결과를 보장하지 않습니다.
        </p>
      </div>
    </footer>
  );
}
