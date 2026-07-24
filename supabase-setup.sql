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

-- Énergie V2.2.0 — Ressenti après les repas
-- Ajoute les champs de ressenti directement au repas afin de conserver un lien 1:1 robuste.
alter table public.meals add column if not exists feeling jsonb;
alter table public.meals add column if not exists feeling_notified_at timestamptz;

comment on column public.meals.feeling is
  'Ressenti après le repas: rating 1-5, tags text[], notes et recordedAt.';


-- Énergie V3.0.0 — macros facultatives
-- Données approximatives et modifiables associées au repas.
alter table public.meals add column if not exists nutrition jsonb;
comment on column public.meals.nutrition is
  'Macros facultatives: calories, protein, carbs, fat, source, confidence, basis et estimated.';


-- V3.3.2 — conserver la suggestion affichée avec le repas
alter table public.meals add column if not exists recommendation jsonb;
comment on column public.meals.recommendation is 'Suggestion facultative affichée après un repas principal.';
