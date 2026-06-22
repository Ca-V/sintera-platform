-- 057 — Ômica Fase 3 (suporte de API): resumo por categoria de um painel.
-- Agrega contagem por categoria no banco (escalável: não carrega todas as
-- features). SECURITY INVOKER → RLS do chamador limita aos dados da própria.

CREATE OR REPLACE FUNCTION public.omics_panel_categories(p_panel uuid)
RETURNS TABLE(category_id uuid, name text, display_order int, n bigint)
LANGUAGE sql STABLE AS $$
  SELECT r.category_id, c.name, c.display_order, count(*)::bigint
  FROM public.omics_results r
  LEFT JOIN public.omics_categories c ON c.id = r.category_id
  WHERE r.panel_id = p_panel
  GROUP BY r.category_id, c.name, c.display_order
  ORDER BY c.display_order NULLS LAST, c.name NULLS LAST;
$$;
