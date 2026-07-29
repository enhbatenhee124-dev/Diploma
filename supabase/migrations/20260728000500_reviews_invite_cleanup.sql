-- ============================================================
-- Далд үнэлгээ, ажилд урих, хэрэглэгч устгах, автомат хаалт
-- ============================================================

-- ------------------------------
-- 1. Далд үнэлгээ (FR-7.2)
-- ------------------------------
-- Хоёул үнэлгээ өгсний ДАРАА, эсвэл 7 хоног өнгөрсний дараа нээгдэнэ.
-- Ингэснээр "чи муу үнэлсэн тул би ч муу үнэлнэ" гэдэг хариу үнэлгээ гарахгүй.
alter table public.reviews
  add column if not exists visible_at timestamptz;

-- Тухайн ажлын үнэлгээ нээгдсэн эсэх
create or replace function public.review_is_visible(p_review public.reviews)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Өөрийн бичсэн үнэлгээг үргэлж харна
    p_review.reviewer_id = auth.uid()
    or public.is_admin()
    -- 7 хоног өнгөрсөн
    or p_review.published_at + interval '7 days' <= now()
    -- Нөгөө тал ч үнэлгээ өгсөн
    or exists (
      select 1 from public.reviews r2
      where r2.application_id = p_review.application_id
        and r2.reviewer_id <> p_review.reviewer_id
    )
$$;

-- Үнэлгээний policy-г шинэчилнэ
drop policy if exists reviews_select on public.reviews;

create policy reviews_select on public.reviews
  for select to authenticated
  using (public.review_is_visible(reviews.*));

-- Нээгдсэн үнэлгээ (профайл, ranking-д хэрэглэнэ)
create or replace view public.visible_reviews as
select r.*
from public.reviews r
where r.published_at + interval '7 days' <= now()
   or exists (
     select 1 from public.reviews r2
     where r2.application_id = r.application_id
       and r2.reviewer_id <> r.reviewer_id
   );

alter view public.visible_reviews set (security_invoker = off);
grant select on public.visible_reviews to authenticated;

-- ------------------------------
-- 2. Ажилд урих (ажил олгогчийн зүгээс)
-- ------------------------------
-- RLS нь ажилтан ЗӨВХӨН өөрийн нэрээр хүсэлт үүсгэхийг зөвшөөрдөг тул
-- ажил олгогч урих боломжгүй байсан. Энэ функц тухайн зар үнэхээр
-- дуудагчийнх мөн эсэхийг шалгаад л үүсгэнэ.
create or replace function public.invite_worker(p_shift uuid, p_worker uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift public.shifts;
  v_app   public.applications;
begin
  select * into v_shift from public.shifts where id = p_shift;
  if not found then
    raise exception 'Зар олдсонгүй.';
  end if;
  if v_shift.employer_id <> auth.uid() then
    raise exception 'Энэ зар танийх биш байна.';
  end if;
  if not exists (select 1 from public.profiles where id = p_worker and role = 'employee') then
    raise exception 'Ажил хайгч олдсонгүй.';
  end if;

  -- Аль хэдийн хүсэлт байвал зөвшөөрөгдсөн болгоно
  select * into v_app
  from public.applications
  where shift_id = p_shift and worker_id = p_worker;

  if found then
    if v_app.status in ('approved', 'in-progress', 'completed') then
      return v_app;
    end if;
    update public.applications
    set status = 'approved', decided_at = now()
    where id = v_app.id
    returning * into v_app;
  else
    insert into public.applications (shift_id, worker_id, status, decided_at)
    values (p_shift, p_worker, 'approved', now())
    returning * into v_app;
  end if;

  insert into public.notifications (user_id, type, message, description)
  values (p_worker, 'success', 'Ажилд урилаа',
          v_shift.title || ' — ажил олгогч таныг шууд урьлаа.');

  return v_app;
end;
$$;

grant execute on function public.invite_worker(uuid, uuid) to authenticated;

-- ------------------------------
-- 3. Хэрэглэгч устгах (админ)
-- ------------------------------
-- auth.users-ийг устгах нь тусгай эрх шаардана. Оронд нь профайлыг
-- идэвхгүй болгож, өгөгдлийг нь нэргүйжүүлнэ — үнэлгээ, ажлын түүх
-- бүрэн бүтэн үлдэнэ (маргаан гарвал хэрэгтэй).
alter table public.profiles
  add column if not exists deactivated_at timestamptz;

create or replace function public.deactivate_user(p_user uuid, p_reason text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ хийнэ.';
  end if;
  if p_user = auth.uid() then
    raise exception 'Өөрийгөө идэвхгүй болгож болохгүй.';
  end if;

  update public.profiles
  set deactivated_at = now(),
      phone          = null,
      email          = null,
      bio            = '',
      name           = 'Устгагдсан хэрэглэгч'
  where id = p_user
  returning * into v_row;

  if not found then
    raise exception 'Хэрэглэгч олдсонгүй.';
  end if;

  -- Идэвхтэй зар, хүсэлтийг нь хаана
  update public.shifts set status = 'Closed'
  where employer_id = p_user and status = 'Active';

  update public.applications set status = 'cancelled', cancelled_by = auth.uid(),
         cancel_reason = coalesce(p_reason, 'Хэрэглэгч идэвхгүй болсон')
  where worker_id = p_user and status in ('applied', 'approved');

  return v_row;
end;
$$;

grant execute on function public.deactivate_user(uuid, text) to authenticated;

-- Идэвхгүй хэрэглэгчийг жагсаалтаас нуух
create or replace view public.public_profiles as
select p.id, p.role, p.name, p.avatar_url, p.district, p.bio, p.created_at
from public.profiles p
where p.deactivated_at is null;

alter view public.public_profiles set (security_invoker = off);
grant select on public.public_profiles to authenticated;

-- ------------------------------
-- 4. Хугацаа өнгөрсөн зар автоматаар хаагдана (FR-4.3)
-- ------------------------------
create or replace function public.close_expired_shifts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.shifts
  set status = 'Closed'
  where status = 'Active' and end_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Зар уншигдах бүрд шалгах нь хүнд тул тусдаа дуудна.
-- Supabase Dashboard → Database → Cron дээр өдөрт нэг удаа тохируулна:
--   select public.close_expired_shifts();
grant execute on function public.close_expired_shifts() to authenticated;
