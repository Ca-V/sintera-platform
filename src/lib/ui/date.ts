// ============================================================
// date — utilitários de data civil (fonte ÚNICA, sem locale)
// ============================================================
// Consolida o que estava duplicado em timeGroup + adapters (indicator/timeline/
// report/dashboard). Trata data civil/sem horário como meia-noite LOCAL (evita
// o off-by-one de fuso). Formatação manual e determinística (sem toLocaleDateString).
// ============================================================

export const DAY_MS = 86_400_000
export const MONTHS_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const MONTHS_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** 'YYYY-MM-DD' (ou timestamp) → Date em meia-noite local para data civil. */
export function parseLocal(iso: string): Date {
  return new Date((iso ?? '').length <= 10 ? `${iso}T00:00:00` : iso)
}

export function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Diferença em dias locais (isoA − isoB). Puro. */
export function dayDiff(isoA: string, isoB: string): number {
  return Math.round((startOfDay(parseLocal(isoA)) - startOfDay(parseLocal(isoB))) / DAY_MS)
}

/** Data de hoje em 'YYYY-MM-DD' local. */
export function todayIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const RE_YMD = /^(\d{4})-(\d{2})-(\d{2})/
const RE_YM = /^(\d{4})-(\d{2})/

/** "03 jul 2026" */
export function fmtDayMonthYear(iso: string): string {
  const m = RE_YMD.exec(iso ?? '')
  return m ? `${m[3]} ${MONTHS_ABBR[Number(m[2]) - 1]} ${m[1]}` : (iso || '—')
}
/** "20 ago" (sem ano) */
export function fmtDayMonth(iso: string): string {
  const m = RE_YMD.exec(iso ?? '')
  return m ? `${m[3]} ${MONTHS_ABBR[Number(m[2]) - 1]}` : (iso || '—')
}
/** "jul 2026" */
export function fmtMonthYear(iso: string): string {
  const m = RE_YM.exec(iso ?? '')
  return m ? `${MONTHS_ABBR[Number(m[2]) - 1]} ${m[1]}` : '—'
}
/** "jul 26" (ano com 2 dígitos) */
export function fmtMonthShortYear(iso: string): string {
  const m = RE_YM.exec(iso ?? '')
  return m ? `${MONTHS_ABBR[Number(m[2]) - 1]} ${m[1].slice(2)}` : ''
}
