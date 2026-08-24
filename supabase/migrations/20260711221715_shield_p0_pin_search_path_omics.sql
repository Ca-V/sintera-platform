-- Shield P0: fixa search_path das funções omics (hardening seguro; corrige WARN
-- function_search_path_mutable sem alterar comportamento — referências public continuam resolvendo).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
             AND p.proname IN ('omics_resolve_feature','omics_panel_categories','omics_ingest')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
  END LOOP;
END $$;