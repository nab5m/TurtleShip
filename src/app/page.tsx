import HomeView from "@/components/HomeView";
import { getServerProgress } from "@/lib/supabase/server";

// 쿠키 세션으로 개인화되므로 정적 프리렌더가 아니라 요청마다 동적 렌더.
export const dynamic = "force-dynamic";

// 홈은 로그인 사용자의 진도를 서버(쿠키 세션)에서 미리 불러와 첫 렌더부터 표시한다.
// (쿠키를 읽으므로 이 라우트는 동적 렌더 — 개인화 페이지라 적절. 다른 정적 페이지엔 영향 없음)
// 서버 로드가 실패/비로그인이면 initialProgress=null → HomeView 가 클라이언트 로드로 폴백.
export default async function HomePage() {
  const initialProgress = await getServerProgress();
  return <HomeView initialProgress={initialProgress} />;
}
