-- Aliments favoris personnels : alias utilisateur relié à une fiche FCÉN/CIQUAL.
create table if not exists public.favorite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cnf_food_id text not null,
  alias text not null,
  name_fr text not null default '',
  name_en text not null default '',
  default_quantity numeric,
  default_unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint favorite_foods_alias_nonempty check (length(btrim(alias)) > 0),
  constraint favorite_foods_quantity_positive check (default_quantity is null or default_quantity > 0),
  constraint favorite_foods_unique_food_per_user unique (user_id, cnf_food_id)
);
create index if not exists favorite_foods_user_idx on public.favorite_foods (user_id);
alter table public.favorite_foods enable row level security;
create policy "Users can read own favorite foods" on public.favorite_foods for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own favorite foods" on public.favorite_foods for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own favorite foods" on public.favorite_foods for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own favorite foods" on public.favorite_foods for delete to authenticated using (auth.uid() = user_id);
