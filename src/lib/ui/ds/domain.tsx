'use client'
// Adaptador Web — componentes de DOMÍNIO (Etapa 4). Consomem as recipes de produto do DS.
import type { CSSProperties, ReactNode } from 'react'
import * as ds from '@sintera/design-system'
import { useDs } from './theme'
import { boxStyle, textStyle } from './style'

const glyph = (d: ds.Trend) => (d === 'up' ? '↑' : d === 'down' ? '↓' : d === 'stable' ? '→' : '')

// --- Laboratory Table -------------------------------------------------------
export interface LabRow {
  name: string
  value: string
  numericValue?: number
  unit?: string
  refLow?: number
  refHigh?: number
  refText?: string
  trend?: ds.Trend
  group?: string
}
export function LaboratoryTable({ rows }: { rows: LabRow[] }) {
  const t = useDs()
  const th = (label: string, end?: boolean): CSSProperties => ({
    ...textStyle({ style: ds.labHeader(t).label.style, color: t.color.text.faint }),
    textAlign: end ? 'right' : 'left', padding: '0 8px 8px', borderBottom: `1px solid ${t.color.border.default}`,
  })
  const cellPad = `${t.density.default.rowY}px 8px`
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={th('Analito')}>Analito</th>
          <th style={th('Resultado', true)}>Resultado</th>
          <th style={th('Referência', true)}>Referência</th>
          <th style={{ ...th('Tend.'), textAlign: 'center' }}>Tend.</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const status = r.numericValue != null ? ds.classifyValue(r.numericValue, r.refLow, r.refHigh) : 'unknown'
          const cell = ds.labValueCell(t, { status, trend: r.trend })
          return (
            <tr key={i} style={{ borderTop: `1px solid ${t.color.border.default}` }}>
              <td style={{ padding: cellPad, ...textStyle(ds.text(t, { role: 'bodySmall' })) }}>{r.name}</td>
              <td style={{ padding: cellPad, textAlign: 'right' }}>
                <span style={textStyle(cell.value)}>{r.value}</span>
                {r.unit && <span style={{ ...textStyle(cell.unit), marginLeft: 4 }}>{r.unit}</span>}
                {cell.flag && (
                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, backgroundColor: cell.flag.backgroundColor, color: cell.flag.textColor }}>
                    {status === 'above' ? 'alto' : 'baixo'}
                  </span>
                )}
              </td>
              <td style={{ padding: cellPad, textAlign: 'right', ...textStyle(cell.reference) }}>
                {r.refText ?? (r.refLow != null && r.refHigh != null ? `${r.refLow}–${r.refHigh}` : '—')}
              </td>
              <td style={{ padding: cellPad, textAlign: 'center', color: cell.trend?.color ?? t.color.text.faint }}>
                {cell.trend ? glyph(cell.trend.direction) : '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// --- Timeline row -----------------------------------------------------------
export function TimelineRow({ kind = 'event', time, title, subtitle, tag }:
  { kind?: ds.TimelineKind; time: string; title: ReactNode; subtitle?: ReactNode; tag?: string }) {
  const t = useDs()
  const s = ds.timelineRow(t, { kind })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '52px 16px 1fr auto', gap: 10, alignItems: 'start', padding: `${s.rowPaddingY}px 0` }}>
      <div style={textStyle(s.time)}>{time}</div>
      <div style={{ width: s.node.size, height: s.node.size, borderRadius: '50%', backgroundColor: s.node.color, marginTop: 4, boxShadow: `0 0 0 4px ${s.node.ringColor}` }} />
      <div>
        <div style={textStyle(s.title)}>{title}</div>
        {subtitle && <div style={textStyle(s.subtitle)}>{subtitle}</div>}
      </div>
      {tag && <div style={textStyle(s.tag)}>{tag}</div>}
    </div>
  )
}

// --- Biomarker card ---------------------------------------------------------
export function BiomarkerCard({ name, value, unit, reference, status = 'within' }:
  { name: string; value: string; unit?: string; reference?: string; status?: ds.ValueStatus }) {
  const t = useDs()
  const s = ds.biomarkerCard(t, { status })
  return (
    <div style={boxStyle(t, s.container)}>
      <div style={textStyle(s.name)}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={textStyle(s.value)}>{value}</span>
        {unit && <span style={textStyle(s.unit)}>{unit}</span>}
        {s.flag && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, backgroundColor: s.flag.backgroundColor, color: s.flag.textColor }}>{status === 'above' ? 'alto' : 'baixo'}</span>}
      </div>
      {reference && <div style={{ ...textStyle(s.reference), marginTop: 4 }}>ref. {reference}</div>}
    </div>
  )
}

// --- Indicator (KPI) --------------------------------------------------------
export function Indicator({ value, label, trend = 'none' }: { value: string; label: string; trend?: ds.Trend }) {
  const t = useDs()
  const s = ds.indicator(t, { trend })
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={textStyle(s.value)}>{value}</span>
        {trend !== 'none' && <span style={{ color: s.delta.color, fontSize: 13 }}>{glyph(trend)}</span>}
      </div>
      <div style={{ ...textStyle(s.label), marginTop: 2 }}>{label}</div>
    </div>
  )
}
