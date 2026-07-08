-- 096 — report_templates (Central de Relatórios · REL-001)
--
-- Modelos de relatório SALVOS pela usuária (além dos perfis padrão em código).
-- Cada template memoriza toda a configuração de seleção (seções/itens/documentos)
-- para reuso — ex.: "Consulta com Dra. Ana", "Seguro Saúde", "Viagem".
-- A seleção é guardada como JSONB (estrutura definida na camada de aplicação;
-- espelha a árvore do menu — UX-001). Ver docs/REL-001_CENTRAL_RELATORIOS.md §7/§13.

CREATE TABLE IF NOT EXISTS public.report_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  selection   jsonb NOT NULL DEFAULT '{}'::jsonb,  -- configuração de seleção (chaves de seção/itens)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_templates_own ON public.report_templates;
CREATE POLICY report_templates_own ON public.report_templates
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS report_templates_user_idx
  ON public.report_templates (user_id, created_at DESC);

COMMENT ON TABLE public.report_templates IS
  'REL-001: modelos de relatório salvos pela usuária (seleção em JSONB). Perfis padrão ficam em código; templates são dados do usuário.';
