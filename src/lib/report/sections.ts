// ════════ ReportSections — ESTRUTURA LÓGICA do relatório (fonte ÚNICA) ════════
// Consumida pelas DUAS telas (dashboard `relatorio` e público `r/[token]`): o mesmo
// documento, a mesma estrutura. Separa 3 conceitos (ADR-013):
//   • HealthPresentationConfig (lib/catalog) → INTERFACE (label/ícone/cor).
//   • ReportSections (este arquivo)          → ESTRUTURA lógica (dimensões + seções).
//   • normalize* (este arquivo)              → ADAPTADOR de compatibilidade dos links.
//
// DOIS MARCOS (decisão PO 29/06 — separar arquitetura de UX):
//   • V1 (ATIVO, Marco 1): a estrutura ATUAL (Minha Saúde / Meu Perfil). Os dois
//     renderizadores passam a consumir ISTO — sem mudança visual. Unifica a renderização.
//   • V2 (Marco 2): a nova organização (Estado Atual × Histórico, tipos separados,
//     snapshots). Trocar V1→V2 ativa a evolução, uma vez, nos dois renderizadores.

export type ReportDimension<K extends string> = {
  id: string
  title: string
  sections: { key: K; label: string }[]
}

/** Árvore LÓGICA de seções visíveis (independe de HTML/CSS) — base do teste de
 *  equivalência: dashboard e público devem produzir a MESMA árvore. */
export type ReportTree = { group: string; keys: string[] }[]

// ── INTENÇÃO ARQUITETURAL (não implementar agora — decisão PO 29/06) ──────────────
// `buildReportData()`: produzir uma REPRESENTAÇÃO do relatório INDEPENDENTE DA INTERFACE
// (árvore rica: Section → Subsection → Item com valores), a ser criada QUANDO surgir o
// primeiro consumidor que NÃO seja um renderizador React — PDF, IA, impressão, API,
// app móvel. Hoje os 2 renderizadores compartilham a ESTRUTURA (REPORT_DIMENSIONS +
// buildReportTree) e divergem só na estilização (Tailwind × inline email-safe), o que
// já resolve o problema arquitetural central (uma única definição da estrutura). Antes
// de um 3º consumidor, um objeto data-rich AUMENTA complexidade em vez de reduzir.
// (Mesma régua de mode/FSM/HealthTaxonomy/FormShell: abstrair quando o consumidor é real.)

export function buildReportTree<K extends string>(
  dimensions: ReportDimension<K>[],
  selected: Record<string, boolean>,
): ReportTree {
  return dimensions
    .map(d => ({ group: d.title, keys: d.sections.map(s => s.key).filter(k => selected[k]) }))
    .filter(g => g.keys.length > 0)
}

// ════════════════════════ V1 — Marco 1 (ATIVO) ════════════════════════
// Estrutura ATUAL. Mesmas chaves/rótulos/ordem que o relatório usa hoje (REV-16).
export type ReportSectionKeyV1 =
  | 'eventos' | 'exames' | 'omica' | 'medicamentos'
  | 'condicoes' | 'habitos' | 'medidas' | 'sinais' | 'visao'

export const REPORT_DIMENSIONS_V1: ReportDimension<ReportSectionKeyV1>[] = [
  {
    id: 'minha_saude', title: 'Minha Saúde',
    sections: [
      { key: 'eventos',      label: 'Consultas e eventos' },
      { key: 'exames',       label: 'Exames' },
      { key: 'omica',        label: 'Exames de ômica' },
      { key: 'medicamentos', label: 'Medicamentos, Suplementos, Produtos e Dispositivos' },
    ],
  },
  {
    id: 'meu_perfil', title: 'Meu Perfil',
    sections: [
      { key: 'condicoes', label: 'Problemas de Saúde' },
      { key: 'habitos',   label: 'Hábitos' },
      { key: 'medidas',   label: 'Medidas Corporais' },
      { key: 'sinais',    label: 'Sinais Vitais' },
      { key: 'visao',     label: 'Óculos e lentes' },
    ],
  },
]

export const ALL_SECTION_KEYS_V1: ReportSectionKeyV1[] =
  REPORT_DIMENSIONS_V1.flatMap(d => d.sections.map(s => s.key))

export function defaultReportSelectionV1(): Record<ReportSectionKeyV1, boolean> {
  return Object.fromEntries(ALL_SECTION_KEYS_V1.map(k => [k, true])) as Record<ReportSectionKeyV1, boolean>
}

/** Compatibilidade V1: aceita chaves gravadas (report_shares) e devolve as válidas na
 *  ordem oficial. Entrada inválida/ausente → todas (seguro). ÚNICO ponto de tradução. */
