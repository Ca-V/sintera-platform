'use client'
// Adaptador Web — componentes de DOMÍNIO (Etapa 4). Consomem as recipes de produto do DS.
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import * as ds from '@sintera/design-system'
import { useDs } from './theme'
import { boxStyle, textStyle } from './style'

const glyph = (d: ds.Trend) => (d === 'up' ? '↑' : d === 'down' ? '↓' : d === 'stable' ? '→' : '')

// --- Laboratory Table -------------------------------------------------------
// Cobre o domínio real: tipos de resultado (numérico/qualitativo/ausente/falha) e agrupamento material→exame.
// A COPY (rótulos de flag, notas) é fornecida pela TELA — o adaptador nunca inventa texto (RDC 657).
export interface LabRow {
  name: string
  value: string                 // já formatado (número ou texto qualitativo)
  kind?: ds.LabResultKind       // default 'numeric'
  numericValue?: number
  unit?: string
  refLow?: number
  refHigh?: number
  refText?: string
  trend?: ds.Trend
  flagLabel?: string            // rótulo do destaque, vindo da tela (ex.: 'alto'/'abaixo')
  note?: string                 // nota da tela p/ qualitativo/ausente/falha/sem-referência
  status?: ds.ValueStatus       // override explícito (fiel à interpretação da tela)
  statusText?: string           // rótulo descritivo (modo `descriptive`) — copy da tela
  href?: string                 // nome vira link (ex.: Evolução do biomarcador)
}
export interface LabExamGroup { label?: string | null; rows: LabRow[] }
export interface LabMaterialGroup { material: string; exams: LabExamGroup[] }
/** A tela injeta o componente de link da plataforma (ex.: Next <Link>) para preservar navegação SPA. */
export type LabLinkRenderer = (args: { href: string; style: CSSProperties; children: ReactNode }) => ReactNode

function Row({ r, index, descriptive, renderLink }: { r: LabRow; index: number; descriptive?: boolean; renderLink?: LabLinkRenderer }) {
  const t = useDs()
  const kind = r.kind ?? 'numeric'
  const status = r.status ?? (kind === 'numeric' && r.numericValue != null ? ds.classifyValue(r.numericValue, r.refLow, r.refHigh) : 'unknown')
  const cell = ds.labValueCell(t, { kind, status, trend: r.trend })
  const nameSpec = ds.labName(t, { interactive: !!r.href })
  const nameStyle: CSSProperties = { ...textStyle(nameSpec), textDecoration: 'none' }
  const cellPad = `${t.density.default.rowY}px 8px`
  return (
    <tr style={{ borderTop: index === 0 ? undefined : `1px solid ${t.color.border.default}` }}>
      <td style={{ padding: cellPad, opacity: cell.subdued ? 0.85 : 1 }}>
        {r.href
          ? (renderLink
            ? renderLink({ href: r.href, style: nameStyle, children: r.name })
            : <a href={r.href} style={nameStyle}>{r.name}</a>)
          : <span style={textStyle(nameSpec)}>{r.name}</span>}
        {descriptive && r.statusText && <div style={{ ...textStyle(cell.statusLine), marginTop: 2 }}>{r.statusText}</div>}
      </td>
      <td style={{ padding: cellPad, textAlign: cell.alignEnd ? 'right' : 'left' }}>
        <span style={textStyle(cell.value)}>{r.value || r.note || '—'}</span>
        {r.unit && <span style={{ ...textStyle(cell.unit), marginLeft: 4 }}>{r.unit}</span>}
        {cell.flag && r.flagLabel && (
          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, backgroundColor: cell.flag.backgroundColor, color: cell.flag.textColor }}>
            {r.flagLabel}
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
}

export function LaboratoryTable({ rows, groups, descriptive, renderLink }: { rows?: LabRow[]; groups?: LabMaterialGroup[]; descriptive?: boolean; renderLink?: LabLinkRenderer }) {
  const t = useDs()
  const th = (end?: boolean, center?: boolean): CSSProperties => ({
    ...textStyle({ style: ds.labHeader(t).label.style, color: t.color.text.faint }),
    textAlign: center ? 'center' : end ? 'right' : 'left', padding: '0 8px 8px', borderBottom: `1px solid ${t.color.border.default}`,
  })
  const materialHead = ds.labGroupHeader(t, { level: 'material' })
  const examHead = ds.labGroupHeader(t, { level: 'exam' })
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={th()}>Analito</th>
          <th style={th(true)}>Resultado</th>
          <th style={th(true)}>Referência</th>
          <th style={th(false, true)}>Tend.</th>
        </tr>
      </thead>
      <tbody>
        {rows?.map((r, i) => <Row key={i} r={r} index={i} descriptive={descriptive} renderLink={renderLink} />)}
        {groups?.map((g, gi) => (
          <Fragment key={`m-${gi}`}>
            <tr><td colSpan={4} style={{ padding: `${t.spacing.stack}px 8px 4px`, ...textStyle({ style: materialHead.title.style, color: materialHead.title.color }) }}>{g.material}</td></tr>
            {g.exams.map((ex, ei) => (
              <Fragment key={`e-${gi}-${ei}`}>
                {ex.label && <tr><td colSpan={4} style={{ padding: '2px 8px', ...textStyle({ style: examHead.title.style, color: examHead.title.color }) }}>{ex.label}</td></tr>}
                {ex.rows.map((r, ri) => <Row key={`r-${gi}-${ei}-${ri}`} r={r} index={ri} descriptive={descriptive} renderLink={renderLink} />)}
              </Fragment>
            ))}
          </Fragment>
        ))}
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
