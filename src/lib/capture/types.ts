// ============================================================
// Centro de Entrada de Documentos — CONTRATOS (Trilha B, sem domínio)
// ============================================================
// Orquestra a captura: Documento → Classificação → Prévia → Confirmação →
// Encaminhamento → pipeline ESPECÍFICO (já existente). Esta camada NÃO cria evento,
// NÃO escreve no catálogo, NÃO decide domínio (Estado 2). Apenas conduz o documento
// até o fluxo correto. Cada tipo é tratado por um DocumentProcessor desacoplado.
// ============================================================

/** Tipos de documento que o Centro de Entrada reconhece (+ desconhecido). */
export type DocumentKind =
  | 'exam'                   // exame
  | 'lab_report'             // laudo
  | 'medication_label'       // rótulo/receita de medicamento ou suplemento
  | 'eyeglass_prescription'  // receita de óculos/lentes
  | 'unknown'

/** Resultado FACTUAL da classificação — a UI mostra e pede confirmação. */
export interface ClassificationResult {
  kind: DocumentKind
  confidence: 'high' | 'medium' | 'low'
  /** Pista factual que levou ao palpite (para a UI explicar). Opcional. */
  reason?: string
}

/**
 * Contrato de um processador de documento. O Centro de Entrada conversa SÓ com esta
 * interface; cada processador evolui de forma independente e encaminha para o pipeline
 * que JÁ existe (sem alterá-lo). `target` é a rota/destino do encaminhamento.
 */
export interface DocumentProcessor {
  kind: Exclude<DocumentKind, 'unknown'>
  /** Rótulo para a usuária (sem jargão técnico). */
  label: string
  /** Nome do ícone (lucide) — a UI resolve o componente. */
  icon: string
  /** MIME types aceitos por este processador. */
  accepts: string[]
  /** Destino do encaminhamento (pipeline existente). */
  target: string
  /** Frase de confirmação: "Detectamos que parece ser {confirmPhrase}." */
  confirmPhrase: string
}
