-- ============================================================
-- Засвар: үнэлгээ бичихэд "row-level security policy" алдаа гардаг байсан
-- ============================================================
-- Алдаа:
--   `reviews_select` policy нь `public.review_visible(id)` функцийг дууддаг
--   бөгөөд тэр функц нь `reviews` хүснэгтээс мөрийг ДАХИН уншдаг:
--
--       select exists (select 1 from public.reviews r where r.id = p_review_id ...)
--
--   `INSERT ... RETURNING` (буюу supabase-js дээрх `.insert().select()`) үед
--   PostgREST нь буцаах мөр дээр SELECT policy-г шалгана. Гэвч STABLE функц
--   нь мэдэгдлийн (statement) snapshot-оор ажилладаг тул ДӨНГӨЖ ОРУУЛСАН
--   мөрийг өөрөө хараагүй → exists = false → policy татгалзана.
--
--   Үр дүнд нь: мөр өгөгдлийн санд ОРСОН мөртлөө клиент рүү 42501 алдаа
--   буцдаг. Апп нь "Үнэлгээ өгч чадсангүй" гэж харуулна. FR-7.1 тасарсан.
--
--   (`.select()`-гүй INSERT ажилладаг байсан нь үүнийг батална.)
--
-- Засвар:
--   Policy нь мөрийг дахин уншихгүй — өөрийнх нь баганыг ШУУД шалгана.
--   RLS-ийг тойрох шаардлагатай цорын ганц хэсэг нь "нөгөө тал үнэлгээ
--   өгсөн үү" гэдэг тул зөвхөн ТҮҮНИЙГ security definer функцэд үлдээнэ.
-- ============================================================

-- ------------------------------
-- Нөгөө тал үнэлгээ өгсөн эсэх
-- ------------------------------
-- Бусдын үнэлгээг унших шаардлагатай тул security definer.
-- Зөвхөн boolean буцаана — агуулгыг задруулахгүй.
create or replace function public.has_counterpart_review(
  p_application uuid,
  p_reviewer    uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reviews r
    where r.application_id = p_application
      and r.reviewer_id   <> p_reviewer
  )
$$;

grant execute on function public.has_counterpart_review(uuid, uuid) to authenticated;

-- ------------------------------
-- Харагдацын policy
-- ------------------------------
-- FR-7.2: үнэлгээ нь хоёул өгсний дараа (эсвэл 7 хоногийн дараа) нээгдэнэ —
-- хариу үнэлгээний хардлагаас сэргийлнэ.
drop policy if exists reviews_select on public.reviews;

create policy reviews_select on public.reviews
  for select to authenticated
  using (
    -- Өөрийн бичсэнийг үргэлж харна (INSERT ... RETURNING ч үүгээр өнгөрнө)
    reviews.reviewer_id = auth.uid()
    or public.is_admin()
    -- 7 хоног өнгөрсөн
    or reviews.published_at + interval '7 days' <= now()
    -- Нөгөө тал ч үнэлгээ өгсөн
    or public.has_counterpart_review(reviews.application_id, reviews.reviewer_id)
  );

-- ------------------------------
-- Хуучин функц
-- ------------------------------
-- `review_visible(uuid)` нь одоо хаанаас ч дуудагдахгүй. Устгахгүй үлдээвэл
-- дараа нь дахин ашиглагдаж ижил алдаа давтагдах эрсдэлтэй.
drop function if exists public.review_visible(uuid);
