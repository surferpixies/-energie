-- Quotas atomiques pour l'importation de recettes Énergie.
-- À exécuter dans Supabase SQL Editor AVANT de déployer la nouvelle Edge Function.
-- 10 imports / 10 minutes et 100 imports / jour / utilisateur (UTC).
CREATE TABLE IF NOT EXISTS public.recipe_import_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_seconds integer NOT NULL CHECK (window_seconds IN (600, 86400)),
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, window_seconds, window_start)
);
ALTER TABLE public.recipe_import_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recipe_import_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_import_usage TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_recipe_import_request(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_10min timestamptz := to_timestamp(
    (floor(extract(epoch from v_now) / 600)::bigint) * 600
  );
  v_day timestamptz := to_timestamp(
    (floor(extract(epoch from v_now) / 86400)::bigint) * 86400
  );
  v_short_count integer;
  v_day_count integer;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Sérialise les réservations d'un même utilisateur (même en multi-instances).
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_user_id::text));

  SELECT request_count INTO v_short_count
  FROM public.recipe_import_usage
  WHERE user_id = p_user_id AND window_seconds = 600 AND window_start = v_10min;

  SELECT request_count INTO v_day_count
  FROM public.recipe_import_usage
  WHERE user_id = p_user_id AND window_seconds = 86400 AND window_start = v_day;

  IF coalesce(v_short_count, 0) >= 10 OR coalesce(v_day_count, 0) >= 100 THEN
    RETURN false;
  END IF;

  INSERT INTO public.recipe_import_usage(user_id, window_seconds, window_start, request_count)
  VALUES (p_user_id, 600, v_10min, 1), (p_user_id, 86400, v_day, 1)
  ON CONFLICT (user_id, window_seconds, window_start) DO UPDATE
  SET request_count = public.recipe_import_usage.request_count + 1;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_recipe_import_request(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_recipe_import_request(uuid) TO service_role;
COMMENT ON FUNCTION public.reserve_recipe_import_request(uuid) IS
  'Quota atomique import-recipe : 10 demandes / 10 minutes et 100 / jour par utilisateur, rôle service_role uniquement.';
