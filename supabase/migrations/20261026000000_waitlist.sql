-- Список раннего доступа ZenvyMax.
-- Сайт может только ДОБАВЛЯТЬ email. Читать список может только владелец (через панель Supabase).

create table if not exists public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  lang       text check (lang in ('ru', 'en')),
  psl        numeric(3, 1) check (psl between 1 and 8),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

drop policy if exists "anon can join waitlist" on public.waitlist;
create policy "anon can join waitlist"
  on public.waitlist for insert
  to anon
  with check (true);

-- Никаких select/update/delete для anon: чужие email не утекут через сайт.
