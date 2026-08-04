// @sintera/core — taxonomia PURA de Recursos de Saúde (tipos + status). Fonte ÚNICA (Web + Mobile).
// Recurso = dispositivo/apoio de saúde (correção visual, dispositivo médico, prótese/órtese, auxílio…).

export type ResourceType = 'correcao_visual' | 'dispositivo_medico' | 'protese_ortese' | 'auxilio' | 'compressao_suporte' | 'outro'
export type ResourceStatus = 'em_uso' | 'suspenso' | 'encerrado'
export type VisionKind = 'oculos' | 'lentes_contato'

export const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'correcao_visual',    label: 'Correção visual' },
  { value: 'dispositivo_medico', label: 'Dispositivo médico' },
  { value: 'protese_ortese',     label: 'Prótese / órtese' },
  { value: 'auxilio',            label: 'Auxílio' },
  { value: 'compressao_suporte', label: 'Compressão / suporte' },
  { value: 'outro',              label: 'Outro' },
]

export const RESOURCE_STATUSES: { value: ResourceStatus; label: string }[] = [
  { value: 'em_uso',    label: 'Em uso' },
  { value: 'suspenso',  label: 'Suspenso' },
  { value: 'encerrado', label: 'Encerrado' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(RESOURCE_TYPES.map(r => [r.value, r.label]))
const STATUS_LABELS: Record<string, string> = Object.fromEntries(RESOURCE_STATUSES.map(r => [r.value, r.label]))

export function resourceTypeLabel(v: string | null | undefined): string { return TYPE_LABELS[(v ?? '').trim()] ?? 'Outro' }
export function resourceStatusLabel(v: string | null | undefined): string { return STATUS_LABELS[(v ?? '').trim()] ?? 'Em uso' }

/** Resumo curto de uma prescrição de correção visual a partir dos `attributes`. Puro. Null se vazio. */
export function visionSummary(attributes: Record<string, unknown> | null | undefined): string | null {
  if (!attributes) return null
  const od = attributes.od as Record<string, string> | undefined
  const oe = attributes.oe as Record<string, string> | undefined
  const part = (label: string, o?: Record<string, string>) => {
    if (!o || Object.keys(o).length === 0) return null
    const bits = [o.sph && `esf ${o.sph}`, o.cyl && `cil ${o.cyl}`, o.axis && `eixo ${o.axis}`, o.add && `add ${o.add}`].filter(Boolean)
    return bits.length ? `${label}: ${bits.join(' ')}` : null
  }
  return [part('OD', od), part('OE', oe)].filter(Boolean).join(' · ') || null
}
