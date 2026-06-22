-- 059 — Ômica Fase 7: ativar os demais domínios usando as MESMAS tabelas.
-- Apenas semeia categorias (a infraestrutura já suporta os 6 domínios). A
-- curadoria fina das categorias/catálogo evolui depois (service_role).

INSERT INTO public.omics_categories (domain, name, display_order) VALUES
  ('proteomics','Enzimas',1),('proteomics','Proteínas de transporte',2),('proteomics','Proteínas imunológicas',3),
  ('proteomics','Proteínas de sinalização',4),('proteomics','Proteínas estruturais',5),('proteomics','Outras proteínas',6),
  ('microbiome','Filos',1),('microbiome','Gêneros',2),('microbiome','Espécies',3),('microbiome','Diversidade',4),('microbiome','Funcional',5),
  ('genetics','Variantes',1),('genetics','Genes',2),('genetics','Farmacogenômica',3),('genetics','Ancestralidade',4),
  ('epigenetics','Metilação de DNA',1),('epigenetics','Marcadores epigenéticos',2),
  ('exposomics','Metais',1),('exposomics','Pesticidas',2),('exposomics','Poluentes orgânicos',3),('exposomics','Plásticos',4),('exposomics','Outros xenobióticos',5)
ON CONFLICT (domain, name) DO NOTHING;
