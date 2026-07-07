-- 095 — health_resources (módulo "Recursos de Saúde")
--
-- Recursos que a pessoa USA para cuidado, compensação funcional ou monitoramento
-- (óculos/lentes, dispositivos médicos, próteses/órteses, auxílios, compressão e
-- suporte). Modelo PRÓPRIO — não reutiliza `medications` (dose/frequência/forma/
-- via/recompra não se aplicam; reaproveitar geraria colunas nulas e regras
-- condicionais). O núcleo é comum a todos os recursos; o detalhe específico do
-- sub-tipo vive em `attributes` (JSONB). Ver UX-001 (Anexo A).
--
-- A SINTERA apenas organiza o que a pessoa informa — não interpreta nem prescreve.

CREATE TABLE IF NOT EXISTS public.health_resources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type  text NOT NULL,               -- correcao_visual | dispositivo_medico | protese_ortese | auxilio | compressao_suporte
  name           text NOT NULL,               -- nome do recurso (ex.: "Óculos de longe", "Marca-passo")
  brand          text,                         -- marca/modelo (opcional)
  prescriber     text,                         -- quem indicou/prescreveu (opcional)
  started_on     date,                         -- desde quando usa (opcional)
  until_date     date,                         -- validade/troca prevista (opcional)
  status         text NOT NULL DEFAULT 'em_uso', -- em_uso | suspenso | encerrado
  notes          text,
  file_url       text,                         -- foto/receita (signed URL do bucket exams)
  attributes     jsonb NOT NULL DEFAULT '{}'::jsonb, -- específico do sub-tipo (ex.: grau da correção visual)
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT health_resources_type_chk CHECK (
    resource_type IN ('correcao_visual','dispositivo_medico','protese_ortese','auxilio','compressao_suporte')
  ),
  CONSTRAINT health_resources_status_chk CHECK (
    status IN ('em_uso','suspenso','encerrado')
  )
);

ALTER TABLE public.health_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS health_resources_own ON public.health_resources;
CREATE POLICY health_resources_own ON public.health_resources
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS health_resources_user_type_idx
  ON public.health_resources (user_id, resource_type, created_at DESC);

-- ------------------------------------------------------------------
-- Migração idempotente: eyeglass_prescriptions → health_resources
-- (resource_type = 'correcao_visual'). Rastreia a origem em
-- attributes.legacy_id para nunca duplicar em reexecuções.
-- ------------------------------------------------------------------
INSERT INTO public.health_resources
  (user_id, resource_type, name, prescriber, started_on, status, notes, file_url, attributes)
SELECT
  e.user_id,
  'correcao_visual',
  CASE WHEN e.kind = 'lentes_contato' THEN 'Lentes de contato' ELSE 'Óculos' END,
  e.prescriber,
  e.prescribed_on,
  'em_uso',
  e.notes,
  e.file_url,
  jsonb_strip_nulls(jsonb_build_object(
    'legacy_id',   e.id::text,
    'vision_kind', e.kind,
    'od', jsonb_strip_nulls(jsonb_build_object('sph', e.od_sph, 'cyl', e.od_cyl, 'axis', e.od_axis, 'add', e.od_add)),
    'oe', jsonb_strip_nulls(jsonb_build_object('sph', e.oe_sph, 'cyl', e.oe_cyl, 'axis', e.oe_axis, 'add', e.oe_add)),
    'dnp', e.dnp,
    'bc',  e.bc,
    'dia', e.dia
  ))
FROM public.eyeglass_prescriptions e
WHERE NOT EXISTS (
  SELECT 1 FROM public.health_resources hr
  WHERE hr.attributes->>'legacy_id' = e.id::text
);

COMMENT ON TABLE public.health_resources IS
  'Recursos de Saúde (UX-001 Anexo A): recursos que a pessoa usa para cuidado/compensação/monitoramento. Modelo próprio; detalhe do sub-tipo em attributes (JSONB).';
