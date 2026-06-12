// Smoke test executável ponta-a-ponta do Resolver — sem dependências.
// Rode com: node src/lib/ai/insights/__smoke__/resolver.e2e.mjs
//
// Embute o índice REAL de apelidos (biomarker_aliases, 99 linhas) e os 118
// pares (nome, unidade) DISTINTOS que existem em produção, com o catalog_code
// que a migração 022/022b já resolveu (100% dos 133 biomarcadores). Roda a
// mesma lógica de resolver.ts e confirma que cada par resolve para o código
// esperado — incluindo as desambiguações por unidade (PCT vs ABS, sangue vs urina).
//
// Mantenha a lógica abaixo em sincronia com resolver.ts.

// ── Lógica portada de resolver.ts ─────────────────────────────────────────────
const ACCENT_FROM = 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç'
const ACCENT_TO   = 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
const ACCENT_MAP = {}
for (let i = 0; i < ACCENT_FROM.length; i++) ACCENT_MAP[ACCENT_FROM[i]] = ACCENT_TO[i]

function normalize(name) {
  let out = ''
  for (const ch of name) out += ACCENT_MAP[ch] ?? ch
  return out.toLowerCase().trim()
}

function pickBestAlias(candidates, unit) {
  const unitLower = unit ? unit.toLowerCase() : null
  const eligible = candidates.filter(a => {
    if (a.unitPattern === null) return true
    if (unitLower === null) return false
    return unitLower.includes(a.unitPattern.toLowerCase())
  })
  if (eligible.length === 0) return null
  eligible.sort((a, b) => {
    const ap = a.unitPattern !== null, bp = b.unitPattern !== null
    if (ap !== bp) return ap ? -1 : 1
    return (b.unitPattern?.length ?? 0) - (a.unitPattern?.length ?? 0)
  })
  return eligible[0]
}

function resolve(aliasesByName, name, unit) {
  const cands = aliasesByName.get(normalize(name)) ?? []
  const best = pickBestAlias(cands, unit)
  return best ? best.code : null
}

