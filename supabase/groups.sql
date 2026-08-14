-- Run this once in the Supabase SQL Editor before using the Groups tab.
-- This app currently uses its own login table rather than Supabase Auth,
-- so these tables intentionally follow the same access model as the existing tables.

-- users.id was created without a primary key in this project.
-- A foreign key can only reference a unique column, so add that constraint first.
do $$
begin
  alter table public.users add constraint users_id_unique unique (id);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 50),
  invite_code text not null unique check (char_length(invite_code) = 8),
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_id_idx on public.group_members(user_id);
create index if not exists group_members_group_id_idx on public.group_members(group_id);
