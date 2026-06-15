-- ============================================================
-- SINTERA — Migração 028: campos de governança científica no catálogo
-- ============================================================
-- ✅ APLICADA em 2026-06-15 (somente estrutura; checklist confirmado: sem
--    UPDATE/INSERT/backfill/trigger/default clínico/alteração de regra ou de
--    comportamento da app). Estrutura VAZIA, não toca conteúdo clínico.
--
-- Adiciona ao biomarker_catalog os campos permanentes que dão rastreabilidade
-- ao mapeamento de interoperabilidade (LOINC/SNOMED) e à sua aprovação. Ver
-- docs/clinical/GOVERNANCA-CIENTIFICA.md §2-3 e o workflow de catálogo.
--
-- Nenhum campo carrega interpretação clínica. O fluxo de status materializa:
--   draft → em_curadoria → verificado → aprovado → producao
-- ============================================================

ALTER TABLE biomarker_catalog
  -- Estágio do mapeamento LOINC (identificação do exame).
  ADD COLUMN IF NOT EXISTS loinc_status text NOT NULL DEFAULT 'draft'
    CHECK (loinc_status IN ('draft','em_curadoria','verificado','aprovado','producao')),
  -- Estágio do mapeamento SNOMED CT (semântica). Geralmente 2ª fase de curadoria.
  ADD COLUMN IF NOT EXISTS snomed_status text NOT NULL DEFAULT 'draft'
    CHECK (snomed_status IN ('draft','em_curadoria','verificado','aprovado','producao')),
  -- Fonte usada para validar o mapeamento (ex.: 'loinc.org', diretriz).
  ADD COLUMN IF NOT EXISTS scientific_source text,
  -- Versão da fonte/release LOINC consultada.
  ADD COLUMN IF NOT EXISTS scientific_version text,
  -- Quem revisou o mapeamento (curador; CRM quando exigir aval clínico).
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  -- Quando foi revisado.
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  -- Estágio geral de aprovação do item no catálogo.
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft','em_curadoria','verificado','aprovado','producao'));

COMMENT ON COLUMN biomarker_catalog.loinc_status     IS 'Estágio do mapeamento LOINC: draft→em_curadoria→verificado→aprovado→producao.';
COMMENT ON COLUMN biomarker_catalog.snomed_status    IS 'Estágio do mapeamento SNOMED CT (mesmo fluxo). 2ª fase de curadoria.';
COMMENT ON COLUMN biomarker_catalog.scientific_source  IS 'Fonte da validação do mapeamento (ex.: loinc.org, release X).';
COMMENT ON COLUMN biomarker_catalog.scientific_version IS 'Versão/release da fonte consultada.';
COMMENT ON COLUMN biomarker_catalog.reviewed_by      IS 'Curador que revisou o mapeamento.';
COMMENT ON COLUMN biomarker_catalog.reviewed_at      IS 'Data/hora da revisão.';
COMMENT ON COLUMN biomarker_catalog.approval_status  IS 'Estágio geral de aprovação do item: draft→…→producao.';
