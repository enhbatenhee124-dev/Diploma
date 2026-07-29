-- ============================================================
-- Засвар: хамгаалалтын триггер сервер талын шинэчлэлтийг ч хааж байсан
-- ============================================================
-- Асуудал:
--   `protect_verification` нь `is_admin()` худал бол баталгаажуулалтын
--   талбаруудыг хуучин утга руу нь БУЦААДАГ. Гэтэл service_role-оор
--   (seed скрипт, Edge Function, админы хэрэгсэл) ажиллахад auth.uid()
--   NULL байдаг тул "админ биш" гэж тооцогдоно.
--
--   Үр дүнд нь `update employer_profiles set is_verified = true` гэсэн
--   серверийн команд ЧИМЭЭГҮЙ бүтэлгүйтэж байлаа — алдаа ч гарахгүй,
--   өөрчлөлт ч орохгүй. Ийм чимээгүй бүтэлгүйтэл хамгийн аюултай.
--
-- Шийдэл:
--   auth.uid() NULL үед (өөрөөр хэлбэл хэрэглэгчийн контекстгүй, сервер
--   талаас) зөвшөөрнө. Anon түлхүүр нь RLS-ээр аль хэдийн хаагдсан тул
--   энэ нь нүх үүсгэхгүй — anon UPDATE хийх policy огт байхгүй.
-- ============================================================

create or replace function public.protect_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Сервер тал (service_role — хэрэглэгчийн контекстгүй) эсвэл админ
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  -- Хэрэглэгч өөрөө баталгаажуулалтын талбарыг хөндөж болохгүй
  new.is_verified   := old.is_verified;
  new.verified_at   := old.verified_at;
  new.verified_by   := old.verified_by;
  new.rejected_at   := old.rejected_at;
  new.reject_reason := old.reject_reason;

  return new;
end;
$$;

create or replace function public.force_unverified_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Сервер тал болон админаас бусад тохиолдолд заавал баталгаажаагүй эхэлнэ
  if auth.uid() is not null and not public.is_admin() then
    new.is_verified := false;
    new.verified_at := null;
    new.verified_by := null;
  end if;
  return new;
end;
$$;
