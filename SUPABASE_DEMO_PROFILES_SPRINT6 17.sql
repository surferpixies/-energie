-- Énergie 3.13.0 — accès privé aux profils de démonstration
-- Migration non destructive.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  has_demo_access boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists has_demo_access boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

-- Remplace les adresses ci-dessous par les deux comptes autorisés.
-- Cette commande crée aussi la ligne de profil si elle n'existe pas encore.
insert into public.profiles (id, has_demo_access)
select id, true from auth.users
where email in ('TON_COURRIEL_ICI', 'COURRIEL_DE_TA_CONJOINTE_ICI')
on conflict (id) do update
set has_demo_access = excluded.has_demo_access,
    updated_at = now();
