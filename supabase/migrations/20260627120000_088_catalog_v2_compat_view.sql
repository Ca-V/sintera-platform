-- ============================================================
-- Scientific Catalog v2 — View de compatibilidade (Sprint 3A · M7)
-- ============================================================
-- `current_catalog`: expõe o catálogo com specimen/category DERIVADOS de
-- material_id/panel_id, para (a) provar reconstrução sem perda (diff=0 — §6.1) e
-- (b) permitir que os consumidores (M8) leiam material_label/panels do banco,
-- dissolvendo lib/biomarkers/panels.ts. NÃO remove specimen/category (aditivo).
-- NÃO executar em produção (Sprint 3A).
-- ============================================================

create or replace view public.current_catalog as
select
  bc.*,
  m.label as material_label,
  -- compat: specimen reconstruído do material (deve == bc.specimen → diff 0)
  bc.material_id as compat_specimen,
  -- compat: category reconstruída do painel de menor sort_order (single-value legado)
  (
    select p.id
      from public.biomarker_panels bp
      join public.panels p on p.id = bp.panel_id
     where bp.catalog_id = bc.id
     order by p.sort_order, p.id
     limit 1
  ) as compat_category,
  -- painéis do item (N—N) já com rótulo curado, ordenados
  coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'label', p.label, 'sort_order', p.sort_order)
                     order by p.sort_order, p.id)
      from public.biomarker_panels bp
      join public.panels p on p.id = bp.panel_id
     where bp.catalog_id = bc.id
  ), '[]'::jsonb) as panels
from public.biomarker_catalog bc
left join public.materials m on m.id = bc.material_id;

grant select on public.current_catalog to authenticated;

-- Rollback: drop view public.current_catalog;
