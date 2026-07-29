-- ============================================================
-- Хадгалсан хайлтад тохирох зар гарахад мэдэгдэх (FR-5.4)
-- ============================================================
-- `saved_searches` хүснэгт үүсгэгдсэн боловч ямар ч код түүнийг ашигладаггүй
-- байсан. Хадгалах боломж дангаараа утгагүй — үнэ цэн нь "шинэ тохирох зар
-- гармагц мэдэгдэх" хэсэгт байна.
--
-- Яагаад триггер (сервер БИШ):
--   • Зар аль ч замаар үүссэн (API, seed, админ) мэдэгдэл ажиллана
--   • Тохироог шалгахад бүх ажилтны хадгалсан хайлтыг УНШИХ шаардлагатай.
--     RLS нь хэрэглэгчид зөвхөн ӨӨРИЙНХ нь хайлтыг харуулдаг тул серверээс
--     хэрэглэгчийн эрхээр хийх боломжгүй. Security definer триггер нь энэ
--     шалгалтыг өгөгдлийн сангийн дотор, задруулалгүй гүйцэтгэнэ.
--
-- `filters` нь jsonb бөгөөд дараах түлхүүрүүдийг дэмжинэ (бүгд заавал биш):
--   district  text     — тухайн дүүрэг
--   category  text     — ажлын төрөл
--   minWage   integer  — цагийн цалингийн доод хэмжээ
--   search    text     — гарчиг/тайлбар дотор хайх үг
-- ============================================================

create or replace function public.notify_saved_searches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_search record;
  v_org    text;
begin
  -- Зөвхөн шинээр нийтлэгдсэн идэвхтэй зар
  if new.status <> 'Active' then
    return new;
  end if;

  select coalesce(ep.org_name, p.name) into v_org
  from public.profiles p
  left join public.employer_profiles ep on ep.user_id = p.id
  where p.id = new.employer_id;

  for v_search in
    select s.id, s.worker_id, s.name, s.filters
    from public.saved_searches s
    join public.profiles w on w.id = s.worker_id
    where s.notify
      and w.deactivated_at is null
      -- Ажил олгогч өөрийн зараар өөртөө мэдэгдэл авахгүй
      and s.worker_id <> new.employer_id
      -- Шүүлт бүр: заагаагүй бол бүгдэд тохирно
      and (s.filters->>'district' is null or s.filters->>'district' = new.district)
      and (s.filters->>'category' is null or s.filters->>'category' = new.category)
      and (s.filters->>'minWage'  is null or new.hourly_wage >= (s.filters->>'minWage')::integer)
      and (
        s.filters->>'search' is null
        or new.title       ilike '%' || (s.filters->>'search') || '%'
        or new.description ilike '%' || (s.filters->>'search') || '%'
      )
  loop
    insert into public.notifications (user_id, type, message, description)
    values (
      v_search.worker_id,
      'info',
      'Шинэ тохирох ажил',
      format('%s — %s, %s₮/цаг. ("%s" хайлтад тохирлоо)',
             new.title, coalesce(v_org, 'Ажил олгогч'), new.hourly_wage, v_search.name)
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists shifts_notify_saved_searches on public.shifts;
create trigger shifts_notify_saved_searches
  after insert on public.shifts
  for each row execute function public.notify_saved_searches();
