-- Extension additive des favoris : aliments FCEN et aliments personnels.
-- Aucun favori existant n'est supprimé ni réécrit.
alter table public.favorite_foods
  add column if not exists food_source text not null default 'fcn',
  add column if not exists custom_food_name text,
  add column if not exists custom_food_id uuid,
  add column if not exists calories_per_100g numeric,
  add column if not exists protein_per_100g numeric,
  add column if not exists carbs_per_100g numeric,
  add column if not exists fat_per_100g numeric;

alter table public.favorite_foods
  alter column cnf_food_id drop not null;

alter table public.favorite_foods
  drop constraint if exists favorite_foods_unique_food_per_user;

alter table public.favorite_foods
  add constraint favorite_foods_source_valid
    check (food_source in ('fcn','custom')),
  add constraint favorite_foods_source_fields_valid
    check (
      (food_source = 'fcn' and cnf_food_id is not null and btrim(cnf_food_id) <> '' and custom_food_id is null)
      or
      (food_source = 'custom' and cnf_food_id is null and custom_food_id is not null
       and custom_food_name is not null and btrim(custom_food_name) <> '')
    ),
  add constraint favorite_foods_nutrition_nonnegative
    check (
      (calories_per_100g is null or calories_per_100g >= 0)
      and (protein_per_100g is null or protein_per_100g >= 0)
      and (carbs_per_100g is null or carbs_per_100g >= 0)
      and (fat_per_100g is null or fat_per_100g >= 0)
    );

create unique index if not exists favorite_foods_fcn_unique
  on public.favorite_foods(user_id, cnf_food_id) where food_source = 'fcn';
create unique index if not exists favorite_foods_custom_unique
  on public.favorite_foods(user_id, custom_food_id) where food_source = 'custom';
