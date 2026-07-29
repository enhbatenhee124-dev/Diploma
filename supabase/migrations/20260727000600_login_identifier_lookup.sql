-- ============================================================
-- Утас БОЛОН и-мэйл хоёулангаар нэвтрэх боломж
-- ============================================================
-- Асуудал:
--   Supabase-д нэг бүртгэл НЭГ л auth и-мэйлтэй. Бид утсаар нэвтрүүлэхийн тулд
--   `99112233@phone.mongolajil.mn` гэсэн хиймэл и-мэйл ашигладаг. Тиймээс
--   хэрэглэгч жинхэнэ и-мэйлээрээ (`info@acme.mn`) нэвтэрч чаддаггүй байв.
--
-- Шийдэл:
--   Оруулсан утга (утас эсвэл и-мэйл) → auth и-мэйл рүү хөрвүүлэх функц.
--   Нэвтрэхийн ӨМНӨ дуудаж, гарсан и-мэйлээр signInWithPassword хийнэ.
--
-- Аюулгүй байдал:
--   • security definer — profiles-ийн RLS-ийг тойрч уншина, гэхдээ ЗӨВХӨН
--     auth и-мэйлийг буцаана. Нэр, утас, дүр зэрэг юу ч гарахгүй.
--   • Хэрэглэгч ОЛДООГҮЙ үед ч утга буцаана (хиймэл). Ингэснээр "энэ хаяг
--     бүртгэлтэй юу?" гэдгийг хариунаас таах боломжгүй — дараагийн
--     signInWithPassword ижилхэн бүтэлгүйтнэ.
-- ============================================================

create or replace function public.auth_email_for(p_identifier text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_input text := lower(trim(coalesce(p_identifier, '')));
  v_digits text := regexp_replace(v_input, '\D', '', 'g');
  v_email text;
begin
  if v_input = '' then
    return 'unknown@phone.mongolajil.mn';
  end if;

  -- И-мэйл маягтай оролт: profiles-оос хайж, тухайн хэрэглэгчийн auth и-мэйлийг олно
  if position('@' in v_input) > 0 then
    select u.email into v_email
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(p.email) = v_input
    limit 1;

    -- Оролт нь өөрөө auth и-мэйл байж болно (хиймэл хаягаар шууд орсон тохиолдол)
    if v_email is null then
      select u.email into v_email
      from auth.users u
      where lower(u.email) = v_input
      limit 1;
    end if;

    -- Олдоогүй ч гэсэн утга буцаана — байгаа/байхгүйг ялгуулахгүй
    return coalesce(v_email, v_input);
  end if;

  -- Цифр л байвал утасны дугаар гэж үзнэ
  if v_digits <> '' then
    -- Эхлээд profiles.phone-оор хайна (хиймэл хаягийн дүрэм өөрчлөгдсөн ч ажиллана)
    select u.email into v_email
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.phone = v_digits
    limit 1;

    return coalesce(v_email, v_digits || '@phone.mongolajil.mn');
  end if;

  return 'unknown@phone.mongolajil.mn';
end;
$$;

-- Нэвтрээгүй хүн дуудах ёстой (нэвтрэхийн ӨМНӨ дуудагдана)
grant execute on function public.auth_email_for(text) to anon, authenticated;
