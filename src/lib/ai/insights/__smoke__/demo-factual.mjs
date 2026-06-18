// Smoke test do texto de DEMONSTRAÇÃO factual — sem dependências/banco.
// Rode com: node src/lib/ai/insights/__smoke__/demo-factual.mjs
// Mantenha em sincronia com demo-factual.ts (factualDemoText/formatRange).

function formatRange(b) {
  const u = b.unit ? ` ${b.unit}` : ''
  if (b.referenceMin !== null && b.referenceMax !== null) return `${b.referenceMin} a ${b.referenceMax}${u}`
  if (b.referenceMin !== null) return `≥ ${b.referenceMin}${u}`
  if (b.referenceMax !== null) return `≤ ${b.referenceMax}${u}`
  return '—'
}
function factualDemoText(b) {
  const name = b.displayName ?? b.name
  const u = b.unit ? ` ${b.unit}` : ''
  const dir = b.rangeStatus === 'below' ? 'abaixo' : 'acima'
  return `DEMONSTRAÇÃO (sem validação clínica): ${name} = ${b.value ?? ''}${u} está ${dir} ` +
    `da faixa de referência impressa no seu laudo (${formatRange(b)}). ` +
    `Esta é uma observação factual sobre a posição do número, não um diagnóstico ` +
    `nem avaliação clínica. Converse com seu médico.`
}

let failures = 0
const check = (label, cond) => { if (!cond) { failures++; console.log(`FAIL  ${label}`) } else console.log(`OK    ${label}`) }

// 1) Abaixo da faixa
const baixo = factualDemoText({ displayName: 'Ferritina', value: 8, unit: 'ng/mL', rangeStatus: 'below', referenceMin: 15, referenceMax: 150 })
check('marca DEMONSTRAÇÃO', baixo.includes('DEMONSTRAÇÃO (sem validação clínica)'))
check('diz abaixo', baixo.includes('está abaixo'))
check('mostra faixa do laudo', baixo.includes('15 a 150 ng/mL'))
check('não diagnostica (texto factual)', baixo.includes('não um diagnóstico'))
check('encaminha ao médico', baixo.includes('Converse com seu médico'))

// 2) Acima da faixa
const alto = factualDemoText({ displayName: 'Glicose (jejum)', value: 130, unit: 'mg/dL', rangeStatus: 'above', referenceMin: 70, referenceMax: 99 })
check('diz acima', alto.includes('está acima'))
check('valor e unidade', alto.includes('130 mg/dL'))

// 3) Faixa só com máximo
const soMax = factualDemoText({ displayName: 'X', value: 5, unit: 'U', rangeStatus: 'above', referenceMin: null, referenceMax: 4 })
check('faixa ≤ quando só max', soMax.includes('≤ 4 U'))

// 4) NUNCA contém juízo clínico (palavras proibidas)
const proibidas = ['diagnóstico de', 'você tem', 'doença', 'tome ', 'recomendo', 'risco de']
check('sem juízo clínico', !proibidas.some(p => baixo.toLowerCase().includes(p) || alto.toLowerCase().includes(p)))

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
