-- Énergie v3.56.107 — bêta privée du mode professionnel
-- Migration non destructive. À exécuter une seule fois dans l'éditeur SQL Supabase.
-- IMPORTANT : la dernière section n'autorise aucun professionnel automatiquement.
-- Remplacer TON_COURRIEL_ENERGIE avant d'exécuter la commande d'activation.

begin;

-- 1) Autorisation bêta explicite sur le profil existant.
alter table public.profiles
  add column if not exists professional_beta_access boolean not null default false;

alter table public.profiles
  add column if not exists display_name text;

-- 2) Relation professionnel-client et consentement.
create table if not exists public.professional_client_links (
  id uuid primary key default gen_random_uuid(),
  professional_user_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid references auth.users(id) on delete cascade,
  professional_label text not null default 'Professionnel Énergie',
  client_label text,
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending','active','revoked')),
  share_journal boolean not null default true,
  share_photos boolean not null default false,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists professional_client_links_professional_idx
  on public.professional_client_links(professional_user_id, status);
create index if not exists professional_client_links_client_idx
  on public.professional_client_links(client_user_id, status);

-- 3) Notes et plan de suivi réels.
create table if not exists public.professional_notes (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.professional_client_links(id) on delete cascade,
  professional_user_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'shared' check (visibility in ('shared','private')),
  context_type text not null default 'global',
  context_id text,
  context_date date,
  context_label text,
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists professional_notes_link_idx
  on public.professional_notes(link_id, created_at desc);

create table if not exists public.professional_tracking_plans (
  link_id uuid primary key references public.professional_client_links(id) on delete cascade,
  professional_user_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  feeling_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 4) Fonctions serveur : le code d'invitation ne donne jamais directement
--    accès aux données. Le client doit être connecté et accepter lui-même.
create or replace function public.accept_professional_invite(
  p_invite_code text,
  p_client_label text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.professional_client_links%rowtype;
begin
  select * into v_link
  from public.professional_client_links
  where upper(invite_code) = upper(trim(p_invite_code))
    and status = 'pending'
    and client_user_id is null
  for update;

  if not found then
    raise exception 'Code expiré, déjà utilisé ou invalide.';
  end if;

  if v_link.professional_user_id = auth.uid() then
    raise exception 'Un professionnel ne peut pas accepter sa propre invitation.';
  end if;

  update public.professional_client_links
  set client_user_id = auth.uid(),
      client_label = nullif(trim(p_client_label), ''),
      status = 'active',
      accepted_at = now(),
      updated_at = now()
  where id = v_link.id;
end;
$$;

create or replace function public.revoke_professional_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professional_client_links
  set status = 'revoked', revoked_at = now(), updated_at = now()
  where id = p_link_id
    and (professional_user_id = auth.uid() or client_user_id = auth.uid());

  if not found then
    raise exception 'Lien introuvable ou accès refusé.';
  end if;
end;
$$;

revoke all on function public.accept_professional_invite(text,text) from public;
grant execute on function public.accept_professional_invite(text,text) to authenticated;
revoke all on function public.revoke_professional_link(uuid) from public;
grant execute on function public.revoke_professional_link(uuid) to authenticated;

-- 5) Helper RLS. Il ne donne accès qu'aux clients ayant accepté le lien.
create or replace function public.is_active_professional_for(p_client_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.professional_client_links l
    join public.profiles p on p.id = l.professional_user_id
    where l.professional_user_id = auth.uid()
      and l.client_user_id = p_client_user_id
      and l.status = 'active'
      and l.share_journal = true
      and p.professional_beta_access = true
  );
$$;
revoke all on function public.is_active_professional_for(uuid) from public;
grant execute on function public.is_active_professional_for(uuid) to authenticated;

-- 6) RLS des nouvelles tables.
alter table public.professional_client_links enable row level security;
alter table public.professional_notes enable row level security;
alter table public.professional_tracking_plans enable row level security;

revoke all on table public.professional_client_links from anon;
revoke all on table public.professional_notes from anon;
revoke all on table public.professional_tracking_plans from anon;
grant select, insert, update on table public.professional_client_links to authenticated;
grant select, insert, update, delete on table public.professional_notes to authenticated;
grant select, insert, update on table public.professional_tracking_plans to authenticated;

