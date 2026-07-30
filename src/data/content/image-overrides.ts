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

export const IMAGE_OVERRIDES: Record<string, ItemImage> = {
  // 가락바퀴
  "d02-c08": { src: "https://contents.history.go.kr/data/img/ta/ta_h71/img_031_03.jpg", alt: "가락바퀴", width: 376, height: 386, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 움집
  "d02-c10": { src: "https://contents.history.go.kr/data/img/eh/eh_r0020/eh_r0020_p01.jpg", alt: "움집", width: 1200, height: 801, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 조개껍데기 가면
  "d02-c18": { src: "https://busan.grandculture.net/ImageView.aspx?fi=GC042P56430&t=middle&ext=jpg&iwm=1", alt: "조개껍데기 가면", width: 640, height: 630, credit: "출처: 부산역사문화대전(한국학중앙연구원)" },
  // 미송리식 토기
  "d03-c10": { src: "https://i.namu.wiki/i/3emZjUpd7DyfY1gTUnBDloYa4zu9sdbOTXkMJudtZfWJegSHnhETQTIjD4ngJ1I_varCRbT3N1jt08fCgsPrUA.webp", alt: "미송리식 토기", width: 767, height: 955, credit: "출처: 나무위키" },
  // 청동기 시대의 바위그림
  "d03-c20": { src: "https://contents.nahf.or.kr/download.do?fileName=ag_0050250.jpg&levelId=ag.d_0005_0010_0060", alt: "청동기 시대의 바위그림", width: 840, height: 641, credit: "출처: 동북아역사재단" },
  // 세형 동검
  "d04-c04": { src: "https://contents.history.go.kr/data/img/kc/thumb/kc_r000500.jpg", alt: "세형 동검", width: 515, height: 669, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 거푸집 — 지시서의 gstatic 썸네일 대신 찾은 안정 원본(전 영암 거푸집 일괄)
  "d04-c06": { src: "https://upload.wikimedia.org/wikipedia/commons/0/04/%EC%A0%84_%EC%98%81%EC%95%94_%EA%B1%B0%ED%91%B8%EC%A7%91_%EC%9D%BC%EA%B4%84.jpg", alt: "거푸집", width: 750, height: 471 },
  // 거푸집(용범)
  "d04-q02": { src: "https://devin.aks.ac.kr/image/b44beebf-d061-4f5f-b3a3-8e5a0fc17b97?preset=page", alt: "거푸집", width: 226, height: 350, credit: "출처: 한국학중앙연구원" },
  // 한 군현 설치 (한글 지명판)
  "d06-c16": { src: "https://upload.wikimedia.org/wikipedia/commons/5/52/Four_Commanderies_of_Han%2C_with_Korean_Names.png", alt: "한 군현 설치", width: 2000, height: 1500 },
  // 낙랑의 문화
  "d06-c19": { src: "https://upload.wikimedia.org/wikipedia/commons/5/52/Four_Commanderies_of_Han%2C_with_Korean_Names.png", alt: "낙랑의 문화", width: 2000, height: 1500 },
  // 무령왕릉
  "d12-c05": { src: "https://img.khan.co.kr/news/2021/03/19/l_2021031901002320300198132.jpg", alt: "무령왕릉", width: 700, height: 694, credit: "출처: 경향신문" },
  // 무령왕릉 (d12-c05 와 동일)
  "d20-c08": { src: "https://img.khan.co.kr/news/2021/03/19/l_2021031901002320300198132.jpg", alt: "무령왕릉", width: 700, height: 694, credit: "출처: 경향신문" },
  // 천마총과 천마도
  "d20-c11": { src: "https://i.namu.wiki/i/EmNAI1iPUpHCMFwW7EIhXNd2AXLQ8HNSGzSy4q13gdy7oNVbMzrz6LlE5JFKqZZsTKPOISn3JsFo1xrU9ygtkw.webp", alt: "천마총과 천마도", width: 750, height: 679, credit: "출처: 나무위키" },
  // 금동 연가 7년명 여래 입상
  "d20-c13": { src: "https://i.namu.wiki/i/R_wYTlDN6aqbqCaakpdQIOZ0rQsbOYjn9blK8dWOr8oak2yNohphV6lERbPE881zc3XulPUM2XbswR4wArqD5g.webp", alt: "금동 연가 7년명 여래 입상", width: 1000, height: 1333, credit: "출처: 나무위키" },
  // 익산 미륵사지 석탑
  "d20-c16": { src: "https://minio.nculture.org/amsweb-opt/multimedia_assets/176/112972/159703/c/%EC%9D%B5%EC%82%B0-%EB%AF%B8%EB%A5%B5%EC%82%AC%EC%A7%80%EC%84%9D%ED%83%91_%EC%9D%B5%EC%82%B0%EB%AF%B8%EB%A5%B5%EC%82%AC%EC%A7%80%EC%84%9D%ED%83%91-%EC%A0%84%EA%B2%BD-%281%29_%EB%AC%B8%ED%99%94%EC%9E%AC%EC%B2%AD_%EC%A0%9C1%EC%9C%A0%ED%98%95-medium-size.jpg", alt: "익산 미륵사지 석탑", width: 1024, height: 817, credit: "출처: 국가유산청 공공누리 제1유형" },
  // 혜초와 왕오천축국전
  "d23-c13": { src: "https://i.namu.wiki/i/Ge6-GVh_X_2PLW4ybXwEQCgpZho56PsJ4E8Y1yVg-0iMb4Q9ylnBj75riRpn4VDs0hDOisz16XD02qNcs9Nqhg.webp", alt: "혜초와 왕오천축국전", width: 740, height: 493, credit: "출처: 나무위키" },
  // 불국사 3층 석탑(석가탑)
  "d23-c16": { src: "https://www.heritage.go.kr/unisearch/images/national_treasure/thumb/2021070210514100.jpg", alt: "불국사 3층 석탑(석가탑)", width: 432, height: 648, credit: "출처: 국가유산청" },
  // 쌍봉사 철감선사탑 — gstatic 썸네일 대신 찾은 안정 원본(원본 8.5MB 라 1280px 렌디션 사용)
  "d24-c21": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/%EC%8C%8D%EB%B4%89%EC%82%AC_%EC%B2%A0%EA%B0%90%EC%84%A0%EC%82%AC%ED%83%91.jpg/1280px-%EC%8C%8D%EB%B4%89%EC%82%AC_%EC%B2%A0%EA%B0%90%EC%84%A0%EC%82%AC%ED%83%91.jpg", alt: "쌍봉사 철감선사탑", width: 1280, height: 1488 },
  // 발해의 영역
  "d25-c18": { src: "https://i.namu.wiki/i/8cX7rX8erLWBpsNryxrfvvUnvn6WuQEGcnr4Dsa3NILqVewENIS1t4Jrt6hDAWbPjY4fH8iUzf4iObhxFUUE-w.webp", alt: "발해의 영역", width: 1000, height: 1015, credit: "출처: 나무위키" },
  // 이불병좌상
  "d27-c03": { src: "https://mblogthumb-phinf.pstatic.net/MjAyMzEwMjZfMjM2/MDAxNjk4MzAzOTI4MDQw.s-ApHP-0jrr6PD0WjlXlIoM3B6drxJlHKOeUf_qsg3cg.N0jyJd_0EB22ULnB1-TVP9i8QIayreO0rjvnoQVQTBkg.JPEG.jhleetck1/20231026%EF%BC%BF155758.jpg?type=w800", alt: "이불병좌상", width: 800, height: 1067, credit: "출처: 네이버 블로그" },
  // 정효공주묘 벽화
  "d27-c11": { src: "https://contents.nahf.or.kr/download.do?fileName=ismy_0010048.jpg&levelId=ismy.d_0003_0030_0020", alt: "정효공주묘 벽화", width: 2834, height: 2119, credit: "출처: 동북아역사재단" },
  // 정혜공주묘 돌사자상 — gstatic 썸네일 대신 찾은 안정 원본. Commons·동북아역사재단에 이 유물
  // 사진이 없어 우리역사넷 역대 국사교과서 도판(302×319, 지면 스캔)을 쓴다
  "d27-c09": { src: "https://contents.history.go.kr/data/img/ta/ta_h61/ta_h61_1150_01.jpg", alt: "정혜공주묘 돌사자상", width: 302, height: 319, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 영광탑
  "d27-c13": { src: "https://www.yeongnam.com/mnt/file/200609/20060912.010012258370001i1.jpg", alt: "영광탑", width: 600, height: 927, credit: "출처: 영남일보" },
  // 이불병좌상 (d27-c03 과 동일)
  "d27-q01": { src: "https://mblogthumb-phinf.pstatic.net/MjAyMzEwMjZfMjM2/MDAxNjk4MzAzOTI4MDQw.s-ApHP-0jrr6PD0WjlXlIoM3B6drxJlHKOeUf_qsg3cg.N0jyJd_0EB22ULnB1-TVP9i8QIayreO0rjvnoQVQTBkg.JPEG.jhleetck1/20231026%EF%BC%BF155758.jpg?type=w800", alt: "이불병좌상", width: 800, height: 1067, credit: "출처: 네이버 블로그" },
  // 영광탑 (d27-c13 과 동일)
  "d27-q05": { src: "https://www.yeongnam.com/mnt/file/200609/20060912.010012258370001i1.jpg", alt: "영광탑", width: 600, height: 927, credit: "출처: 영남일보" },
  // 후삼국의 정립
  "d28-c19": { src: "https://contents.history.go.kr/data/img/eh/eh_r0118/eh_r0118_m02.jpg", alt: "후삼국의 정립", width: 1200, height: 1417, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 강동 6주
  "d34-c06": { src: "https://cdn.koreahiti.com/news/photo/201705/2046_691_1338.jpg", alt: "강동 6주", width: 520, height: 462, credit: "출처: 코리아 히스토리 타임스" },
  // 천리장성
  "d34-c18": { src: "https://i.namu.wiki/i/i0Px_srJhIXOFzcrYTgTs7CQqKokK2hYLm8xQzvpSkvY0LCZP-0TVdN8MPTV9pGo1CTiobUekZGCRpVi6yc3_A.webp", alt: "천리장성", width: 512, height: 302, credit: "출처: 나무위키" },
  // 초조대장경
  "d34-c19": { src: "https://contents.history.go.kr/data/img/kc/thumb/kc_r200380.jpg", alt: "초조대장경", width: 781, height: 400, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 초조대장경 (d34-c19 와 동일)
  "d34-q06": { src: "https://contents.history.go.kr/data/img/kc/thumb/kc_r200380.jpg", alt: "초조대장경", width: 781, height: 400, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 몽골풍
  "d38-c14": { src: "https://i.namu.wiki/i/fkD1gvd5AsfqOdV6Rg_os_mtxIry2kLtTikpJA9ZWkk1k_xIlN1OvPjnLJbYEdjgdQ2WnqDKW6aK3h8p7hER_Q.webp", alt: "몽골풍", width: 500, height: 354, credit: "출처: 나무위키" },
  // 천산대렵도 — gstatic 썸네일 대신 찾은 안정 원본(Commons 판은 250×297 로 너무 작아 제외)
  "d39-c21": { src: "https://contents.history.go.kr/data/img/ta/ta_m71/img_116_01.jpg", alt: "천산대렵도", width: 900, height: 1012, credit: "출처: 우리역사넷(국사편찬위원회)" },
  // 고려청자
  "d43-c01": { src: "https://i.namu.wiki/i/y_3AaYvUaV3H84xc9vw0oiDdOXB2gQbKbD4hh15-VY_eHQ9rPW43FeB7MR1K6vT1Md7ES91p2-2GItbSxapbww.webp", alt: "고려청자", width: 635, height: 755, credit: "출처: 나무위키" },
  // 상감청자 — 지시서가 d43-c01(고려청자) 과 같은 URL 을 지정했다(지시 그대로 유지, 추후 확인 필요)
  "d43-c02": { src: "https://i.namu.wiki/i/y_3AaYvUaV3H84xc9vw0oiDdOXB2gQbKbD4hh15-VY_eHQ9rPW43FeB7MR1K6vT1Md7ES91p2-2GItbSxapbww.webp", alt: "상감청자", width: 635, height: 755, credit: "출처: 나무위키" },
  // 직지심체요절
  "d43-c04": { src: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Korean_book-Jikji-Selected_Teachings_of_Buddhist_Sages_and_Seon_Masters-1377.jpg", alt: "『직지심체요절』", width: 500, height: 400 },
  // 분청사기
  "d53-c10": { src: "https://i.namu.wiki/i/ZOxUAur7Fx0c4-Oz6-EypkLbKluRnm1qg3Jhx82orrAz20O2w1SaYQfSEfjoxO9hRwV7Qr9Yck3Z8Uc8ABpZqQ.webp", alt: "분청사기", width: 401, height: 500, credit: "출처: 나무위키" },
  // 순백자
  "d53-c11": { src: "https://www.jemin.com/news/photo/200904/217674_39724_5442.jpg", alt: "순백자", width: 377, height: 532, credit: "출처: 제민일보" },
  // 안견의 몽유도원도
  "d53-c12": { src: "https://i.namu.wiki/i/IxjK5Xi0XRy6steX1sqZXyX-Ec0u_qNoC2yiWrs7zsFMI5ONC1Ft9axXJkO-PmtJBCcNQRHnbP0uherrALQmiQ.webp", alt: "안견의 「몽유도원도」", width: 1000, height: 363, credit: "출처: 나무위키" },
  // 정선의 금강전도
  "d64-c04": { src: "https://www.heritage.go.kr/unisearch/images/national_treasure/thumb/1611691.jpg", alt: "정선의 「금강전도」", width: 307, height: 432, credit: "출처: 국가유산청" },
  // 김홍도의 풍속화
  "d64-c05": { src: "https://www.koya-culture.com/data/photos/20210521/art_1622381602089_12cb4d.jpg", alt: "김홍도의 풍속화", width: 500, height: 375, credit: "출처: 우리문화신문" },
  // 신윤복의 풍속화
  "d64-c06": { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Hyewon-Miindo.jpg/250px-Hyewon-Miindo.jpg", alt: "신윤복의 풍속화", width: 250, height: 656 },
  // 민화
  "d64-c07": { src: "https://img.hankyung.com/photo/202601/01.43007898.1.jpg", alt: "민화", width: 1200, height: 1749, credit: "출처: 한국경제" },
  // 수자기 — 사진이 문항 핵심이므로 유지·교체
  "d66-q06": { src: "https://wimg.sedaily.com/news/legacy/2018/10/14/1S5WS6Z2W8_2.jpg", alt: "수자기", width: 305, height: 283, credit: "출처: 서울경제" },
};

export const IMAGE_ALIASES: Record<string, string> = {
  "d01-q01": "d01-c03", // 주먹도끼
  "d02-q01": "d02-c03", // 빗살무늬 토기
  "d02-q11": "d02-c07", // 갈돌과 갈판
  "d03-q01": "d03-c06", // 반달 돌칼
  "d03-q02": "d03-c06", // 반달 돌칼
  "d03-q03": "d03-c12", // 고인돌
};
