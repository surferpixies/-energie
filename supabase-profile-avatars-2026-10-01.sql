-- Énergie — avatars privés (Web, iOS, Android).
-- Exécuter une seule fois dans l'éditeur SQL Supabase AVANT de publier la nouvelle interface.
alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists show_avatar_self boolean not null default false,
  add column if not exists share_avatar_with_professionals boolean not null default false;

-- Les photos sont indépendantes du partage des photos de repas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 2097152, array['image/jpeg'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Accès vérifié à chaque signature : soi-même, ou professionnel réellement lié
-- à un client ayant explicitement autorisé la visibilité de son portrait.
create or replace function public.can_read_profile_avatar_path(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.avatar_path = p_path
      and (
        p.id = (select auth.uid())
        or (
          p.share_avatar_with_professionals is true
          and exists (
            select 1
            from public.professional_client_links l
            where l.client_user_id = p.id
              and l.professional_user_id = (select auth.uid())
              and l.status = 'active'
          )
        )
      )
  );
$$;
revoke all on function public.can_read_profile_avatar_path(text) from public;
grant execute on function public.can_read_profile_avatar_path(text) to authenticated;

-- Ne renvoie des chemins qu'aux professionnels concernés et uniquement
-- pour les comptes clients ayant consenti. Aucun droit de lecture global sur profiles.
create or replace function public.get_professional_client_avatar_paths()
returns table (link_id text, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id::text, p.avatar_path
  from public.professional_client_links l
  join public.profiles p on p.id = l.client_user_id
  where l.professional_user_id = (select auth.uid())
    and l.status = 'active'
    and p.share_avatar_with_professionals is true
    and p.avatar_path is not null;
$$;
revoke all on function public.get_professional_client_avatar_paths() from public;
grant execute on function public.get_professional_client_avatar_paths() to authenticated;

drop policy if exists "profile_avatars_select" on storage.objects;
create policy "profile_avatars_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.can_read_profile_avatar_path(name)
  )
);

drop policy if exists "profile_avatars_insert_own" on storage.objects;
create policy "profile_avatars_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "profile_avatars_delete_own" on storage.objects;
create policy "profile_avatars_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
