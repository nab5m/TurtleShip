import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 홈(/) 서버 렌더 전에 Supabase 세션을 갱신해 쿠키에 반영한다.
// 이게 없으면 만료된 액세스 토큰을 서버 컴포넌트가 갱신하지 못해(쿠키 쓰기 불가)
// getServerProgress 가 null 을 반환 → SSR 이 스켈레톤을 그리고 클라이언트에서 채워
// 넣으며 깜빡임이 생긴다. 여기서 토큰을 미리 갱신하면 홈이 진도까지 담아 SSR 된다.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 요청/응답 양쪽 쿠키를 갱신 → 뒤이어 실행되는 서버 컴포넌트가 신선한 토큰을 읽는다
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // 만료 시 자동 갱신 트리거 (갱신된 토큰은 위 setAll 로 쿠키에 기록됨)
    await supabase.auth.getUser();
  } catch {
    // 갱신 실패해도 페이지는 정상 진행 (홈은 클라이언트 로드로 폴백)
  }

  return response;
}

// 홈만 세션 갱신이 필요(유일한 서버 사이드 진도 로드 라우트). 정적 페이지에는 적용하지 않는다.
export const config = {
  matcher: ["/"],
};