drop policy if exists professional_links_select_parties on public.professional_client_links;
create policy professional_links_select_parties
on public.professional_client_links for select to authenticated
using (auth.uid() = professional_user_id or auth.uid() = client_user_id);

drop policy if exists professional_links_insert_authorized_professional on public.professional_client_links;
create policy professional_links_insert_authorized_professional
on public.professional_client_links for insert to authenticated
with check (
  auth.uid() = professional_user_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.professional_beta_access = true
  )
);

-- Les changements d'état sensibles passent par les fonctions ci-dessus.
drop policy if exists professional_links_update_none on public.professional_client_links;
create policy professional_links_update_none
on public.professional_client_links for update to authenticated
using (false) with check (false);

drop policy if exists professional_notes_select_parties on public.professional_notes;
create policy professional_notes_select_parties
on public.professional_notes for select to authenticated
using (
  auth.uid() = professional_user_id
  or (auth.uid() = client_user_id and visibility = 'shared')
);

drop policy if exists professional_notes_write_professional on public.professional_notes;
create policy professional_notes_write_professional
on public.professional_notes for insert to authenticated
with check (
  auth.uid() = professional_user_id
  and exists (
    select 1 from public.professional_client_links l
    where l.id = link_id and l.professional_user_id = auth.uid()
      and l.client_user_id = professional_notes.client_user_id and l.status = 'active'
  )
);

drop policy if exists professional_notes_update_professional on public.professional_notes;
create policy professional_notes_update_professional
on public.professional_notes for update to authenticated
using (auth.uid() = professional_user_id)
with check (auth.uid() = professional_user_id);

drop policy if exists professional_notes_delete_professional on public.professional_notes;
create policy professional_notes_delete_professional
on public.professional_notes for delete to authenticated
using (auth.uid() = professional_user_id);

drop policy if exists professional_tracking_select_parties on public.professional_tracking_plans;
create policy professional_tracking_select_parties
on public.professional_tracking_plans for select to authenticated
using (auth.uid() = professional_user_id or auth.uid() = client_user_id);

drop policy if exists professional_tracking_write_professional on public.professional_tracking_plans;
create policy professional_tracking_write_professional
on public.professional_tracking_plans for insert to authenticated
with check (
  auth.uid() = professional_user_id
  and exists (
    select 1 from public.professional_client_links l
    where l.id = link_id and l.professional_user_id = auth.uid()
      and l.client_user_id = professional_tracking_plans.client_user_id and l.status = 'active'
  )
);

drop policy if exists professional_tracking_update_professional on public.professional_tracking_plans;
create policy professional_tracking_update_professional
on public.professional_tracking_plans for update to authenticated
using (auth.uid() = professional_user_id)
with check (auth.uid() = professional_user_id);

-- 7) Accès en lecture aux vraies données du client.
-- Ces politiques s'ajoutent aux politiques personnelles existantes; elles ne les remplacent pas.
alter table public.daily_logs enable row level security;
alter table public.meals enable row level security;

-- Filet de sécurité : préserver explicitement l'accès du propriétaire à ses propres données.
drop policy if exists daily_logs_own_all_v107 on public.daily_logs;
create policy daily_logs_own_all_v107
on public.daily_logs for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists meals_own_all_v107 on public.meals;
create policy meals_own_all_v107
on public.meals for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists daily_logs_select_linked_professional on public.daily_logs;
create policy daily_logs_select_linked_professional
on public.daily_logs for select to authenticated
using (public.is_active_professional_for(user_id));

drop policy if exists meals_select_linked_professional on public.meals;
create policy meals_select_linked_professional
on public.meals for select to authenticated
using (public.is_active_professional_for(user_id));

-- Les photos restent volontairement hors de cette première bêta.
-- Aucune politique Storage professionnelle n'est ajoutée ici.

commit;

-- 8) ACTIVATION MANUELLE DE TON COMPTE SEULEMENT.
-- Remplace TON_COURRIEL_ENERGIE puis exécute cette commande séparément :
--
-- insert into public.profiles (id, professional_beta_access)
-- select id, true from auth.users where email = 'TON_COURRIEL_ENERGIE'
-- on conflict (id) do update
-- set professional_beta_access = true, updated_at = now();
