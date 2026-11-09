-- Suivi minimal de consommation IA : aucun contenu de repas ni photo.
-- Une ligne par appel autorisé par le quota (pas par tentative refusée).
create table if not exists public.ai_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  call_type text not null check (call_type in ('google_search', 'gemini_estimate')),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_created_at_idx
  on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_user_created_at_idx
  on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;
-- Aucun accès client : seules les Edge Functions, avec service_role, écrivent.
revoke all on table public.ai_usage_events from anon, authenticated;
grant select, insert, delete on table public.ai_usage_events to service_role;
grant usage, select on sequence public.ai_usage_events_id_seq to service_role;

-- À lancer dans l'éditeur SQL de Supabase pour consulter les 30 derniers jours :
-- select
--   count(distinct user_id) as utilisateurs_uniques,
--   count(*) as appels_total,
--   count(*) filter (where call_type = 'google_search') as recherches_google,
--   count(*) filter (where call_type = 'gemini_estimate') as estimations_gemini
-- from public.ai_usage_events
-- where created_at >= now() - interval '30 days';
--
-- Par jour :
-- select (created_at at time zone 'America/Toronto')::date as jour,
--        count(distinct user_id) as utilisateurs_uniques,
--        count(*) filter (where call_type='google_search') as recherches_google,
--        count(*) filter (where call_type='gemini_estimate') as estimations_gemini
-- from public.ai_usage_events
-- group by 1 order by 1 desc;
