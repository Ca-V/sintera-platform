// ============================================================
// Camada de Proveniência (rastreabilidade documental) — SINTERA
// ============================================================
// Infraestrutura REUTILIZÁVEL por toda a plataforma. Princípio: toda informação
// exibida tem uma ORIGEM oficial e, quando existir, um DOCUMENTO ORIGINAL.
// Hierarquia única:  Informação exibida → Origem → Documento original (se houver).
//
// Consumidores: Relatório (primeiro), Histórico, Timeline, Exames, Medicamentos,
// Recursos de Saúde e, futuramente, KG v2 / SRL / IA Contextual (coerente com o
// ADR-017 — Proveniência Científica). NÃO criar solução específica por módulo:
// todos consomem esta camada. O documento original é a origem oficial da
// informação, não um mero anexo.
// ============================================================

export type SourceKind =
  | 'documento_usuario'
  | 'exame_laboratorial'
  | 'receita_medica'
  | 'laudo'
  | 'autorrelato'
  | 'registro_manual'
  | 'dispositivo_wearable'   // futuro (wearables)
  | 'importacao_externa'     // futuro (integrações)

export const SOURCE_LABELS: Record<SourceKind, string> = {
  documento_usuario:    'Documento enviado',
  exame_laboratorial:   'Exame laboratorial',
  receita_medica:       'Receita médica',
  laudo:                'Laudo',
  autorrelato:          'Autorrelato',
  registro_manual:      'Registro manual',
  dispositivo_wearable: 'Dispositivo / wearable',
  importacao_externa:   'Importação externa',
}

/**
 * Proveniência de UMA informação.
 * `documentUrl` ausente/null = sem documento → NUNCA criar link fictício; exibir só a origem.
 */
export interface Provenance {
  kind: SourceKind
  documentUrl?: string | null
  issuer?: string | null   // laboratório, clínica, prescritor, dispositivo…
  date?: string | null
}

export const sourceLabel = (k: SourceKind): string => SOURCE_LABELS[k]
export const hasDocument = (p: Provenance | null | undefined): boolean => !!p?.documentUrl

// ── Adaptadores por entidade (fonte ÚNICA; reutilizados por todos os módulos) ──

export function examProvenance(i: { fileUrl?: string | null; lab?: string | null; date?: string | null }): Provenance {
  return { kind: 'exame_laboratorial', documentUrl: i.fileUrl ?? null, issuer: i.lab ?? null, date: i.date ?? null }
}

export function medicationProvenance(i: { prescriber?: string | null; fileUrl?: string | null }): Provenance {
  if (i.fileUrl) return { kind: 'receita_medica', documentUrl: i.fileUrl, issuer: i.prescriber ?? null }
  return { kind: i.prescriber ? 'receita_medica' : 'autorrelato', documentUrl: null, issuer: i.prescriber ?? null }
}

export function resourceProvenance(i: { fileUrl?: string | null; prescriber?: string | null }): Provenance {
  return { kind: i.fileUrl ? 'documento_usuario' : 'autorrelato', documentUrl: i.fileUrl ?? null, issuer: i.prescriber ?? null }
}

/** Informação registrada manualmente pela pessoa (condições, medidas, hábitos…). */
export const selfReportProvenance = (issuer?: string | null): Provenance =>
  ({ kind: 'autorrelato', documentUrl: null, issuer: issuer ?? null })
