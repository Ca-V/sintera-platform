// @sintera/api-client — Comunicação com a plataforma (contrato único web/mobile). Ver docs/HIP-012 §4 · ADR-007.
// Autenticação: fábrica ÚNICA do cliente Supabase + domínio (login/logout/sessão). O storage é injetado por
// plataforma via StorageAdapter genérico. Web/Mobile consomem SÓ esta API pública — nunca o SDK Supabase direto.
export { createApiClient } from './auth/client'
export type {
  ApiClient,
  ApiClientConfig,
  ApiClientOptions,
  AuthApi,
  AuthResult,
  SessionListener,
  Session,
  User,
} from './auth/types'
export type { StorageAdapter } from './storage/adapter'
// Domínio Perfil (Inc 4) — contrato congelado (MOBILE-019). Web/Mobile consomem via ApiClient.profile.
export type { ProfileApi, ProfileDTO, ProfileEditable } from './profile/types'
// Domínio Exames (leitura) — infra compartilhada; de-risca o Inc 5 (Histórico de Exames).
export type { ExamsApi, ExamDTO, ExamsQuery } from './exams/types'
export type { BiomarkerDTO } from './exams/biomarkers'
// Domínio Exames (ESCRITA) — contrato DEFINIDO p/ Inc.6 (Upload); implementação após aceite do Inc.5.
export type { ExamsWriteApi, UploadResult, CreateExamInput, UploadConstraints, ExamFieldsPatch } from './exams/write'
export { DEFAULT_UPLOAD_CONSTRAINTS } from './exams/write'
export { validateUpload, acceptedFormatsHint, type UploadValidation } from './exams/validateUpload'
// PORT de seleção de documento (device) — abstração injetada por plataforma (app não conhece a lib).
export type { DocumentPickerPort, PickedFile } from './device/documentPicker'
export { withTimeout, TimeoutError, DEFAULT_TIMEOUT_MS } from './net/timeout'
