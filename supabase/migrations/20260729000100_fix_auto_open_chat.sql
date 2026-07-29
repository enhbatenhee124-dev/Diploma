-- ============================================================
-- Засвар: хүсэлт зөвшөөрөх үед сервер 500 өгдөг байсан
-- ============================================================
-- Алдаа:
--   auto_open_chat() дотор `coalesce(old.status, '')` гэж бичсэн байв.
--   `old.status` нь `app_status` enum төрөлтэй тул Postgres нь `''`
--   литералыг мөн `app_status` болгон хөрвүүлэхийг оролдож,
--
--       invalid input value for enum app_status: ""
--
--   гэсэн алдаа шиднэ. UPDATE бүрд триггер ажилладаг тул ХҮСЭЛТ
--   ЗӨВШӨӨРӨХ (applied → approved) үйлдэл БҮРЭН ажиллахгүй байсан:
--   FR-6.2 (ажил олгогч сонгох) ба FR-6.4 (чат нээгдэх) хоёулаа
--   тасарсан. Seed өгөгдөл нь INSERT-ээр орсон тул энэ алдаа нүдэнд
--   харагдахгүй, зөвхөн бодит хэрэглээнд илэрдэг байв.
--
-- Засвар:
--   `is distinct from` ашиглана. Энэ нь NULL-ыг зөв боловсруулдаг
--   бөгөөд хиймэл `''` утга шаардахгүй.
-- ============================================================

create or replace function public.auto_open_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- INSERT үед old нь NULL — `is distinct from` үүнийг зөв зохицуулна
  if new.status = 'approved' and (old is null or old.status is distinct from 'approved') then
    insert into public.chat_threads (application_id)
    values (new.id)
    on conflict (application_id) do nothing;

    insert into public.notifications (user_id, type, message, description)
    values (new.worker_id, 'success', 'Хүсэлт зөвшөөрөгдлөө',
            'Ажил олгогчтой чатаар холбогдох боломжтой боллоо.');
  end if;
  return new;
end;
$$;
