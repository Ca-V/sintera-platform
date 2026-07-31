// @sintera/api-client — Contrato do domínio Exames (ESCRITA). SEPARADO da leitura (types.ts) por decisão
// arquitetural da fundadora (31/07): "manter separação clara entre operações". Fluxo em DUAS etapas —
// (1) uploadExam sobe o arquivo físico ao Storage e devolve o identificador/URL; (2) createExam persiste os
// metadados do exame apontando para esse arquivo. Desacopla armazenamento e domínio de negócio.
//
// ESTADO: contrato DEFINIDO (Inc.6) — implementação concreta só APÓS o aceite do Inc.5 (gate) + as decisões
// de infra (bucket/RLS/dep nativa). Ver docs/MOBILE-027 e docs/API_CONTRACTS.md.
//
// Convenção de escrita do pacote: NÃO lança; retorna `{ data, error }` (erro operacional em `error`).

/** Resultado do upload físico. `storagePath` é o IDENTIFICADOR gerado pelo backend (nunca o nome do arquivo —
 *  requisito de segurança da fundadora). `url` é a referência para visualização (assinada/derivada). */
export interface UploadResult {
  storagePath: string
  url: string
  mimeType: string
  sizeBytes: number
}

/** Metadados do exame a persistir, referenciando o arquivo já enviado. Enxuto e FACTUAL (REG-001: documento,
 *  não resultado interpretado). Campos de exibição opcionais; a referência ao arquivo é obrigatória. */
export interface CreateExamInput {
  storagePath: string
  url: string
  mimeType: string
  sizeBytes: number
  display_title?: string | null
  exam_date?: string | null
  document_type?: string | null
  issuer?: string | null
}

/** Restrições validadas ANTES do upload (requisito não-funcional — fundadora 31/07). */
export interface UploadConstraints {
  maxBytes: number
  allowedMimeTypes: readonly string[]
  allowedExtensions: readonly string[] // sem ponto, minúsculas (ex.: 'pdf')
}

/** Padrão conservador para documentos de saúde (PDF + imagens comuns de laudo). Ajustável no Inc.6. */
export const DEFAULT_UPLOAD_CONSTRAINTS: UploadConstraints = {
  maxBytes: 20 * 1024 * 1024, // 20 MB
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'],
  allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'heic'],
}

/** API pública do domínio Exames — ESCRITA. Web/Mobile consumirão via ApiClient.exams (nunca Supabase direto).
 *  Contrato definido; entra no ApiClient concreto (com bump MINOR em API_CONTRACTS) na implementação do Inc.6. */
export interface ExamsWriteApi {
  /** Sobe o arquivo ao Storage. Gera identificador próprio; valida permissões/RLS no backend. */
  uploadExam(file: { uri: string; mimeType: string; sizeBytes: number }, signal?: AbortSignal): Promise<{ data: UploadResult | null; error: Error | null }>
  /** Persiste os metadados do exame apontando para o arquivo enviado. */
  createExam(input: CreateExamInput, signal?: AbortSignal): Promise<{ data: { id: string } | null; error: Error | null }>
}
