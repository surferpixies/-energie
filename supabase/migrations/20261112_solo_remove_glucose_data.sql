-- ÉNERGIE SOLO — purge ciblée et irréversible des données de glycémie.
-- À exécuter MANUELLEMENT dans Supabase SQL Editor après déploiement des clients sans glycémie.
-- Important : les anciens builds iOS/Android/Web non mis à jour peuvent réintroduire les champs.
-- Ne modifie pas les repas, les photos, le poids, les pas, les ressentis ni le sommeil.
-- Aucun export de données personnelles ne doit être déposé dans GitHub.
--
-- Contrôle AVANT :
-- select count(*) as jours_avec_glycemie
-- from public.daily_logs
-- where supplements ? 'glucoseMeasurements'
--   or (supplements->'profilePreferences') ? 'glucoseTracking'
--   or (supplements->'profilePreferences') ? 'glucoseReminders';
--
begin;
-- Nettoie les mesures et toutes les préférences de glycémie dans le JSON des journées.
with sanitized as (
  select
    user_id, log_date,
    supplements - 'glucoseMeasurements' as base,
    case
      when jsonb_typeof(supplements->'profilePreferences') = 'object'
      then (supplements->'profilePreferences')
        - 'glucoseTracking' - 'glucoseReminders' - 'glucoseMode'
        - 'glucoseMealDelay' - 'glucoseMealTypes' - 'glucoseReminderTimes'
      else null
    end as clean_preferences
  from public.daily_logs
  where supplements is not null and jsonb_typeof(supplements) = 'object'
), ready as (
  select user_id, log_date,
    case when clean_preferences is null
      then base
      else jsonb_set(base, '{profilePreferences}', clean_preferences, true)
    end as clean
  from sanitized
)
update public.daily_logs as d
set supplements = ready.clean
from ready
where d.user_id = ready.user_id and d.log_date = ready.log_date
  and d.supplements is distinct from ready.clean;
commit;
--
-- Vérification APRÈS :
-- select count(*) as jours_avec_donnees_glycemie_restantes
-- from public.daily_logs
-- where supplements ? 'glucoseMeasurements'
--   or (supplements->'profilePreferences') ? 'glucoseTracking'
--   or (supplements->'profilePreferences') ? 'glucoseReminders'
--   or (supplements->'profilePreferences') ? 'glucoseMode'
--   or (supplements->'profilePreferences') ? 'glucoseMealDelay'
--   or (supplements->'profilePreferences') ? 'glucoseMealTypes'
--   or (supplements->'profilePreferences') ? 'glucoseReminderTimes';
--
-- Les sauvegardes Supabase, exports anciens et appareils qui n'ont pas encore
-- mis l'application à jour ne sont PAS purgés par cette requête.
