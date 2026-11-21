begin;
create table if not exists public.wellness_notice_acceptances (
 user_id uuid not null references auth.users(id) on delete cascade,
 notice_version text not null check (notice_version = 'v2'),
 accepted_at timestamptz not null default now(),
 locale text not null check (locale in ('fr','en')),
 primary key (user_id, notice_version)
);
alter table public.wellness_notice_acceptances enable row level security;
revoke all on public.wellness_notice_acceptances from public, anon, authenticated;
grant select on public.wellness_notice_acceptances to authenticated;
drop policy if exists wellness_read_own on public.wellness_notice_acceptances;
create policy wellness_read_own on public.wellness_notice_acceptances for select to authenticated using (auth.uid() = user_id);
create or replace function public.accept_wellness_notice(p_locale text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_locale is null or p_locale not in ('fr','en') then raise exception 'Invalid locale'; end if;
 insert into public.wellness_notice_acceptances(user_id,notice_version,locale)
 values (auth.uid(),'v2',p_locale) on conflict (user_id,notice_version) do nothing;
end;
$$;
revoke all on function public.accept_wellness_notice(text) from public, anon, authenticated;
grant execute on function public.accept_wellness_notice(text) to authenticated;
commit;
