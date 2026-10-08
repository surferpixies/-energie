-- Énergie — options par client. Exécuter après SUPABASE_PROFESSIONAL_BETA_V3.56.107.sql.
-- Migration additive : aucune donnée du journal ni autorisation de partage n'est modifiée.
begin;
create table if not exists public.professional_client_options (
  link_id uuid primary key references public.professional_client_links(id) on delete cascade,
  rules jsonb not null default '{}'::jsonb check (jsonb_typeof(rules) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.professional_client_options enable row level security;
revoke all on table public.professional_client_options from anon, authenticated;
grant select on table public.professional_client_options to authenticated;
drop policy if exists professional_options_read_parties on public.professional_client_options;
create policy professional_options_read_parties on public.professional_client_options for select to authenticated
using (exists (
  select 1 from public.professional_client_links l
  join public.profiles p on p.id = l.professional_user_id
  where l.id = link_id and l.status = 'active' and l.share_journal is true
    and p.professional_beta_access is true
    and auth.uid() in (l.professional_user_id, l.client_user_id)
));

create or replace function public.get_professional_client_options(p_link_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_link public.professional_client_links%rowtype; v_options public.professional_client_options%rowtype;
begin
  select * into v_link from public.professional_client_links
  where id = p_link_id and auth.uid() in (professional_user_id, client_user_id);
  if not found then raise exception 'Dossier introuvable ou accès refusé.' using errcode = '42501'; end if;
  if v_link.status <> 'active' or not v_link.share_journal or not exists (
    select 1 from public.profiles where id = v_link.professional_user_id and professional_beta_access is true
  ) then return null; end if;
  select * into v_options from public.professional_client_options where link_id = p_link_id;
  return jsonb_build_object('link_id',p_link_id,'client_user_id',v_link.client_user_id,
    'rules',coalesce(v_options.rules,'{}'::jsonb),'updated_at',v_options.updated_at);
end;
$$;

create or replace function public.set_professional_client_options(
  p_link_id uuid, p_rules jsonb, p_expected_updated_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_link public.professional_client_links%rowtype;
  v_options public.professional_client_options%rowtype;
  v_key text; v_rule jsonb; v_clean jsonb := '{}'::jsonb; v_token text;
  v_allowed text[] := array['showCnfGuidedEntry','showCiqualGuidedEntry','forceGuidedCnfMealEntry','hideCalories','showEatingReasons','showRecognizedElements','summaryHideCompletedMeals','feelingReminders'];
begin
  -- Le verrou sur le lien sérialise aussi la première création du document.
  select * into v_link from public.professional_client_links
  where id = p_link_id and professional_user_id = auth.uid()
    and status = 'active' and client_user_id is not null and share_journal is true for update;
  if not found or not exists (
    select 1 from public.profiles where id = auth.uid() and professional_beta_access is true
  ) then raise exception 'Seul le professionnel autorisé peut configurer ce client.' using errcode = '42501'; end if;
  if p_rules is null or jsonb_typeof(p_rules) <> 'object' or pg_column_size(p_rules) > 12000 then
    raise exception 'Configuration invalide.' using errcode = '22023';
  end if;
  select * into v_options from public.professional_client_options where link_id = p_link_id for update;
  if v_options.updated_at is distinct from p_expected_updated_at then
    raise exception 'Ces options ont changé. Recharge le dossier avant de les modifier.' using errcode = '40001';
  end if;
  for v_key, v_rule in select key, value from jsonb_each(p_rules) loop
    if not (v_key = any(v_allowed)) or jsonb_typeof(v_rule) <> 'object' then
      raise exception 'Option non autorisée : %', v_key using errcode = '22023';
    end if;
    if coalesce(v_rule->>'mode','') not in ('client','default','locked') then
      raise exception 'Mode invalide.' using errcode = '22023';
    end if;
    if v_rule->>'mode' = 'client' then continue; end if;
    if jsonb_typeof(v_rule->'value') is distinct from 'boolean' then
      raise exception 'Valeur invalide.' using errcode = '22023';
    end if;
    if v_options.rules->v_key->>'mode' = v_rule->>'mode' and v_options.rules->v_key->'value' = v_rule->'value' then
      v_token := v_options.rules->v_key->>'token';
    else v_token := gen_random_uuid()::text; end if;
    v_clean := v_clean || jsonb_build_object(v_key,jsonb_build_object('mode',v_rule->>'mode','value',v_rule->'value','token',v_token));
  end loop;
  insert into public.professional_client_options(link_id,rules,updated_at)
  values(p_link_id,v_clean,clock_timestamp())
  on conflict(link_id) do update set rules=excluded.rules,updated_at=excluded.updated_at;
  return public.get_professional_client_options(p_link_id);
end;
$$;
revoke all on function public.get_professional_client_options(uuid) from public, anon, authenticated;
revoke all on function public.set_professional_client_options(uuid,jsonb,timestamptz) from public, anon, authenticated;
grant execute on function public.get_professional_client_options(uuid) to authenticated;
grant execute on function public.set_professional_client_options(uuid,jsonb,timestamptz) to authenticated;
commit;
