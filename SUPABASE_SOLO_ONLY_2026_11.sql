-- Énergie — lancement Solo uniquement (migration NON destructive).
-- À exécuter dans Supabase SQL Editor avec les privilèges d'administration.
-- Conserver cette migration et la migration professionnelle originale pour une
-- éventuelle réactivation ultérieure. Ne supprime aucune table ni note historique.
begin;

-- Aucun compte ne conserve le droit d'ouvrir un espace Pro.
update public.profiles
set professional_beta_access = false,
    account_type = 'personal',
    updated_at = now()
where professional_beta_access = true or account_type = 'professional';

-- Mettre fin aux partages existants et aux invitations en attente.
-- Les lignes historiques subsistent, mais ne donnent plus aucun accès.
update public.professional_client_links
set status = 'revoked',
    share_journal = false,
    share_photos = false,
    revoked_at = coalesce(revoked_at, now()),
    updated_at = now()
where status in ('active','pending');

-- Couper les accès directs aux tables du module professionnel.
revoke all on table public.professional_client_links from anon, authenticated;
revoke all on table public.professional_notes from anon, authenticated;
revoke all on table public.professional_tracking_plans from anon, authenticated;

-- Une ancienne application ne doit plus pouvoir accepter d'invitation.
revoke execute on function public.accept_professional_invite(text,text) from public, anon, authenticated;
revoke execute on function public.revoke_professional_link(uuid) from public, anon, authenticated;

-- Les policies de lecture de journal et de repas appellent cette fonction.
-- Le faux constant ferme l'accès sans retirer les règles RLS personnelles.
create or replace function public.is_active_professional_for(p_client_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;
revoke all on function public.is_active_professional_for(uuid) from public;
grant execute on function public.is_active_professional_for(uuid) to authenticated;

commit;

-- Important : vérifier séparément les policies de Storage des photos,
-- notamment private.can_read_shared_meal_photo. Tous les liens sont révoqués
-- et share_photos=false, mais un audit RLS/Storage reste recommandé.
-- Pour réactiver Pro un jour, restaurer d'abord les fonctions/grants/policies,
-- puis créer de NOUVELLES autorisations de partage explicites.
