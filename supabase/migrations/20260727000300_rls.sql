-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- Зарчим: DENY BY DEFAULT. RLS асаасны дараа policy-гүй хүснэгт бүрэн хаагдана.
-- service_role түлхүүр (зөвхөн серверт байдаг) нь RLS-ийг тойрдог тул
-- Express сервер бүх үйлдлийг хийж чадна. Харин браузераас ирэх anon/authenticated
-- хүсэлт эдгээр дүрмээр хязгаарлагдана.
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.worker_profiles   enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.shifts            enable row level security;
alter table public.applications      enable row level security;
alter table public.reviews           enable row level security;
alter table public.saved_jobs        enable row level security;
alter table public.cosmetics         enable row level security;
alter table public.notifications     enable row level security;
alter table public.plans             enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.invoices          enable row level security;
alter table public.payment_events    enable row level security;

-- ------------------------------
-- Туслах функцууд
-- ------------------------------
create or replace function public.current_role_of()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_of() = 'admin', false)
$$;

-- ------------------------------
-- profiles
-- ------------------------------
-- Нэвтэрсэн хүн бүр бусдын үндсэн профайлыг харна (зар дээр нэр харуулах,
-- ажилтан хайх, ranking-д хэрэгтэй).
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

-- Зөвхөн өөрийнхөө профайлыг засна. Дүрээ өөрөө өөрчлөх боломжгүй —
-- эс тэгвээс хэн ч өөрийгөө админ болгож чадна.
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role_of());

create policy profiles_admin_all
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------
-- worker_profiles / employer_profiles
-- ------------------------------
create policy worker_profiles_select on public.worker_profiles
  for select to authenticated using (true);

create policy worker_profiles_write_own on public.worker_profiles
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy employer_profiles_select on public.employer_profiles
  for select to authenticated using (true);

create policy employer_profiles_write_own on public.employer_profiles
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Зөвхөн админ баталгаажуулна (is_verified-г хэрэглэгч өөрөө тавьж болохгүй)
create policy employer_profiles_admin on public.employer_profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------
-- shifts
-- ------------------------------
-- Идэвхтэй зарыг нэвтэрсэн хүн бүр харна. Ажил олгогч өөрийн бүх зарыг харна.
create policy shifts_select_active on public.shifts
  for select to authenticated
  using (status = 'Active' or employer_id = auth.uid() or public.is_admin());

-- Зөвхөн ажил олгогч өөрийн нэрээр зар нэмнэ.
-- Захиалга дууссан эсэхийг enforce_shift_quota триггер шалгана.
create policy shifts_insert_own on public.shifts
  for insert to authenticated
  with check (
    employer_id = auth.uid()
    and public.current_role_of() = 'employer'
  );

create policy shifts_update_own on public.shifts
  for update to authenticated
  using (employer_id = auth.uid()) with check (employer_id = auth.uid());

create policy shifts_delete_own on public.shifts
  for delete to authenticated
  using (employer_id = auth.uid());

create policy shifts_admin_all on public.shifts
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------
-- applications
-- ------------------------------
-- Ажилтан өөрийн хүсэлтээ, ажил олгогч өөрийн зарын хүсэлтүүдийг харна.
-- Өөр ажилтны хүсэлтийг ХАРАХГҮЙ.
create policy applications_select on public.applications
  for select to authenticated
  using (
    worker_id = auth.uid()
    or exists (
      select 1 from public.shifts s
      where s.id = applications.shift_id and s.employer_id = auth.uid()
    )
    or public.is_admin()
  );

-- Ажилтан зөвхөн ӨӨРИЙН нэрээр хүсэлт илгээнэ
create policy applications_insert_own on public.applications
  for insert to authenticated
  with check (
    worker_id = auth.uid()
    and public.current_role_of() = 'employee'
  );

-- Ажилтан өөрийн хүсэлтээ цуцлана; ажил олгогч төлөвийг өөрчилнө
create policy applications_update on public.applications
  for update to authenticated
  using (
    worker_id = auth.uid()
    or exists (
      select 1 from public.shifts s
      where s.id = applications.shift_id and s.employer_id = auth.uid()
    )
  );

create policy applications_admin_all on public.applications
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------
-- reviews
-- ------------------------------
-- Үнэлгээ нь нийтэд харагдана (ranking, профайлд хэрэгтэй)
create policy reviews_select on public.reviews
  for select to authenticated using (true);

-- Зөвхөн ДУУССАН ажлын оролцогч үнэлгээ бичнэ
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1
      from public.applications a
      join public.shifts s on s.id = a.shift_id
      where a.id = reviews.application_id
        and a.status = 'completed'
        and (a.worker_id = auth.uid() or s.employer_id = auth.uid())
    )
  );

-- ------------------------------
-- saved_jobs / cosmetics / notifications — зөвхөн өөрийнх
-- ------------------------------
create policy saved_jobs_own on public.saved_jobs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cosmetics_select on public.cosmetics
  for select to authenticated using (true);

create policy cosmetics_write_own on public.cosmetics
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notifications_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------
-- Төлбөр
-- ------------------------------
-- Багцын үнэ нийтэд нээлттэй
create policy plans_select on public.plans
  for select to authenticated using (is_active or public.is_admin());

-- Ажил олгогч зөвхөн ӨӨРИЙН захиалга/нэхэмжлэлийг харна.
-- ӨӨРЧЛӨХ эрх ХЭНД Ч байхгүй — зөвхөн сервер (service_role) өөрчилнө.
-- Ингэснээр хэрэглэгч өөрийн захиалгыг "төлсөн" болгож чадахгүй.
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (employer_id = auth.uid() or public.is_admin());

create policy invoices_select_own on public.invoices
  for select to authenticated
  using (employer_id = auth.uid() or public.is_admin());

-- payment_events нь зөвхөн админд харагдана (аудитын баримт)
create policy payment_events_admin on public.payment_events
  for select to authenticated
  using (public.is_admin());
