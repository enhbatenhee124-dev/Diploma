-- ============================================================
-- Утасны push токен (FCM)
-- ============================================================
-- `notifications` хүснэгт нь мэдэгдлийн ҮНДСЭН суваг хэвээр (NFR-6). Энэ
-- хүснэгт нь түүн дээр нэмэгдэх давхарга: аппаа хаасан хэрэглэгчид утсаар
-- нь мэдэгдэхэд шаардлагатай төхөөрөмжийн хаягуудыг хадгална.
--
-- Нэг хэрэглэгч ОЛОН төхөөрөмжтэй байж болно (утас + таблет), нэг төхөөрөмж
-- дээр ОЛОН хэрэглэгч ээлжлэн нэвтэрч болно. Тиймээс түлхүүр нь `token`
-- өөрөө — FCM токен нь суулгац бүрд давтагдашгүй. Өөр хэрэглэгч тэр утсанд
-- нэвтэрвэл мөр нь шинэ эзэн рүү шилжинэ (upsert), хуучин эзэнд нь
-- мэдэгдэл очихоо болино.
--
-- ⚠ Токен нь НУУЦ утга биш ч хувийн мэдээлэл: хэн ямар төхөөрөмж
--   ашигладгийг илчилнэ. Тиймээс RLS нь зөвхөн эзэнд нь харуулна. Илгээх
--   талдаа сервер service_role-оор уншина (webhook нь нэвтрэлтгүй ирдэг).
-- ============================================================

create table public.device_tokens (
  token       text        primary key,
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  platform    text        not null default 'android',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Мэдэгдэл илгээхэд "энэ хэрэглэгчийн бүх төхөөрөмж" гэж хайна
create index device_tokens_user_idx on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

-- ------------------------------
-- RLS — зөвхөн өөрийн төхөөрөмж
-- ------------------------------
-- Бүртгэх. `with check` нь өөр хүний нэрээр токен бүртгэхээс сэргийлнэ —
-- эс тэгвээс хэн нэгэн бусдын мэдэгдлийг өөрийн утас руу чиглүүлж чадна.
create policy device_tokens_insert_own on public.device_tokens
  for insert to authenticated
  with check (user_id = auth.uid());

-- Өөр хэрэглэгч ижил утсанд нэвтрэхэд мөрийг шинэ эзэн рүү шилжүүлнэ.
-- `using (true)` нь санаатай: шилжүүлэхийг хүсэгч нь ХУУЧИН эзэн биш тул
-- `using (user_id = auth.uid())` бол upsert бүтэхгүй. `with check` нь
-- шинэ эзэн зөвхөн ӨӨРИЙГӨӨ бичихийг л зөвшөөрөх тул хамгаалалт хэвээр.
create policy device_tokens_update_claim on public.device_tokens
  for update to authenticated
  using (true)
  with check (user_id = auth.uid());

-- Гарах үед устгана
create policy device_tokens_delete_own on public.device_tokens
  for delete to authenticated
  using (user_id = auth.uid());

create policy device_tokens_select_own on public.device_tokens
  for select to authenticated
  using (user_id = auth.uid());

-- `updated_at`-ыг гараар шинэчлэхийг мартах магадлалтай тул триггерээр
create or replace function public.touch_device_token()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger device_tokens_touch
  before update on public.device_tokens
  for each row execute function public.touch_device_token();
