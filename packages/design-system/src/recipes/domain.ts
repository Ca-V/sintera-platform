// @sintera/design-system — RECIPES DE DOMÍNIO (Passo 3B · Etapa 4).
// Componentes de PRODUTO (não apenas de interface): carregam o comportamento próprio do domínio SINTERA
// (números tabulares, referências, tendências, destaque de alterações, acessibilidade) — sempre headless (ADR-011),
// derivados dos papéis do tema, sem hex cru e sem plataforma.
//
// IMPORTANTE (RDC 657): estas recipes NÃO interpretam clinicamente. Classificar um valor frente à referência FORNECIDA
// e indicar direção de variação são operações FACTUAIS. A recipe apenas dá o TRATAMENTO VISUAL a um status factual.
import type { SinteraTheme } from '../theme'
import type { BoxSpec, TextSpec, IconSpec } from './spec'
import { card, badge, button } from './base'

// --- Fatos do domínio (não é interpretação clínica) -------------------------
export type ValueStatus = 'within' | 'below' | 'above' | 'unknown'
export type Trend = 'up' | 'down' | 'stable' | 'none'

/** Classifica um valor frente à referência fornecida (comparação factual). */
export function classifyValue(value: number, refLow?: number, refHigh?: number): ValueStatus {
  if (refLow == null && refHigh == null) return 'unknown'
  if (refLow != null && value < refLow) return 'below'
  if (refHigh != null && value > refHigh) return 'above'
  return 'within'
}

/** Tratamento visual (papéis) para um status factual. `within`/`unknown` não destacam. */
export function statusTreatment(t: SinteraTheme, status: ValueStatus): { textColor: string; soft: string | null; flagText: string | null } {
  switch (status) {
    case 'below': return { textColor: t.color.badge.info.text, soft: t.color.badge.info.soft, flagText: t.color.badge.info.text }
    case 'above': return { textColor: t.color.badge.attention.text, soft: t.color.badge.attention.soft, flagText: t.color.badge.attention.text }
    case 'unknown': return { textColor: t.color.text.muted, soft: null, flagText: null }
    default: return { textColor: t.color.text.default, soft: null, flagText: null }
  }
}

function trendIcon(t: SinteraTheme, trend: Trend): (IconSpec & { direction: Trend }) | null {
  if (trend === 'none') return null
  // direção é fato neutro → cor discreta (não sugere bom/ruim).
  return { size: 14, color: t.color.text.faint, direction: trend }
}

// --- Laboratory Table -------------------------------------------------------
// TIPO de resultado (fato do documento, não interpretação clínica): numérico (comparável à referência),
// qualitativo (descrição em palavras), ausente (não informado) e falha de leitura. A recipe dá o TRATAMENTO
// VISUAL; a COPY (rótulos, notas RDC 657) é sempre da tela — o DS não fixa texto humano.
export type LabResultKind = 'numeric' | 'qualitative' | 'missing' | 'failed'

export interface LabCellSpec {
  value: TextSpec
  unit: TextSpec
  reference: TextSpec
  flag: { backgroundColor: string; textColor: string } | null // só numérico fora da referência
  trend: (IconSpec & { direction: Trend }) | null
  alignEnd: boolean
  subdued: boolean // qualitativo/ausente/falha → apresentação discreta (não é destaque)
}
export function labValueCell(t: SinteraTheme, opts: { kind?: LabResultKind; status?: ValueStatus; trend?: Trend } = {}): LabCellSpec {
  const kind = opts.kind ?? 'numeric'
  if (kind === 'numeric') {
    const tr = statusTreatment(t, opts.status ?? 'within')
    return {
      value: { style: t.typography.numeric.primary, color: tr.textColor },
      unit: { style: t.typography.numeric.secondary, color: t.color.text.muted },
      reference: { style: t.typography.numeric.reference, color: t.color.text.faint },
      flag: tr.soft && tr.flagText ? { backgroundColor: tr.soft, textColor: tr.flagText } : null,
      trend: trendIcon(t, opts.trend ?? 'none'),
      alignEnd: true,
      subdued: false,
    }
  }
  // Não-numérico: discreto, sem flag. `failed` recebe tom de atenção (qualidade do dado, não erro clínico).
  const color = kind === 'failed' ? t.color.badge.attention.text : t.color.text.muted
  return {
    value: { style: kind === 'qualitative' ? t.typography.bodySmall : t.typography.numeric.reference, color },
    unit: { style: t.typography.numeric.secondary, color: t.color.text.faint },
    reference: { style: t.typography.numeric.reference, color: t.color.text.faint },
    flag: null,
    trend: null,
    alignEnd: kind !== 'qualitative',
    subdued: true,
  }
}
export interface LabHeaderSpec { label: TextSpec; alignEnd: boolean }
export function labHeader(t: SinteraTheme, opts: { alignEnd?: boolean } = {}): LabHeaderSpec {
  return { label: { style: t.typography.label, color: t.color.text.faint }, alignEnd: opts.alignEnd ?? false }
}
// Cabeçalho de grupo da tabela — agrupamento material → exame (fiel ao documento). A tela fornece os rótulos.
export interface LabGroupHeaderSpec { title: TextSpec; iconColor: string; level: 'material' | 'exam' }
export function labGroupHeader(t: SinteraTheme, opts: { level?: 'material' | 'exam' } = {}): LabGroupHeaderSpec {
  const level = opts.level ?? 'material'
  return {
    title: level === 'material'
      ? { style: t.typography.label, color: t.color.text.default }
      : { style: t.typography.caption, color: t.color.text.muted },
    iconColor: t.color.identity.primary,
    level,
  }
}

