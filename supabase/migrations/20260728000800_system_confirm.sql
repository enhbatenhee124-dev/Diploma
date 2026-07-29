-- ============================================================
-- Системээс төлбөр баталгаажуулах (QPay webhook)
-- ============================================================
-- `confirm_invoice` нь админ эсэхийг шалгадаг. QPay-ийн webhook нь
-- хэрэглэгчгүй (service_role) ажилладаг тул тусдаа хувилбар хэрэгтэй.
--
-- ⚠ Энэ функцийг `authenticated` дуудаж БОЛОХГҮЙ — зөвхөн service_role.
--   Тиймээс execute эрхийг зөвхөн тэдэнд өгнө.
-- ============================================================

create or replace function public.confirm_invoice_system(p_invoice uuid, p_note text default null)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invoices;
begin
  select * into v_inv from public.invoices where id = p_invoice;
  if not found then
    raise exception 'Нэхэмжлэл олдсонгүй.';
  end if;
  if v_inv.status = 'paid' then
    return v_inv;   -- давхар боловсруулахгүй
  end if;

  update public.invoices
  set status = 'paid', paid_at = now()
  where id = p_invoice and status = 'pending'
  returning * into v_inv;

  update public.subscriptions
  set status               = 'active',
      current_period_start = v_inv.period_start,
      current_period_end   = v_inv.period_end,
      grace_until          = v_inv.period_end + interval '14 days'
  where employer_id = v_inv.employer_id;

  insert into public.payment_events (invoice_id, provider, event_type, raw_payload)
  values (p_invoice, 'qpay', 'system_confirmed',
          jsonb_build_object('note', p_note, 'at', now()));

  insert into public.notifications (user_id, type, message, description)
  values (v_inv.employer_id, 'success', 'Төлбөр амжилттай',
          'Захиалга ' || to_char(v_inv.period_end, 'YYYY-MM-DD') || ' хүртэл сунгагдлаа.');

  return v_inv;
end;
$$;

-- Зөвхөн сервер (service_role) дуудна. Нэвтэрсэн хэрэглэгчид эрх ӨГӨХГҮЙ.
revoke all on function public.confirm_invoice_system(uuid, text) from public, anon, authenticated;
grant execute on function public.confirm_invoice_system(uuid, text) to service_role;
