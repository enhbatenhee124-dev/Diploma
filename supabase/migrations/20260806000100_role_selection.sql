-- ============================================================
-- Нэвтэрсний дараа дүр сонгох алхам
-- ============================================================
-- Асуудал:
--   Google-ээр (OAuth) нэвтэрсэн хүний метадатад `role` байдаггүй тул
--   `handle_new_user` анхдагчаар 'employee' оноодог. Ажил олгогч болох
--   гэсэн хүн ч ажил хайгч болж, буруу самбар руу ордог.
--
--   Гэвч одоо байгаа `profiles_update_own` дүрэм нь
--   `with check (... role = public.current_role_of())` тул хэрэглэгч
--   өөрийнхөө дүрийг ЗАСАЖ ЧАДАХГҮЙ. (Энэ нь зөв — эс бөгөөс хэн ч
--   өөрийгөө админ болгож чадна.)
--
-- Шийдэл:
--   1. `role_confirmed` тэмдэг нэмнэ — хэрэглэгч дүрээ ӨӨРӨӨ сонгосон эсэх.
--   2. Дүрийг НЭГ УДАА сонгох `confirm_role` функц. `security definer` тул
--      RLS-ийг тойрох ч, дотроо хатуу шалгана.
-- ============================================================

alter table public.profiles
  add column if not exists role_confirmed boolean not null default false;

-- Одоо байгаа бүх хэрэглэгч бүртгүүлэхдээ дүрээ сонгосон — тэднээс дахин
-- асуух шаардлагагүй.
update public.profiles set role_confirmed = true where role_confirmed = false;

-- ------------------------------
-- Шинэ хэрэглэгч үүсэх үе
-- ------------------------------
-- Ердийн бүртгэл (`signUp`) нь метадатад `role` илгээдэг → баталгаажсан.
-- OAuth нь илгээдэггүй → баталгаажаагүй, дараа нь асууна.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_name text;
  v_explicit boolean;
begin
  v_explicit := (new.raw_user_meta_data ->> 'role') is not null;
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'employee');
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    -- Google нь `full_name` талбараар нэрийг илгээдэг
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1),
    'Хэрэглэгч'
  );

  insert into public.profiles (id, role, name, email, phone, avatar_url, role_confirmed)
  values (
    new.id,
    v_role,
    v_name,
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    -- OAuth үед Google-ийн зургийг шууд ашиглана
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', ''),
      'https://ui-avatars.com/api/?name=' || replace(v_name, ' ', '+') || '&background=3b82f6&color=fff'
    ),
    v_explicit
  );

  if v_role = 'employer' then
    insert into public.employer_profiles (user_id, org_name) values (new.id, v_name);
  else
    insert into public.worker_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

-- ------------------------------
-- Дүрийг нэг удаа сонгох
-- ------------------------------
create or replace function public.confirm_role(p_role user_role)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_row  public.profiles;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Нэвтрээгүй байна';
  end if;

  -- ⚠ Админ дүрийг ХЭЗЭЭ Ч өөрөө сонгож болохгүй. Энэ шалгалтгүй бол
  --   `security definer` нь хэн бүхэнд өөрийгөө админ болгох эрх өгнө.
  if p_role not in ('employee', 'employer') then
    raise exception 'Энэ дүрийг сонгох боломжгүй';
  end if;

  -- Зөвхөн БАТАЛГААЖААГҮЙ үед. Ингэснээр сонгосны дараа дүрээ солих
  -- боломжгүй — эс бөгөөс ажил олгогч болж зар нийтлээд, дараа нь ажил
  -- хайгч болж өөрийнхөө зард орох гэх мэт эвгүй байдал үүснэ.
  select * into v_row from public.profiles where id = v_uid;
  if not found then
    raise exception 'Профайл олдсонгүй';
  end if;
  if v_row.role_confirmed then
    raise exception 'Дүр аль хэдийн сонгогдсон байна';
  end if;

  update public.profiles
     set role = p_role,
         role_confirmed = true,
         updated_at = now()
   where id = v_uid
  returning * into v_row;

  v_name := v_row.name;

  -- Тохирох дэд профайлыг үүсгэнэ. Триггер анхдагчаар `worker_profiles`
  -- үүсгэсэн байгаа — түүнийг УСТГАХГҮЙ: хоосон мөр хор хөнөөлгүй бөгөөд
  -- устгавал каскадаар өөр өгөгдөл алдагдах эрсдэлтэй.
  if p_role = 'employer' then
    insert into public.employer_profiles (user_id, org_name)
    values (v_uid, v_name)
    on conflict (user_id) do nothing;
  else
    insert into public.worker_profiles (user_id)
    values (v_uid)
    on conflict (user_id) do nothing;
  end if;

  return v_row;
end;
$$;

grant execute on function public.confirm_role(user_role) to authenticated;
