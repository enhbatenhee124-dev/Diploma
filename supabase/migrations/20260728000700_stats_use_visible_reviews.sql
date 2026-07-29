-- ============================================================
-- EXP тооцоог НЭЭГДСЭН үнэлгээнд суурилуулах
-- ============================================================
-- Асуудал:
--   user_stats нь `reviews` хүснэгтээс шууд уншдаг (security_invoker = off тул
--   RLS-ийг тойрдог). Үүнээс болж ажил олгогч үнэлгээ өгмөгц ажилтны EXP,
--   дундаж од ШУУД өөрчлөгдөж, "чамайг үнэлчихлээ" гэдгийг далдуур илчилнэ.
--   Энэ нь далд үнэлгээний (FR-7.2) утгыг алдагдуулна.
--
-- Шийдэл:
--   visible_reviews (хоёул өгсөн эсвэл 7 хоног өнгөрсөн) дээр суурилуулна.
--   Ингэснээр EXP-ийн өсөлт үнэлгээ нээгдэх мөчид л гарна.
-- ============================================================

create or replace view public.user_stats as
with completed as (
  select
    a.worker_id as user_id,
    public.shift_hours(s.*) as hours,
    25 + round(public.shift_hours(s.*) * 10)::integer as exp
  from public.applications a
  join public.shifts s on s.id = a.shift_id
  where a.status = 'completed'

  union all

  select
    s.employer_id as user_id,
    public.shift_hours(s.*) as hours,
    20 + round(public.shift_hours(s.*) * 4)::integer as exp
  from public.applications a
  join public.shifts s on s.id = a.shift_id
  where a.status = 'completed'
),
work as (
  select
    user_id,
    count(*)::integer          as completed_jobs,
    round(sum(hours))::integer as total_hours,
    sum(exp)::integer          as work_exp
  from completed
  group by user_id
),
rated as (
  -- ЗӨВХӨН нээгдсэн үнэлгээ
  select
    reviewee_id                                 as user_id,
    count(*)::integer                           as review_count,
    round(avg(stars)::numeric, 1)               as avg_rating,
    count(*) filter (where stars >= 5)::integer as five_stars,
    sum(public.star_bonus(stars))::integer      as review_exp
  from public.visible_reviews
  group by reviewee_id
)
select
  p.id                                   as user_id,
  p.role,
  p.name,
  p.avatar_url,
  coalesce(w.completed_jobs, 0)          as completed_jobs,
  coalesce(w.total_hours, 0)             as total_hours,
  coalesce(r.review_count, 0)            as review_count,
  coalesce(r.avg_rating, 0)              as avg_rating,
  coalesce(r.five_stars, 0)              as five_stars,
  coalesce(w.work_exp, 0) + coalesce(r.review_exp, 0) as exp
from public.profiles p
left join work  w on w.user_id = p.id
left join rated r on r.user_id = p.id
where p.deactivated_at is null;

alter view public.user_stats set (security_invoker = off);
grant select on public.user_stats to authenticated;
