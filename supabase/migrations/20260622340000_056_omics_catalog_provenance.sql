-- 056 — Ômica Fase 2: Catálogo Científico e Proveniência (genérico)
--
-- PRIORIDADE ESTRATÉGICA: resolver identidade, catalogação e proveniência das
-- features ANTES de UI/OCR. Sem isto, "L-Leucine", "Leucine" e "HMDB0000687"
-- seriam tratados como entidades distintas e a comparação longitudinal entre
-- laboratórios ficaria comprometida.
--
-- Substitui o omics_features (Fase 1, vazio) por um catálogo normalizado:
--   omics_catalog              — entidade canônica (nome canônico, categoria,
--                                domínio, unidade, status de curadoria, versão)
--   omics_aliases              — sinônimos/nomes de laboratório (resolução)
--   omics_external_references  — proveniência (HMDB, KEGG, PubChem, UniProt,
--                                NCBI, Ensembl, ChEBI, LIPID MAPS)
--   omics_curation_log         — auditoria/versionamento da curadoria
--
-- A SINTERA apenas normaliza e organiza — não interpreta resultados.

ALTER TABLE public.omics_results DROP CONSTRAINT IF EXISTS omics_results_feature_id_fkey;
DROP TABLE IF EXISTS public.omics_features;

CREATE TABLE IF NOT EXISTS public.omics_catalog (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain          text NOT NULL CHECK (domain IN ('metabolomics','proteomics','microbiome','genetics','epigenetics','exposomics')),
  category_id     uuid REFERENCES public.omics_categories(id) ON DELETE SET NULL,
  canonical_name  text NOT NULL,
  description     text,
  unit_default    text,
  curation_status text NOT NULL DEFAULT 'draft' CHECK (curation_status IN ('draft','curated','verified','deprecated')),
  version         integer NOT NULL DEFAULT 1,
  source          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS omics_catalog_domain_name_uq ON public.omics_catalog (domain, lower(btrim(canonical_name)));
CREATE INDEX IF NOT EXISTS omics_catalog_domain_cat_idx ON public.omics_catalog (domain, category_id);

CREATE TABLE IF NOT EXISTS public.omics_aliases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id  uuid NOT NULL REFERENCES public.omics_catalog(id) ON DELETE CASCADE,
  domain      text NOT NULL,
  alias       text NOT NULL,
  alias_norm  text NOT NULL,
  source      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain, alias_norm)
);
CREATE INDEX IF NOT EXISTS omics_aliases_norm_idx ON public.omics_aliases (alias_norm);
CREATE INDEX IF NOT EXISTS omics_aliases_catalog_idx ON public.omics_aliases (catalog_id);

