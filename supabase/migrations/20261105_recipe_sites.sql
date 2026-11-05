-- Catalogue central des sites de recettes Énergie.
-- À exécuter une seule fois dans Supabase SQL Editor avant de déployer import-recipe.
create table if not exists public.recipe_sites (
  domain text primary key,
  display_name text not null,
  enabled boolean not null default false,
  status text not null default 'testing' check (status in ('working','testing','blocked')),
  updated_at timestamptz not null default now(),
  constraint recipe_sites_domain_format check (
    domain = lower(domain) and domain !~ '^www\\.'
    and domain ~ '^[a-z0-9-]+(\\.[a-z0-9-]+)+$'
    and length(domain) <= 253
  ),
  constraint recipe_sites_display_name_length check (length(btrim(display_name)) between 1 and 100)
);
alter table public.recipe_sites enable row level security;
-- Aucune politique SELECT / WRITE pour anon ou authenticated.
-- Seule la fonction Edge, côté serveur, utilise le rôle service_role.
revoke all on public.recipe_sites from anon, authenticated;
grant all on public.recipe_sites to service_role;

insert into public.recipe_sites (domain, display_name, enabled, status)
values
  ('ricardocuisine.com', 'Ricardo', true, 'working'),
  ('marmiton.org', 'Marmiton', true, 'testing'),
  ('marmiton.fr', 'Marmiton', true, 'testing'),
  ('zeste.ca', 'Zeste', false, 'blocked'),
  ('recettes.qc.ca', 'Recettes du Québec', false, 'blocked'),
  ('iga.ca', 'IGA', false, 'blocked')
on conflict (domain) do nothing;

comment on table public.recipe_sites is 'Sites autorisés pour l’importation de recettes : ajouter/modifier des lignes sans redéployer la fonction Edge.';