// ── Índice real de apelidos (alias_normalized, unit_pattern, code) ────────────
const ALIASES = [
  ['25-hidroxivitamina d',null,'VIT_D_25OH'],['acido citrico - citrato',null,'CITRATO_24H'],
  ['albumina',null,'ALBUMINA'],['apolipoproteina a1',null,'APO_A1'],['aspecto',null,'EAS_ASPECTO'],
  ['atividade protrombina',null,'ATIVIDADE_PROTROMBINA'],['b12',null,'VIT_B12'],
  ['basofilos','%','BASOFILOS_PCT'],['basofilos','/mm3','BASOFILOS_ABS'],
  ['basofilos (absoluto)',null,'BASOFILOS_ABS'],['beta-hcg',null,'BHCG'],['bilirrubina',null,'EAS_BILIRRUBINA'],
  ['calcio (24 horas)',null,'CALCIO_24H'],['calcio ionico',null,'CALCIO_IONICO'],['chcm',null,'CHCM'],
  ['cilindros hialinos',null,'EAS_CILINDROS_HIALINOS'],['cilindros patologicos',null,'EAS_CILINDROS_PATOLOGICOS'],
  ['cloretos',null,'CLORETOS'],['cor',null,'EAS_COR'],['cor da urina',null,'EAS_COR'],
  ['corpos cetonicos',null,'EAS_CETONAS'],['creatinina',null,'CREATININA_SERICA'],['cristais',null,'EAS_CRISTAIS'],
  ['densidade',null,'EAS_DENSIDADE'],['eosinofilos','/mm3','EOSINOFILOS_ABS'],['eosinofilos','%','EOSINOFILOS_PCT'],
  ['eosinofilos (absoluto)',null,'EOSINOFILOS_ABS'],['epitelios vias altas',null,'EAS_EPITELIOS_ALTAS'],
  ['epitelios vias baixas',null,'EAS_EPITELIOS_BAIXAS'],['estradiol',null,'ESTRADIOL'],['ferritina',null,'FERRITINA'],
  ['ferro serico',null,'FERRO_SERICO'],['flora bacteriana',null,'EAS_FLORA'],['fosforo',null,'FOSFORO'],
  ['fsh',null,'FSH'],['glicemia',null,'GLICEMIA'],['glicose',null,'EAS_GLICOSE'],['glicose - jejum',null,'GLICEMIA'],
  ['globulinas',null,'GLOBULINAS'],['h.c.g., beta total',null,'BHCG'],['hba1c',null,'HBA1C'],['hcm',null,'HCM'],
  ['hdl',null,'HDL'],['hemacias','/mm3','HEMACIAS_SANGUE'],['hemacias','por campo','EAS_HEMACIAS_CAMPO'],
  ['hemacias (urina)',null,'EAS_HEMACIAS_CAMPO'],['hematocrito',null,'HEMATOCRITO'],
  ['hemoglobina',null,'EAS_HEMOGLOBINA'],['hemoglobina','g/d','HEMOGLOBINA_SANGUE'],
  ['ige especifico para latex (k82)',null,'IGE_LATEX'],['insulina',null,'INSULINA'],
  ['leucocito esterase',null,'EAS_LEUCO_ESTERASE'],['leucocitos','/mm3','LEUCOCITOS_TOTAIS'],
  ['leucocitos - global',null,'LEUCOCITOS_TOTAIS'],['lh',null,'LH'],['linfocitos','/mm3','LINFOCITOS_ABS'],
  ['linfocitos','%','LINFOCITOS_PCT'],['linfocitos (absoluto)',null,'LINFOCITOS_ABS'],['magnesio',null,'MAGNESIO'],
  ['monocitos','/mm3','MONOCITOS_ABS'],['monocitos','%','MONOCITOS_PCT'],['monocitos (absoluto)',null,'MONOCITOS_ABS'],
  ['muco',null,'EAS_MUCO'],['neutrofilos bastonetes','/mm3','NEUTROFILOS_BAST_ABS'],
  ['neutrofilos bastonetes','%','NEUTROFILOS_BAST_PCT'],['neutrofilos bastonetes (absoluto)',null,'NEUTROFILOS_BAST_ABS'],
  ['neutrofilos segmentados','/mm3','NEUTROFILOS_SEG_ABS'],['neutrofilos segmentados','%','NEUTROFILOS_SEG_PCT'],
  ['neutrofilos segmentados (absoluto)',null,'NEUTROFILOS_SEG_ABS'],['nitrito',null,'EAS_NITRITO'],
  ['nitrito na urina',null,'EAS_NITRITO'],['paratormonio pth intacto (molecula inteira)',null,'PTH'],
  ['pcr',null,'PCR'],['piocitos',null,'EAS_PIOCITOS'],['plaquetas',null,'PLAQUETAS'],['potassio',null,'POTASSIO'],
  ['potassio (24 horas)',null,'POTASSIO_24H'],['progesterona',null,'PROGESTERONA'],['proteina',null,'EAS_PROTEINA'],
  ['proteina (urina)',null,'EAS_PROTEINA'],['proteina na urina',null,'EAS_PROTEINA'],
  ['proteinas totais',null,'PROTEINAS_TOTAIS'],['r.n.i.',null,'RNI'],['rdw',null,'RDW'],['reacao (ph)',null,'EAS_PH'],
  ['relacao a/g',null,'RELACAO_AG'],['ritmo de filtracao glomerular',null,'RFG'],['sodio',null,'SODIO'],
  ['sodio (24 horas)',null,'SODIO_24H'],['t4 livre',null,'T4_LIVRE'],['tempo atividade protrombina',null,'TP_SEGUNDOS'],
  ['tempo de tromboplastina parcial ativado',null,'TTPA'],['triglicerideos',null,'TRIGLICERIDEOS'],
  ['tsh',null,'TSH'],['tsh ultra sensivel',null,'TSH'],['ureia',null,'UREIA'],['urobilinogenio',null,'EAS_UROBILINOGENIO'],
  ['vcm',null,'VCM'],['vitamina d',null,'VIT_D_25OH'],
]

const aliasesByName = new Map()
for (const [alias, unitPattern, code] of ALIASES) {
  const e = { unitPattern, code }
  const l = aliasesByName.get(alias)
  if (l) l.push(e); else aliasesByName.set(alias, [e])
}

