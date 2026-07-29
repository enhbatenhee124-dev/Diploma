-- ============================================================
-- Нэхэмжлэл үүсгэх / баталгаажуулах
-- ============================================================
-- Яагаад RPC болгов:
--   invoices хүснэгтэд INSERT/UPDATE хийх RLS policy ЗОРИУДААР байхгүй —
--   эс тэгвээс ажил олгогч өөрийн нэхэмжлэлээ "төлсөн" болгож чадна.
--   Тиймээс бичих үйлдлийг security definer функцээр л зөвшөөрнө.
--
--   Эдгээр функц нь Express серверийн оронд ажиллана. QPay холбогдоход
--   сервер талаас мөн эдгээрийг дуудна — давхардал үүсэхгүй.
-- ============================================================

-- ------------------------------
-- Ажил олгогч төлөх нэхэмжлэл хүсэх
-- ------------------------------
create or replace function public.request_invoice()
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_role    user_role;
  v_plan    public.plans;
  v_sub     public.subscriptions;
  v_pending public.invoices;
  v_start   timestamptz;
  v_end     timestamptz;
  v_new     public.invoices;
begin
  if v_user is null then
    raise exception 'Нэвтрэх шаардлагатай.';
  end if;

  select role into v_role from public.profiles where id = v_user;
  if v_role <> 'employer' then
    raise exception 'Зөвхөн ажил олгогч төлбөр төлнө.';
  end if;

  -- Хүлээгдэж буй нэхэмжлэл байвал ШИНЭ үүсгэхгүй, түүнийг буцаана.
  -- Товч дахин дарахад давхар төлөх эрсдэлээс сэргийлнэ.
  select * into v_pending
  from public.invoices
  where employer_id = v_user and status = 'pending' and due_at > now()
  order by created_at desc
  limit 1;

  if found then
    return v_pending;
  end if;

  select * into v_plan from public.plans where id = 'employer_monthly';
  select * into v_sub  from public.subscriptions where employer_id = v_user;

  -- Шинэ мөчлөг нь одоогийн хугацаа дууссанаас хойш эхэлнэ
  v_start := greatest(coalesce(v_sub.current_period_end, now()), now());
  v_end   := v_start + (v_plan.interval_days || ' days')::interval;

  insert into public.invoices (
    employer_id, plan_id, amount_mnt, period_start, period_end, due_at
  ) values (
    v_user, v_plan.id, v_plan.price_mnt, v_start, v_end, now() + interval '7 days'
  )
  returning * into v_new;

  return v_new;
end;
$$;

grant execute on function public.request_invoice() to authenticated;

-- ------------------------------
-- Админ төлбөрийг баталгаажуулах
-- ------------------------------
-- Дансаар шилжүүлсэн тохиолдолд ашиглана. QPay холбогдвол webhook нь
-- үүнтэй ижил логикийг сервер талаас дуудна.
create or replace function public.confirm_invoice(p_invoice uuid, p_note text default null)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_inv   public.invoices;
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ төлбөр баталгаажуулна.';
  end if;

  select * into v_inv from public.invoices where id = p_invoice;
  if not found then
    raise exception 'Нэхэмжлэл олдсонгүй.';
  end if;
  if v_inv.status = 'paid' then
    return v_inv;  -- давхар боловсруулахгүй
  end if;

  update public.invoices
  set status = 'paid', paid_at = now()
  where id = p_invoice
  returning * into v_inv;

  -- Захиалгыг сунгана: шинэ мөчлөг + 14 хоногийн хүлээлгэ
  update public.subscriptions
  set status               = 'active',
      current_period_start = v_inv.period_start,
      current_period_end   = v_inv.period_end,
      grace_until          = v_inv.period_end + interval '14 days'
  where employer_id = v_inv.employer_id;

  -- Аудитын мөр — маргаан гарвал энэ бол баримт
  insert into public.payment_events (invoice_id, provider, event_type, raw_payload)
  values (p_invoice, 'manual', 'admin_confirmed',
          jsonb_build_object('admin_id', v_admin, 'note', p_note, 'at', now()));

  insert into public.notifications (user_id, type, message, description)
  values (v_inv.employer_id, 'success', 'Төлбөр баталгаажлаа',
          'Захиалга ' || to_char(v_inv.period_end, 'YYYY-MM-DD') || ' хүртэл сунгагдлаа.');

  return v_inv;
end;
$$;

grant execute on function public.confirm_invoice(uuid, text) to authenticated;

-- ------------------------------
-- Админд бүх нэхэмжлэлийг харах эрх
-- ------------------------------
-- Одоогийн policy нь зөвхөн өөрийнхийг харуулдаг. Админ баталгаажуулахын
-- тулд бүгдийг харах хэрэгтэй — is_admin() нь аль хэдийн policy дотор бий,
-- гэхдээ ажил олгогчийн нэрийг ч харуулахын тулд нэгтгэсэн view нэмнэ.
create or replace view public.invoice_overview as
select
  i.id,
  i.employer_id,
  p.name          as employer_name,
  p.email         as employer_email,
  p.phone         as employer_phone,
  i.amount_mnt,
  i.status,
  i.period_start,
  i.period_end,
  i.due_at,
  i.paid_at,
  i.created_at
from public.invoices i
join public.profiles p on p.id = i.employer_id;

alter view public.invoice_overview set (security_invoker = on);
grant select on public.invoice_overview to authenticated;
