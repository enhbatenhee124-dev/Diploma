-- ============================================================
-- Засвар: EXP / ranking view-үүд буруу тоо буцааж байсан
-- ============================================================
-- Асуудал:
--   user_stats / user_progress / rankings нь `security_invoker = on` байсан тул
--   асууж буй хэрэглэгчийн RLS эрхээр ажиллаж байв. Үүнээс болж:
--     • Ажилтан зөвхөн 'Active' зарыг харна → өөрийн ДУУССАН ажил ('Closed')
--       EXP тооцоонд ороогүй
--     • Хэн ч бусдын application-ыг харахгүй → тэргүүлэгчид бүгд 0 EXP
--   Үр дүнд нь Болор Эрдэнэ 135 EXP (Lv.2) байтал жагсаалтад 30 EXP (Lv.1)
--   гэж харагдаж байлаа.
--
-- Шийдэл:
--   Эдгээр нь НЭГТГЭСЭН, нийтэд зориулсан үзүүлэлт тул view-г эзэмшигчийн
--   эрхээр ажиллуулна (security_invoker = off). Ингэснээр бүх дууссан ажлыг
--   тоолж, зөв EXP гарна.
--
--   Ил гарах талбарууд: нэр, аватар, дууссан ажлын ТОО, цагийн нийлбэр,
--   дундаж үнэлгээ, EXP, түвшин. Ажлын дэлгэрэнгүй, утас, и-мэйл ОРОХГҮЙ —
--   өөрөөр хэлбэл тэргүүлэгчдийн самбарт байх ёстой мэдээлэл л харагдана.
-- ============================================================

alter view public.user_stats    set (security_invoker = off);
alter view public.user_progress set (security_invoker = off);
alter view public.rankings      set (security_invoker = off);

-- View-үүд одоо RLS-ийг тойрох тул хандалтыг ил тодоор зөвшөөрнө.
-- Нэвтрээгүй хүн (anon) харахгүй.
revoke all on public.user_stats, public.user_progress, public.rankings from anon;
grant select on public.user_stats, public.user_progress, public.rankings to authenticated;
