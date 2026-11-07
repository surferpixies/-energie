-- Énergie 3.56.405 — catégories multiples et boisson facultative des favoris.
-- Migration additive, sans suppression et sans modification des règles RLS.
alter table public.favorite_meals
  add column if not exists meal_types text[],
  add column if not exists beverage jsonb;

-- Reproduit le comportement historique : dîner et souper interchangeables.
update public.favorite_meals
set meal_types = case
  when meal_type in ('Dîner', 'Souper') then array['Dîner', 'Souper']::text[]
  when meal_type in ('Déjeuner', 'Collation') then array[meal_type]::text[]
  else array['Déjeuner', 'Dîner', 'Souper', 'Collation']::text[]
end
where meal_types is null or cardinality(meal_types) = 0;

-- Les favoris existants n'ont pas de boisson définie.
-- beverage reste NULL et peut contenir { "type": "coffee", "amountMl": 250 }.
