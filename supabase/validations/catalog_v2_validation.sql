-- ============================================================
-- Scientific Catalog v2 — Validação da migração (Sprint 3B)
-- ============================================================
-- NÃO é uma migration (fora de supabase/migrations/ → não roda no runner).
-- Rodar MANUALMENTE após aplicar 086→088, em ambiente de verificação e depois
-- em produção. Traduz os Critérios de Sucesso (Migration Plan §6.1). Todas as
-- queries devem retornar ZERO linhas (ou o valor indicado). Qualquer linha = falha.
-- ============================================================

-- [1] 100% dos registros com material_id (esperado: 0 linhas) ───────────────────
select id, code, specimen
  from public.biomarker_catalog
 where material_id is null;

-- [2] 100% com ao menos 1 painel — itens com category mas sem painel (esperado: 0)
select bc.id, bc.code, bc.category
  from public.biomarker_catalog bc
  left join public.biomarker_panels bp on bp.catalog_id = bc.id
 where bc.category is not null and bp.catalog_id is null;

-- [3] 0 registros órfãos — biomarkers apontando p/ catalog_id inexistente (0)
select b.id, b.catalog_id
  from public.biomarkers b
 where b.catalog_id is not null
   and not exists (select 1 from public.biomarker_catalog bc where bc.id = b.catalog_id);

-- [4] 0 perda de catalog_id — todo item do catálogo tem id (0)
select count(*) as itens_sem_id
  from public.biomarker_catalog
 where id is null;

-- [5] 0 incompatibilidades na view de compat — diff specimen/category (0 linhas) ─
select cc.id, cc.specimen, cc.compat_specimen, cc.category, cc.compat_category
  from public.current_catalog cc
 where cc.compat_specimen is distinct from cc.specimen
    or cc.compat_category is distinct from cc.category;

-- [6] Idempotência — contagens ANTES e DEPOIS de re-rodar 087 devem ser iguais.
--     Registrar estes números, re-rodar 087, comparar (devem bater exatamente):
select
  (select count(*) from public.materials)         as materials,
  (select count(*) from public.panels)            as panels,
  (select count(*) from public.biomarker_panels)  as biomarker_panels,
  (select count(*) from public.catalog_versions)  as catalog_versions,
  (select count(*) from public.biomarker_catalog where material_id is not null) as com_material;

-- [7] Cobertura de catalog_id nos biomarcadores MEDIDOS (deve ser ≥ atual ~99%) ─
select
  count(*)                                             as biomarcadores,
  count(*) filter (where catalog_id is not null)       as com_catalog,
  round(100.0 * count(*) filter (where catalog_id is not null) / nullif(count(*),0), 2) as pct
  from public.biomarkers;

-- [8] Biomarcadores medidos SEM match no catálogo — LOGAR (não silencioso) ───────
select b.id, b.name, b.exam_id
  from public.biomarkers b
 where b.catalog_id is null
 order by b.name;

-- [Rollback validado] e [Tempo de execução]: registrar manualmente no relatório de
-- homologação da Sprint 3B (não automatizável por query).
