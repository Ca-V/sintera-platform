'use client'

// BOD-001 área ② — gráfico de Evolução Longitudinal. SVG puro (sem libs), responsivo, com marcadores
// DIFERENTES por origem (● bioimpedância · ■ manual · ▲ DEXA · ◆ balança) e PONTOS CLICÁVEIS (rastreabilidade).
// Só apresenta os valores medidos no tempo (RDC 657) — não interpreta.

import type { EvoPoint } from '@/lib/body/evolution'
import { markerFor } from '@/lib/body/evolution'

const W = 700, H = 220
const PAD_L = 40, PAD_R = 14, PAD_T = 16, PAD_B = 26
const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B

function fmtShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function Marker({ cx, cy, shape, selected }: { cx: number; cy: number; shape: string; selected: boolean }) {
  const s = selected ? 5.5 : 4
  const cls = selected ? 'fill-petal' : 'fill-petal'
  if (shape === 'square') return <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} className={cls} rx={0.5} />
  if (shape === 'triangle') return <polygon points={`${cx},${cy - s * 1.2} ${cx - s},${cy + s * 0.8} ${cx + s},${cy + s * 0.8}`} className={cls} />
  if (shape === 'diamond') return <polygon points={`${cx},${cy - s * 1.3} ${cx + s * 1.1},${cy} ${cx},${cy + s * 1.3} ${cx - s * 1.1},${cy}`} className={cls} />
  return <circle cx={cx} cy={cy} r={s} className={cls} />
}

export default function EvolutionChart({
  points, unit, selectedKey, onSelect,
}: {
  points: EvoPoint[]         // já ordenados por data (asc)
  unit: string | null
  selectedKey: string | null
  onSelect: (p: EvoPoint) => void
}) {
  if (points.length === 0) {
    return <p className="font-body text-sm text-mauve py-8 text-center">Sem dados para o período selecionado.</p>
  }

  const values = points.map(p => p.value)
  let vmin = Math.min(...values), vmax = Math.max(...values)
  if (vmin === vmax) { vmin -= 1; vmax += 1 }
  const times = points.map(p => new Date(`${p.date}T00:00:00Z`).getTime())
  const tmin = Math.min(...times), tmax = Math.max(...times)

  const xOf = (t: number) => tmax === tmin ? PAD_L + innerW / 2 : PAD_L + innerW * ((t - tmin) / (tmax - tmin))
  const yOf = (v: number) => PAD_T + innerH * (1 - (v - vmin) / (vmax - vmin))

  const coords = points.map((p, i) => ({ p, x: xOf(times[i]), y: yOf(p.value) }))
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: 320 }} role="img" aria-label="Gráfico de evolução do indicador">
        {/* grade horizontal (min/meio/max) */}
        {[vmax, (vmin + vmax) / 2, vmin].map((v, i) => {
          const y = yOf(v)
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} className="stroke-border" strokeWidth={0.5} strokeDasharray="3 3" />
              <text x={PAD_L - 5} y={y + 3} textAnchor="end" className="fill-mauve" style={{ fontSize: 10 }}>{Number(v.toFixed(1))}</text>
            </g>
          )
        })}
        {/* datas nas extremidades */}
        <text x={PAD_L} y={H - 8} textAnchor="start" className="fill-mauve" style={{ fontSize: 10 }}>{fmtShort(points[0].date)}</text>
        {points.length > 1 && <text x={W - PAD_R} y={H - 8} textAnchor="end" className="fill-mauve" style={{ fontSize: 10 }}>{fmtShort(points[points.length - 1].date)}</text>}
        {/* linha */}
        {points.length > 1 && <path d={linePath} className="stroke-petal" fill="none" strokeWidth={1.5} />}
        {/* pontos clicáveis (marcador por origem) */}
        {coords.map(({ p, x, y }) => {
          const selected = p.key === selectedKey
          return (
            <g key={p.key} onClick={() => onSelect(p)} style={{ cursor: 'pointer' }}>
              {selected && <circle cx={x} cy={y} r={9} className="fill-petal/15 stroke-petal" strokeWidth={1} />}
              <Marker cx={x} cy={y} shape={markerFor(p.source)} selected={selected} />
              {/* área de clique ampliada (acessível ao toque) */}
              <circle cx={x} cy={y} r={12} fill="transparent" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
