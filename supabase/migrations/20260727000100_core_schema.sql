-- ============================================================
-- МонголАжил — үндсэн схем (Postgres / Supabase)
-- ============================================================
-- Тайлбар: хэрэглэгчийн нэвтрэлтийг Supabase Auth (auth.users) хариуцна.
-- public.profiles нь auth.users-тэй 1:1 холбогдож, аппын нэмэлт мэдээллийг хадгална.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------
-- Тоочсон төрлүүд
-- ------------------------------
create type user_role      as enum ('employee', 'employer', 'admin');
create type shift_status   as enum ('Active', 'Filled', 'Closed');
create type app_status     as enum ('applied', 'approved', 'in-progress', 'completed', 'cancelled');

-- ------------------------------
-- 1. Профайл (auth.users-ийн өргөтгөл)
-- ------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       user_role   not null default 'employee',
  name       text        not null,
  phone      text        unique,
  email      text        unique,
  avatar_url text,
  district   text        not null default 'Баянзүрх',
  bio        text        not null default '',
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- ------------------------------
-- 2. Ажилтны профайл
-- ------------------------------
create table public.worker_profiles (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  skills       text[]      not null default '{}',
  availability jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ------------------------------
-- 3. Ажил олгогчийн профайл
-- ------------------------------
create table public.employer_profiles (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  org_name    text        not null,
  logo_url    text,
  reg_number  text,
  address     text,
  is_verified boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ------------------------------
-- 4. Ажлын зар (ээлж)
-- ------------------------------
create table public.shifts (
  id          uuid         primary key default gen_random_uuid(),
  employer_id uuid         not null references public.profiles (id) on delete cascade,
  title       text         not null check (length(trim(title)) > 0),
  category    text         not null,
  description text         not null default '',
  district    text         not null,
  lat         double precision,
  lng         double precision,
  start_at    timestamptz  not null,
  end_at      timestamptz  not null,
  hourly_wage integer      not null check (hourly_wage > 0),
  slots       integer      not null default 1 check (slots > 0),
  status      shift_status not null default 'Active',
  created_at  timestamptz  not null default now(),
  -- Дуусах цаг эхлэх цагаас хойш байх ёстой (frontend дээр гарч байсан алдаа)
  constraint shifts_time_order check (end_at > start_at)
);

create index shifts_employer_idx on public.shifts (employer_id);
create index shifts_status_idx   on public.shifts (status) where status = 'Active';
create index shifts_start_idx    on public.shifts (start_at);

-- Ээлжийн үргэлжлэх хугацаа (цагаар) — EXP болон цалин тооцоход хэрэглэнэ
create or replace function public.shift_hours(s public.shifts)
returns numeric
language sql
immutable
as $$
  select extract(epoch from (s.end_at - s.start_at)) / 3600.0
$$;

-- ------------------------------
-- 5. Ажилд орох хүсэлт
-- ------------------------------
create table public.applications (
  id            uuid        primary key default gen_random_uuid(),
  shift_id      uuid        not null references public.shifts (id) on delete cascade,
  worker_id     uuid        not null references public.profiles (id) on delete cascade,
  status        app_status  not null default 'applied',
  applied_at    timestamptz not null default now(),
  decided_at    timestamptz,
  cancelled_by  uuid        references public.profiles (id) on delete set null,
  cancel_reason text,
  -- Нэг ажилтан нэг зарт зөвхөн нэг удаа
  unique (shift_id, worker_id)
);

create index applications_worker_idx on public.applications (worker_id);
create index applications_shift_idx  on public.applications (shift_id);
create index applications_status_idx on public.applications (status);

-- ------------------------------
-- 6. Үнэлгээ
-- ------------------------------
create table public.reviews (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        not null references public.applications (id) on delete cascade,
  reviewer_id    uuid        not null references public.profiles (id) on delete cascade,
  reviewee_id    uuid        not null references public.profiles (id) on delete cascade,
  stars          smallint    not null check (stars between 1 and 5),
  comment        text        not null default '',
  published_at   timestamptz not null default now(),
  unique (application_id, reviewer_id),
  -- Өөрийгөө үнэлэхийг хориглоно
  constraint reviews_no_self check (reviewer_id <> reviewee_id)
);

create index reviews_reviewee_idx on public.reviews (reviewee_id);

-- ------------------------------
-- 7. Хадгалсан ажил
-- ------------------------------
create table public.saved_jobs (
  user_id  uuid        not null references public.profiles (id) on delete cascade,
  shift_id uuid        not null references public.shifts (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, shift_id)
);

-- ------------------------------
-- 8. Профайлын гоёолт
-- ------------------------------
create table public.cosmetics (
  user_id   uuid primary key references public.profiles (id) on delete cascade,
  theme_id  text,
  frame_id  text,
  banner_id text,
  title_id  text
);

-- ------------------------------
-- 9. Мэдэгдэл
-- ------------------------------
create table public.notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  type        text        not null default 'info',
  message     text        not null,
  description text,
  is_read     boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read);

-- ------------------------------
-- updated_at автомат шинэчлэл
-- ------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ------------------------------
-- Шинэ хэрэглэгч бүртгүүлэхэд профайл автоматаар үүсгэнэ
-- ------------------------------
-- Supabase Auth нь auth.users-д мөр нэмнэ. Бид түүнд тохирсон профайл болон
-- дүрд нь тохирсон дэд профайлыг ЭНД үүсгэнэ — frontend-д найдвал
-- бүртгэл дутуу үлдэх эрсдэлтэй.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_name text;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'employee');
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1), 'Хэрэглэгч');

  insert into public.profiles (id, role, name, email, phone, avatar_url)
  values (
    new.id,
    v_role,
    v_name,
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'https://ui-avatars.com/api/?name=' || replace(v_name, ' ', '+') || '&background=3b82f6&color=fff'
  );

  if v_role = 'employer' then
    insert into public.employer_profiles (user_id, org_name) values (new.id, v_name);
  else
    insert into public.worker_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
