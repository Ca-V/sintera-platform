// Smoke test das sugestões temporais da agenda (Fase 3) — sem dependências.
// node src/lib/agenda/__smoke__/suggestions.mjs
// Mantenha em sincronia com suggestions.ts (apenas a lógica essencial).

const EXAM_RECENCY_MONTHS = 6
function monthsSince(dateStr, now) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  if (!y || !m) return 0
  const then = new Date(y, m - 1, d || 1)
  const days = (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.floor(days / 30.44))
}
function build(exams, hasPending, now) {
  if (hasPending) return null
  const processed = exams.filter(e => e.status === 'processed' && !!e.date)
  if (processed.length === 0) return null
  const latest = processed.reduce((a, b) => (a.date > b.date ? a : b))
  const months = monthsSince(latest.date, now)
  if (months < EXAM_RECENCY_MONTHS) return null
  return { months, latest: latest.date }
}

const NOW = new Date(2026, 5, 12) // 12 jun 2026
let fail = 0
const ok = (label, cond) => { if (!cond) { fail++; console.log('FAIL ' + label) } else console.log('OK   ' + label) }

ok('sem exames -> null', build([], false, NOW) === null)
ok('exame recente (2 meses) -> null',
  build([{ status: 'processed', date: '2026-04-10', type: null }], false, NOW) === null)
ok('exame antigo (8 meses) -> sugere',
  build([{ status: 'processed', date: '2025-10-01', type: null }], false, NOW)?.months >= 6)
ok('pega o mais recente entre vários',
  build([
    { status: 'processed', date: '2024-01-01', type: null },
    { status: 'processed', date: '2025-10-01', type: null },
  ], false, NOW)?.latest === '2025-10-01')
ok('já tem exame agendado -> null',
  build([{ status: 'processed', date: '2025-01-01', type: null }], true, NOW) === null)
ok('exame não processado é ignorado',
  build([{ status: 'pending', date: '2024-01-01', type: null }], false, NOW) === null)

console.log(`\n${fail === 0 ? 'TODOS OK' : fail + ' FALHA(S)'}`)
if (fail) process.exit(1)
