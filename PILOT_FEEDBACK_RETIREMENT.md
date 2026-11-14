# Retrait du formulaire « Mode pilote » — Énergie Solo

## État du code
La version Web 3.56.502 retire le réglage de profil, le bouton flottant, le formulaire de commentaires et les appels vers `pilot_feedback` / le bucket `pilot-feedback`. La fonction `delete-account` du dépôt n'utilise plus la table `pilot_feedback`. Les mécanismes de quotas d'estimation de calories IA sont conservés.

## Ordre de retrait côté Supabase
1. Publier puis tester Énergie Web 3.56.502 et préparer une mise à jour iOS/Android. Les versions déjà installées peuvent encore afficher l'ancien formulaire.
2. Déployer la **nouvelle** Edge Function `delete-account` du dépôt et vérifier la suppression d'un compte de test (à faire avant de supprimer la table).
3. Désactiver les nouveaux commentaires et la notification au moyen du SQL de phase 1 ci-dessous.
4. Après validation des applications à jour, exécuter la phase 2. Cette phase supprime définitivement l'historique des commentaires et le déclencheur SQL; ne pas ajouter `CASCADE` si PostgreSQL signale d'autres dépendances.
5. Dans Supabase Dashboard, vider puis supprimer le bucket `pilot-feedback` (vrais fichiers compris), puis supprimer l'Edge Function `pilot-feedback-email`. La suppression SQL de la table ne supprime pas les fichiers du bucket.

## Phase 1 — Bloquer les nouveaux commentaires / couper les courriels
```sql
begin;
revoke insert, update, delete, select on public.pilot_feedback from anon, authenticated, public;
-- Un rôle client déjà connecté n'a plus accès à la table.
-- Détacher uniquement les triggers liés à la fonction de notification.
do $$
declare tr record;
begin
  for tr in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.pilot_feedback'::regclass
      and not t.tgisinternal
      and p.proname = 'notify_pilot_feedback_email'
      and p.pronamespace = 'public'::regnamespace
  loop
    execute format('drop trigger %I on public.pilot_feedback', tr.tgname);
  end loop;
end $$;
commit;
```

## Phase 2 — Suppression définitive après déploiement et tests
```sql
begin;
drop table if exists public.pilot_feedback;
drop function if exists public.notify_pilot_feedback_email();
commit;
```

## Contrôles
```sql
select to_regclass('public.pilot_feedback') as feedback_table;
select to_regprocedure('public.notify_pilot_feedback_email()') as notification_function;
select id, public from storage.buckets where id = 'pilot-feedback';
```
Après la phase 2 et la suppression du bucket, toutes les valeurs devraient être NULL/absentes.

Ne pas supprimer `consume_pilot_application_quota`, `reserve_calorie_ai_pilot_request` ou les tables de suivi de consommation IA à cause de leur nom : ce sont des composants distincts.
