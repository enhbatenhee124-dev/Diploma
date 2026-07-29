-- ============================================================
-- EXP / Level / Ranking
-- ============================================================
-- EXP-ийг ХАДГАЛАХГҮЙ — дууссан ажлаас шууд бодно. Ингэснээр:
--   • хуурамчаар нэмэгдэх боломжгүй
--   • өгөгдөл засагдвал (ажил цуцлагдвал) EXP автоматаар зөв болно
--   • синк алдагдахгүй
-- ============================================================

-- EXP-ийн тарифыг нэг дор төвлөрүүлнэ (өөрчлөхөд энэ функцийг л засна)
create or replace function public.exp_rates()
returns table (
  employee_per_hour   integer,
  employee_per_shift  integer,
  employer_per_hour   integer,
  employer_per_shift  integer,
  star5 integer, star4 integer, star3 integer
)
language sql immutable as $$
  select 10, 25, 4, 20, 30, 15, 5
$$;

create or replace function public.star_bonus(p_stars smallint)
returns integer
language sql immutable as $$
  select case
    when p_stars >= 5 then 30
    when p_stars >= 4 then 15
    when p_stars >= 3 then 5
    else 0
  end
$$;

-- ------------------------------
-- Хэрэглэгч бүрийн статистик
-- ------------------------------
create or replace view public.user_stats as
with completed as (
  -- Ажилтны дуусгасан ажил
  select
    a.worker_id as user_id,
    'employee'::user_role as role,
    public.shift_hours(s.*) as hours,
    25 + round(public.shift_hours(s.*) * 10)::integer as exp
  from public.applications a
  join public.shifts s on s.id = a.shift_id
  where a.status = 'completed'

  union all

  -- Ажил олгогчийн хаагдсан ажил
  select
    s.employer_id as user_id,
    'employer'::user_role as role,
    public.shift_hours(s.*) as hours,
    20 + round(public.shift_hours(s.*) * 4)::integer as exp
  from public.applications a
  join public.shifts s on s.id = a.shift_id
  where a.status = 'completed'
),
work as (
  select
    user_id,
    count(*)::integer            as completed_jobs,
    round(sum(hours))::integer   as total_hours,
    sum(exp)::integer            as work_exp
  from completed
  group by user_id
),
rated as (
  select
    reviewee_id                                       as user_id,
    count(*)::integer                                 as review_count,
    round(avg(stars)::numeric, 1)                     as avg_rating,
    count(*) filter (where stars >= 5)::integer       as five_stars,
    sum(public.star_bonus(stars))::integer            as review_exp
  from public.reviews
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
left join rated r on r.user_id = p.id;

-- ------------------------------
-- EXP → Level
-- ------------------------------
-- Босго: Lv.1=0, Lv.2=120, Lv.3=300, Lv.4=560, Lv.5=900, Lv.6=1320,
--        Lv.7=1820, Lv.8=2400, Lv.9=3060, Lv.10=3800, Lv.11=4620,
--        цаашид level тутам +1200
create or replace function public.exp_for_level(p_level integer)
returns integer
language sql immutable as $$
  select case
    when p_level <= 11 then (array[0,120,300,560,900,1320,1820,2400,3060,3800,4620])[greatest(p_level, 1)]
    else 4620 + (p_level - 11) * 1200
  end
$$;

create or replace function public.level_from_exp(p_exp integer)
returns integer
language sql immutable as $$
  -- Хамгийн их level-ийг олно: exp_for_level(level) <= p_exp
  select coalesce(max(lvl), 1)
  from generate_series(1, 100) as lvl
  where public.exp_for_level(lvl) <= greatest(coalesce(p_exp, 0), 0)
$$;

-- ------------------------------
-- Явц (dashboard, профайлд хэрэглэнэ)
-- ------------------------------
create or replace view public.user_progress as
select
  s.*,
  public.level_from_exp(s.exp)                                        as level,
  public.exp_for_level(public.level_from_exp(s.exp))                  as current_level_exp,
  public.exp_for_level(public.level_from_exp(s.exp) + 1)              as next_level_exp,
  s.exp - public.exp_for_level(public.level_from_exp(s.exp))          as into_level,
  public.exp_for_level(public.level_from_exp(s.exp) + 1) - s.exp      as needed_for_next,
  round(
    100.0 * (s.exp - public.exp_for_level(public.level_from_exp(s.exp)))
    / nullif(
        public.exp_for_level(public.level_from_exp(s.exp) + 1)
        - public.exp_for_level(public.level_from_exp(s.exp)), 0
      )
  )::integer                                                          as progress_pct
from public.user_stats s;

-- ------------------------------
-- Тэргүүлэгчид
-- ------------------------------
create or replace view public.rankings as
select
  p.*,
  rank() over (partition by p.role order by p.exp desc, p.completed_jobs desc, p.name) as rank
from public.user_progress p
where p.role <> 'admin';

-- ------------------------------
-- Цалин ↔ шаардлагатай level
-- ------------------------------
create or replace function public.required_level_for_wage(p_wage integer)
returns integer
language sql immutable as $$
  select case
    when p_wage >= 30000 then 8
    when p_wage >= 25000 then 6
    when p_wage >= 20000 then 5
    when p_wage >= 17000 then 4
    when p_wage >= 15000 then 3
    when p_wage >= 12500 then 2
    else 1
  end
$$;

-- ------------------------------
-- Level шаардлагыг өгөгдлийн сангийн түвшинд хамгаална
-- ------------------------------
-- Frontend дээрх түгжээг тойрч API руу шууд хүсэлт илгээж болно.
-- Энэ триггер нь түвшин хүрээгүй ажилтныг өндөр цалинтай ажилд орохыг эцэслэн хориглоно.
create or replace function public.enforce_level_requirement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wage     integer;
  v_required integer;
  v_level    integer;
begin
  select hourly_wage into v_wage from public.shifts where id = new.shift_id;
  v_required := public.required_level_for_wage(v_wage);

  if v_required > 1 then
    select public.level_from_exp(coalesce(exp, 0)) into v_level
    from public.user_stats where user_id = new.worker_id;

    if coalesce(v_level, 1) < v_required then
      raise exception 'Энэ ажилд Lv.% шаардлагатай (та Lv.%).', v_required, coalesce(v_level, 1)
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger applications_enforce_level
  before insert on public.applications
  for each row execute function public.enforce_level_requirement();

-- ------------------------------
-- View-үүдийн хандалт
-- ------------------------------
-- security_invoker = on гэснээр view нь дуудаж буй хэрэглэгчийн эрхээр
-- ажиллана — өөрөөр хэлбэл доод хүснэгтүүдийн RLS хүчинтэй хэвээр байна.
alter view public.user_stats    set (security_invoker = on);
alter view public.user_progress set (security_invoker = on);
alter view public.rankings      set (security_invoker = on);

grant select on public.user_stats, public.user_progress, public.rankings to authenticated;
