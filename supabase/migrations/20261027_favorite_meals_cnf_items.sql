-- Conserve les aliments FCÉN/CIQUAL des repas favoris sans modifier les favoris existants.
-- Migration additive : aucune suppression ni modification des données actuelles.
ALTER TABLE public.favorite_meals
  ADD COLUMN IF NOT EXISTS cnf_items jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.favorite_meals.cnf_items IS
  'Aliments structurés (référence FCÉN/CIQUAL, quantité, unité) du repas favori.';
