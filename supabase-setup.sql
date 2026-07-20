-- Énergie & Repas V1.5.1 — migration NON DESTRUCTIVE
-- Ce script ne supprime et ne modifie aucun repas existant.
-- Il ajoute uniquement la table favorite_meals si elle n'existe pas déjà.

create extension if not exists pgcrypto;

create table if not exists public.favorite_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meal_type text not null,
  description text not null,
  notes text,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists favorite_meals_user_usage_idx
  on public.favorite_meals(user_id, usage_count desc, updated_at desc);

alter table public.favorite_meals enable row level security;
revoke all on table public.favorite_meals from anon;
grant select, insert, update, delete on table public.favorite_meals to authenticated;

drop policy if exists "favorite_meals_select_own" on public.favorite_meals;
drop policy if exists "favorite_meals_insert_own" on public.favorite_meals;
drop policy if exists "favorite_meals_update_own" on public.favorite_meals;
drop policy if exists "favorite_meals_delete_own" on public.favorite_meals;

create policy "favorite_meals_select_own" on public.favorite_meals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "favorite_meals_insert_own" on public.favorite_meals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "favorite_meals_update_own" on public.favorite_meals
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "favorite_meals_delete_own" on public.favorite_meals
  for delete to authenticated using ((select auth.uid()) = user_id);
