-- ============================================================
-- Нийтийн зарын самбар — нэвтрээгүй зочинд
-- ============================================================
-- Асуудал:
--   `shifts_select_active` policy нь `to authenticated` гэсэн тул нэвтрээгүй
--   хүн `/jobs` хуудсан дээр ЮУ Ч ХАРАХГҮЙ байсан. Marketplace-д энэ нь
--   ноцтой: хүн бүртгүүлэхээсээ ӨМНӨ ямар ажил байгааг харах ёстой, эс
--   тэгвээс бүртгүүлэх шалтгаангүй (тахиа-өндөгний асуудлыг улам хүндрүүлнэ).
--
-- Шийдэл:
--   `shifts` хүснэгтийг anon-д НЭЭХГҮЙ. Оронд нь зөвхөн зарын самбарт
--   хэрэгтэй баганыг агуулсан ТУСГАЙ view үүсгэж, түүнийг л нээнэ.
--
--   Ингэснээр:
--     • Зөвхөн 'Active' зар харагдана — хаагдсан, дүүрсэн зар нуугдана
--     • Ажилтнуудын профайл, хүсэлт, чат, үнэлгээ нээгдэхгүй хэвээр
--     • Ажил олгогчийн РЕГИСТР, ХАЯГ гарахгүй (зөвхөн нэр, лого, баталгаа)
--
-- ⚠ Хамрах хүрээ: эдгээр view-д байгаа бүх багана нь ОЛОН НИЙТЭД ил гэсэн
--   үг. Шинэ багана нэмэхээсээ өмнө "үүнийг Google индексжүүлж болох уу?"
--   гэж өөрөөсөө асуу.
-- ============================================================

-- ------------------------------
-- 1. Нийтийн зар
-- ------------------------------
create or replace view public.public_shifts as
select
  s.id,
  s.employer_id,
  s.title,
  s.category,
  s.description,
  s.district,
  s.lat,
  s.lng,
  s.start_at,
  s.end_at,
  s.hourly_wage,
  s.slots,
  s.status,
  s.created_at
from public.shifts s
join public.profiles p on p.id = s.employer_id
where s.status = 'Active'
  -- Идэвхгүй болгосон ажил олгогчийн зар харагдахгүй
  and p.deactivated_at is null;

-- Доод хүснэгтийн RLS-ийг тойрно. Ил гарах өгөгдөл нь дээрх багана болон
-- `status = 'Active'` шүүлтээр хатуу хязгаарлагдсан.
alter view public.public_shifts set (security_invoker = off);

grant select on public.public_shifts to anon, authenticated;

-- ------------------------------
-- 2. Нийтийн ажил олгогч
-- ------------------------------
-- Зарын карт дээр байгууллагын нэр, лого харагдах ёстой.
-- ⚠ `reg_number` (улсын бүртгэлийн дугаар) болон `address` ОРООГҮЙ —
--   тэдгээр нь зөвхөн нэвтэрсэн хэрэглэгчид хэрэгтэй.
create or replace view public.public_employers as
select
  ep.user_id,
  ep.org_name,
  ep.logo_url,
  ep.is_verified
from public.employer_profiles ep
join public.profiles p on p.id = ep.user_id
where p.deactivated_at is null;

alter view public.public_employers set (security_invoker = off);

grant select on public.public_employers to anon, authenticated;
