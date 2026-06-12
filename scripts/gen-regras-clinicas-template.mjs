// Gera o template CSV de regras clínicas a partir do catálogo real.
// Rode com: node scripts/gen-regras-clinicas-template.mjs > docs/clinical/regras-clinicas-template.csv
//
// Colunas marcadas (motor) mapeiam 1:1 para InsightRule em src/lib/ai/insights/engine.ts.
// As colunas de decisão (FILL) são preenchidas por responsável clínico.

// Catálogo real (biomarker_catalog), exportado em 2026-06-12. [code, nome, categoria, specimen, unidade, measure_kind, is_critical]
const CATALOG = [
  ['CALCIO_IONICO','Cálcio iônico','funcao_renal_eletrolitos','sangue','mmol/L','absoluto',true],
  ['CREATININA_SERICA','Creatinina','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',true],
  ['POTASSIO','Potássio','funcao_renal_eletrolitos','sangue','mEq/L','absoluto',true],
  ['SODIO','Sódio','funcao_renal_eletrolitos','sangue','mEq/L','absoluto',true],
  ['HEMOGLOBINA_SANGUE','Hemoglobina','hematologia_vermelha','sangue','g/dL','absoluto',true],
  ['GLICEMIA','Glicose (jejum)','metabolismo_glicose','sangue','mg/dL','absoluto',true],
  ['APO_A1','Apolipoproteína A1','cardiometabolico','sangue','mg/dL','absoluto',false],
  ['HDL','HDL colesterol','cardiometabolico','sangue','mg/dL','absoluto',false],
  ['TRIGLICERIDEOS','Triglicerídeos','cardiometabolico','sangue','mg/dL','absoluto',false],
  ['ATIVIDADE_PROTROMBINA','Atividade de protrombina','coagulacao','sangue','%','absoluto',false],
  ['RNI','RNI (INR)','coagulacao','sangue','','absoluto',false],
  ['TP_SEGUNDOS','Tempo de protrombina','coagulacao','sangue','segundos','absoluto',false],
  ['TTPA','TTPA','coagulacao','sangue','segundos','absoluto',false],
  ['ALBUMINA','Albumina','funcao_hepatica_proteinas','sangue','g/dL','absoluto',false],
  ['GLOBULINAS','Globulinas','funcao_hepatica_proteinas','sangue','g/dL','absoluto',false],
  ['PROTEINAS_TOTAIS','Proteínas totais','funcao_hepatica_proteinas','sangue','g/dL','absoluto',false],
  ['RELACAO_AG','Relação A/G','funcao_hepatica_proteinas','sangue','','absoluto',false],
  ['CLORETOS','Cloretos','funcao_renal_eletrolitos','sangue','mEq/L','absoluto',false],
  ['FOSFORO','Fósforo','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',false],
  ['MAGNESIO','Magnésio','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',false],
  ['RFG','Ritmo de filtração glomerular','funcao_renal_eletrolitos','sangue','mL/min/1,73m2','absoluto',false],
  ['UREIA','Ureia','funcao_renal_eletrolitos','sangue','mg/dL','absoluto',false],
  ['T4_LIVRE','T4 livre','funcao_tireoidiana','sangue','ng/dL','absoluto',false],
  ['TSH','TSH','funcao_tireoidiana','sangue','mUI/L','absoluto',false],
  ['BASOFILOS_ABS','Basófilos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['BASOFILOS_PCT','Basófilos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false],
  ['EOSINOFILOS_ABS','Eosinófilos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['EOSINOFILOS_PCT','Eosinófilos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false],
  ['LEUCOCITOS_TOTAIS','Leucócitos totais','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['LINFOCITOS_ABS','Linfócitos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['LINFOCITOS_PCT','Linfócitos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false],
  ['MONOCITOS_ABS','Monócitos','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['MONOCITOS_PCT','Monócitos (%)','hematologia_branca_plaquetas','sangue','%','percentual',false],
  ['NEUTROFILOS_BAST_ABS','Neutrófilos bastonetes','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['NEUTROFILOS_BAST_PCT','Neutrófilos bastonetes (%)','hematologia_branca_plaquetas','sangue','%','percentual',false],
  ['NEUTROFILOS_SEG_ABS','Neutrófilos segmentados','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['NEUTROFILOS_SEG_PCT','Neutrófilos segmentados (%)','hematologia_branca_plaquetas','sangue','%','percentual',false],
  ['PLAQUETAS','Plaquetas','hematologia_branca_plaquetas','sangue','/mm3','absoluto',false],
  ['CHCM','CHCM','hematologia_vermelha','sangue','g/dL','absoluto',false],
  ['HCM','HCM','hematologia_vermelha','sangue','pg','absoluto',false],
  ['HEMACIAS_SANGUE','Hemácias','hematologia_vermelha','sangue','/mm3','absoluto',false],
  ['HEMATOCRITO','Hematócrito','hematologia_vermelha','sangue','%','absoluto',false],
  ['RDW','RDW','hematologia_vermelha','sangue','%','absoluto',false],
  ['VCM','VCM','hematologia_vermelha','sangue','fL','absoluto',false],
  ['BHCG','Beta-HCG','hormonios_sexuais_reprodutivo','sangue','mUI/mL','absoluto',false],
  ['ESTRADIOL','Estradiol','hormonios_sexuais_reprodutivo','sangue','pg/mL','absoluto',false],
  ['FSH','FSH','hormonios_sexuais_reprodutivo','sangue','mUI/mL','absoluto',false],
  ['LH','LH','hormonios_sexuais_reprodutivo','sangue','mUI/mL','absoluto',false],
  ['PTH','Paratormônio (PTH)','hormonios_sexuais_reprodutivo','sangue','pg/mL','absoluto',false],
  ['PROGESTERONA','Progesterona','hormonios_sexuais_reprodutivo','sangue','ng/mL','absoluto',false],
  ['IGE_LATEX','IgE específico — látex (K82)','inflamacao_imunologia','sangue','kU/L','qualitativo',false],
  ['PCR','Proteína C reativa','inflamacao_imunologia','sangue','mg/dL','absoluto',false],
  ['FERRITINA','Ferritina','metabolismo_ferro','sangue','ng/mL','absoluto',false],
  ['FERRO_SERICO','Ferro sérico','metabolismo_ferro','sangue','ug/dL','absoluto',false],
  ['HBA1C','Hemoglobina glicada (HbA1c)','metabolismo_glicose','sangue','%','absoluto',false],
  ['INSULINA','Insulina','metabolismo_glicose','sangue','uUI/mL','absoluto',false],
  ['CALCIO_24H','Cálcio (urina 24h)','urina_24h','urina_24h','mg/24h','absoluto',false],
  ['CITRATO_24H','Citrato (urina 24h)','urina_24h','urina_24h','mg/24h','absoluto',false],
  ['POTASSIO_24H','Potássio (urina 24h)','urina_24h','urina_24h','mEq/24h','absoluto',false],
  ['SODIO_24H','Sódio (urina 24h)','urina_24h','urina_24h','mEq/24h','absoluto',false],
  ['EAS_ASPECTO','Aspecto da urina','urinalise_eas','urina','','qualitativo',false],
  ['EAS_BILIRRUBINA','Bilirrubina (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_CILINDROS_HIALINOS','Cilindros hialinos','urinalise_eas','urina','por campo','absoluto',false],
  ['EAS_CILINDROS_PATOLOGICOS','Cilindros patológicos','urinalise_eas','urina','','qualitativo',false],
  ['EAS_COR','Cor da urina','urinalise_eas','urina','','qualitativo',false],
  ['EAS_CETONAS','Corpos cetônicos (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_CRISTAIS','Cristais (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_DENSIDADE','Densidade urinária','urinalise_eas','urina','','absoluto',false],
  ['EAS_EPITELIOS_ALTAS','Epitélios vias altas','urinalise_eas','urina','por campo','absoluto',false],
  ['EAS_EPITELIOS_BAIXAS','Epitélios vias baixas','urinalise_eas','urina','por campo','absoluto',false],
  ['EAS_FLORA','Flora bacteriana (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_GLICOSE','Glicose (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_HEMACIAS_CAMPO','Hemácias (sedimento)','urinalise_eas','urina','por campo','absoluto',false],
  ['EAS_HEMOGLOBINA','Hemoglobina (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_LEUCO_ESTERASE','Leucócito esterase (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_MUCO','Muco (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_NITRITO','Nitrito (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_PH','pH urinário','urinalise_eas','urina','','absoluto',false],
  ['EAS_PIOCITOS','Piócitos (sedimento)','urinalise_eas','urina','por campo','absoluto',false],
  ['EAS_PROTEINA','Proteína (urina)','urinalise_eas','urina','','qualitativo',false],
  ['EAS_UROBILINOGENIO','Urobilinogênio (urina)','urinalise_eas','urina','mg/dL','qualitativo',false],
  ['VIT_B12','Vitamina B12','vitaminas_minerais','sangue','pg/mL','absoluto',false],
  ['VIT_D_25OH','Vitamina D (25-OH)','vitaminas_minerais','sangue','ng/mL','absoluto',false],
]

// Colunas. (motor) = consumida por InsightRule; (ref) = referência; (FILL) = preencher.
const HEADER = [
  'catalog_code',        // (motor) InsightRule.catalogCode — NÃO ALTERAR
  'display_name',        // (ref)
  'category',            // (ref)
  'specimen',            // (ref)
  'canonical_unit',      // (ref)
  'measure_kind',        // (ref)
  'is_critical',         // (ref)
  'condition_kind',      // (motor) when.kind: rangeStatus | numericThreshold | always
  'condition_params',    // (motor) when: p/ rangeStatus = below|above|within|no_reference; p/ numericThreshold = ">=126" etc.
  'clinical_flag',       // (motor/FILL) atencao_imediata | acompanhar | normal
  'template_key',        // (motor/FILL) ex.: hemoglobina_baixa_v1
  'insight_type',        // (motor/FILL) biomarker | cluster | longitudinal | priority
  'priority',            // (motor/FILL) low | medium | high
  'clinical_rationale',  // (FILL) justificativa clínica (governança)
  'approved_by',         // (FILL) responsável clínico
  'approved_at',         // (FILL) data ISO
  'notes',               // (ref/FILL) observações
]

function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
function row(cells) { return cells.map(csvCell).join(',') }

const lines = [row(HEADER)]

for (const [code, name, cat, specimen, unit, kind, critical] of CATALOG) {
  const base = [code, name, cat, specimen, unit, kind, critical]
  if (kind === 'qualitativo') {
    // Motor v1 não avalia value_text. Linha 'always' como ponto de partida + aviso.
    lines.push(row([...base, 'always', '', '', '', 'biomarker', '', '', '', '',
      'QUALITATIVO: motor v1 avalia apenas numérico; tratamento de value_text (ex.: Reagente/Positivo) a definir']))
  } else {
    // Numérico: duas linhas prontas (abaixo / acima da faixa impressa).
    lines.push(row([...base, 'rangeStatus', 'below', '', '', 'biomarker', '', '', '', '', '']))
    lines.push(row([...base, 'rangeStatus', 'above', '', '', 'biomarker', '', '', '', '', '']))
  }
}

process.stdout.write(lines.join('\n') + '\n')
