// Parsing financeiro (valor em reais ⇄ centavos) — puro/determinístico, reutilizado pelo formulário
// de evento (financeiro do exame F8: "R$ 1.234,56" → cents) e por quem exibir valores.

/** "R$ 1.234,56" / "250,00" / "50" → centavos (>=0) ou null (vazio/inválido/negativo). */
export function parseAmountToCents(s: string | null | undefined): number | null {
  let t = (s ?? '').trim().replace(/[R$\s]/g, '')
  if (!t) return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')  // vírgula decimal + ponto de milhar
  const n = parseFloat(t)
  return isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

/** Centavos → "1234,56" (vazio quando null). */
export function centsToAmount(cents: number | null): string {
  return cents != null ? (cents / 100).toFixed(2).replace('.', ',') : ''
}
