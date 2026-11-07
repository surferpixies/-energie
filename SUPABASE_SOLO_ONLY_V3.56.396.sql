-- Énergie 3.56.396 — lancement Solo uniquement
-- À exécuter MANUELLEMENT dans Supabase SQL Editor APRÈS sauvegarde.
-- Non destructif : aucun compte, repas, note ou historique supprimé.
-- Les tables et fonctions Pro demeurent dans le schéma pour une éventuelle réactivation.
-- Attention : les invitations existantes seront révoquées (une réactivation future
-- nécessitera de nouveaux liens autorisés).
begin;

-- Tous les comptes redeviennent des comptes Solo, sans privilège Pro ni partage de photo.
update public.profiles
set professional_beta_access = false,
    account_type = 'personal',
    share_avatar_with_professionals = false,
    updated_at = now()
where professional_beta_access is distinct from false
   or account_type is distinct from 'personal'
   or share_avatar_with_professionals is distinct from false;

-- Couper explicitement tous les partages existants (y compris invitations en attente).
update public.professional_client_links
set status = 'revoked',
    share_journal = false,
    share_photos = false,
    revoked_at = coalesce(revoked_at, now()),
    updated_at = now()
where status <> 'revoked'
   or share_journal is distinct from false
   or share_photos is distinct from false;

-- Les données Pro archivées sur place ne sont plus accessibles via l'API publique.
revoke all on table
  public.professional_client_links,
  public.professional_notes,
  public.professional_tracking_plans
from anon, authenticated, public;

-- Fermer les RPC Pro tout en laissant les fonctions de contrôle RLS existantes.
-- Ne PAS révoquer is_active_professional_for() : les politiques RLS des repas
-- l'appellent encore, et les liens révoqués / beta=false le font retourner false.
do $$
declare fn record;
begin
  for fn in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'accept_professional_invite',
        'revoke_professional_link',
        'get_professional_client_display_names',
        'get_professional_client_avatar_paths',
        'set_professional_client_options',
        'set_professional_photo_sharing'
      )
  loop
    execute format('revoke all on function %I.%I(%s) from anon, authenticated, public',
                   fn.nspname, fn.proname, fn.args);
  end loop;
end $$;
commit;

-- Validation facultative, après la transaction :
-- select count(*) as professional_accounts from public.profiles
-- where professional_beta_access = true or account_type = 'professional'
--    or share_avatar_with_professionals = true;
-- select count(*) as active_professional_links from public.professional_client_links
-- where status in ('pending','active') or share_journal = true or share_photos = true;
