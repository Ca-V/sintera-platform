-- PARTE A — Catálogo canônico de biomarcadores

CREATE TABLE IF NOT EXISTS biomarker_catalog (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE,
  display_name   text NOT NULL,
  category       text NOT NULL CHECK (category IN (
                   'hematologia_vermelha','hematologia_branca_plaquetas','coagulacao',
                   'metabolismo_ferro','metabolismo_glicose','funcao_tireoidiana',
                   'inflamacao_imunologia','funcao_hepatica_proteinas',
                   'funcao_renal_eletrolitos','urina_24h','vitaminas_minerais',
                   'hormonios_sexuais_reprodutivo','cardiometabolico','urinalise_eas')),
  specimen       text NOT NULL CHECK (specimen IN ('sangue','urina','urina_24h')),
  canonical_unit text,
  measure_kind   text NOT NULL DEFAULT 'absoluto'
                 CHECK (measure_kind IN ('absoluto','percentual','qualitativo')),
  is_critical    boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS biomarker_aliases (
  alias_normalized text NOT NULL,
  catalog_id       uuid NOT NULL REFERENCES biomarker_catalog(id) ON DELETE CASCADE,
  unit_pattern     text,
  PRIMARY KEY (alias_normalized, catalog_id)
);
CREATE INDEX IF NOT EXISTS biomarker_aliases_alias_idx ON biomarker_aliases (alias_normalized);

ALTER TABLE biomarkers ADD COLUMN IF NOT EXISTS catalog_id uuid
  REFERENCES biomarker_catalog(id);
CREATE INDEX IF NOT EXISTS biomarkers_catalog_idx ON biomarkers (catalog_id);

ALTER TABLE biomarker_catalog  ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_aliases  ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalog_read  ON biomarker_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY aliases_read  ON biomarker_aliases FOR SELECT TO authenticated USING (true);

INSERT INTO biomarker_catalog (code, display_name, category, specimen, canonical_unit, measure_kind, is_critical) VALUES
('HEMOGLOBINA_SANGUE','Hemoglobina','hematologia_vermelha','sangue','g/dL','absoluto',true),
('HEMATOCRITO','Hematócrito','hematologia_vermelha','sangue','%','absoluto',false),
('HEMACIAS_SANGUE','Hemácias','hematologia_vermelha','sangue','/mm3','absoluto',false),
('VCM','VCM','hematologia_vermelha','sangue','fL','absoluto',false),
('HCM','HCM','hematologia_vermelha','sangue','pg','absoluto',false),
('CHCM','CHCM','hematologia_vermelha','sangue','g/dL','absoluto',false),
('RDW','RDW','hematologia_vermelha','sangue','%','absoluto',false),
('LEUCOCITOS_TOTAIS','Leucócitos totais','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('NEUTROFILOS_SEG_PCT','Neutrófilos segmentados (%)','hematologia_branca_plaquetas','sangue','%','percentual',false),
('NEUTROFILOS_SEG_ABS','Neutrófilos segmentados','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('NEUTROFILOS_BAST_PCT','Neutrófilos bastonetes (%)','hematologia_branca_plaquetas','sangue','%','percentual',false),
('NEUTROFILOS_BAST_ABS','Neutrófilos bastonetes','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('LINFOCITOS_PCT','Linfócitos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false),
('LINFOCITOS_ABS','Linfócitos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('MONOCITOS_PCT','Monócitos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false),
('MONOCITOS_ABS','Monócitos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('EOSINOFILOS_PCT','Eosinófilos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false),
('EOSINOFILOS_ABS','Eosinófilos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('BASOFILOS_PCT','Basófilos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false),
('BASOFILOS_ABS','Basófilos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('PLAQUETAS','Plaquetas','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false),
('ATIVIDADE_PROTROMBINA','Atividade de protrombina','coagulacao','sangue','%','absoluto',false),
('TP_SEGUNDOS','Tempo de protrombina','coagulacao','sangue','segundos','absoluto',false),
('RNI','RNI (INR)','coagulacao','sangue',NULL,'absoluto',false),
('TTPA','TTPA','coagulacao','sangue','segundos','absoluto',false),
('FERRITINA','Ferritina','metabolismo_ferro','sangue','ng/mL','absoluto',false),
('FERRO_SERICO','Ferro sérico','metabolismo_ferro','sangue','ug/dL','absoluto',false),
('GLICEMIA','Glicose (jejum)','metabolismo_glicose','sangue','mg/dL','absoluto',true),
('HBA1C','Hemoglobina glicada (HbA1c)','metabolismo_glicose','sangue','%','absoluto',false),
('INSULINA','Insulina','metabolismo_glicose','sangue','uUI/mL','absoluto',false),
('TSH','TSH','funcao_tireoidiana','sangue','mUI/L','absoluto',false),
('T4_LIVRE','T4 livre','funcao_tireoidiana','sangue','ng/dL','absoluto',false),
('PCR','Proteína C reativa','inflamacao_imunologia','sangue','mg/dL','absoluto',false),
('IGE_LATEX','IgE específico — látex (K82)','inflamacao_imunologia','sangue','kU/L','qualitativo',false),
('ALBUMINA','Albumina','funcao_hepatica_proteinas','sangue','g/dL','absoluto',false),
('GLOBULINAS','Globulinas','funcao_hepatica_proteinas','sangue','g/dL','absoluto',false),
('PROTEINAS_TOTAIS','Proteínas totais','funcao_hepatica_proteinas','sangue','g/dL','absoluto',false),
('RELACAO_AG','Relação A/G','funcao_hepatica_proteinas','sangue',NULL,'absoluto',false),
('CREATININA_SERICA','Creatinina','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',true),
('UREIA','Ureia','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',false),
('RFG','Ritmo de filtração glomerular','funcao_renal_eletrolitos','sangue','mL/min/1,73m2','absoluto',false),
('SODIO','Sódio','funcao_renal_eletrolitos','sangue','mEq/L','absoluto',true),
('POTASSIO','Potássio','funcao_renal_eletrolitos','sangue','mEq/L','absoluto',true),
('CLORETOS','Cloretos','funcao_renal_eletrolitos','sangue','mEq/L','absoluto',false),
('CALCIO_IONICO','Cálcio iônico','funcao_renal_eletrolitos','sangue','mmol/L','absoluto',true),
('FOSFORO','Fósforo','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',false),
('MAGNESIO','Magnésio','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',false),
('CALCIO_24H','Cálcio (urina 24h)','urina_24h','urina_24h','mg/24h','absoluto',false),
('SODIO_24H','Sódio (urina 24h)','urina_24h','urina_24h','mEq/24h','absoluto',false),
('POTASSIO_24H','Potássio (urina 24h)','urina_24h','urina_24h','mEq/24h','absoluto',false),
('CITRATO_24H','Citrato (urina 24h)','urina_24h','urina_24h','mg/24h','absoluto',false),
('VIT_D_25OH','Vitamina D (25-OH)','vitaminas_minerais','sangue','ng/mL','absoluto',false),
('VIT_B12','Vitamina B12','vitaminas_minerais','sangue','pg/mL','absoluto',false),
('ESTRADIOL','Estradiol','hormonios_sexuais_reprodutivo','sangue','pg/mL','absoluto',false),
('PROGESTERONA','Progesterona','hormonios_sexuais_reprodutivo','sangue','ng/mL','absoluto',false),
('FSH','FSH','hormonios_sexuais_reprodutivo','sangue','mUI/mL','absoluto',false),
('LH','LH','hormonios_sexuais_reprodutivo','sangue','mUI/mL','absoluto',false),
('BHCG','Beta-HCG','hormonios_sexuais_reprodutivo','sangue','mUI/mL','absoluto',false),
('PTH','Paratormônio (PTH)','hormonios_sexuais_reprodutivo','sangue','pg/mL','absoluto',false),
('HDL','HDL colesterol','cardiometabolico','sangue','mg/dL','absoluto',false),
('TRIGLICERIDEOS','Triglicerídeos','cardiometabolico','sangue','mg/dL','absoluto',false),
('APO_A1','Apolipoproteína A1','cardiometabolico','sangue','mg/dL','absoluto',false),
('EAS_COR','Cor da urina','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_ASPECTO','Aspecto da urina','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_DENSIDADE','Densidade urinária','urinalise_eas','urina',NULL,'absoluto',false),
('EAS_PH','pH urinário','urinalise_eas','urina',NULL,'absoluto',false),
('EAS_PROTEINA','Proteína (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_GLICOSE','Glicose (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_HEMOGLOBINA','Hemoglobina (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_BILIRRUBINA','Bilirrubina (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_CETONAS','Corpos cetônicos (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_UROBILINOGENIO','Urobilinogênio (urina)','urinalise_eas','urina','mg/dL','qualitativo',false),
('EAS_NITRITO','Nitrito (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_LEUCO_ESTERASE','Leucócito esterase (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_HEMACIAS_CAMPO','Hemácias (sedimento)','urinalise_eas','urina','por campo','absoluto',false),
('EAS_PIOCITOS','Piócitos (sedimento)','urinalise_eas','urina','por campo','absoluto',false),
('EAS_CILINDROS_HIALINOS','Cilindros hialinos','urinalise_eas','urina','por campo','absoluto',false),
('EAS_CILINDROS_PATOLOGICOS','Cilindros patológicos','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_CRISTAIS','Cristais (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_EPITELIOS_ALTAS','Epitélios vias altas','urinalise_eas','urina','por campo','absoluto',false),
('EAS_EPITELIOS_BAIXAS','Epitélios vias baixas','urinalise_eas','urina','por campo','absoluto',false),
('EAS_FLORA','Flora bacteriana (urina)','urinalise_eas','urina',NULL,'qualitativo',false),
('EAS_MUCO','Muco (urina)','urinalise_eas','urina',NULL,'qualitativo',false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO biomarker_aliases (alias_normalized, catalog_id, unit_pattern)
SELECT a.alias, c.id, a.unit_pattern
FROM (VALUES
  ('hemoglobina',            'HEMOGLOBINA_SANGUE', 'g/d'),
  ('hemoglobina',            'EAS_HEMOGLOBINA',    NULL),
  ('hemacias',               'HEMACIAS_SANGUE',    '/mm3'),
  ('hemacias',               'EAS_HEMACIAS_CAMPO', 'por campo'),
  ('hemacias (urina)',       'EAS_HEMACIAS_CAMPO', NULL),
  ('glicose',                'EAS_GLICOSE',        NULL),
  ('glicemia',               'GLICEMIA',           NULL),
  ('glicose - jejum',        'GLICEMIA',           NULL),
  ('creatinina',             'CREATININA_SERICA',  NULL),
  ('bilirrubina',            'EAS_BILIRRUBINA',    NULL),
  ('hematocrito','HEMATOCRITO',NULL),('vcm','VCM',NULL),('hcm','HCM',NULL),
  ('chcm','CHCM',NULL),('rdw','RDW',NULL),
  ('leucocitos',             'LEUCOCITOS_TOTAIS','/mm3'),
  ('leucocitos - global',    'LEUCOCITOS_TOTAIS',NULL),
  ('neutrofilos segmentados','NEUTROFILOS_SEG_PCT','%'),
  ('neutrofilos segmentados','NEUTROFILOS_SEG_ABS','/mm3'),
  ('neutrofilos segmentados (absoluto)','NEUTROFILOS_SEG_ABS',NULL),
  ('neutrofilos bastonetes', 'NEUTROFILOS_BAST_PCT','%'),
  ('neutrofilos bastonetes', 'NEUTROFILOS_BAST_ABS','/mm3'),
  ('neutrofilos bastonetes (absoluto)','NEUTROFILOS_BAST_ABS',NULL),
  ('linfocitos','LINFOCITOS_PCT','%'),('linfocitos','LINFOCITOS_ABS','/mm3'),
  ('linfocitos (absoluto)','LINFOCITOS_ABS',NULL),
  ('monocitos','MONOCITOS_PCT','%'),('monocitos','MONOCITOS_ABS','/mm3'),
  ('monocitos (absoluto)','MONOCITOS_ABS',NULL),
  ('eosinofilos','EOSINOFILOS_PCT','%'),('eosinofilos','EOSINOFILOS_ABS','/mm3'),
  ('eosinofilos (absoluto)','EOSINOFILOS_ABS',NULL),
  ('basofilos','BASOFILOS_PCT','%'),('basofilos','BASOFILOS_ABS','/mm3'),
  ('basofilos (absoluto)','BASOFILOS_ABS',NULL),
  ('plaquetas','PLAQUETAS',NULL),
  ('atividade protrombina','ATIVIDADE_PROTROMBINA',NULL),
  ('tempo atividade protrombina','TP_SEGUNDOS',NULL),
  ('r.n.i.','RNI',NULL),
  ('tempo de tromboplastina parcial ativado','TTPA',NULL),
  ('ferritina','FERRITINA',NULL),('ferro serico','FERRO_SERICO',NULL),
  ('hba1c','HBA1C',NULL),('insulina','INSULINA',NULL),
  ('tsh','TSH',NULL),('tsh ultra sensivel','TSH',NULL),('t4 livre','T4_LIVRE',NULL),
  ('pcr','PCR',NULL),('ige especifico para latex (k82)','IGE_LATEX',NULL),
  ('albumina','ALBUMINA',NULL),('globulinas','GLOBULINAS',NULL),
  ('proteinas totais','PROTEINAS_TOTAIS',NULL),('relacao a/g','RELACAO_AG',NULL),
  ('ureia','UREIA',NULL),
  ('ritmo de filtracao glomerular','RFG',NULL),
  ('sodio','SODIO',NULL),('potassio','POTASSIO',NULL),('cloretos','CLORETOS',NULL),
  ('calcio ionico','CALCIO_IONICO',NULL),('fosforo','FOSFORO',NULL),('magnesio','MAGNESIO',NULL),
  ('calcio (24 horas)','CALCIO_24H',NULL),('sodio (24 horas)','SODIO_24H',NULL),
  ('potassio (24 horas)','POTASSIO_24H',NULL),('acido citrico - citrato','CITRATO_24H',NULL),
  ('vitamina d','VIT_D_25OH',NULL),('25-hidroxivitamina d','VIT_D_25OH',NULL),
  ('b12','VIT_B12',NULL),
  ('estradiol','ESTRADIOL',NULL),('progesterona','PROGESTERONA',NULL),
  ('fsh','FSH',NULL),('lh','LH',NULL),
  ('beta-hcg','BHCG',NULL),('h.c.g., beta total','BHCG',NULL),
  ('paratormonio pth intacto (molecula inteira)','PTH',NULL),
  ('hdl','HDL',NULL),('triglicerideos','TRIGLICERIDEOS',NULL),
  ('apolipoproteina a1','APO_A1',NULL),
  ('cor','EAS_COR',NULL),('cor da urina','EAS_COR',NULL),
  ('aspecto','EAS_ASPECTO',NULL),('densidade','EAS_DENSIDADE',NULL),
  ('reacao (ph)','EAS_PH',NULL),
  ('proteina','EAS_PROTEINA',NULL),('proteina (urina)','EAS_PROTEINA',NULL),
  ('proteina na urina','EAS_PROTEINA',NULL),
  ('corpos cetonicos','EAS_CETONAS',NULL),
  ('urobilinogenio','EAS_UROBILINOGENIO',NULL),
  ('nitrito','EAS_NITRITO',NULL),('nitrito na urina','EAS_NITRITO',NULL),
  ('leucocito esterase','EAS_LEUCO_ESTERASE',NULL),
  ('piocitos','EAS_PIOCITOS',NULL),
  ('cilindros hialinos','EAS_CILINDROS_HIALINOS',NULL),
  ('cilindros patologicos','EAS_CILINDROS_PATOLOGICOS',NULL),
  ('cristais','EAS_CRISTAIS',NULL),
  ('epitelios vias altas','EAS_EPITELIOS_ALTAS',NULL),
  ('epitelios vias baixas','EAS_EPITELIOS_BAIXAS',NULL),
  ('flora bacteriana','EAS_FLORA',NULL),('muco','EAS_MUCO',NULL)
) AS a(alias, code, unit_pattern)
JOIN biomarker_catalog c ON c.code = a.code
ON CONFLICT DO NOTHING;

UPDATE biomarkers b
SET catalog_id = sub.catalog_id
FROM (
  SELECT DISTINCT ON (b2.id) b2.id AS bid, al.catalog_id
  FROM biomarkers b2
  JOIN biomarker_aliases al
    ON al.alias_normalized = lower(trim(translate(b2.name,
       'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
       'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')))
  WHERE al.unit_pattern IS NULL
     OR (b2.unit IS NOT NULL AND lower(b2.unit) LIKE '%' || lower(al.unit_pattern) || '%')
  ORDER BY b2.id, (al.unit_pattern IS NOT NULL) DESC
) sub
WHERE b.id = sub.bid AND b.catalog_id IS NULL;

-- PARTE B — Motor de insights

ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS insight_type text
  CHECK (insight_type IN ('biomarker','cluster','longitudinal','priority'));
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS biomarker_ids uuid[];
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS clinical_flag text
  CHECK (clinical_flag IN ('atencao_imediata','acompanhar','normal'));
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS template_key text;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS extraction_confidence numeric
  CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1);
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS clinical_confidence numeric
  CHECK (clinical_confidence >= 0 AND clinical_confidence <= 1);
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS generation_confidence numeric
  CHECK (generation_confidence >= 0 AND generation_confidence <= 1);
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS confidence_band text
  CHECK (confidence_band IN ('alta','media','baixa'));

CREATE INDEX IF NOT EXISTS ai_insights_exam_type_idx ON ai_insights (exam_id, insight_type);
CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_exam_hash_uidx
  ON ai_insights (exam_id, content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_insights_template_key_idx ON ai_insights (template_key);

CREATE TABLE IF NOT EXISTS insight_feedback (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id   uuid NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating       text NOT NULL CHECK (rating IN ('util','nao_util')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (insight_id, user_id)
);
CREATE INDEX IF NOT EXISTS insight_feedback_template_idx ON insight_feedback (template_key, rating);
ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY insight_feedback_select ON insight_feedback
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY insight_feedback_insert ON insight_feedback
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY insight_feedback_update ON insight_feedback
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
             WITH CHECK ((SELECT auth.uid()) = user_id);

INSERT INTO ai_provider_config (provider, model, operation, is_active, max_tokens, temperature)
VALUES
  ('anthropic','claude-sonnet-4-6','narrative',true,2048,0.3),
  ('anthropic','claude-haiku-4-5-20251001','qa',true,512,0.0)
ON CONFLICT DO NOTHING;
