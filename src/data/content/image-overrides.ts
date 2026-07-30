import type { ItemImage } from "@/lib/types";

// 손으로 관리하는 이미지 지정 — scripts/resolve-images.mjs 가 절대 건드리지 않는 파일이다.
// (자동 생성물은 images.ts 이며 그쪽은 직접 수정하면 재실행 때 덮어써진다)
//
// ── IMAGE_OVERRIDES: 항목 id → 직접 지정한 이미지. images.ts 의 자동 해석 결과보다 우선한다.
//    · 자동 해석기는 Wikimedia Commons(자유 라이선스)만 채택하지만, 여기 등록된 항목은
//      운영자가 출처를 직접 확인하고 고른 것이므로 그 규칙의 예외다.
//      (근거: docs/image-review-2026-07-30.tsv)
//    · width/height 는 원본을 실제로 내려받아 측정한 픽셀 크기를 적는다. 레이아웃(next/image)이
//      이 값에 의존하므로 추측해서 넣지 말 것.
//    · 새 호스트를 추가하면 next.config.ts 의 images.remotePatterns 에도 반드시 함께 등록한다.
//    · credit 은 캡션에 그대로 노출된다. 비워 두면 "출처: Wikimedia Commons" 로 표시되므로
//      Commons 가 아닌 출처는 반드시 credit 을 채운다.
//
// ── IMAGE_ALIASES: 항목 id → 이미지를 빌려올 다른 항목 id. URL 을 복사하지 않으므로
//    원본 항목의 사진이 나중에 바뀌면 빌려 쓰는 쪽도 같이 바뀐다. (주로 퀴즈가 카드 사진 재사용)
//
// ── 두 맵 모두 "항목에 imageSearch 가 남아 있을 때만" 적용된다(src/data/content/index.ts).
//    따라서 사진을 없애는 조치는 days-*.ts 에서 imageSearch 를 지우는 것으로 처리하며,
//    이 파일에 아무것도 적지 않아도 된다.

export const IMAGE_OVERRIDES: Record<string, ItemImage> = {};

export const IMAGE_ALIASES: Record<string, string> = {
  "d01-q01": "d01-c03", // 주먹도끼
  "d02-q01": "d02-c03", // 빗살무늬 토기
  "d02-q11": "d02-c07", // 갈돌과 갈판
  "d03-q01": "d03-c06", // 반달 돌칼
  "d03-q02": "d03-c06", // 반달 돌칼
  "d03-q03": "d03-c12", // 고인돌
};