export function normalizeReportSectionsV1(stored: unknown): ReportSectionKeyV1[] {
  if (!Array.isArray(stored)) return [...ALL_SECTION_KEYS_V1]
  const set = new Set(stored.map(String))
  const out = ALL_SECTION_KEYS_V1.filter(k => set.has(k))
  return out.length > 0 ? out : [...ALL_SECTION_KEYS_V1]
}

/** Serializa a seleção (V1) para gravar em report_shares. */
export function serializeReportSectionsV1(selected: Record<ReportSectionKeyV1, boolean>): ReportSectionKeyV1[] {
  return ALL_SECTION_KEYS_V1.filter(k => selected[k])
}

// ════════════════════════ V2 — Marco 2 (alvo, dormente) ════════════════════════
// Nova organização (Estado Atual × Histórico, tipos separados, snapshots). Pronta para
// o Marco 2; não consumida ainda. O adaptador V1→V2 traduz os links antigos quando ativarmos.
export type ReportSectionKeyV2 =
  | 'condicoes' | 'medicamento' | 'suplemento' | 'produto' | 'dispositivo' | 'habitos'
  | 'medidasAtuais' | 'sinaisAtuais' | 'ultimosExames'
  | 'eventos' | 'exames' | 'omica' | 'medidasEvolucao' | 'sinaisEvolucao'

export const REPORT_DIMENSIONS_V2: ReportDimension<ReportSectionKeyV2>[] = [
  {
    id: 'estado_atual', title: 'Estado Atual',
    sections: [
      { key: 'condicoes',     label: 'Problemas de Saúde' },
      { key: 'medicamento',   label: 'Medicamentos' },
      { key: 'suplemento',    label: 'Suplementos' },
      { key: 'produto',       label: 'Produtos' },
      { key: 'dispositivo',   label: 'Dispositivos' },
      { key: 'habitos',       label: 'Hábitos' },
      { key: 'medidasAtuais', label: 'Medidas atuais' },
      { key: 'sinaisAtuais',  label: 'Sinais vitais atuais' },
      { key: 'ultimosExames', label: 'Últimos exames' },
    ],
  },
  {
    id: 'historico', title: 'Histórico',
    sections: [
      { key: 'eventos',         label: 'Consultas, procedimentos e eventos' },
      { key: 'exames',          label: 'Exames' },
      { key: 'omica',           label: 'Exames de ômica' },
      { key: 'medidasEvolucao', label: 'Evolução das medidas' },
      { key: 'sinaisEvolucao',  label: 'Evolução dos sinais vitais' },
    ],
  },
]

export const ALL_SECTION_KEYS_V2: ReportSectionKeyV2[] =
  REPORT_DIMENSIONS_V2.flatMap(d => d.sections.map(s => s.key))

export function defaultReportSelectionV2(): Record<ReportSectionKeyV2, boolean> {
  return Object.fromEntries(ALL_SECTION_KEYS_V2.map(k => [k, true])) as Record<ReportSectionKeyV2, boolean>
}

/** Serializa a seleção (V2) para gravar em report_shares. */
export function serializeReportSectionsV2(selected: Record<ReportSectionKeyV2, boolean>): ReportSectionKeyV2[] {
  return ALL_SECTION_KEYS_V2.filter(k => selected[k])
}

// Vocabulário V1 → V2 (expansão). Detecção de versão: se há chave que só existe em V2,
// a lista já é V2; senão é V1 e expande tudo (inclusive `exames` → exames + últimos).
const LEGACY_V1_TO_V2: Record<string, ReportSectionKeyV2[]> = {
  medicamentos: ['medicamento', 'suplemento', 'produto', 'dispositivo'],
  condicoes:    ['condicoes'],
  habitos:      ['habitos'],
  visao:        ['dispositivo'],
  eventos:      ['eventos'],
  exames:       ['exames', 'ultimosExames'],
  omica:        ['omica'],
  medidas:      ['medidasAtuais', 'medidasEvolucao'],
  sinais:       ['sinaisAtuais', 'sinaisEvolucao'],
}
const V1_VOCAB = new Set(Object.keys(LEGACY_V1_TO_V2))

/** Marco 2: normaliza V1 antiga OU V2 nova para chaves V2, na ordem oficial. */
export function normalizeReportSectionsV2(stored: unknown): ReportSectionKeyV2[] {
  if (!Array.isArray(stored)) return [...ALL_SECTION_KEYS_V2]
  const raws = stored.map(String)
  const isV2 = raws.some(k => (ALL_SECTION_KEYS_V2 as string[]).includes(k) && !V1_VOCAB.has(k))
  const set = new Set<ReportSectionKeyV2>()
  if (isV2) {
    for (const k of raws) if ((ALL_SECTION_KEYS_V2 as string[]).includes(k)) set.add(k as ReportSectionKeyV2)
  } else {
    for (const k of raws) for (const mapped of LEGACY_V1_TO_V2[k] ?? []) set.add(mapped)
  }
  return ALL_SECTION_KEYS_V2.filter(k => set.has(k))
}
