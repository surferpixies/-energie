-- Protection anti-rafale IA calories (à exécuter UNE fois dans Supabase SQL Editor).
-- Préserve les quotas quotidiens : 50 appels/utilisateur et 500 globaux.
-- Autorise au maximum 2 appels sur 30 secondes par utilisateur :
-- une recherche Google ET son éventuel repli Gemini.
-- L'analyse photo utilise une autre Edge Function et doit être protégée séparément côté serveur.

create table if not exists public.calorie_ai_pilot_burst_usage (
  user_id uuid primary key,
  window_start timestamptz not null,
  request_count integer not null default 0
);
alter table public.calorie_ai_pilot_burst_usage enable row level security;
revoke all on public.calorie_ai_pilot_burst_usage from public, anon, authenticated;

create or replace function public.reserve_calorie_ai_pilot_request(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_day date := (now() at time zone 'UTC')::date;
  current_time timestamptz := clock_timestamp();
  global_count integer;
  user_count integer;
  burst_start timestamptz;
  burst_count integer;
begin
  if auth.role() is distinct from 'service_role' or p_user_id is null then
    raise exception 'not authorized';
  end if;
  perform pg_advisory_xact_lock(hashtext('energie-calorie-ai-pilot'), current_day - date '2000-01-01');

  select request_count into global_count
    from public.calorie_ai_pilot_global_usage where usage_day = current_day;
  if coalesce(global_count, 0) >= 500 then return false; end if;
  select request_count into user_count
    from public.calorie_ai_pilot_usage
    where usage_day = current_day and user_id = p_user_id;
  if coalesce(user_count, 0) >= 50 then return false; end if;

  select window_start, request_count into burst_start, burst_count
    from public.calorie_ai_pilot_burst_usage where user_id = p_user_id;
  if burst_start is not null
     and current_time < burst_start + interval '30 seconds'
     and coalesce(burst_count, 0) >= 2 then
    return false;
  end if;

  insert into public.calorie_ai_pilot_burst_usage (user_id, window_start, request_count)
  values (p_user_id, current_time, 1)
  on conflict (user_id) do update set
    window_start = case
      when calorie_ai_pilot_burst_usage.window_start <= current_time - interval '30 seconds'
      then current_time else calorie_ai_pilot_burst_usage.window_start end,
    request_count = case
      when calorie_ai_pilot_burst_usage.window_start <= current_time - interval '30 seconds'
      then 1 else calorie_ai_pilot_burst_usage.request_count + 1 end;

  insert into public.calorie_ai_pilot_global_usage (usage_day, request_count)
  values (current_day, 1)
  on conflict (usage_day) do update
    set request_count = calorie_ai_pilot_global_usage.request_count + 1;
  insert into public.calorie_ai_pilot_usage (usage_day, user_id, request_count)
  values (current_day, p_user_id, 1)
  on conflict (usage_day, user_id) do update
    set request_count = calorie_ai_pilot_usage.request_count + 1;
  return true;
end;
$$;
revoke all on function public.reserve_calorie_ai_pilot_request(uuid)
  from public, anon, authenticated;
grant execute on function public.reserve_calorie_ai_pilot_request(uuid) to service_role;
