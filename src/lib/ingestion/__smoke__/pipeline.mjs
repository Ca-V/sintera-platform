// Smoke test executável do pipeline de pós-ingestão — sem dependências.
// Rode com: node src/lib/ingestion/__smoke__/pipeline.mjs
//
// A lógica abaixo é PORTADA de flags.ts + pipeline.ts (mesma convenção de
// engine.eval.mjs). Mantenha em sincronia com o TS.

// ── Portado de flags.ts ───────────────────────────────────────────────────────
const TRUTHY = new Set(['on', '1', 'true'])
function isFlagOn(raw) {
  return raw != null && TRUTHY.has(String(raw).trim().toLowerCase())
}

// ── Portado de pipeline.ts (runPostIngestion) ─────────────────────────────────
function sourceRefOf(source) {
  return source.kind === 'exam' ? source.examId : source.provider
}
async function runPostIngestion(event, deps) {
  const isEnabled = deps.isEnabled
  const telemetry = deps.telemetry ?? (() => {})
  const now = deps.now ?? Date.now
  const startedAt = now()
  const base = { source: event.source.kind, sourceRef: sourceRefOf(event.source), userId: event.userId }
  const emit = partial => {
    const result = { ...base, durationMs: now() - startedAt, ...partial }
    telemetry(result); return result
  }
  if (!isEnabled()) {
    return emit({ outcome: 'flag_off', ran: false, insightsGenerated: 0, rulesActive: 0, candidates: 0 })
  }
  try {
    if (event.source.kind === 'exam') {
      const res = await deps.generateForExam({ examId: event.source.examId, userId: event.userId })
      return emit({
        outcome: res.rulesActive === 0 ? 'no_active_rules' : 'generated',
        ran: true, insightsGenerated: res.upserted, rulesActive: res.rulesActive, candidates: res.candidates,
      })
    }
    return emit({ outcome: 'unsupported_source', ran: false, insightsGenerated: 0, rulesActive: 0, candidates: 0 })
  } catch (err) {
    return emit({
      outcome: 'error', ran: false, insightsGenerated: 0, rulesActive: 0, candidates: 0,
      error: String(err?.message ?? err).slice(0, 300),
    })
  }
}

// ── Harness ───────────────────────────────────────────────────────────────────
let failures = 0
function check(label, cond) {
  if (!cond) { failures++; console.log(`FAIL  ${label}`) } else { console.log(`OK    ${label}`) }
}

// 1) isFlagOn: default OFF; só liga com on/1/true (case/space-insensitive).
check('flag: undefined -> off', isFlagOn(undefined) === false)
check("flag: 'off' -> off", isFlagOn('off') === false)
check("flag: 'on' -> on", isFlagOn('on') === true)
check("flag: '1' -> on", isFlagOn('1') === true)
check("flag: '  TRUE ' -> on", isFlagOn('  TRUE ') === true)

const examEvent = { userId: 'u1', source: { kind: 'exam', examId: 'e1' } }
const wearableEvent = { userId: 'u1', source: { kind: 'wearable', provider: 'oura' } }
// Relógio determinístico: 1000 no start, 1042 no fim → durationMs=42.
const clock = (() => { let t = 1000; return () => (t === 1000 ? (t = 1042, 1000) : t) })()

// 2) Flag OFF -> no-op, gerador NÃO chamado; telemetria completa mesmo assim.
{
  let called = false
  const telem = []
  const r = await runPostIngestion(examEvent, {
    isEnabled: () => false,
    generateForExam: async () => { called = true; return { rulesActive: 5, candidates: 5, upserted: 99 } },
    telemetry: t => telem.push(t),
  })
  check('off: outcome=flag_off', r.outcome === 'flag_off')
  check('off: ran=false', r.ran === false)
  check('off: gerador NÃO chamado', called === false)
  check('off: telemetria tem userId (quem)', telem[0].userId === 'u1')
  check('off: telemetria tem sourceRef (origem)', telem[0].sourceRef === 'e1')
  check('off: telemetria tem durationMs (tempo)', typeof telem[0].durationMs === 'number')
}

// 3) Flag ON + exame COM regras ativas -> outcome=generated; conta insights.
{
  let gotParams = null
  const r = await runPostIngestion(examEvent, {
    isEnabled: () => true,
    now: clock,
    generateForExam: async p => { gotParams = p; return { rulesActive: 2, candidates: 4, upserted: 3 } },
  })
  check('on/exam(regras): outcome=generated', r.outcome === 'generated')
  check('on/exam(regras): insightsGenerated=3', r.insightsGenerated === 3)
  check('on/exam(regras): rulesActive=2', r.rulesActive === 2)
  check('on/exam(regras): candidates=4', r.candidates === 4)
  check('on/exam(regras): durationMs=42 (relógio injetado)', r.durationMs === 42)
  check('on/exam(regras): gerador recebeu examId/userId', gotParams?.examId === 'e1' && gotParams?.userId === 'u1')
}

// 4) Flag ON + exame SEM regras (estado atual) -> outcome=no_active_rules, 0 insights.
{
  const r = await runPostIngestion(examEvent, {
    isEnabled: () => true,
    generateForExam: async () => ({ rulesActive: 0, candidates: 0, upserted: 0 }),
  })
  check('on/exam(sem regras): outcome=no_active_rules', r.outcome === 'no_active_rules')
  check('on/exam(sem regras): ran=true', r.ran === true)
  check('on/exam(sem regras): insightsGenerated=0', r.insightsGenerated === 0)
}

// 5) Flag ON + wearable -> origem ainda não mapeada -> unsupported_source.
{
  let called = false
  const r = await runPostIngestion(wearableEvent, {
    isEnabled: () => true,
    generateForExam: async () => { called = true; return { rulesActive: 1, candidates: 1, upserted: 1 } },
  })
  check('on/wearable: outcome=unsupported_source', r.outcome === 'unsupported_source')
  check('on/wearable: sourceRef=oura', r.sourceRef === 'oura')
  check('on/wearable: gerador de exame NÃO chamado', called === false)
}

// 6) Best-effort: gerador lança -> capturado, NUNCA propaga; outcome=error.
{
  let threw = false
  let r = null
  try {
    r = await runPostIngestion(examEvent, {
      isEnabled: () => true,
      generateForExam: async () => { throw new Error('boom no orquestrador') },
    })
  } catch { threw = true }
  check('erro: runPostIngestion NÃO propaga', threw === false)
  check('erro: outcome=error', r?.outcome === 'error')
  check('erro: mensagem capturada', typeof r?.error === 'string' && r.error.includes('boom'))
}

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
