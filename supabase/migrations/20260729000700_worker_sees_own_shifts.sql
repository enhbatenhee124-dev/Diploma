-- ============================================================
-- Засвар: ажилтны ажлын түүх хоосон харагддаг байсан
-- ============================================================
-- Алдаа:
--   `shifts_select_active` policy нь
--       status = 'Active' or employer_id = auth.uid() or is_admin()
--   гэсэн тул ажилтан ХҮСЭЛТ ИЛГЭЭСЭН зараа ч гэсэн хаагдмагц харахаа
--   болино.
--
--   Үр дүнд нь "Миний оролцууд" хуудсан дээр гарчиггүй хоосон мөр гарч,
--   дууссан ажлын нэр, цалин, байршил бүгд алга болно. Ажилтны ажлын
--   түүх (FR-2.4) бүрэн ажиллахгүй болж, үнэлгээ өгөхдөө ямар ажил
--   байсныг ч харахгүй.
--
--   Энэ алдаа урт хугацаанд нуугдаж байсан: демо өгөгдлийн зар үүрд
--   'Active' хэвээр байсан тул зөвхөн автомат хаалт (pg_cron) нэмэгдсэний
--   дараа илэрсэн.
--
-- Засвар:
--   Ажилтан ӨӨРИЙН хүсэлт илгээсэн зарыг төлвөөс үл хамааран харна.
--
-- ⚠ Яагаад `exists (select ... from applications)` гэж policy дотор шууд
--   бичихгүй вэ: policy доторх дэд query нь МӨН RLS-д захирагдана. Ижил
--   алдаа `reviews_insert` дээр гарч байсан (20260728000600 үз). Тиймээс
--   шалгалтыг security definer функцэд зөөв.
-- ============================================================

create or replace function public.has_applied_to(p_shift uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.shift_id  = p_shift
      and a.worker_id = auth.uid()
  )
$$;

grant execute on function public.has_applied_to(uuid) to authenticated;

drop policy if exists shifts_select_active on public.shifts;

create policy shifts_select_active on public.shifts
  for select to authenticated
  using (
    status = 'Active'
    or employer_id = auth.uid()
    or public.is_admin()
    -- Хүсэлт илгээсэн ажилтан зараа үргэлж харна
    or public.has_applied_to(id)
  );
