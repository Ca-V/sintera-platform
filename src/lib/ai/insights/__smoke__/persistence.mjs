// Smoke test da Persistência em ai_insights (mecanismo) — sem dependências/banco.
// Rode com: node src/lib/ai/insights/__smoke__/persistence.mjs
//
// Testa a montagem de linhas e o content_hash. Usa candidatos SINTÉTICOS e um
// renderizador de template FICTÍCIO (o texto real é conteúdo clínico, externo).
// Mantenha a lógica em sincronia com persistence.ts.

import { createHash } from 'node:crypto'

// ── Lógica portada de persistence.ts ─────────────────────────────────
function contentHashFor(c) {
  const ids = [...c.biomarkerIds].sort().join(',')
  const basis = `${c.templateKey} ${c.clinicalFlag} ${c.insightType} ${ids}`
  return createHash('sha256').update(basis, 'utf8').digest('hex')
}

function buildInsightRows(candidates, opts) {
  return candidates.map(c => {
    const insight = opts.renderText(c)
    if (!insight || insight.trim() === '') throw new Error('template vazio')
    return {
      user_id: opts.userId, exam_id: opts.examId, insight,
      insight_type: c.insightType, clinical_flag: c.clinicalFlag,
      template_key: c.templateKey, biomarker_ids: c.biomarkerIds,
      priority: c.priority, source: 'rule_based',
      content_hash: contentHashFor(c), model_version: null, synthetic: false,
    }
  })
}

// ── Testes ─────────────────────────────────────────────────────────────
let failures = 0
const check = (label, cond) => { if (!cond) { failures++; console.log(`FAIL  ${label}`) } else console.log(`OK    ${label}`) }

const opts = { examId: 'exam-1', userId: 'user-1', renderText: c => `Texto fictício para ${c.templateKey}` }

// 1) Candidatos vazios → no-op (renderText nunca chamado). GARANTIA: ruleset vazio não grava.
let rendererCalled = false
const emptyRows = buildInsightRows([], { ...opts, renderText: () => { rendererCalled = true; return 'x' } })
check('candidatos vazios → 0 linhas', emptyRows.length === 0)
check('candidatos vazios → renderText NÃO chamado', rendererCalled === false)

// 2) Candidatos sintéticos → linhas com proveniência correta.
const candidates = [
  { insightType: 'biomarker', clinicalFlag: 'acompanhar', templateKey: 'syn_hb_low_v1', biomarkerIds: ['b1'], priority: 'medium' },
  { insightType: 'biomarker', clinicalFlag: 'acompanhar', templateKey: 'syn_glic_high_v1', biomarkerIds: ['b2', 'b3'], priority: 'high' },
]
const rows = buildInsightRows(candidates, opts)
check('2 candidatos → 2 linhas', rows.length === 2)
check('source = rule_based', rows.every(r => r.source === 'rule_based'))
check('sem modelo (model_version null)', rows.every(r => r.model_version === null))
check('synthetic = false', rows.every(r => r.synthetic === false))
check('insight preenchido pelo renderizador', rows[0].insight.includes('syn_hb_low_v1'))
check('biomarker_ids preservados', rows[1].biomarker_ids.join(',') === 'b2,b3')

// 3) content_hash determinístico e estável (dedup em reanálise).
check('content_hash estável entre execuções', contentHashFor(candidates[0]) === contentHashFor(candidates[0]))
check('content_hash independe da ordem dos ids', contentHashFor({ ...candidates[1], biomarkerIds: ['b3', 'b2'] }) === rows[1].content_hash)
check('content_hash difere entre candidatos distintos', rows[0].content_hash !== rows[1].content_hash)

// 4) Renderizador que devolve vazio → erro (defesa).
let threw = false
try { buildInsightRows([candidates[0]], { ...opts, renderText: () => '' }) } catch { threw = true }
check('template vazio → lança erro', threw === true)

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
