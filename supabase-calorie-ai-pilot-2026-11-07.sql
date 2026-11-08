-- Pilote IA calories : quotas transactionnels (à exécuter dans SQL Editor).
-- Plafonds de test : 50 appels / utilisateur / jour et 500 appels globaux / jour.
-- Un parcours Google puis repli IA peut compter pour deux appels.
-- Aucune donnée de repas n'est enregistrée dans ces compteurs.
create table if not exists public.calorie_ai_pilot_usage (
  usage_day date not null,
  user_id uuid not null,
  request_count integer not null default 0,
  primary key (usage_day, user_id)
);
create table if not exists public.calorie_ai_pilot_global_usage (
  usage_day date primary key,
  request_count integer not null default 0
);
alter table public.calorie_ai_pilot_usage enable row level security;
alter table public.calorie_ai_pilot_global_usage enable row level security;
revoke all on public.calorie_ai_pilot_usage from public, anon, authenticated;
revoke all on public.calorie_ai_pilot_global_usage from public, anon, authenticated;

create or replace function public.reserve_calorie_ai_pilot_request(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_day date := (now() at time zone 'UTC')::date;
  global_count integer;
  user_count integer;
begin
  -- Seule la fonction Supabase authentifiée via service_role peut réserver.
  if auth.role() is distinct from 'service_role' or p_user_id is null then
    raise exception 'not authorized';
  end if;
  -- Sérialise les réservations de la journée, même pour deux utilisateurs différents.
  perform pg_advisory_xact_lock(hashtext('energie-calorie-ai-pilot'), current_day - date '2000-01-01');
  select request_count into global_count
    from public.calorie_ai_pilot_global_usage where usage_day = current_day;
  if coalesce(global_count, 0)  >= 500 then return false; end if;

  select request_count into user_count
    from public.calorie_ai_pilot_usage
    where usage_day = current_day and user_id = p_user_id;
  if coalesce(user_count, 0)  >= 50 then return false; end if;

  insert into public.calorie_ai_pilot_global_usage (usage_day, request_count)
  values (current_day, 1)
  on conflict (usage_day) do update set request_count = calorie_ai_pilot_global_usage.request_count + 1;
  insert into public.calorie_ai_pilot_usage (usage_day, user_id, request_count)
  values (current_day, p_user_id, 1)
  on conflict (usage_day, user_id) do update set request_count = calorie_ai_pilot_usage.request_count + 1;
  return true;
end;
$$;
revoke all on function public.reserve_calorie_ai_pilot_request(uuid) from public, anon, authenticated;
grant execute on function public.reserve_calorie_ai_pilot_request(uuid) to service_role;
