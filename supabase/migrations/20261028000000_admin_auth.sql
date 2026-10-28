-- Доступ к админке только для пользователей из таблицы admins.
-- Запускать в Supabase → SQL Editor целиком (скрипт идемпотентный).

-- ─── Список админов ───────────────────────────────────────────────
create table if not exists public.admins (
  email      text        primary key check (email = lower(email)),
  note       text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- Политик нет: таблица редактируется только из Dashboard (service role обходит RLS).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ─── Снимаем старые политики (в т.ч. анонимную запись) ────────────
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('cities', 'modals')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- ─── cities ───────────────────────────────────────────────────────
alter table public.cities enable row level security;

-- Данные и так публичны в cities.json; чтение оставлено для старых клиентов
create policy "public read" on public.cities
  for select using (true);

create policy "admin write" on public.cities
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── modals ───────────────────────────────────────────────────────
alter table public.modals enable row level security;

create policy "admin all" on public.modals
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Активной может быть только одна модалка
update public.modals set is_active = false
where is_active and id <> (
  select id from public.modals where is_active order by created_at desc limit 1
);
create unique index if not exists modals_single_active
  on public.modals ((true)) where is_active;

-- Атомарная смена активной модалки; p_id = null — выключить все
create or replace function public.set_active_modal(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.modals set is_active = false
  where is_active and id is distinct from p_id;
  if p_id is not null then
    update public.modals set is_active = true where id = p_id;
  end if;
end;
$$;

revoke all on function public.set_active_modal(uuid) from public, anon;
grant execute on function public.set_active_modal(uuid) to authenticated;

-- ─── Первый админ (подставить свою почту) ─────────────────────────
-- insert into public.admins (email, note) values ('you@cse.ru', 'владелец');