// --- Timeline ---------------------------------------------------------------
export type TimelineKind = 'event' | 'monitoring' | 'medication'
export interface TimelineRowSpec {
  node: { color: string; ringColor: string; size: number }
  time: TextSpec; title: TextSpec; subtitle: TextSpec; tag: TextSpec
  rowPaddingY: number
}
export function timelineRow(t: SinteraTheme, opts: { kind?: TimelineKind; density?: 'compact' | 'default' | 'comfortable' } = {}): TimelineRowSpec {
  const kind = opts.kind ?? 'event'
  const nodeColor = kind === 'medication' ? t.color.timeline.medication : kind === 'monitoring' ? t.color.timeline.node : t.color.timeline.event
  return {
    node: { color: nodeColor, ringColor: t.color.surface.accent, size: 9 },
    time: { style: t.typography.numeric.secondary, color: t.color.text.faint },
    title: { style: t.typography.bodyStrong, color: t.color.text.default },
    subtitle: { style: t.typography.caption, color: t.color.text.muted },
    tag: { style: t.typography.label, color: t.color.text.link },
    rowPaddingY: t.density[opts.density ?? 'default'].rowY,
  }
}

// --- Biomarker Card ---------------------------------------------------------
export interface BiomarkerCardSpec {
  container: BoxSpec
  name: TextSpec; value: TextSpec; unit: TextSpec; reference: TextSpec
  flag: { backgroundColor: string; textColor: string } | null
  sparklineColor: string
}
export function biomarkerCard(t: SinteraTheme, opts: { status?: ValueStatus } = {}): BiomarkerCardSpec {
  const status = opts.status ?? 'within'
  const tr = statusTreatment(t, status)
  return {
    container: card(t, { padding: 'default' }).container,
    name: { style: t.typography.label, color: t.color.text.muted },
    value: { style: t.typography.numeric.large, color: tr.textColor },
    unit: { style: t.typography.numeric.secondary, color: t.color.text.muted },
    reference: { style: t.typography.numeric.reference, color: t.color.text.faint },
    flag: tr.soft && tr.flagText ? { backgroundColor: tr.soft, textColor: tr.flagText } : null,
    sparklineColor: status === 'within' || status === 'unknown' ? t.color.chart.primary : t.color.chart.alert,
  }
}

// --- Indicator (KPI) --------------------------------------------------------
export interface IndicatorSpec { value: TextSpec; label: TextSpec; delta: { color: string; direction: Trend } }
export function indicator(t: SinteraTheme, opts: { trend?: Trend } = {}): IndicatorSpec {
  return {
    value: { style: t.typography.numeric.large, color: t.color.text.default },
    label: { style: t.typography.label, color: t.color.text.muted },
    delta: { color: t.color.text.faint, direction: opts.trend ?? 'none' },
  }
}

// --- Health Event -----------------------------------------------------------
export interface HealthEventSpec { container: BoxSpec; icon: IconSpec; title: TextSpec; meta: TextSpec }
export function healthEvent(t: SinteraTheme): HealthEventSpec {
  return {
    container: card(t, { padding: 'cozy', elevation: 'none' }).container,
    icon: { size: 20, color: t.color.identity.primary },
    title: { style: t.typography.bodyStrong, color: t.color.text.default },
    meta: { style: t.typography.caption, color: t.color.text.muted },
  }
}

// --- Longitudinal Chart -----------------------------------------------------
export interface LongitudinalChartSpec { series: string; positive: string; alert: string; grid: string; axis: TextSpec }
export function longitudinalChart(t: SinteraTheme): LongitudinalChartSpec {
  return {
    series: t.color.chart.primary,
    positive: t.color.chart.positive,
    alert: t.color.chart.alert,
    grid: t.color.chart.grid,
    axis: { style: t.typography.caption, color: t.color.text.faint },
  }
}

// --- Clinical Document Card -------------------------------------------------
export interface DocumentCardSpec {
  container: BoxSpec
  docTypeBadge: ReturnType<typeof badge>
  title: TextSpec; source: TextSpec
  action: ReturnType<typeof button>
}
export function clinicalDocumentCard(t: SinteraTheme): DocumentCardSpec {
  return {
    container: card(t).container,
    docTypeBadge: badge(t, { tone: 'info' }),
    title: { style: t.typography.cardTitle, color: t.color.text.default },
    source: { style: t.typography.caption, color: t.color.text.muted },
    action: button(t, { variant: 'ghost', size: 'sm' }), // "Ver documento original"
  }
}

// --- Observation Card (FHIR Observation) ------------------------------------
export type ReliabilityTier = 'clinical' | 'consumer' | 'self'
export interface ObservationCardSpec {
  container: BoxSpec
  value: TextSpec; unit: TextSpec; source: TextSpec; timestamp: TextSpec
  tierColor: string
}
export function observationCard(t: SinteraTheme, opts: { tier?: ReliabilityTier } = {}): ObservationCardSpec {
  const tier = opts.tier ?? 'consumer'
  const tierColor = tier === 'clinical' ? t.color.badge.success.fill : tier === 'consumer' ? t.color.identity.primary : t.color.text.faint
  return {
    container: card(t, { padding: 'cozy' }).container,
    value: { style: t.typography.numeric.primary, color: t.color.text.default },
    unit: { style: t.typography.numeric.secondary, color: t.color.text.muted },
    source: { style: t.typography.caption, color: t.color.text.muted },
    timestamp: { style: t.typography.numeric.reference, color: t.color.text.faint },
    tierColor,
  }
}
