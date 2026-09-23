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


-- Énergie V3.4.0 — contexte facultatif du sommeil
alter table public.daily_logs add column if not exists sleep_tags jsonb not null default '[]'::jsonb;
alter table public.daily_logs add column if not exists sleep_comment text;
comment on column public.daily_logs.sleep_tags is 'Éléments facultatifs ayant marqué la nuit, sélection multiple.';
comment on column public.daily_logs.sleep_comment is 'Commentaire libre facultatif sur la nuit.';


-- Énergie V3.5.0b — Activité intelligente synchronisée dans Supabase
-- Chaque activité demeure dans le tableau JSONB daily_logs.activities.
-- Les objets contiennent: id, type, minutes, intensity, estimatedCalories,
-- actualCalories et at. Cette migration est non destructive.
alter table public.daily_logs
  add column if not exists activities jsonb not null default '[]'::jsonb;

update public.daily_logs
set activities = '[]'::jsonb
where activities is null or jsonb_typeof(activities) <> 'array';

alter table public.daily_logs
  alter column activities set default '[]'::jsonb,
  alter column activities set not null;

comment on column public.daily_logs.activities is
  'Tableau des activités quotidiennes: type, durée, intensité, calories estimées ou mesurées et horodatage.';

-- Énergie V3.6.0 — état des suppléments synchronisé par jour
alter table public.daily_logs
  add column if not exists supplements jsonb not null default '{}'::jsonb;

update public.daily_logs
set supplements = '{}'::jsonb
where supplements is null or jsonb_typeof(supplements) <> 'object';

alter table public.daily_logs
  alter column supplements set default '{}'::jsonb,
  alter column supplements set not null;

comment on column public.daily_logs.supplements is
  'État des suppléments pour la journée: prises aujourd’hui et defaults enregistrés dans le profil.';


-- Énergie V3.56.64 — jusqu’à trois photos facultatives par repas
-- Migration non destructive : photo_path demeure compatible avec les anciennes versions.
alter table public.meals
  add column if not exists photo_paths jsonb not null default '[]'::jsonb;

update public.meals
set photo_paths = jsonb_build_array(photo_path)
where photo_path is not null
  and (photo_paths is null or photo_paths = '[]'::jsonb);

comment on column public.meals.photo_paths is
  'Jusqu’à trois chemins privés dans Storage pour les photos facultatives du repas.';


-- Énergie V3.56.125 — Mode pilote V1
create table if not exists public.pilot_feedback (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('suggestion','bug','other')),
  comment text not null check (char_length(comment) between 1 and 4000), reported_at timestamptz not null default now(),
  context text not null default '', platform text not null default '', app_version text not null default '',
  attachment_path text, status text not null default 'new' check (status in ('new','reviewing','resolved')), created_at timestamptz not null default now()
);
create index if not exists pilot_feedback_user_created_idx on public.pilot_feedback(user_id, created_at desc);
alter table public.pilot_feedback enable row level security;
revoke all on table public.pilot_feedback from anon;
grant select, insert on table public.pilot_feedback to authenticated;
drop policy if exists "pilot_feedback_insert_own" on public.pilot_feedback;
drop policy if exists "pilot_feedback_select_own" on public.pilot_feedback;
create policy "pilot_feedback_insert_own" on public.pilot_feedback for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "pilot_feedback_select_own" on public.pilot_feedback for select to authenticated using ((select auth.uid()) = user_id);
insert into storage.buckets (id,name,public,file_size_limit) values ('pilot-feedback','pilot-feedback',false,10485760)
on conflict (id) do update set public=false,file_size_limit=10485760;
drop policy if exists "pilot_feedback_storage_insert_own" on storage.objects;
drop policy if exists "pilot_feedback_storage_select_own" on storage.objects;
drop policy if exists "pilot_feedback_storage_delete_own" on storage.objects;
create policy "pilot_feedback_storage_insert_own" on storage.objects for insert to authenticated with check (bucket_id='pilot-feedback' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "pilot_feedback_storage_select_own" on storage.objects for select to authenticated using (bucket_id='pilot-feedback' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "pilot_feedback_storage_delete_own" on storage.objects for delete to authenticated using (bucket_id='pilot-feedback' and (storage.foldername(name))[1]=(select auth.uid())::text);
