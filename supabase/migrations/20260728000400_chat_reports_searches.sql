-- ============================================================
-- Чат, мэдээлэх, хадгалсан хайлт (FR-6.4, FR-9.2, FR-5.4)
-- ============================================================

-- ------------------------------
-- 1. Чат
-- ------------------------------
-- Хүсэлт ЗӨВШӨӨРӨГДСӨН үед л чат нээгдэнэ. Ингэснээр утасны дугаар
-- солилцохгүйгээр холбогдоно (NFR-3).
create table if not exists public.chat_threads (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  created_at     timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.chat_threads (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (length(trim(content)) between 1 and 2000),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

-- Тухайн хэрэглэгч чатын оролцогч мөн эсэх
create or replace function public.is_chat_participant(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_threads t
    join public.applications a on a.id = t.application_id
    join public.shifts s       on s.id = a.shift_id
    where t.id = p_thread
      and (a.worker_id = auth.uid() or s.employer_id = auth.uid())
  )
$$;

-- Зөвшөөрөгдсөн хүсэлтэд чат үүсгэх / авах
create or replace function public.open_chat(p_application uuid)
returns public.chat_threads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app    public.applications;
  v_shift  public.shifts;
  v_thread public.chat_threads;
begin
  select * into v_app from public.applications where id = p_application;
  if not found then
    raise exception 'Хүсэлт олдсонгүй.';
  end if;

  select * into v_shift from public.shifts where id = v_app.shift_id;

  if auth.uid() not in (v_app.worker_id, v_shift.employer_id) then
    raise exception 'Та энэ ажлын оролцогч биш байна.';
  end if;

  if v_app.status not in ('approved', 'in-progress', 'completed') then
    raise exception 'Хүсэлт зөвшөөрөгдсөний дараа чат нээгдэнэ.';
  end if;

  select * into v_thread from public.chat_threads where application_id = p_application;
  if found then
    return v_thread;
  end if;

  insert into public.chat_threads (application_id)
  values (p_application)
  returning * into v_thread;

  return v_thread;
end;
$$;

grant execute on function public.open_chat(uuid) to authenticated;
grant execute on function public.is_chat_participant(uuid) to authenticated;

alter table public.chat_threads  enable row level security;
alter table public.chat_messages enable row level security;

create policy chat_threads_participants on public.chat_threads
  for select to authenticated
  using (public.is_chat_participant(id) or public.is_admin());

create policy chat_messages_read on public.chat_messages
  for select to authenticated
  using (public.is_chat_participant(thread_id) or public.is_admin());

-- Зөвхөн оролцогч, зөвхөн ӨӨРИЙН нэрээр бичнэ
create policy chat_messages_send on public.chat_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_chat_participant(thread_id));

-- Уншсан тэмдэглэгээ
create policy chat_messages_mark_read on public.chat_messages
  for update to authenticated
  using (public.is_chat_participant(thread_id) and sender_id <> auth.uid());

-- Хүсэлт зөвшөөрөгдмөгц чат автоматаар нээгдэнэ
create or replace function public.auto_open_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and coalesce(old.status, '') <> 'approved' then
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

drop trigger if exists applications_auto_chat on public.applications;
create trigger applications_auto_chat
  after update on public.applications
  for each row execute function public.auto_open_chat();

-- ------------------------------
-- 2. Мэдээлэх (FR-9.2)
-- ------------------------------
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('shift', 'user')),
  target_id   uuid not null,
  reason      text not null check (length(trim(reason)) between 3 and 1000),
  status      report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  admin_note  text,
  created_at  timestamptz not null default now(),
  -- Нэг хүн нэг зүйлийг нэг л удаа мэдээлнэ
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

create policy reports_select on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy reports_admin_update on public.reports
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------
-- 3. Хадгалсан хайлт (FR-5.4)
-- ------------------------------
create table if not exists public.saved_searches (
  id         uuid primary key default gen_random_uuid(),
  worker_id  uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  filters    jsonb not null default '{}'::jsonb,
  notify     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists saved_searches_worker_idx on public.saved_searches (worker_id);

alter table public.saved_searches enable row level security;

create policy saved_searches_own on public.saved_searches
  for all to authenticated
  using (worker_id = auth.uid()) with check (worker_id = auth.uid());
