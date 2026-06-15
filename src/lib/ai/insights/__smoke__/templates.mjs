// Smoke test do render de templates (mecanismo) — sem dependências/banco.
// Rode com: node src/lib/ai/insights/__smoke__/templates.mjs
//
// Usa um template SINTÉTICO (fictício, só neste teste). NÃO é conteúdo clínico.
// Mantenha a lógica em sincronia com templates.ts.

// ── Lógica portada de templates.ts ───────────────────────────────────
function placeholderValues(b) {
  return {
    displayName: b.displayName ?? b.name,
    value: b.value !== null ? String(b.value) : (b.valueText ?? ''),
    unit: b.unit ?? '',
    referenceMin: b.referenceMin !== null ? String(b.referenceMin) : '',
    referenceMax: b.referenceMax !== null ? String(b.referenceMax) : '',
  }
}
function fillTemplate(template, b) {
  const values = placeholderValues(b)
  return Object.keys(values).reduce((acc, key) => acc.split(`{{${key}}}`).join(values[key]), template)
}
function makeTemplateRenderer(library) {
  return candidate => {
    const template = library[candidate.templateKey]
    if (template === undefined) throw new Error(`Template ausente: ${candidate.templateKey}`)
    return fillTemplate(template, candidate.biomarker)
  }
}

// ── Testes ─────────────────────────────────────────────────────────────
let failures = 0
const check = (label, cond) => { if (!cond) { failures++; console.log(`FAIL  ${label}`) } else console.log(`OK    ${label}`) }

const biomarker = { name: 'Hemoglobina', displayName: 'Hemoglobina', value: 10.2, valueText: null, unit: 'g/dL', referenceMin: 12, referenceMax: 16 }

// Template SINTÉTICO (fictício) — só dados factuais, nenhum juízo clínico.
const SYN_TEMPLATE = 'Seu {{displayName}} foi {{value}} {{unit}} (faixa do laudo: {{referenceMin}}–{{referenceMax}}).'
check('substitui placeholders factuais', fillTemplate(SYN_TEMPLATE, biomarker) === 'Seu Hemoglobina foi 10.2 g/dL (faixa do laudo: 12–16).')

// valueText quando value é null (qualitativo)
const qual = { name: 'Nitrito', displayName: 'Nitrito', value: null, valueText: 'Negativo', unit: null, referenceMin: null, referenceMax: null }
check('usa valueText quando value é null', fillTemplate('{{displayName}}: {{value}}', qual) === 'Nitrito: Negativo')

// Biblioteca VAZIA → template_key inexistente lança (segurança).
let threw = false
try { makeTemplateRenderer({})({ templateKey: 'inexistente', biomarker }) } catch { threw = true }
check('biblioteca vazia → template ausente lança', threw === true)

// Renderizador com biblioteca sintética resolve.
const render = makeTemplateRenderer({ syn_hb_low_v1: SYN_TEMPLATE })
check('renderizador resolve template existente', render({ templateKey: 'syn_hb_low_v1', biomarker }).startsWith('Seu Hemoglobina'))

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
