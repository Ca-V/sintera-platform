// Smoke test do Loader CSV → RuleSet (mecanismo) — sem dependências/banco.
// Rode com: node src/lib/ai/insights/__smoke__/rules-loader.mjs
//
// Usa CSV SINTÉTICO (fictício, só neste teste). NÃO são regras clínicas reais.
// Mantenha a lógica em sincronia com rules-loader.ts.

// ── Lógica portada de rules-loader.ts ───────────────────────────────────
const CLINICAL_FLAGS = new Set(['atencao_imediata', 'acompanhar', 'normal'])
const PRIORITIES = new Set(['low', 'medium', 'high'])
const INSIGHT_TYPES = new Set(['biomarker', 'cluster', 'longitudinal', 'priority'])
const RANGE_STATUSES = new Set(['below', 'above', 'within', 'no_reference', 'non_numeric'])

function parseCsvRows(text) {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows = []
  let field = '', row = [], inQuotes = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') { if (clean[i + 1] === '"') { field += '"'; i++ } else inQuotes = false }
      else field += ch
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\r') { /* skip */ }
    else if (ch === '\n') { row.push(field); rows.push(row); field = ''; row = [] }
    else field += ch
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

function parseCondition(kind, params) {
  const k = kind.trim(), p = params.trim()
  if (k === 'always') return { kind: 'always' }
  if (k === 'rangeStatus') {
    const tokens = p.split('|').map(t => t.trim()).filter(Boolean)
    if (tokens.length === 0) return { error: 'rangeStatus sem status' }
    const bad = tokens.filter(t => !RANGE_STATUSES.has(t))
    if (bad.length) return { error: `rangeStatus inválido: ${bad.join(',')}` }
    return { kind: 'rangeStatus', status: tokens }
  }
  if (k === 'numericThreshold') {
    const m = /^(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/.exec(p)
    if (!m) return { error: `numericThreshold inválido: "${p}"` }
    return { kind: 'numericThreshold', op: m[1], value: Number(m[2]) }
  }
  return { error: `condition_kind desconhecido: "${k}"` }
}

function parseRulesetCsv(csvText) {
  const rows = parseCsvRows(csvText)
  const result = { ruleset: [], skipped: [], errors: [] }
  if (rows.length === 0) return result
  const header = rows[0].map(h => h.trim())
  const col = name => header.indexOf(name)
  const idx = {
    catalogCode: col('catalog_code'), conditionKind: col('condition_kind'),
    conditionParams: col('condition_params'), clinicalFlag: col('clinical_flag'),
    templateKey: col('template_key'), insightType: col('insight_type'),
    priority: col('priority'), approvedBy: col('approved_by'),
  }
  if (idx.catalogCode < 0) { result.errors.push({ line: 1, message: 'sem catalog_code' }); return result }
  const get = (r, i) => (i >= 0 && i < r.length ? r[i].trim() : '')
  for (let n = 1; n < rows.length; n++) {
    const r = rows[n], line = n + 1
    const catalogCode = get(r, idx.catalogCode)
    const clinicalFlag = get(r, idx.clinicalFlag)
    const templateKey = get(r, idx.templateKey)
    const approvedBy = get(r, idx.approvedBy)
    const hasFlag = clinicalFlag !== '', hasTemplate = templateKey !== '', hasSignature = approvedBy !== ''
    if (!hasFlag && !hasTemplate && !hasSignature) { result.skipped.push({ line, catalogCode, reason: 'pending' }); continue }
    if (!hasFlag || !hasTemplate || !hasSignature) { result.skipped.push({ line, catalogCode, reason: 'incomplete' }); continue }
    if (!CLINICAL_FLAGS.has(clinicalFlag)) { result.errors.push({ line, catalogCode, message: 'flag inválido' }); continue }
    const insightType = get(r, idx.insightType) || 'biomarker'
    if (!INSIGHT_TYPES.has(insightType)) { result.errors.push({ line, catalogCode, message: 'insight_type inválido' }); continue }
    const priority = get(r, idx.priority) || 'medium'
    if (!PRIORITIES.has(priority)) { result.errors.push({ line, catalogCode, message: 'priority inválido' }); continue }
    const cond = parseCondition(get(r, idx.conditionKind), get(r, idx.conditionParams))
    if (cond.error) { result.errors.push({ line, catalogCode, message: cond.error }); continue }
    result.ruleset.push({ catalogCode, when: cond, clinicalFlag, templateKey, insightType, priority })
  }
  return result
}

// ── Testes ─────────────────────────────────────────────────────────────
let failures = 0
const check = (label, cond) => { if (!cond) { failures++; console.log(`FAIL  ${label}`) } else console.log(`OK    ${label}`) }

const HEADER = 'catalog_code,display_name,category,specimen,canonical_unit,measure_kind,is_critical,condition_kind,condition_params,clinical_flag,template_key,insight_type,priority,clinical_rationale,approved_by,approved_at,notes'

// 1) CSV em branco (como o template real) → ruleset vazio, tudo pendente.
const blank = [
  HEADER,
  'CALCIO_IONICO,Cálcio iônico,funcao_renal_eletrolitos,sangue,mmol/L,absoluto,true,rangeStatus,below,,,biomarker,,,,,',
  'CALCIO_IONICO,Cálcio iônico,funcao_renal_eletrolitos,sangue,mmol/L,absoluto,true,rangeStatus,above,,,biomarker,,,,,',
  'RFG,Ritmo de filtração glomerular,funcao_renal_eletrolitos,sangue,"mL/min/1,73m2",absoluto,false,rangeStatus,below,,,biomarker,,,,,',
].join('\n')
const r1 = parseRulesetCsv(blank)
check('CSV em branco → 0 regras (SEGURANÇA)', r1.ruleset.length === 0)
check('CSV em branco → 3 linhas pendentes', r1.skipped.filter(s => s.reason === 'pending').length === 3)
check('CSV em branco → 0 erros', r1.errors.length === 0)
check('campo com vírgula entre aspas é parseado', parseCsvRows(blank)[3][4] === 'mL/min/1,73m2')

// 2) Linhas SINTÉTICAS aprovadas (fictícias) → viram regras.
const approved = [
  HEADER,
  'HEMOGLOBINA_SANGUE,Hemoglobina,hematologia_vermelha,sangue,g/dL,absoluto,true,rangeStatus,below,acompanhar,syn_hb_low_v1,biomarker,medium,racional fictício,Dra. Fulana CRM 0000,2026-06-15,',
  'GLICEMIA,Glicose,metabolismo_glicose,sangue,mg/dL,absoluto,true,numericThreshold,>=126,acompanhar,syn_glic_high_v1,biomarker,high,racional fictício,Dra. Fulana CRM 0000,2026-06-15,',
].join('\n')
const r2 = parseRulesetCsv(approved)
check('2 linhas aprovadas → 2 regras', r2.ruleset.length === 2)
check('regra rangeStatus parseada', r2.ruleset[0].when.kind === 'rangeStatus' && r2.ruleset[0].when.status[0] === 'below')
check('regra numericThreshold parseada', r2.ruleset[1].when.kind === 'numericThreshold' && r2.ruleset[1].when.value === 126)
check('priority preservada (high)', r2.ruleset[1].priority === 'high')

// 3) Linha incompleta (flag sem assinatura) → skipped incomplete, não vira regra.
const incomplete = [HEADER, 'TSH,TSH,funcao_tireoidiana,sangue,mUI/L,absoluto,false,rangeStatus,above,acompanhar,syn_tsh,biomarker,medium,,,'].join('\n')
const r3 = parseRulesetCsv(incomplete)
check('flag sem assinatura → incompleta, 0 regras', r3.ruleset.length === 0 && r3.skipped.some(s => s.reason === 'incomplete'))

// 4) clinical_flag inválido (assinado) → erro, não vira regra.
const badFlag = [HEADER, 'TSH,TSH,funcao_tireoidiana,sangue,mUI/L,absoluto,false,rangeStatus,above,URGENTE,syn_tsh,biomarker,medium,r,Dra. X,2026-06-15,'].join('\n')
const r4 = parseRulesetCsv(badFlag)
check('clinical_flag inválido → erro', r4.errors.length === 1 && r4.ruleset.length === 0)

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