// ── Casos reais: [nome no laudo, unidade, catalog_code esperado] ──────────────
const CASES = [
  ['25-HIDROXIVITAMINA D','ng/mL','VIT_D_25OH'],['ÁCIDO CÍTRICO - CITRATO','mg/24 h','CITRATO_24H'],
  ['Albumina','g/dL','ALBUMINA'],['Apolipoproteína A1','mg/dL','APO_A1'],['ASPECTO',null,'EAS_ASPECTO'],
  ['Atividade Protrombina','%','ATIVIDADE_PROTROMBINA'],['B12','pg/mL','VIT_B12'],
  ['Basofilos','/mm3','BASOFILOS_ABS'],['Basófilos','%','BASOFILOS_PCT'],['Basófilos (absoluto)','/mm3','BASOFILOS_ABS'],
  ['Beta-HCG',null,'BHCG'],['BILIRRUBINA',null,'EAS_BILIRRUBINA'],['CÁLCIO (24 HORAS)','mg/24 h','CALCIO_24H'],
  ['CÁLCIO IÔNICO','mmol/L','CALCIO_IONICO'],['CHCM','g/dl','CHCM'],['CHCM','g/dL','CHCM'],
  ['Cilindros Hialinos','por campo','EAS_CILINDROS_HIALINOS'],['CILINDROS HIALINOS','por campo','EAS_CILINDROS_HIALINOS'],
  ['CILINDROS PATOLÓGICOS',null,'EAS_CILINDROS_PATOLOGICOS'],['CLORETOS','mEq/L','CLORETOS'],
  ['COR',null,'EAS_COR'],['Cor da urina',null,'EAS_COR'],['Cor da Urina',null,'EAS_COR'],
  ['CORPOS CETÔNICOS',null,'EAS_CETONAS'],['Creatinina','mg/dL','CREATININA_SERICA'],['CREATININA','mg/dL','CREATININA_SERICA'],
  ['CRISTAIS',null,'EAS_CRISTAIS'],['Densidade',null,'EAS_DENSIDADE'],['DENSIDADE',null,'EAS_DENSIDADE'],
  ['Eosinofilos','/mm3','EOSINOFILOS_ABS'],['Eosinófilos','%','EOSINOFILOS_PCT'],['Eosinófilos (absoluto)','/mm3','EOSINOFILOS_ABS'],
  ['Epitelios Vias Altas','por campo','EAS_EPITELIOS_ALTAS'],['EPITELIOS VIAS ALTAS','por campo','EAS_EPITELIOS_ALTAS'],
  ['Epitelios Vias Baixas','por campo','EAS_EPITELIOS_BAIXAS'],['EPITELIOS VIAS BAIXAS','por campo','EAS_EPITELIOS_BAIXAS'],
  ['Estradiol','pg/mL','ESTRADIOL'],['Ferritina','ng/mL','FERRITINA'],['Ferro sérico','ug/dL','FERRO_SERICO'],
  ['FLORA BACTERIANA',null,'EAS_FLORA'],['FÓSFORO','mg/dL','FOSFORO'],['FSH','mUI/mL','FSH'],
  ['Glicemia','mg/dL','GLICEMIA'],['GLICOSE',null,'EAS_GLICOSE'],['Glicose - Jejum','mg/dL','GLICEMIA'],
  ['Globulinas','g/dL','GLOBULINAS'],['H.C.G., Beta Total','mUI/mL','BHCG'],['HbA1c','%','HBA1C'],
  ['HCM','pg','HCM'],['HDL','mg/dL','HDL'],['Hemacias','/mm3','HEMACIAS_SANGUE'],['Hemácias','/mm3','HEMACIAS_SANGUE'],
  ['Hemácias','por campo','EAS_HEMACIAS_CAMPO'],['HEMÁCIAS','por campo','EAS_HEMACIAS_CAMPO'],['Hemácias (Urina)',null,'EAS_HEMACIAS_CAMPO'],
  ['Hematocrito','%','HEMATOCRITO'],['Hematócrito','%','HEMATOCRITO'],['Hemoglobina','g/dl','HEMOGLOBINA_SANGUE'],
  ['Hemoglobina','g/dL','HEMOGLOBINA_SANGUE'],['HEMOGLOBINA',null,'EAS_HEMOGLOBINA'],
  ['IgE Específico para Látex (K82)','kU/L','IGE_LATEX'],['Insulina','uUI/mL','INSULINA'],
  ['LEUCÓCITO ESTERASE',null,'EAS_LEUCO_ESTERASE'],['Leucócitos','/mm3','LEUCOCITOS_TOTAIS'],
  ['Leucocitos - Global','/mm3','LEUCOCITOS_TOTAIS'],['Leucócitos - Global','/mm3','LEUCOCITOS_TOTAIS'],
  ['LH','mUI/mL','LH'],['Linfocitos','/mm3','LINFOCITOS_ABS'],['Linfócitos','%','LINFOCITOS_PCT'],
  ['Linfócitos (absoluto)','/mm3','LINFOCITOS_ABS'],['MAGNÉSIO','mg/dL','MAGNESIO'],['Monocitos','/mm3','MONOCITOS_ABS'],
  ['Monócitos','%','MONOCITOS_PCT'],['Monócitos (absoluto)','/mm3','MONOCITOS_ABS'],['MUCO',null,'EAS_MUCO'],
  ['Neutrofilos Bastonetes','/mm3','NEUTROFILOS_BAST_ABS'],['Neutrófilos Bastonetes','%','NEUTROFILOS_BAST_PCT'],
  ['Neutrófilos Bastonetes (absoluto)','/mm3','NEUTROFILOS_BAST_ABS'],['Neutrofilos Segmentados','/mm3','NEUTROFILOS_SEG_ABS'],
  ['Neutrófilos Segmentados','%','NEUTROFILOS_SEG_PCT'],['Neutrófilos Segmentados (absoluto)','/mm3','NEUTROFILOS_SEG_ABS'],
  ['NITRITO',null,'EAS_NITRITO'],['Nitrito na Urina',null,'EAS_NITRITO'],
  ['PARATORMÔNIO PTH INTACTO (MOLÉCULA INTEIRA)','pg/mL','PTH'],['PCR','mg/dL','PCR'],
  ['Piócitos','por campo','EAS_PIOCITOS'],['PIÓCITOS','por campo','EAS_PIOCITOS'],['Plaquetas','/mm3','PLAQUETAS'],
  ['POTÁSSIO','mEq/L','POTASSIO'],['POTÁSSIO (24 HORAS)','mEq/24 horas','POTASSIO_24H'],['Progesterona','ng/mL','PROGESTERONA'],
  ['PROTEÍNA',null,'EAS_PROTEINA'],['Proteína (Urina)',null,'EAS_PROTEINA'],['Proteína na urina',null,'EAS_PROTEINA'],
  ['Proteína na Urina',null,'EAS_PROTEINA'],['Proteínas Totais','g/dL','PROTEINAS_TOTAIS'],['R.N.I.',null,'RNI'],
  ['RDW','%','RDW'],['Reação (pH)',null,'EAS_PH'],['REAÇÃO (PH)',null,'EAS_PH'],['Relação A/G',null,'RELACAO_AG'],
  ['Ritmo de Filtração Glomerular','mL/min/1,73 m2','RFG'],['RITMO DE FILTRAÇÃO GLOMERULAR',null,'RFG'],
  ['SÓDIO','mEq/L','SODIO'],['SÓDIO (24 HORAS)','mEq/24 horas','SODIO_24H'],['T4 Livre','ng/dL','T4_LIVRE'],
  ['Tempo Atividade Protrombina','segundos','TP_SEGUNDOS'],['Tempo de Tromboplastina Parcial Ativado','segundos','TTPA'],
  ['Triglicerídeos','mg/dL','TRIGLICERIDEOS'],['TSH','mIU/L','TSH'],['TSH Ultra Sensível','microUI/mL','TSH'],
  ['Ureia','mg/dL','UREIA'],['UREIA','mg/dL','UREIA'],['Urobilinogênio','mg/dL','EAS_UROBILINOGENIO'],
  ['UROBILINOGÊNIO','mg/dL','EAS_UROBILINOGENIO'],['VCM','fl','VCM'],['VCM','fL','VCM'],['Vitamina D','ng/mL','VIT_D_25OH'],
]

let failures = 0
for (const [name, unit, expected] of CASES) {
  const got = resolve(aliasesByName, name, unit)
  if (got !== expected) {
    failures++
    console.log(`FAIL  "${name}" [${unit ?? 'sem unidade'}] -> ${got}  (esperado: ${expected})`)
  }
}

console.log(`${CASES.length - failures}/${CASES.length} pares resolvidos corretamente`)
if (failures > 0) { console.error(`${failures} falha(s)`); process.exit(1) }
console.log('Resolver bate 100% com o catalog_id de produção.')
