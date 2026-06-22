'use client'

// ============================================================
// Sparkline — mini-gráfico de linha, factual (sem eixos nem juízo clínico)
// ============================================================
// Plota uma série de valores na ordem cronológica (mais antigo → mais recente).
// Apenas organiza visualmente o que a pessoa registrou. Não interpreta.
// ============================================================

/** Extrai o primeiro número de um texto (aceita vírgula decimal). null se não houver. */
export function parseNum(text: string | null | undefined): number | null {
  if (!text) return null
  const m = text.replace(',', '.').match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

export default function Sparkline({
  values, width = 88, height = 24, className = 'text-petal',
}: { values: number[]; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)
  const pad = 2
  const h = height - pad * 2
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(pad + h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ')
  const last = values[values.length - 1]
  const cx = (values.length - 1) * step
  const cy = pad + h - ((last - min) / range) * h
  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={cx.toFixed(1)} cy={cy.toFixed(1)} r="2.2" fill="currentColor" />
    </svg>
  )
}
