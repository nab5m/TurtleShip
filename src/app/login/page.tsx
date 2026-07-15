"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProgress } from "@/lib/progress-context";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const { user, authAvailable, signInWithGoogle, signOut } = useProgress();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-5 pt-6">
      <div className="text-center">
        <Logo className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-2xl font-bold">거북선</h1>
        <p className="text-xs font-medium text-muted">한능검 심화 대비 한국사 학습</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          로그인하면 학습 기록·복습 일정·즐겨찾기가 계정에 저장되어
          <br />
          휴대폰과 PC 어디서든 이어서 학습할 수 있어요.
        </p>
      </div>

      {user ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm">
            <span className="font-semibold">{user.name ?? user.email}</span> 님으로 로그인되어 있어요.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => void signOut()}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-card-muted"
            >
              로그아웃
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
            >
              학습하러 가기
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-left">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--accent)]"
            />
            <span className="text-xs leading-relaxed text-muted">
              <Link href="/terms" className="font-medium text-accent hover:underline">
                이용약관
              </Link>
              {" 및 "}
              <Link href="/privacy" className="font-medium text-accent hover:underline">
                개인정보처리방침
              </Link>
              에 동의합니다. (필수)
            </span>
          </label>

          <button
            onClick={() => void signInWithGoogle()}
            disabled={!authAvailable || !agreed}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 font-semibold shadow-sm hover:bg-card-muted disabled:opacity-40"
          >
            <GoogleLogo />
            Google로 계속하기
          </button>

          {!agreed && authAvailable && (
            <p className="text-center text-[11px] text-muted">
              가입·로그인하려면 약관에 동의해 주세요.
            </p>
          )}

          {!authAvailable && (
            <p className="rounded-xl bg-card-muted p-3 text-xs leading-relaxed text-muted">
              Supabase 환경변수(<code>.env.local</code>)가 설정되지 않아 로그인이 비활성화되어
              있습니다. 게스트 모드로도 모든 기능을 이용할 수 있어요 (기록은 이 브라우저에만
              저장됩니다).
            </p>
          )}

          <Link href="/" className="block py-2 text-center text-sm font-medium text-muted hover:text-foreground">
            로그인 없이 시작하기 →
          </Link>
          <p className="text-center text-xs leading-relaxed text-muted">
            게스트로 학습한 기록은 나중에 로그인하면 자동으로 계정에 합쳐져요.
          </p>
        </div>
      )}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.7-4.9l-.14.01-3.6 2.8-.05.13C3.4 21.3 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.5c-.3-.7-.4-1.5-.4-2.2s.1-1.6.4-2.3l-.01-.15-3.7-2.8-.12.06C.5 8.6 0 10.3 0 12.2s.5 3.6 1.5 5.1l3.8-2.8z"
      />
      <path
        fill="#EB4335"
        d="M12 4.6c2.2 0 3.7 1 4.5 1.8L19.9 3C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.5 6.6l3.8 2.9c.9-2.8 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}
