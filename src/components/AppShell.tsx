"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useProgress } from "@/lib/progress-context";
import { BookIcon, CalendarIcon, HomeIcon, MenuIcon, StarIcon, TagIcon, XIcon } from "./icons";
import Logo from "./Logo";
import InstallPrompt from "./InstallPrompt";
import Footer from "./Footer";

const NAV = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/curriculum", label: "커리큘럼", Icon: BookIcon },
  { href: "/card", label: "키워드", Icon: TagIcon },
  { href: "/calendar", label: "캘린더", Icon: CalendarIcon },
  { href: "/favorites", label: "즐겨찾기", Icon: StarIcon },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* 모바일 웹 전용: 홈 화면에 추가(PWA 설치) 배너 — 헤더 위에 노출 */}
      <InstallPrompt />

      {/* 헤더: 모든 화면(학습 세션 포함)에 항상 표시 */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" onClick={closeMenu} className="flex items-center gap-2 font-bold">
            <Logo className="h-7 w-7" />
            <span className="text-lg text-accent">거북선</span>
            <span className="hidden text-xs font-medium text-muted sm:inline">
              한능검 심화 대비
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname === href
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <AuthButton />
            {/* 모바일 햄버거 */}
            <button
              type="button"
              aria-label="메뉴"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-muted hover:bg-card-muted hover:text-foreground md:hidden"
            >
              {menuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {menuOpen && (
          <nav className="mx-auto w-full max-w-3xl px-4 pb-3 md:hidden">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {NAV.map(({ href, label, Icon }, i) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                      i > 0 ? "border-t border-border" : ""
                    } ${active ? "bg-accent-soft text-accent" : "hover:bg-card-muted"}`}
                  >
                    <Icon className="h-5 w-5" filled={active && href === "/favorites"} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* 메뉴 열렸을 때 바깥 탭으로 닫기 */}
      {menuOpen && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={closeMenu}
          className="fixed inset-0 top-14 z-20 cursor-default bg-transparent md:hidden"
        />
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-16">{children}</main>

      <Footer />
    </div>
  );
}

function AuthButton() {
  const { user, signOut, ready } = useProgress();
  if (!ready) return <div className="h-8 w-8" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        로그인
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();
  return (
    <details className="relative">
      <summary className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-accent-soft text-sm font-bold text-accent select-none">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.name ?? "프로필"} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </summary>
      <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-border bg-card p-2 shadow-lg">
        <p className="truncate px-2 py-1 text-xs text-muted">{user.email}</p>
        <button
          onClick={() => void signOut()}
          className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-card-muted"
        >
          로그아웃
        </button>
      </div>
    </details>
  );
}
