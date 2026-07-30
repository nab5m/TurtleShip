-- 한국사 28일 학습 앱 스키마
-- Supabase SQL Editor에서 실행하세요.
-- 이미 90일 커리큘럼으로 운영 중인 프로젝트라면 supabase/migrations/2026-07-30-28day-curriculum.sql 를 먼저 실행하세요.

-- 학습 완료 기록 (사용자 × 학습일차, 1~28)
create table if not exists public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null check (day between 1 and 28),
  date text not null, -- 최초 학습 완료일 "YYYY-MM-DD"
  score int not null default 0,
  total int not null default 0,
  wrong_quiz_ids jsonb not null default '[]'::jsonb,
  review_dates jsonb not null default '[]'::jsonb, -- 망각곡선 복습 완료일 목록
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- 학습 중간 저장 (사용자 × 학습일차) — 그 일차에서 카드를 끝까지 본 단원 목록.
-- 하루치가 단원 2~4개라 중간에 끊고 다음에 이어서 학습할 수 있어야 한다.
-- 퀴즈까지 마쳐 progress 에 완료 기록이 생기면 이 행은 삭제된다(완료 기록이 대체).
create table if not exists public.day_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null check (day between 1 and 28),
  studied_units jsonb not null default '[]'::jsonb, -- 학습을 마친 단원 번호 배열 (1~90)
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- 즐겨찾기 (카드/퀴즈)
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null, -- "d09-c01" / "d09-q02"
  item_type text not null check (item_type in ('card', 'quiz')),
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- RLS: 본인 데이터만 접근 가능
alter table public.progress enable row level security;
alter table public.day_progress enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "progress_own" on public.progress;
create policy "progress_own" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "day_progress_own" on public.day_progress;
create policy "day_progress_own" on public.day_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
