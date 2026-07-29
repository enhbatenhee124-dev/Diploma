-- ============================================================
-- Засвар: үнэлгээ бичих боломжгүй байсан
-- ============================================================
-- Асуудал:
--   `reviews_insert` policy дотор `applications`-той `shifts`-ийг JOIN хийж
--   байсан. Гэтэл policy доторх дэд query нь МӨН RLS-д захирагддаг:
--     shifts_select_active → status = 'Active' or employer_id = auth.uid()
--   Дууссан ажлын зар нь 'Closed' төлөвтэй тул АЖИЛТАН түүнийг харахгүй →
--   JOIN хоосон → EXISTS false → бичилт блоклогдоно.
--
--   Өөрөөр хэлбэл "ажлаа дуусгасан хүн үнэлгээ өгч чадахгүй" болж байлаа.
--
-- Шийдэл:
--   Шалгалтыг security definer функц рүү зөөнө — тэр нь RLS-ийг тойрч
--   бодит харьцааг шалгана. Policy өөрөө хэвээр хатуу.
-- ============================================================

-- ------------------------------
-- Тухайн ажлыг үнэлэх эрхтэй эсэх
-- ------------------------------
create or replace function public.can_review(p_application uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.shifts s on s.id = a.shift_id
    where a.id = p_application
      and a.status = 'completed'
      and (a.worker_id = auth.uid() or s.employer_id = auth.uid())
  )
$$;

grant execute on function public.can_review(uuid) to authenticated;

drop policy if exists reviews_insert on public.reviews;

create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and public.can_review(application_id)
  );

-- ------------------------------
-- Харагдац — id-гаар шалгана
-- ------------------------------
-- Композит төрөл (reviews.*) дамжуулах нь найдваргүй тул id ашиглана.
drop policy if exists reviews_select on public.reviews;
drop function if exists public.review_is_visible(public.reviews);

create or replace function public.review_visible(p_review_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reviews r
    where r.id = p_review_id
      and (
        -- Өөрийн бичсэнийг үргэлж харна
        r.reviewer_id = auth.uid()
        or public.is_admin()
        -- 7 хоног өнгөрсөн
        or r.published_at + interval '7 days' <= now()
        -- Нөгөө тал ч үнэлгээ өгсөн
        or exists (
          select 1 from public.reviews r2
          where r2.application_id = r.application_id
            and r2.reviewer_id <> r.reviewer_id
        )
      )
  )
$$;

grant execute on function public.review_visible(uuid) to authenticated;

create policy reviews_select on public.reviews
  for select to authenticated
  using (public.review_visible(id));

-- ------------------------------
-- Ижил алдаа өөр газар байгаа эсэх
-- ------------------------------
-- `applications_select` policy нь shifts руу JOIN хийдэг ч тэнд
-- `s.employer_id = auth.uid()` шалгадаг тул ажил олгогч өөрийн зарыг
-- үргэлж хардаг — асуудалгүй.
--
-- `open_chat` нь security definer тул мөн асуудалгүй.
