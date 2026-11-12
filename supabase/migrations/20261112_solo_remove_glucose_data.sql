-- ÉNERGIE SOLO — purge ciblée et irréversible des données de glycémie.
-- À exécuter MANUELLEMENT dans Supabase SQL Editor dans Supabase SQL Editor; ce script prévient aussi la réintroduction par d'anciens clients.
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

-- Fonction centrale, aussi appliquée aux écritures des anciens builds.
create or replace function public.energie_strip_glucose_json(payload jsonb)
returns jsonb
language sql immutable
set search_path = pg_catalog
as $$
  select case
    when jsonb_typeof(payload) is distinct from 'object' then payload
    when jsonb_typeof(payload->'profilePreferences') = 'object' then
      jsonb_set(
        payload - 'glucoseMeasurements',
        '{profilePreferences}',
        (payload->'profilePreferences')
          - 'glucoseTracking' - 'glucoseReminders' - 'glucoseMode'
          - 'glucoseMealDelay' - 'glucoseMealTypes' - 'glucoseReminderTimes',
        true
      )
    else payload - 'glucoseMeasurements'
  end;
$$;

-- Les anciennes applications ne peuvent pas réintroduire de glycémie sur le serveur.
create or replace function public.energie_strip_glucose_on_write()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.supplements := public.energie_strip_glucose_json(new.supplements);
  return new;
end;
$$;
drop trigger if exists energie_strip_glucose_daily_logs on public.daily_logs;
create trigger energie_strip_glucose_daily_logs
before insert or update of supplements on public.daily_logs
for each row execute function public.energie_strip_glucose_on_write();

-- Purge de toutes les journées existantes, sans modifier leurs autres champs.
update public.daily_logs
set supplements = public.energie_strip_glucose_json(supplements)
where supplements is distinct from public.energie_strip_glucose_json(supplements);

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
