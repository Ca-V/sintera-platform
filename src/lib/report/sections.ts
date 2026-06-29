// ════════ ReportSections — ESTRUTURA LÓGICA do relatório (fonte ÚNICA) ════════
// Consumida pelas DUAS telas (dashboard `relatorio` e público `r/[token]`): o mesmo
// documento tem a mesma estrutura. Separa 3 conceitos (ADR-013 / decisão PO 29/06):
//   • HealthPresentationConfig (lib/catalog) → organiza a INTERFACE (label/ícone/cor).
//   • ReportSections (este arquivo)          → ESTRUTURA lógica (dimensões + seções).
//   • normalizeReportSections (este arquivo) → ADAPTADOR de compatibilidade (v1→v2),
//        para que o compartilhamento (report_shares) sobreviva a mudanças de estrutura
//        sem espalhar `if (section === 'medicamentos')` pela UI.
//
// Duas DIMENSÕES (ADR-013): Estado Atual (fotografia, sempre) × Histórico (cronologia,
// filtrável por período no futuro).

export type ReportSectionKey =
  | 'condicoes' | 'medicamento' | 'suplemento' | 'produto' | 'dispositivo' | 'habitos'
  | 'medidasAtuais' | 'sinaisAtuais' | 'ultimosExames'
  | 'eventos' | 'exames' | 'omica' | 'medidasEvolucao' | 'sinaisEvolucao'

export type ReportDimensionId = 'estado_atual' | 'historico'

export interface ReportDimension {
  id: ReportDimensionId
  title: string
  sections: { key: ReportSectionKey; label: string }[]
}

export const REPORT_DIMENSIONS: ReportDimension[] = [
  {
    id: 'estado_atual', title: 'Estado Atual',
    sections: [
      { key: 'condicoes',     label: 'Condições' },
      { key: 'medicamento',   label: 'Medicamentos' },
      { key: 'suplemento',    label: 'Suplementos' },
      { key: 'produto',       label: 'Produtos' },
      { key: 'dispositivo',   label: 'Dispositivos' }, // Óculos/Lentes/Outros aninhados no corpo
      { key: 'habitos',       label: 'Hábitos' },
      { key: 'medidasAtuais', label: 'Medidas atuais' },
      { key: 'sinaisAtuais',  label: 'Sinais vitais atuais' },
      { key: 'ultimosExames', label: 'Últimos exames' },
    ],
  },
  {
    id: 'historico', title: 'Histórico',
    sections: [
      { key: 'eventos',        label: 'Consultas, procedimentos e eventos' },
      { key: 'exames',         label: 'Exames' },
      { key: 'omica',          label: 'Exames de ômica' },
      { key: 'medidasEvolucao',label: 'Evolução das medidas' },
      { key: 'sinaisEvolucao', label: 'Evolução dos sinais vitais' },
    ],
  },
]

export const ALL_REPORT_SECTION_KEYS: ReportSectionKey[] =
  REPORT_DIMENSIONS.flatMap(d => d.sections.map(s => s.key))

/** Seleção padrão: tudo marcado. */
export function defaultReportSelection(): Record<ReportSectionKey, boolean> {
  return Object.fromEntries(ALL_REPORT_SECTION_KEYS.map(k => [k, true])) as Record<ReportSectionKey, boolean>
}

// ── Adaptador de compatibilidade (ÚNICO ponto de tradução v1 → v2) ──────────────
// As chaves ANTIGAS (report_shares gravados) viram as novas, preservando a intenção
// do link já compartilhado. Aqui — e SÓ aqui — vive a compatibilidade entre versões.
const LEGACY_MAP: Record<string, ReportSectionKey[]> = {
  medicamentos: ['medicamento', 'suplemento', 'produto', 'dispositivo'],
  condicoes:    ['condicoes'],
  habitos:      ['habitos'],
  visao:        ['dispositivo'],            // Óculos/Lentes passaram a ser subtipo de Dispositivos
  eventos:      ['eventos'],
  exames:       ['exames', 'ultimosExames'],
  omica:        ['omica'],
  medidas:      ['medidasAtuais', 'medidasEvolucao'],
  sinais:       ['sinaisAtuais', 'sinaisEvolucao'],
}

// Vocabulário ANTIGO (v1). Algumas chaves existem em v1 E v2 (ex.: `exames`, `condicoes`),
// por isso a tradução precisa DETECTAR A VERSÃO: se houver qualquer chave que só existe na
// v2, a lista é v2 (usa como está); senão é v1 (expande tudo pelo LEGACY_MAP, inclusive
// `exames` → exames + últimos exames).
const V1_KEYS = new Set(Object.keys(LEGACY_MAP))

/**
 * Normaliza a lista de seções (v1 antiga OU v2 nova) para chaves v2, na ordem oficial.
 * Entrada inválida/ausente → todas as seções (comportamento seguro: mostra tudo).
 */
export function normalizeReportSections(stored: unknown): ReportSectionKey[] {
  if (!Array.isArray(stored)) return [...ALL_REPORT_SECTION_KEYS]
  const raws = stored.map(String)
  const isV2 = raws.some(k => (ALL_REPORT_SECTION_KEYS as string[]).includes(k) && !V1_KEYS.has(k))
  const set = new Set<ReportSectionKey>()
  if (isV2) {
    for (const k of raws) if ((ALL_REPORT_SECTION_KEYS as string[]).includes(k)) set.add(k as ReportSectionKey)
  } else {
    for (const k of raws) for (const mapped of LEGACY_MAP[k] ?? []) set.add(mapped)
  }
  return ALL_REPORT_SECTION_KEYS.filter(k => set.has(k))
}

/** Serializa a seleção (v2) para gravar em report_shares. */
export function serializeReportSections(selected: Record<ReportSectionKey, boolean>): ReportSectionKey[] {
  return ALL_REPORT_SECTION_KEYS.filter(k => selected[k])
}
