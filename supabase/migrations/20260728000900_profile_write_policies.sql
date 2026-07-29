-- ============================================================
-- Засвар: ур чадвар / боломжит цаг хадгалагдахгүй байсан
-- ============================================================
-- Асуудал:
--   worker_profiles / employer_profiles дээр UPDATE policy л байсан.
--   Frontend нь `upsert` ашигладаг — PostgREST түүнийг INSERT ... ON CONFLICT
--   болгож илгээдэг тул INSERT policy шаардана. Байхгүй учир хадгалалт
--   чимээгүй бүтэлгүйтэж байлаа.
--
--   Мөн cosmetics хүснэгт ижил асуудалтай (upsert ашигладаг).
-- ============================================================

-- worker_profiles
create policy worker_profiles_insert_own on public.worker_profiles
  for insert to authenticated
  with check (user_id = auth.uid());

-- employer_profiles
create policy employer_profiles_insert_own on public.employer_profiles
  for insert to authenticated
  with check (user_id = auth.uid());

-- ⚠ Ажил олгогч ӨӨРИЙГӨӨ баталгаажуулж чадахгүй байх ёстой.
-- UPDATE policy нь is_verified-г хамгаалахгүй тул триггерээр хаана.
create or replace function public.protect_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Админ бол юу ч хийж болно (verify_employer функц үүгээр явна)
  if public.is_admin() then
    return new;
  end if;

  -- Бусад тохиолдолд баталгаажуулалтын талбаруудыг хөндөхийг зөвшөөрөхгүй
  new.is_verified   := old.is_verified;
  new.verified_at   := old.verified_at;
  new.verified_by   := old.verified_by;
  new.rejected_at   := old.rejected_at;
  new.reject_reason := old.reject_reason;

  return new;
end;
$$;

drop trigger if exists employer_profiles_protect_verification on public.employer_profiles;
create trigger employer_profiles_protect_verification
  before update on public.employer_profiles
  for each row execute function public.protect_verification();

-- Шинээр үүсгэхэд баталгаажсан гэж тэмдэглэхийг хориглоно
create or replace function public.force_unverified_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_verified := false;
    new.verified_at := null;
    new.verified_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists employer_profiles_force_unverified on public.employer_profiles;
create trigger employer_profiles_force_unverified
  before insert on public.employer_profiles
  for each row execute function public.force_unverified_on_insert();
