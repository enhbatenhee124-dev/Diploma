-- ============================================================
-- Ажил олгогчийн баталгаажуулалт (FR-3.2, NFR-5)
-- ============================================================
-- Асуудал:
--   • Админы "Баталгаажуулах / Татгалзах" товч onClick-гүй — зүгээр л зураг
--   • is_verified нь зар нийтлэхэд ОГТ шалгагддаггүй байсан
--   Шаардлагын баримт: "Баталгаажаагүй ажил олгогч зар нийтлэхгүй (эхэн үед)"
-- ============================================================

-- Татгалзсан шалтгааныг хадгалах
alter table public.employer_profiles
  add column if not exists verified_at   timestamptz,
  add column if not exists verified_by   uuid references public.profiles (id) on delete set null,
  add column if not exists rejected_at   timestamptz,
  add column if not exists reject_reason text;

-- ------------------------------
-- Баталгаажуулах
-- ------------------------------
create or replace function public.verify_employer(p_employer uuid)
returns public.employer_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.employer_profiles;
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ баталгаажуулна.';
  end if;

  update public.employer_profiles
  set is_verified   = true,
      verified_at   = now(),
      verified_by   = auth.uid(),
      rejected_at   = null,
      reject_reason = null
  where user_id = p_employer
  returning * into v_row;

  if not found then
    raise exception 'Ажил олгогчийн профайл олдсонгүй.';
  end if;

  insert into public.notifications (user_id, type, message, description)
  values (p_employer, 'success', 'Байгууллага баталгаажлаа',
          'Одооноос зар нийтлэх боломжтой боллоо.');

  return v_row;
end;
$$;

-- ------------------------------
-- Татгалзах
-- ------------------------------
create or replace function public.reject_employer(p_employer uuid, p_reason text)
returns public.employer_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.employer_profiles;
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ татгалзана.';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Татгалзах шалтгаанаа бичнэ үү.';
  end if;

  update public.employer_profiles
  set is_verified   = false,
      rejected_at   = now(),
      verified_by   = auth.uid(),
      reject_reason = p_reason
  where user_id = p_employer
  returning * into v_row;

  if not found then
    raise exception 'Ажил олгогчийн профайл олдсонгүй.';
  end if;

  insert into public.notifications (user_id, type, message, description)
  values (p_employer, 'error', 'Баталгаажуулалт татгалзсан', p_reason);

  return v_row;
end;
$$;

grant execute on function public.verify_employer(uuid) to authenticated;
grant execute on function public.reject_employer(uuid, text) to authenticated;

-- ------------------------------
-- Баталгаажаагүй бол зар нийтлэхийг хориглоно
-- ------------------------------
-- Захиалгын шалгалттай нэг триггерт нэгтгэнэ — дараалал баталгаатай болно.
create or replace function public.enforce_shift_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verified boolean;
begin
  -- 1. Баталгаажсан эсэх (NFR-5)
  select is_verified into v_verified
  from public.employer_profiles
  where user_id = new.employer_id;

  if not coalesce(v_verified, false) then
    raise exception 'Байгууллага баталгаажаагүй тул зар нийтлэх боломжгүй. Админ баталгаажуулахыг хүлээнэ үү.'
      using errcode = 'check_violation';
  end if;

  -- 2. Захиалгын хугацаа
  if not public.can_post_shift(new.employer_id) then
    raise exception 'Захиалгын хугацаа дууссан тул шинэ зар нийтлэх боломжгүй. Төлбөрөө төлнө үү.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- ------------------------------
-- Баталгаажуулах дараалал (админд)
-- ------------------------------
create or replace view public.employer_queue as
select
  ep.user_id,
  ep.org_name,
  ep.reg_number,
  ep.address,
  ep.logo_url,
  ep.is_verified,
  ep.rejected_at,
  ep.reject_reason,
  ep.verified_at,
  p.name  as contact_name,
  p.phone as contact_phone,
  p.email as contact_email,
  p.created_at as joined_at,
  (select count(*) from public.shifts s where s.employer_id = ep.user_id) as shift_count
from public.employer_profiles ep
join public.profiles p on p.id = ep.user_id
where public.is_admin();

alter view public.employer_queue set (security_invoker = off);
grant select on public.employer_queue to authenticated;
