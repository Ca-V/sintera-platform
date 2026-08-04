// Taxonomia ÚNICA de métodos contraceptivos (SSOT). Consumida pelo módulo Ciclo
// (/dashboard/ciclo) e pelo Relatório — nenhuma tela reimplementa a lista.
export const CONTRACEPTIVE_KINDS: { value: string; label: string; months: number | null }[] = [
  { value: 'diu_cobre',    label: 'DIU de cobre',                   months: 120 },
  { value: 'diu_hormonal', label: 'DIU hormonal (Mirena, Kyleena)', months: 60 },
  { value: 'implante',     label: 'Implante (Implanon, Nexplanon)', months: 36 },
  { value: 'injecao',      label: 'Injeção',                        months: 3 },
  { value: 'anel',         label: 'Anel vaginal',                   months: 1 },
  { value: 'adesivo',      label: 'Adesivo',                        months: 1 },
  { value: 'pilula',       label: 'Pílula',                         months: null },
  { value: 'outro',        label: 'Outro',                          months: null },
]

export const contraceptiveLabel = (k: string): string =>
  CONTRACEPTIVE_KINDS.find(x => x.value === k)?.label ?? 'Método'

// CTC-001 — NATUREZA do método (discriminador derivado do kind; SSOT). Hormonais são funcionalmente medicamentos
// (projetam em Medicamentos); dispositivos vinculam a Recursos/Dispositivos. Regra de propriedade: o fato
// pertence ao Ciclo; os demais módulos apenas projetam/referenciam (nunca duplicam).
export type ContraceptiveNature = 'hormonal' | 'dispositivo' | 'outro'
const CONTRACEPTIVE_NATURE: Record<string, ContraceptiveNature> = {
  pilula: 'hormonal', injecao: 'hormonal', anel: 'hormonal', adesivo: 'hormonal',
  diu_cobre: 'dispositivo', diu_hormonal: 'dispositivo', implante: 'dispositivo',
  outro: 'outro',
}
export const contraceptiveNature = (kind: string): ContraceptiveNature => CONTRACEPTIVE_NATURE[kind] ?? 'outro'
export const isHormonalContraceptive = (kind: string): boolean => contraceptiveNature(kind) === 'hormonal'
export const isDeviceContraceptive = (kind: string): boolean => contraceptiveNature(kind) === 'dispositivo'

// CTC-001 (Opção A) — CADÊNCIA de recompra/reaplicação dos métodos HORMONAIS (uso contínuo). Distinta da
// "vida útil em meses" dos dispositivos. SSOT consumido pelo formulário do Ciclo e pela projeção em Medicamentos.
export type ContraceptiveCadence = 'semanal' | 'mensal' | 'trimestral'
export const CONTRACEPTIVE_CADENCES: { value: ContraceptiveCadence; label: string; days: number }[] = [
  { value: 'semanal',    label: 'Semanal',    days: 7 },
  { value: 'mensal',     label: 'Mensal',     days: 30 },
  { value: 'trimestral', label: 'Trimestral', days: 90 },
]
export const cadenceLabel = (c: string | null | undefined): string =>
  CONTRACEPTIVE_CADENCES.find(x => x.value === c)?.label ?? ''
export const cadenceDays = (c: string | null | undefined): number | null =>
  CONTRACEPTIVE_CADENCES.find(x => x.value === c)?.days ?? null

/** Cadência sugerida por método hormonal (a usuária pode ajustar). Não-hormonais → null. */
export const defaultCadenceFor = (kind: string): ContraceptiveCadence | null => {
  switch (kind) {
    case 'pilula':  return 'mensal'      // recompra da cartela
    case 'anel':    return 'mensal'
    case 'adesivo': return 'semanal'
    case 'injecao': return 'trimestral'  // trimestral por padrão; mensal se ajustar
    default:        return null
  }
}

/** Rótulo curto de uso para listagens/projeção (ex.: "Recompra mensal"). Vazio se não houver cadência. */
export const cadenceUsageLabel = (c: string | null | undefined): string => {
  const l = cadenceLabel(c)
  return l ? `Recompra ${l.toLowerCase()}` : ''
}

/** Rótulo de CATEGORIA para listagens (ex.: em Medicamentos, identificar claramente o uso contraceptivo). */
export const contraceptiveCategoryLabel = (kind: string): string =>
  contraceptiveNature(kind) === 'hormonal' ? 'Contracepção hormonal'
    : contraceptiveNature(kind) === 'dispositivo' ? 'Dispositivo contraceptivo'
    : 'Contracepção'

/** Rótulo CONTEXTUAL da Timeline para o INÍCIO do método (preserva a natureza original — CTC-001 §Timeline). */
export const contraceptiveStartLabel = (kind: string): string => {
  switch (kind) {
    case 'diu_cobre':
    case 'diu_hormonal': return `Inserção do ${contraceptiveLabel(kind)}`
    case 'implante':     return 'Colocação do implante'
    case 'injecao':      return 'Início da injeção anticoncepcional'
    case 'anel':         return 'Início do anel vaginal'
    case 'adesivo':      return 'Início do adesivo anticoncepcional'
    case 'pilula':       return 'Início do anticoncepcional'
    default:             return `Início do método contraceptivo (${contraceptiveLabel(kind)})`
  }
}

/** Rótulo CONTEXTUAL da Timeline para a SUSPENSÃO/REMOÇÃO do método. */
export const contraceptiveStopLabel = (kind: string): string => {
  switch (kind) {
    case 'diu_cobre':
    case 'diu_hormonal': return `Remoção do ${contraceptiveLabel(kind)}`
    case 'implante':     return 'Remoção do implante'
    default:             return `Suspensão do método contraceptivo (${contraceptiveLabel(kind)})`
  }
}
