// 한글 제목 → URL 슬러그. 로마자로 변환하면 어색하므로 한글을 그대로 URL 에 사용한다.
// (한글은 브라우저 주소창에 그대로 노출되고, href/사이트맵에서는 퍼센트 인코딩된다.)
export function slugifyTitle(title: string): string {
  return title
    .normalize("NFC")
    .trim()
    .replace(/[·・]/g, "-") // 가운뎃점 → 하이픈
    .replace(/[()\[\]{}<>「」『』«»"'“”‘’.,!?:;\/\\|~%#&]/g, "") // 문장부호/URL 예약문자 제거
    .replace(/\s+/g, "-") // 공백 → 하이픈
    .replace(/-+/g, "-") // 하이픈 중복 축소
    .replace(/^-|-$/g, ""); // 양끝 하이픈 제거
}

// 퍼센트 인코딩된 슬러그를 안전하게 디코드 (잘못된 입력이면 원본 반환)
export function safeDecode(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
