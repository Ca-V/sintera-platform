-- 055 — Infraestrutura genérica de Ômica
--
-- Modelo-base único para TODOS os segmentos de ômica: metabolômica,
-- proteômica, microbioma, genética, epigenética e exposômica. Evita
-- reengenharia conforme a plataforma evolui para dados ômicos mais complexos.
--
-- PRINCÍPIO REGULATÓRIO: a SINTERA apenas ARMAZENA, ORGANIZA, VERSIONA,
-- COMPARA e VISUALIZA dados ômicos. NÃO interpreta resultados, não calcula
-- risco, não gera score, não estima idade biológica, não infere doenças e não
-- recomenda conduta.
--
-- Conceito:
--   Painel (omics_panels) → Resultados (omics_results) → Feature (omics_features)
--   organizados por Categoria (omics_categories), com Versões (omics_versions).
--   Proveniência científica em external_ids (jsonb): hmdb/kegg/pubchem/uniprot/
--   ncbi_gene/rsid/taxonomy_id/... — genérico por domínio.

-- Painel ômico (1 exame ômico)
CREATE TABLE IF NOT EXISTS public.omics_panels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain          text NOT NULL CHECK (domain IN ('metabolomics','proteomics','microbiome','genetics','epigenetics','exposomics')),
  technology      text,
  platform        text,
  total_features  integer,
  laboratory      text,
  collected_on    date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Categorias por domínio (catálogo global)
CREATE TABLE IF NOT EXISTS public.omics_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain        text NOT NULL CHECK (domain IN ('metabolomics','proteomics','microbiome','genetics','epigenetics','exposomics')),
  name          text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain, name)
);

-- Catálogo mestre de features (metabólito/proteína/táxon/gene/…)
CREATE TABLE IF NOT EXISTS public.omics_features (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain        text NOT NULL CHECK (domain IN ('metabolomics','proteomics','microbiome','genetics','epigenetics','exposomics')),
  category_id   uuid REFERENCES public.omics_categories(id) ON DELETE SET NULL,
  name          text NOT NULL,
  synonym       text,
  unit_default  text,
  external_ids  jsonb NOT NULL DEFAULT '{}'::jsonb,
  source        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Resultado individual (valor de uma feature num painel)
CREATE TABLE IF NOT EXISTS public.omics_results (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id         uuid NOT NULL REFERENCES public.omics_panels(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain           text NOT NULL CHECK (domain IN ('metabolomics','proteomics','microbiome','genetics','epigenetics','exposomics')),
  feature_id       uuid REFERENCES public.omics_features(id) ON DELETE SET NULL,
  feature_name     text NOT NULL,
  category_id      uuid REFERENCES public.omics_categories(id) ON DELETE SET NULL,
  value            numeric,
  unit             text,
  raw_value        text,
  detection_status text,
  method           text,
  measured_on      date,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Versionamento imutável do painel (nenhum dado é sobrescrito)
CREATE TABLE IF NOT EXISTS public.omics_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id       uuid NOT NULL REFERENCES public.omics_panels(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  source_file    text,
  note           text,
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (panel_id, version_number)
);

-- RLS
ALTER TABLE public.omics_panels     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omics_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omics_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omics_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omics_features   ENABLE ROW LEVEL SECURITY;

CREATE POLICY omics_panels_own   ON public.omics_panels   FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY omics_results_own  ON public.omics_results  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY omics_versions_own ON public.omics_versions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Catálogos: leitura para autenticados; escrita só via service_role.
CREATE POLICY omics_categories_read ON public.omics_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY omics_features_read   ON public.omics_features   FOR SELECT TO authenticated USING (true);

-- Índices (escalabilidade: leitura por categoria, histórico por feature)
CREATE INDEX IF NOT EXISTS omics_panels_user_domain_idx  ON public.omics_panels (user_id, domain, created_at DESC);
CREATE INDEX IF NOT EXISTS omics_panels_exam_idx         ON public.omics_panels (exam_id);
CREATE INDEX IF NOT EXISTS omics_results_hist_idx        ON public.omics_results (user_id, feature_id, measured_on DESC);
CREATE INDEX IF NOT EXISTS omics_results_panel_cat_idx   ON public.omics_results (panel_id, category_id);
CREATE INDEX IF NOT EXISTS omics_results_user_domain_idx ON public.omics_results (user_id, domain);
CREATE INDEX IF NOT EXISTS omics_features_domain_cat_idx ON public.omics_features (domain, category_id);
CREATE INDEX IF NOT EXISTS omics_features_name_idx       ON public.omics_features (lower(name));
CREATE INDEX IF NOT EXISTS omics_categories_domain_idx   ON public.omics_categories (domain, display_order);

-- Seed: categorias de metabolômica (primeira instância do modelo)
INSERT INTO public.omics_categories (domain, name, display_order) VALUES
  ('metabolomics','Aminoácidos',1),
  ('metabolomics','Lipídios',2),
  ('metabolomics','Energia Celular',3),
  ('metabolomics','Ácidos Graxos',4),
  ('metabolomics','Vitaminas',5),
  ('metabolomics','Cofatores',6),
  ('metabolomics','Estresse Oxidativo',7),
  ('metabolomics','Microbiota',8),
  ('metabolomics','Xenobióticos',9)
ON CONFLICT (domain, name) DO NOTHING;
