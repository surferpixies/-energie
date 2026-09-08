-- Énergie V3.10.0 — Mémoire alimentaire personnalisée, Sprint 2
-- À exécuter une seule fois dans Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.user_food_memory (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  normalized_label text not null,
  aliases jsonb not null default '[]'::jsonb,
  meal_types jsonb not null default '{}'::jsonb,
  ingredients jsonb not null default '{}'::jsonb,
  occurrences integer not null default 0 check (occurrences >= 0),
  confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source_meal_ids jsonb not null default '[]'::jsonb,
  is_forgotten boolean not null default false,
  memory_version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_food_memory_user_normalized_unique
  on public.user_food_memory (user_id, normalized_label);

create index if not exists user_food_memory_user_last_seen_idx
  on public.user_food_memory (user_id, last_seen_at desc);

alter table public.user_food_memory enable row level security;

revoke all on table public.user_food_memory from anon;
grant select, insert, update, delete on table public.user_food_memory to authenticated;

drop policy if exists "Users read their food memory" on public.user_food_memory;
create policy "Users read their food memory"
  on public.user_food_memory for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users create their food memory" on public.user_food_memory;
create policy "Users create their food memory"
  on public.user_food_memory for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update their food memory" on public.user_food_memory;
create policy "Users update their food memory"
  on public.user_food_memory for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete their food memory" on public.user_food_memory;
create policy "Users delete their food memory"
  on public.user_food_memory for delete
  to authenticated
  using (auth.uid() = user_id);
