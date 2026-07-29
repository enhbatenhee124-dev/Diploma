-- ============================================================
-- Захиалга ба төлбөр (SaaS)
-- ============================================================
-- Загвар: ажил олгогч сар бүр 50,000₮ төлж зуучлалын үйлчилгээ авна.
-- Платформ нь ажилтны цалинд ХҮРЭХГҮЙ — цалинг ажил олгогч шууд өгнө.
-- Тиймээс escrow, мөнгө шилжүүлэх зохицуулалт үүсэхгүй.
-- ============================================================

create type subscription_status as enum ('trialing', 'active', 'grace', 'expired', 'cancelled');
create type invoice_status      as enum ('pending', 'paid', 'expired', 'cancelled');

-- ------------------------------
-- Багц (үнэ өөрчлөгдвөл шинэ мөр нэмнэ — хуучин нэхэмжлэл хэвээр үлдэнэ)
-- ------------------------------
create table public.plans (
  id            text        primary key,
  name          text        not null,
  price_mnt     integer     not null check (price_mnt >= 0),
  interval_days integer     not null default 30,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now()
);

insert into public.plans (id, name, price_mnt, interval_days) values
  ('employer_monthly', 'Ажил олгогч — сарын багц', 50000, 30);

-- ------------------------------
-- Захиалга (ажил олгогч бүрт нэг)
-- ------------------------------
create table public.subscriptions (
  employer_id          uuid                primary key references public.profiles (id) on delete cascade,
  plan_id              text                not null references public.plans (id),
  status               subscription_status not null default 'trialing',
  current_period_start timestamptz         not null default now(),
  current_period_end   timestamptz         not null default (now() + interval '14 days'),
  -- Хугацаа дуусахад 14 хоногийн хүлээлгэ өгнө. Энэ хугацаанд зөвхөн сануулга
  -- харуулах бөгөөд шинэ зар нийтлэхийг хориохгүй.
  grace_until          timestamptz         not null default (now() + interval '28 days'),
  cancelled_at         timestamptz,
  created_at           timestamptz         not null default now(),
  updated_at           timestamptz         not null default now()
);

create index subscriptions_status_idx on public.subscriptions (status, current_period_end);

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ------------------------------
-- Нэхэмжлэл
-- ------------------------------
-- Монголд картаас автоматаар суутгах (recurring) боломж практикт байдаггүй тул
-- сар бүр нэхэмжлэл үүсгэж, QPay-ийн QR-аар төлүүлнэ.
create table public.invoices (
  id              uuid           primary key default gen_random_uuid(),
  employer_id     uuid           not null references public.profiles (id) on delete cascade,
  plan_id         text           not null references public.plans (id),
  amount_mnt      integer        not null check (amount_mnt >= 0),
  status          invoice_status not null default 'pending',
  period_start    timestamptz    not null,
  period_end      timestamptz    not null,
  due_at          timestamptz    not null,
  paid_at         timestamptz,
  -- QPay-ийн талын мэдээлэл
  qpay_invoice_id text           unique,
  qpay_qr_text    text,
  qpay_qr_image   text,
  qpay_urls       jsonb,
  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now()
);

create index invoices_employer_idx on public.invoices (employer_id, status);
create index invoices_status_idx   on public.invoices (status) where status = 'pending';

create trigger invoices_touch_updated_at
  before update on public.invoices
  for each row execute function public.touch_updated_at();

-- ------------------------------
-- Төлбөрийн үйл явдлын түүх (аудит)
-- ------------------------------
-- QPay-ээс ирсэн бүх webhook-ийг хэвээр нь хадгална. Маргаан гарвал энэ бол
-- баримт. Хэзээ ч устгахгүй, зөвхөн нэмнэ.
create table public.payment_events (
  id           uuid        primary key default gen_random_uuid(),
  invoice_id   uuid        references public.invoices (id) on delete set null,
  provider     text        not null default 'qpay',
  event_type   text        not null,
  raw_payload  jsonb       not null,
  received_at  timestamptz not null default now()
);

create index payment_events_invoice_idx on public.payment_events (invoice_id);

-- ------------------------------
-- Захиалга идэвхтэй эсэх
-- ------------------------------
-- Хүлээлгийн хугацаа (grace) дуусаагүй бол ШИНЭ зар нийтлэх боломжтой.
-- Хугацаа дууссаны дараа зөвхөн шинэ зар нийтлэхийг хориглоно —
-- хуучин зар, ирсэн хүсэлтүүд хэвээр ажиллана.
create or replace function public.can_post_shift(p_employer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.status <> 'cancelled' and now() < s.grace_until
      from public.subscriptions s
      where s.employer_id = p_employer
    ),
    false  -- захиалга огт байхгүй бол зар нийтлэхийг зөвшөөрөхгүй
  )
$$;

-- Захиалгын одоогийн бодит төлөв (хугацаа шалгаад буцаана)
create or replace function public.subscription_state(p_employer uuid)
returns table (
  status            subscription_status,
  period_end        timestamptz,
  grace_until       timestamptz,
  days_left         integer,
  can_post          boolean,
  needs_payment     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when s.status = 'cancelled' then 'cancelled'::subscription_status
      when now() <= s.current_period_end then s.status
      when now() < s.grace_until         then 'grace'::subscription_status
      else 'expired'::subscription_status
    end,
    s.current_period_end,
    s.grace_until,
    greatest(0, extract(day from (s.current_period_end - now()))::integer),
    now() < s.grace_until and s.status <> 'cancelled',
    now() > s.current_period_end and s.status <> 'cancelled'
  from public.subscriptions s
  where s.employer_id = p_employer
$$;

-- ------------------------------
-- Шинэ ажил олгогчид туршилтын захиалга автоматаар нээнэ
-- ------------------------------
create or replace function public.handle_new_employer_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'employer' then
    insert into public.subscriptions (employer_id, plan_id, status)
    values (new.id, 'employer_monthly', 'trialing')
    on conflict (employer_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_profile_created_subscription
  after insert on public.profiles
  for each row execute function public.handle_new_employer_subscription();

-- ------------------------------
-- Зар нийтлэхийг өгөгдлийн сангийн түвшинд хамгаална
-- ------------------------------
-- Зөвхөн frontend/API дээр шалгавал алдаж мэднэ. Энэ триггер нь
-- төлбөр төлөөгүй ажил олгогч ШИНЭ зар нэмэхийг эцсийн байдлаар хориглоно.
create or replace function public.enforce_shift_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_post_shift(new.employer_id) then
    raise exception 'Захиалгын хугацаа дууссан тул шинэ зар нийтлэх боломжгүй. Төлбөрөө төлнө үү.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger shifts_enforce_quota
  before insert on public.shifts
  for each row execute function public.enforce_shift_quota();
