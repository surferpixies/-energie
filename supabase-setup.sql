-- Énergie & Repas V1.3 — à exécuter une seule fois dans Supabase > SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  sleep_hours numeric(4,2),
  water integer not null default 0 check (water >= 0 and water <= 30),
  activities jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null,
  meal_time time not null,
  meal_type text not null,
  description text not null,
  fatigue_before integer check (fatigue_before between 1 and 5),
  fatigue_after integer check (fatigue_after between 1 and 5),
  notes text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meals_user_date_idx on public.meals(user_id, meal_date desc);

alter table public.daily_logs enable row level security;
alter table public.meals enable row level security;

revoke all on table public.daily_logs from anon;
revoke all on table public.meals from anon;
grant select, insert, update, delete on table public.daily_logs to authenticated;
grant select, insert, update, delete on table public.meals to authenticated;

drop policy if exists "daily_logs_select_own" on public.daily_logs;
drop policy if exists "daily_logs_insert_own" on public.daily_logs;
drop policy if exists "daily_logs_update_own" on public.daily_logs;
drop policy if exists "daily_logs_delete_own" on public.daily_logs;
create policy "daily_logs_select_own" on public.daily_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_logs_insert_own" on public.daily_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily_logs_update_own" on public.daily_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_logs_delete_own" on public.daily_logs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "meals_select_own" on public.meals;
drop policy if exists "meals_insert_own" on public.meals;
drop policy if exists "meals_update_own" on public.meals;
drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_select_own" on public.meals for select to authenticated using ((select auth.uid()) = user_id);
create policy "meals_insert_own" on public.meals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meals_update_own" on public.meals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "meals_delete_own" on public.meals for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos','meal-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "meal_photos_select_own" on storage.objects;
drop policy if exists "meal_photos_insert_own" on storage.objects;
drop policy if exists "meal_photos_update_own" on storage.objects;
drop policy if exists "meal_photos_delete_own" on storage.objects;
create policy "meal_photos_select_own" on storage.objects for select to authenticated using (bucket_id='meal-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "meal_photos_insert_own" on storage.objects for insert to authenticated with check (bucket_id='meal-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "meal_photos_update_own" on storage.objects for update to authenticated using (bucket_id='meal-photos' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='meal-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "meal_photos_delete_own" on storage.objects for delete to authenticated using (bucket_id='meal-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
