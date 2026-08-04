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

/** Metadados do exame a persistir, referenciando o arquivo já enviado. ALINHADO ao insert da Web
 *  (`src/lib/capture/processors/exam.ts`) — MESMA regra de negócio, sem divergência:
 *    insert exams { id, user_id, type, exam_date, file_url, status:'pending' }.
 *  `id`/`user_id`/`status` são responsabilidade da IMPLEMENTAÇÃO (id gerado, user da sessão, status inicial),
 *  não do input. FACTUAL (REG-001): os campos ricos (display_title, issuer, clinical_family, document_type)
 *  são DERIVADOS pela extração depois — NUNCA informados na criação. */
export interface CreateExamInput {
  file_url: string          // URL (assinada) do documento — referência à fonte da verdade
  type: string              // rótulo factual (nome do arquivo sem extensão) — NÃO é interpretação clínica
  exam_date?: string | null // opcional; a extração pode preenchê-la depois
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
  /** Dispara a extração/análise do exame. PONTE TRANSITÓRIA (ADR-020): reusa a rota `/analyze` da Web (regra
   *  ÚNICA de extração) por Bearer; alvo pós-Onda-1 = camada compartilhada. O status é acompanhado pela lista. */
  analyzeExam(id: string): Promise<{ error: Error | null }>
  /** Exclui o exame (arquivo + registro; cascata de FKs limpa os dependentes). LGPD-positivo. PENDÊNCIA isolada
   *  (MOBILE-030): requer política RLS de DELETE em `exams` — sem ela, retorna erro. */
  deleteExam(id: string, signal?: AbortSignal): Promise<{ error: Error | null }>
  /** Atualiza campos editáveis do exame (renomear/data/financeiro/vínculo de origem) — whitelist. Espelha as
   *  edições do detalhe da Web. `{ error: null }` em sucesso. NÃO lança. */
  updateExam(id: string, patch: ExamFieldsPatch, signal?: AbortSignal): Promise<{ error: Error | null }>
}

import type { ExamFieldsPatch } from './update'
export type { ExamFieldsPatch } from './update'
