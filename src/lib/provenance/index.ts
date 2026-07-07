// ============================================================
// Camada de Proveniência (rastreabilidade documental) — SINTERA
// ============================================================
// CAPACIDADE TRANSVERSAL DO DOMÍNIO — não pertence ao Relatório nem a nenhum
// módulo. Todo módulo apenas implementa um ADAPTADOR para esta camada; nunca cria
// sua própria lógica de origem.
//
// Hierarquia OFICIAL de proveniência (5 níveis):
//   1. Informação apresentada
//   2. Origem da informação            → SourceKind
//   3. Documento original (se existir)  → DocumentMeta.url
//   4. Metadados do documento           → DocumentMeta (tipo, data, emissor, versão…)
//   5. Referências científicas (futuro) → ScientificReference[]  (KG v2 / SRL, ADR-017)
//
// Os níveis 4 e 5 já estão previstos na estrutura (evolução sem refação); nem tudo
// é preenchido hoje. Consumidores: Relatório (1º), Histórico, Timeline, Exames,
// Medicamentos, Recursos e, futuramente, KG v2 / SRL / IA Contextual.
//
// REGRA ARQUITETURAL DEFINITIVA: sempre que uma informação possuir um documento de
// origem, esse documento DEVE estar acessível ("Ver documento original") em QUALQUER
// consumidor da Camada de Comunicação (Relatório · PDF · compartilhamento · impressão
// · Timeline compartilhada · integrações), pela MESMA lógica, sem implementação
// específica por módulo. Quando um fluxo passar a armazenar o documento (ex.: ômica,
// receitas de medicamentos), o link aparece automaticamente — basta o adaptador
// popular `document.url`.
// ============================================================

// ── Nível 2 — origem ──────────────────────────────────────────────────────────
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

// ── Níveis 3–4 — documento original + metadados ───────────────────────────────
export interface DocumentMeta {
  url?: string | null          // Nível 3: documento original (PDF/imagem). Ausente = sem link.
  // Nível 4: metadados (PREVISÃO — nem tudo preenchido hoje):
  type?: string | null         // tipo do documento (laudo, receita, exame…)
  date?: string | null         // data do documento
  issuer?: string | null       // emissor
  source?: string | null       // laboratório / clínica / profissional
  version?: string | null      // versão
  language?: string | null     // idioma
  hash?: string | null         // checksum (futuro)
  ocr?: string | null          // OCR utilizado (futuro)
  extractionConfidence?: number | null  // confiança da extração (futuro)
}

// ── Nível 5 — referências científicas (FUTURO: alimentado pelo KG v2 / SRL) ────
export interface ScientificReference {
  id?: string
  title?: string
  source?: string      // diretriz · artigo · consenso · protocolo…
  identifier?: string  // DOI / PMID
  version?: string
  url?: string
}

/** Proveniência de UMA informação (os 5 níveis). Sem documento → nunca link fictício. */
export interface Provenance {
  kind: SourceKind                        // nível 2
  issuer?: string | null                  // emissor/fonte da informação
  date?: string | null                    // data da informação
  document?: DocumentMeta | null          // níveis 3–4
  references?: ScientificReference[]       // nível 5 (futuro — KG/SRL)
}

export const sourceLabel = (k: SourceKind): string => SOURCE_LABELS[k]
export const hasDocument = (p: Provenance | null | undefined): boolean => !!p?.document?.url
export const documentUrl = (p: Provenance | null | undefined): string | null => p?.document?.url ?? null
export const hasReferences = (p: Provenance | null | undefined): boolean => !!p?.references?.length

// ── Adaptadores por entidade (fonte ÚNICA; reutilizados por todos os módulos) ──

export function examProvenance(i: { fileUrl?: string | null; lab?: string | null; date?: string | null }): Provenance {
  return {
    kind: 'exame_laboratorial',
    issuer: i.lab ?? null,
    date: i.date ?? null,
    document: i.fileUrl ? { url: i.fileUrl, type: 'exame', source: i.lab ?? null, date: i.date ?? null } : null,
  }
}

export function medicationProvenance(i: { prescriber?: string | null; fileUrl?: string | null }): Provenance {
  if (i.fileUrl) {
    return { kind: 'receita_medica', issuer: i.prescriber ?? null, document: { url: i.fileUrl, type: 'receita', issuer: i.prescriber ?? null } }
  }
  return { kind: i.prescriber ? 'receita_medica' : 'autorrelato', issuer: i.prescriber ?? null, document: null }
}

export function resourceProvenance(i: { fileUrl?: string | null; prescriber?: string | null }): Provenance {
  return {
    kind: i.fileUrl ? 'documento_usuario' : 'autorrelato',
    issuer: i.prescriber ?? null,
    document: i.fileUrl ? { url: i.fileUrl, issuer: i.prescriber ?? null } : null,
  }
}

/** Informação registrada manualmente pela pessoa (condições, medidas, hábitos…). */
export const selfReportProvenance = (issuer?: string | null): Provenance =>
  ({ kind: 'autorrelato', issuer: issuer ?? null, document: null })
