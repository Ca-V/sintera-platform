// ============================================================
// Centro de Entrada de Documentos — CONTRATOS (Trilha B, sem domínio)
// ============================================================
// Camadas isoladas (PO 30/06):
//   Documento → Intake (UX) → Classifier (identifica) → Processor (encaminha) → Pipeline existente
// Esta camada NÃO cria evento, NÃO escreve catálogo, NÃO decide domínio (Estado 2).
// ============================================================

/** O que a usuária deseja adicionar (intenção) + classificações auxiliares. */
export type DocumentKind =
  | 'exam'                   // exame
  | 'medication_label'       // receita/rótulo de medicamento ou suplemento
  | 'eyeglass_prescription'  // receita de óculos/lentes
  | 'omics'                  // exame ômico (pipeline próprio)
  | 'other'                  // outro documento
  | 'unknown'                // classificador não identificou

/** Como a usuária deseja enviar (método de entrada). */
export type IntakeMethod = 'pdf' | 'photo' | 'gallery'

/** Resultado FACTUAL da classificação — a UI mostra e pede confirmação. */
export interface ClassificationResult {
  kind: DocumentKind
  confidence: 'high' | 'medium' | 'low'
  /** Pista factual que levou ao palpite (para a UI explicar). Opcional. */
  reason?: string
}

/**
 * Contrato de um processador de documento. O Intake conversa SÓ com esta interface;
 * cada processador evolui isolado e encaminha para o pipeline que JÁ existe (sem
 * alterá-lo). `target` = rota/destino do encaminhamento.
 */
export interface DocumentProcessor {
  kind: Exclude<DocumentKind, 'unknown' | 'other'>
  /** Rótulo pela INTENÇÃO da usuária ("O que deseja adicionar?"). Sem jargão. */
  label: string
  /** Nome do ícone (lucide) — a UI resolve o componente. */
  icon: string
  /** MIME types aceitos. */
  accepts: string[]
  /** Destino do encaminhamento (pipeline existente). */
  target: string
  /** Frase de confirmação (V0.1+): "Detectamos que parece ser {confirmPhrase}." */
  confirmPhrase: string
}
