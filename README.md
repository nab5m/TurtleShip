# 거북선 — 한능검 심화 대비 한국사 학습 앱

하루 30분씩 90일 동안 한국사능력검정시험 **심화**를 대비하는 카드 학습 앱입니다.

- **90일 커리큘럼**: 구석기 → 신석기 → 청동기 → 철기 → 고조선 → 연맹왕국 → 삼국 → 남북국 → 후삼국 → 고려 → 조선전기 → 조선후기 → 개항기 → 일제강점기 → 현대
- **1일 학습 세트**: 키워드 카드 20~25장 + 4지선다 퀴즈 12~15문항
- **망각곡선 복습**: 학습 완료 후 1·3·7·14·30일 간격으로 복습 세트 자동 등록 (틀린 문제 우선 출제)
- **학습 캘린더**: 학습/복습 이력을 달력으로 확인
- **즐겨찾기**: 카드/퀴즈 별표 후 모아보기
- **이미지 자료**: 유물·문화재 등 시각자료가 중요한 카드에 Wikimedia Commons 이미지 표시
- **게스트 모드 + Google 로그인**: 로그인 없이 사용 가능(localStorage), 로그인하면 Supabase에 저장되어 기기 간 동기화. 게스트 기록은 첫 로그인 때 자동 병합
- **PWA**: 홈 화면에 설치 가능하고, 서비스워커로 이미 본 화면은 오프라인에서도 열람 가능

## 실행

```bash
npm install
npm run dev
```

`.env.local` 없이도 게스트 모드로 모든 기능이 동작합니다.

## Supabase 설정 (Google 로그인)

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. **SQL Editor**에서 `supabase/schema.sql` 실행 (progress / favorites 테이블 + RLS)
3. `.env.local.example`을 `.env.local`로 복사하고 Project Settings → API의 **URL / anon key** 입력
4. **Google 로그인 활성화** — Google 자격증명은 앱 `.env`가 아니라 **Supabase 대시보드**에 넣습니다.
   1. **Google Cloud Console** → 사용자 인증 정보 → **OAuth 2.0 클라이언트 ID**(웹 애플리케이션) 생성
      - 승인된 리디렉션 URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   2. **Supabase → Authentication → Providers → Google** → **Enable** → 위 Client ID / Secret 입력 → Save
   3. **Supabase → Authentication → URL Configuration** → Redirect URLs에 추가:
      `http://localhost:3000/auth/callback`, `https://<배포도메인>/auth/callback`

> **`Unsupported provider: provider is not enabled` 오류**는 위 4-2단계(Supabase에서 Google 프로바이더 Enable)가 안 된 것입니다. 앱에 추가할 환경변수는 없습니다.

## 콘텐츠 파이프라인

| 명령 | 설명 |
| --- | --- |
| `npm run validate:content` | 카드/퀴즈 무결성 검증 (id 중복, 정답 범위, 분량 등) |
| `npm run resolve:images` | `imageSearch` 검색어를 Wikimedia Commons 이미지 URL로 변환해 `src/data/content/images.ts` 생성 |
| `npm run gen:icons` | 거북선 PWA 아이콘(파비콘·192·512·마스커블·애플) 생성 |
| `npm run gen:og` | 링크 미리보기용 OG 이미지 `public/og.png`(1200×630) 생성 |

## PWA

- `app/manifest.ts` → `/manifest.webmanifest`, `public/sw.js`(서비스워커), `src/components/ServiceWorkerRegister.tsx`(등록)
- 서비스워커는 **프로덕션에서만** 등록됩니다. 설치·오프라인 테스트는 `npm run build && npm start`로 확인하세요 (개발 모드 `npm run dev`에서는 등록 안 됨).
- 아이콘 모티프를 바꾸려면 `scripts/gen-icons.mjs`의 SVG를 수정하고 `npm run gen:icons` 실행.

## 링크 미리보기 (OG / 카카오톡)

- `app/layout.tsx`의 `openGraph`/`twitter` 메타 + `public/og.png`(1200×630, 로고 카드).
- **절대 URL이 필요**하므로 배포 시 `.env`에 `NEXT_PUBLIC_SITE_URL=https://<도메인>`을 설정하세요 (og:image가 `<도메인>/og.png`로 나감).
- 카카오톡은 미리보기를 강하게 캐시합니다. 변경 후에도 옛 이미지가 보이면 [카카오 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 URL을 입력해 캐시를 초기화하세요.

콘텐츠 데이터는 `src/data/content/days-*.ts`, 90일 커리큘럼 설계는 `src/data/curriculum.ts`에 있습니다.
작성 기준은 `docs/content-guide.md`를 참고하세요.

## 구조

```
src/
  app/                # 라우트 (홈, learn/[day], review/[day], curriculum, calendar, favorites, login)
  components/         # AppShell, CardView, QuizRunner, 세션 UI
  data/
    curriculum.ts     # 15개 시대 × 90일 학습 설계
    content/          # 일차별 카드/퀴즈 데이터 + 이미지 맵
  lib/
    types.ts          # 도메인 타입 + 망각곡선 계산
    progress-store.ts # localStorage / Supabase 저장소
    progress-context.tsx # 학습 상태 컨텍스트 (게스트↔회원 동기화)
    supabase/         # Supabase 클라이언트
supabase/schema.sql   # DB 스키마 + RLS
scripts/              # 콘텐츠 검증·이미지 resolve
```
