// Formatação numérica pt-BR para exibição de valores/faixas (Exames e demais domínios).
// PURA. Vírgula decimal + agrupamento de milhar, SEM arredondar (fidelidade do valor impresso).

/** Número em pt-BR ("1.234,5"). Trata sinal e magnitudes extremas (evita notação científica). */
export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return String(n)
  const neg = n < 0
  const abs = Math.abs(n)
  let s = String(abs)
  // String() usa notação científica em magnitudes extremas (|n| < 1e-6 etc.) → "1e-7" viraria "0".
  // Expande para decimal sem arredondamento visível (remove só zeros à direita supérfluos).
  if (/e/i.test(s)) s = abs.toFixed(20).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  const [int, dec] = s.split('.')
  const grouped = Number(int).toLocaleString('pt-BR')
  return (neg ? '-' : '') + (dec ? `${grouped},${dec}` : grouped)
}

/** Faixa de referência: "min – max" · "> min" · "< max" · "—". */
export function formatRef(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${fmtNum(min)} – ${fmtNum(max)}`
  if (min !== null) return `> ${fmtNum(min)}`
  if (max !== null) return `< ${fmtNum(max)}`
  return '—'
}
