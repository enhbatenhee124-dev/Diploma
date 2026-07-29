-- ============================================================
-- Утас / и-мэйлийн нууцлал (NFR-3)
-- ============================================================
-- Асуудал:
--   `profiles_select_authenticated ... using (true)` нь нэвтэрсэн ХЭН Ч бүх
--   хэрэглэгчийн утас, и-мэйлийг уншихыг зөвшөөрч байсан. Скриптээр бүх
--   дугаарыг татаж авах боломжтой байв.
--
-- Шийдэл:
--   • public_profiles view — холбоо барих мэдээлэлГҮЙ, бүгд харна
--   • profiles хүснэгт — зөвхөн өөрийн мөр ба админ
--   • contact_info() — утас/и-мэйлийг зөвхөн эрхтэй хүнд буцаана:
--       өөрөө / админ / зөвшөөрөгдсөн ажлын нөгөө тал
--
-- Postgres-д багана тус бүрээр RLS тавих боломжгүй тул view-гээр тусгаарлав.
-- ============================================================

-- ------------------------------
-- 1. Нийтэд харагдах профайл (утас/и-мэйлгүй)
-- ------------------------------
create or replace view public.public_profiles as
select
  p.id,
  p.role,
  p.name,
  p.avatar_url,
  p.district,
  p.bio,
  p.created_at
from public.profiles p;

-- Доод хүснэгтийн RLS-ийг тойрч бүх профайлыг харуулна.
-- Ил гарах багана нь дээрх жагсаалтаар хатуу хязгаарлагдсан.
alter view public.public_profiles set (security_invoker = off);

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

-- ------------------------------
-- 2. profiles хүснэгтийг хумина
-- ------------------------------
drop policy if exists profiles_select_authenticated on public.profiles;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- ------------------------------
-- 3. Холбоо барих мэдээлэл — эрхтэй хүнд л
-- ------------------------------
-- Зөвшөөрөгдсөнөөс хойших ажлын хоёр тал бие биеийнхээ дугаарыг харна.
-- Ингэснээр чат ажиллах хүртэл холбогдох арга үлдэнэ.
create or replace function public.contact_info(p_user uuid)
returns table (phone text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select p.phone, p.email
  from public.profiles p
  where p.id = p_user
    and (
      -- өөрийн мэдээлэл
      p.id = auth.uid()
      -- админ
      or public.is_admin()
      -- зөвшөөрөгдсөн ажлаар холбогдсон нөгөө тал
      or exists (
        select 1
        from public.applications a
        join public.shifts s on s.id = a.shift_id
        where a.status in ('approved', 'in-progress', 'completed')
          and (
            (a.worker_id = p_user      and s.employer_id = auth.uid()) or
            (s.employer_id = p_user    and a.worker_id   = auth.uid())
          )
      )
    )
$$;

grant execute on function public.contact_info(uuid) to authenticated;

-- ------------------------------
-- 4. Хамааралтай view-үүдийг засах
-- ------------------------------
-- invoice_overview нь profiles-оос уншдаг. security_invoker = on байсан тул
-- шинэ хатуу policy-гоос болж админд ч хоосон харагдах болно. Админ л уншдаг
-- тул эзэмшигчийн эрхээр ажиллуулж, доор нь эрхийг шалгана.
alter view public.invoice_overview set (security_invoker = off);

drop policy if exists invoices_select_own on public.invoices;
create policy invoices_select_own
  on public.invoices for select
  to authenticated
  using (employer_id = auth.uid() or public.is_admin());

-- invoice_overview-д хандах эрхийг функцээр шалгах боломжгүй тул
-- RLS-тэй invoices хүснэгт рүү буцаан холбож, шүүлтийг тэндээс авна.
create or replace view public.invoice_overview as
select
  i.id,
  i.employer_id,
  p.name          as employer_name,
  p.email         as employer_email,
  p.phone         as employer_phone,
  i.amount_mnt,
  i.status,
  i.period_start,
  i.period_end,
  i.due_at,
  i.paid_at,
  i.created_at
from public.invoices i
join public.profiles p on p.id = i.employer_id
where i.employer_id = auth.uid() or public.is_admin();

alter view public.invoice_overview set (security_invoker = off);
grant select on public.invoice_overview to authenticated;