CREATE TABLE IF NOT EXISTS public.omics_external_references (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id  uuid NOT NULL REFERENCES public.omics_catalog(id) ON DELETE CASCADE,
  source      text NOT NULL CHECK (source IN ('hmdb','kegg','pubchem','uniprot','ncbi','ensembl','chebi','lipidmaps','other')),
  external_id text NOT NULL,
  url         text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS omics_extref_lookup_idx ON public.omics_external_references (source, lower(external_id));
CREATE INDEX IF NOT EXISTS omics_extref_catalog_idx ON public.omics_external_references (catalog_id);

CREATE TABLE IF NOT EXISTS public.omics_curation_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id    uuid NOT NULL REFERENCES public.omics_catalog(id) ON DELETE CASCADE,
  action        text NOT NULL,
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_before text,
  status_after  text,
  version       integer,
  curated_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS omics_curation_catalog_idx ON public.omics_curation_log (catalog_id, created_at DESC);

ALTER TABLE public.omics_results
  ADD CONSTRAINT omics_results_feature_catalog_fkey FOREIGN KEY (feature_id) REFERENCES public.omics_catalog(id) ON DELETE SET NULL;

ALTER TABLE public.omics_catalog              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omics_aliases              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omics_external_references  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omics_curation_log         ENABLE ROW LEVEL SECURITY;
CREATE POLICY omics_catalog_read  ON public.omics_catalog             FOR SELECT TO authenticated USING (true);
CREATE POLICY omics_aliases_read  ON public.omics_aliases             FOR SELECT TO authenticated USING (true);
CREATE POLICY omics_extref_read   ON public.omics_external_references FOR SELECT TO authenticated USING (true);
CREATE POLICY omics_curation_read ON public.omics_curation_log        FOR SELECT TO authenticated USING (true);

-- Resolução de identidade: termo (nome OU id externo) -> catalog_id canônico.
-- Prioridade: id externo > nome canônico > alias.
CREATE OR REPLACE FUNCTION public.omics_resolve_feature(p_domain text, p_term text)
RETURNS uuid LANGUAGE sql STABLE AS $$
  WITH t AS (SELECT lower(btrim(p_term)) AS term)
  SELECT id FROM (
    SELECT r.catalog_id AS id, 1 AS pri FROM public.omics_external_references r, t WHERE lower(r.external_id) = t.term
    UNION ALL
    SELECT c.id, 2 FROM public.omics_catalog c, t WHERE c.domain = p_domain AND lower(btrim(c.canonical_name)) = t.term
    UNION ALL
    SELECT a.catalog_id, 3 FROM public.omics_aliases a, t WHERE a.domain = p_domain AND a.alias_norm = t.term
  ) s ORDER BY pri LIMIT 1;
$$;

-- Seed de demonstração (metabolômica): catálogo + aliases + IDs externos + log.
INSERT INTO public.omics_catalog (domain, category_id, canonical_name, unit_default, curation_status, source)
SELECT 'metabolomics', cat.id, v.cname, 'µmol/L', 'curated', 'seed'
FROM (VALUES
  ('Alanina','Aminoácidos'), ('Leucina','Aminoácidos'), ('Valina','Aminoácidos'), ('Glicina','Aminoácidos'),
  ('Lactato','Energia Celular'), ('Piruvato','Energia Celular')
) v(cname, catname)
JOIN public.omics_categories cat ON cat.domain='metabolomics' AND cat.name = v.catname
ON CONFLICT (domain, lower(btrim(canonical_name))) DO NOTHING;

INSERT INTO public.omics_aliases (catalog_id, domain, alias, alias_norm, source)
SELECT c.id, 'metabolomics', v.alias, lower(btrim(v.alias)), 'seed'
FROM (VALUES
  ('Alanina','Alanine'), ('Alanina','L-Alanine'), ('Alanina','Ala'),
  ('Leucina','Leucine'), ('Leucina','L-Leucine'), ('Leucina','Leu'),
  ('Valina','Valine'), ('Valina','L-Valine'), ('Valina','Val'),
  ('Glicina','Glycine'), ('Glicina','Gly'),
  ('Lactato','Lactate'), ('Lactato','L-Lactate'), ('Lactato','Ácido láctico'),
  ('Piruvato','Pyruvate'), ('Piruvato','Ácido pirúvico')
) v(cname, alias)
JOIN public.omics_catalog c ON c.domain='metabolomics' AND c.canonical_name = v.cname
ON CONFLICT (domain, alias_norm) DO NOTHING;

INSERT INTO public.omics_external_references (catalog_id, source, external_id, url)
SELECT c.id, v.src, v.eid, v.url
FROM (VALUES
  ('Alanina','hmdb','HMDB0000161','https://hmdb.ca/metabolites/HMDB0000161'),
  ('Alanina','kegg','C00041','https://www.genome.jp/dbget-bin/www_bget?cpd:C00041'),
  ('Leucina','hmdb','HMDB0000687','https://hmdb.ca/metabolites/HMDB0000687'),
  ('Leucina','kegg','C00123','https://www.genome.jp/dbget-bin/www_bget?cpd:C00123'),
  ('Valina','hmdb','HMDB0000883','https://hmdb.ca/metabolites/HMDB0000883'),
  ('Valina','kegg','C00183','https://www.genome.jp/dbget-bin/www_bget?cpd:C00183'),
  ('Glicina','hmdb','HMDB0000123','https://hmdb.ca/metabolites/HMDB0000123'),
  ('Glicina','kegg','C00037','https://www.genome.jp/dbget-bin/www_bget?cpd:C00037'),
  ('Lactato','hmdb','HMDB0000190','https://hmdb.ca/metabolites/HMDB0000190'),
  ('Lactato','kegg','C00186','https://www.genome.jp/dbget-bin/www_bget?cpd:C00186'),
  ('Piruvato','hmdb','HMDB0000243','https://hmdb.ca/metabolites/HMDB0000243'),
  ('Piruvato','kegg','C00022','https://www.genome.jp/dbget-bin/www_bget?cpd:C00022')
) v(cname, src, eid, url)
JOIN public.omics_catalog c ON c.domain='metabolomics' AND c.canonical_name = v.cname
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO public.omics_curation_log (catalog_id, action, detail, status_after, version)
SELECT id, 'seed_created', jsonb_build_object('canonical_name', canonical_name), curation_status, version
FROM public.omics_catalog WHERE source='seed';
