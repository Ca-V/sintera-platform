// Smoke test do Motor Longitudinal (FASE 3) — sem dependências/banco.
// Rode com: node src/lib/biomarkers/__smoke__/longitudinal.mjs
// Mantenha a lógica em sincronia com longitudinal.ts.

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375

function analyzeSeries(points) {
  const valid = points.filter(p => Number.isFinite(p.value) && !!p.date)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (valid.length === 0) return null
  const first = valid[0], last = valid[valid.length - 1]
  if (valid.length < 2) {
    return { count: valid.length, first, last, monthsSpan: null, ratePerMonth: null, ratePercentPerMonth: null, totalDeltaPercent: null, direction: 'stable' }
  }
  const ms = new Date(last.date).getTime() - new Date(first.date).getTime()
  const months = ms > 0 ? ms / MS_PER_MONTH : null
  const deltaVal = last.value - first.value
  const totalDeltaPercent = first.value !== 0 ? (deltaVal / Math.abs(first.value)) * 100 : null
  const ratePerMonth = months !== null ? deltaVal / months : null
  const ratePercentPerMonth = (months !== null && first.value !== 0) ? (deltaVal / Math.abs(first.value)) * 100 / months : null
  const direction = totalDeltaPercent === null ? 'stable' : totalDeltaPercent > 5 ? 'up' : totalDeltaPercent < -5 ? 'down' : 'stable'
  return { count: valid.length, first, last, monthsSpan: months, ratePerMonth, ratePercentPerMonth, totalDeltaPercent, direction }
}

let failures = 0
const check = (label, cond) => { if (!cond) { failures++; console.log(`FAIL  ${label}`) } else console.log(`OK    ${label}`) }
const near = (a, b, tol = 0.5) => a !== null && Math.abs(a - b) <= tol

// 1) Série vazia → null
check('vazio → null', analyzeSeries([]) === null)

// 2) Uma medição → sem velocidade, direção stable
const one = analyzeSeries([{ value: 30, date: '2026-01-01' }])
check('1 ponto → count 1, sem rate', one.count === 1 && one.ratePerMonth === null && one.direction === 'stable')

// 3) Ferritina 18 → 32 em ~6 meses (factual): +14 em 6 meses ≈ +2,33/mês, +77,8% total
const ferritina = analyzeSeries([
  { value: 18, date: '2026-01-01' },
  { value: 24, date: '2026-04-01' },
  { value: 32, date: '2026-07-01' },
])
check('3 pontos → count 3', ferritina.count === 3)
check('direção up (subiu)', ferritina.direction === 'up')
check('variação total ≈ +77,8%', near(ferritina.totalDeltaPercent, 77.8, 1))
check('velocidade ≈ +2,3/mês', near(ferritina.ratePerMonth, 2.3, 0.3))
check('velocidade % ≈ +12,8%/mês', near(ferritina.ratePercentPerMonth, 12.8, 1))

// 4) Queda: 100 → 80 em ~12 meses → direção down, -20% total
const queda = analyzeSeries([{ value: 100, date: '2025-06-01' }, { value: 80, date: '2026-06-01' }])
check('direção down (desceu)', queda.direction === 'down')
check('variação total ≈ -20%', near(queda.totalDeltaPercent, -20, 0.5))

// 5) Estável (variação < 5%): 50 → 51
const estavel = analyzeSeries([{ value: 50, date: '2026-01-01' }, { value: 51, date: '2026-06-01' }])
check('direção stable (variação pequena)', estavel.direction === 'stable')

// 6) Ordena fora de ordem (entrada desordenada) e calcula igual
const desordenado = analyzeSeries([{ value: 32, date: '2026-07-01' }, { value: 18, date: '2026-01-01' }])
check('ordena por data: first=18, last=32', desordenado.first.value === 18 && desordenado.last.value === 32)

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
