-- 099 — Shield P0: fixa search_path das funções omics (hardening seguro)
--
-- Corrige o WARN `function_search_path_mutable` do Supabase Advisor para
-- omics_resolve_feature, omics_panel_categories e omics_ingest. Fixar o
-- search_path é hardening de segurança (evita sequestro de resolução de nomes)
-- sem alterar comportamento — referências a objetos public continuam resolvendo.
-- Aplicado em produção via Management API em 2026-07-10.

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
