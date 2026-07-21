import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { loadRemote } from "@/lib/progress-store";
import type { ProgressState } from "@/lib/types";

// 서버 컴포넌트에서 쿠키 세션으로 로그인 사용자의 진도를 미리 로드한다.
// 실패(비로그인·토큰 만료·네트워크 등)하면 null 을 반환해 클라이언트 로드로 안전하게 폴백한다.
// ⚠️ 쿠키를 읽으므로 이 함수를 쓰는 라우트는 동적 렌더가 된다 → 홈(/)에서만 사용.
export async function getServerProgress(): Promise<ProgressState | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const cookieStore = await cookies();
    const sb = createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // 서버 컴포넌트에서는 쿠키를 쓸 수 없다 → no-op.
        // (토큰 갱신·저장은 브라우저 클라이언트가 처리)
        setAll() {},
      },
    });

    const { data, error } = await sb.auth.getUser();
    if (error) {
      // 로그인 사용자인데 세션 검증/갱신 실패 → SSR 진도 없이 스켈레톤(깜빡임)의 주원인.
      // (프록시가 토큰을 갱신하지 못했을 때 발생)
      console.warn("[home-ssr] getUser 실패 → 클라이언트 폴백:", error.message);
      return null;
    }
    if (!data.user) return null; // 비로그인(게스트) — 정상

    const progress = await loadRemote(sb, data.user.id);
    return progress;
  } catch (e) {
    console.error("[home-ssr] 진도 로드 예외 → 클라이언트 폴백:", e);
    return null;
  }
}
