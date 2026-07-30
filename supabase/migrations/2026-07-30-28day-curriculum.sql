-- 90일 커리큘럼 → 28일 커리큘럼 마이그레이션 (한 번만 실행)
--
-- 배경: 학습 단원 90개는 그대로 두고, 하루에 단원 2~4개를 묶어 28일 커리큘럼으로 바꿨다.
--       progress.day 의 의미가 '단원 번호(1~90)' 에서 '일차(1~28)' 로 바뀌므로 기존 기록을 변환한다.
-- 규칙: 그 일차에 묶인 단원을 '모두' 완료한 경우만 일차 완료로 인정한다(부분 학습은 다시 학습).
--       점수·문항수는 합산, 최초 학습일은 가장 늦은 날, 복습 단계는 가장 적게 복습한 단원 기준(보수적).
--       변환 규칙은 src/lib/progress-store.ts 의 migrateV1() 과 동일하다.
-- 실행: Supabase → SQL Editor 에 이 파일 전체를 붙여넣고 실행. 두 번 실행하면 첫 단계에서 중단된다.

begin;

-- 0) 중복 실행 방지 — day 체크가 아직 1~90 기준인지 확인
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.progress'::regclass
      and conname = 'progress_day_check'
      and pg_get_constraintdef(oid) like '%90%'
  ) then
    raise exception '이미 28일 커리큘럼 기준으로 보입니다(progress_day_check 가 90 기준이 아님). 중복 실행을 막기 위해 중단합니다.';
  end if;
end $$;

-- 1) 단원(1~90) → 일차(1~28) 매핑 (src/data/curriculum.ts 의 DAY_PLAN 과 동일)
create temporary table unit_day_map on commit drop as
select d.day, u.unit
from (values
  (1, 1, 4), (2, 5, 8), (3, 9, 11), (4, 12, 14), (5, 15, 17), (6, 18, 20),
  (7, 21, 24), (8, 25, 27), (9, 28, 30), (10, 31, 33), (11, 34, 36), (12, 37, 39),
  (13, 40, 43), (14, 44, 46), (15, 47, 49), (16, 50, 52), (17, 53, 54), (18, 55, 57),
  (19, 58, 60), (20, 61, 64), (21, 65, 67), (22, 68, 70), (23, 71, 73), (24, 74, 76),
  (25, 77, 79), (26, 80, 83), (27, 84, 86), (28, 87, 90)
) as d(day, unit_from, unit_to)
cross join lateral generate_series(d.unit_from, d.unit_to) as u(unit);

-- 2) 묶인 단원을 모두 학습한 일차만 새 기록으로 집계
create temporary table migrated_progress on commit drop as
select
  p.user_id,
  m.day,
  max(p.date) as date,
  sum(p.score)::int as score,
  sum(p.total)::int as total,
  coalesce(jsonb_agg(distinct w.elem) filter (where w.elem is not null), '[]'::jsonb) as wrong_quiz_ids,
  coalesce((
    select p2.review_dates
    from public.progress p2
    join unit_day_map m2 on m2.unit = p2.day
    where p2.user_id = p.user_id and m2.day = m.day
    order by jsonb_array_length(p2.review_dates), p2.day
    limit 1
  ), '[]'::jsonb) as review_dates
from public.progress p
join unit_day_map m on m.unit = p.day
left join lateral jsonb_array_elements(p.wrong_quiz_ids) as w(elem) on true
group by p.user_id, m.day
having count(distinct p.day) = (select count(*) from unit_day_map m3 where m3.day = m.day);

-- 3) 옛 단원 기준 기록을 새 일차 기준 기록으로 교체
delete from public.progress;

insert into public.progress (user_id, day, date, score, total, wrong_quiz_ids, review_dates, updated_at)
select user_id, day, date, score, total, wrong_quiz_ids, review_dates, now()
from migrated_progress;

-- 4) 체크 제약을 1~28 로 갱신
alter table public.progress drop constraint if exists progress_day_check;
alter table public.progress add constraint progress_day_check check (day between 1 and 28);

commit;

-- 즐겨찾기(favorites)는 카드/퀴즈 id 기준이라 변경할 것이 없다.
