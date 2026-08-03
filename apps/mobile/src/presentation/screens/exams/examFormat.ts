// Formatação de data do exame — ÚNICA fonte (antes duplicada e INCONSISTENTE entre lista e detalhe: "Sem data"
// vs "—"). FACTUAL (REG-001): mostra a data impressa; ausente/ inválida → "Sem data". Puro/testável.
export function formatExamDate(iso: string | null | undefined): string {
  if (!iso) return 'Sem data'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : 'Sem data'
}
