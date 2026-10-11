-- Révocation bidirectionnelle des liens professionnel-client.
-- Le journal du client et les notes partagées ne sont pas supprimés.
begin;

create or replace function public.revoke_professional_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  update public.professional_client_links
  set status = 'revoked', revoked_at = now(), updated_at = now()
  where id = p_link_id
    and (professional_user_id = auth.uid() or client_user_id = auth.uid())
    and status in ('active', 'pending');
  if not found then
    raise exception 'Lien introuvable, déjà retiré ou accès refusé.';
  end if;
end;
$$;
revoke all on function public.revoke_professional_link(uuid) from public;
grant execute on function public.revoke_professional_link(uuid) to authenticated;

drop policy if exists professional_notes_select_parties on public.professional_notes;
create policy professional_notes_select_parties
on public.professional_notes for select to authenticated
using (
  (auth.uid() = client_user_id and visibility = 'shared')
  or (auth.uid() = professional_user_id and exists (
    select 1 from public.professional_client_links l
    where l.id = professional_notes.link_id
      and l.professional_user_id = professional_notes.professional_user_id
      and l.client_user_id = professional_notes.client_user_id
      and l.status = 'active'
  ))
);

drop policy if exists professional_notes_update_professional on public.professional_notes;
create policy professional_notes_update_professional
on public.professional_notes for update to authenticated
using (
  auth.uid() = professional_user_id and exists (
    select 1 from public.professional_client_links l
    where l.id = professional_notes.link_id
      and l.professional_user_id = professional_notes.professional_user_id
      and l.client_user_id = professional_notes.client_user_id
      and l.status = 'active'
  )
)
with check (
  auth.uid() = professional_user_id and exists (
    select 1 from public.professional_client_links l
    where l.id = professional_notes.link_id
      and l.professional_user_id = professional_notes.professional_user_id
      and l.client_user_id = professional_notes.client_user_id
      and l.status = 'active'
  )
);

drop policy if exists professional_notes_delete_professional on public.professional_notes;
create policy professional_notes_delete_professional
on public.professional_notes for delete to authenticated
using (
  auth.uid() = professional_user_id and exists (
    select 1 from public.professional_client_links l
    where l.id = professional_notes.link_id
      and l.professional_user_id = professional_notes.professional_user_id
      and l.client_user_id = professional_notes.client_user_id
      and l.status = 'active'
  )
);

drop policy if exists professional_tracking_select_parties on public.professional_tracking_plans;
create policy professional_tracking_select_parties
on public.professional_tracking_plans for select to authenticated
using (
  auth.uid() = client_user_id
  or (auth.uid() = professional_user_id and exists (
    select 1 from public.professional_client_links l
    where l.id = professional_tracking_plans.link_id
      and l.professional_user_id = professional_tracking_plans.professional_user_id
      and l.client_user_id = professional_tracking_plans.client_user_id
      and l.status = 'active'
  ))
);

drop policy if exists professional_tracking_update_professional on public.professional_tracking_plans;
create policy professional_tracking_update_professional
on public.professional_tracking_plans for update to authenticated
using (
  auth.uid() = professional_user_id and exists (
    select 1 from public.professional_client_links l
    where l.id = professional_tracking_plans.link_id
      and l.professional_user_id = professional_tracking_plans.professional_user_id
      and l.client_user_id = professional_tracking_plans.client_user_id
      and l.status = 'active'
  )
)
with check (
  auth.uid() = professional_user_id and exists (
    select 1 from public.professional_client_links l
    where l.id = professional_tracking_plans.link_id
      and l.professional_user_id = professional_tracking_plans.professional_user_id
      and l.client_user_id = professional_tracking_plans.client_user_id
      and l.status = 'active'
  )
);

commit;
