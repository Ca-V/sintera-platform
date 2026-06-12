// Smoke test executável do Motor Determinístico (mecanismo) — sem dependências.
// Rode com: node src/lib/ai/insights/__smoke__/engine.eval.mjs
//
// Usa regras SINTÉTICAS (fictícias, só neste teste) para provar que o mecanismo
// de avaliação funciona. NÃO são regras clínicas reais. Mantenha a lógica em
// sincronia com engine.ts.

// ── Lógica portada de engine.ts ───────────────────────────────────────────────
function matchesCondition(b, cond) {
  switch (cond.kind) {
    case 'always': return true
    case 'rangeStatus': return cond.status.includes(b.rangeStatus)
    case 'numericThreshold':
      if (b.value === null) return false
      if (cond.op === '<')  return b.value <  cond.value
      if (cond.op === '<=') return b.value <= cond.value
      if (cond.op === '>')  return b.value >  cond.value
      if (cond.op === '>=') return b.value >= cond.value
      return false
  }
}

function evaluateRules(context, ruleset) {
  if (ruleset.length === 0) return []
  const byCode = new Map()
  for (const r of ruleset) {
    const l = byCode.get(r.catalogCode)
    if (l) l.push(r); else byCode.set(r.catalogCode, [r])
  }
  const out = []
  for (const b of context.biomarkers) {
    if (!b.catalogCode) continue
    const rules = byCode.get(b.catalogCode)
    if (!rules) continue
    for (const rule of rules) {
      if (matchesCondition(b, rule.when)) {
        out.push({
          insightType: rule.insightType, clinicalFlag: rule.clinicalFlag,
          templateKey: rule.templateKey, biomarkerIds: [b.id],
          priority: rule.priority ?? 'medium',
        })
      }
    }
  }
  return out
}

// ── Contexto sintético ────────────────────────────────────────────────────────
const context = {
  biomarkers: [
    { id: 'b1', catalogCode: 'HEMOGLOBINA_SANGUE', value: 10, rangeStatus: 'below' },
    { id: 'b2', catalogCode: 'GLICEMIA',           value: 200, rangeStatus: 'above' },
    { id: 'b3', catalogCode: 'CREATININA_SERICA',  value: 0.9, rangeStatus: 'within' },
    { id: 'b4', catalogCode: null,                 value: 1, rangeStatus: 'non_numeric' }, // não resolvido
  ],
}

// Regras SINTÉTICAS (fictícias, apenas para testar o mecanismo)
const SYN_RULES = [
  { catalogCode: 'HEMOGLOBINA_SANGUE', when: { kind: 'rangeStatus', status: ['below'] }, clinicalFlag: 'acompanhar', templateKey: 'syn_hb_low', insightType: 'biomarker' },
  { catalogCode: 'GLICEMIA', when: { kind: 'numericThreshold', op: '>=', value: 126 }, clinicalFlag: 'acompanhar', templateKey: 'syn_glic_high', insightType: 'biomarker', priority: 'high' },
  { catalogCode: 'CREATININA_SERICA', when: { kind: 'rangeStatus', status: ['below','above'] }, clinicalFlag: 'acompanhar', templateKey: 'syn_creat', insightType: 'biomarker' },
]

let failures = 0
function check(label, cond) {
  if (!cond) { failures++; console.log(`FAIL  ${label}`) } else { console.log(`OK    ${label}`) }
}

// 1) Conjunto VAZIO não emite nada (garantia de segurança).
check('ruleset vazio -> 0 candidatos', evaluateRules(context, []).length === 0)

// 2) Regras sintéticas produzem os candidatos esperados.
const cands = evaluateRules(context, SYN_RULES)
check('hemoglobina below dispara', cands.some(c => c.templateKey === 'syn_hb_low' && c.biomarkerIds[0] === 'b1'))
check('glicemia >=126 dispara (200)', cands.some(c => c.templateKey === 'syn_glic_high' && c.priority === 'high'))
check('creatinina within NÃO dispara', !cands.some(c => c.templateKey === 'syn_creat'))
check('biomarcador não resolvido é ignorado', !cands.some(c => c.biomarkerIds[0] === 'b4'))
check('total de candidatos = 2', cands.length === 2)

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
