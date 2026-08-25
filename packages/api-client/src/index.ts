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
export type { ProfileApi, ProfileDTO, ProfileEditable, ProfileStats } from './profile/types'
// Função standalone das estatísticas — a Web (que consome Supabase direto) reusa a MESMA consulta (SSOT).
export { getProfileStats } from './profile/get-stats'
// Síntese de navegação (§5d) — contagens por domínio; a Web (Supabase direto) reusa a MESMA consulta (SSOT).
export type { SummaryApi } from './auth/types'
export { getMinhaSaudeCounts, type MinhaSaudeCounts } from './summary/counts'
// Domínio Exames (leitura) — infra compartilhada; de-risca o Inc 5 (Histórico de Exames).
export type { ExamsApi, ExamDTO, ExamDetailDTO, ExamsQuery, ExamExtractionLog } from './exams/types'
export type { BiomarkerDTO } from './exams/biomarkers'
export type { BiomarkerRow, BiomarkerSummary, Trend } from '@sintera/core'
export type { EventsApi, AgendaApi, ConditionsApi, HabitsApi, ResourcesApi, MedicationsApi, CycleApi } from './auth/types'
export type { ContraceptiveDTO, ContraceptiveInput } from './cycle/contraception'
export type { PeriodDTO } from './cycle/menstrual'
export type { SettingsApi, BodyApi, ReportApi, OmicsApi } from './auth/types'
export type { ShareDTO, TemplateDTO, OmicsPanelDTO } from './report/report'
export type { OmicsPanelDTO as OmicsPanel, OmicsPanelDetail, OmicsCategoryDTO, OmicsResultDTO, OmicsHistoryPoint, OmicsCatalogMatch, OmicsResultInput } from './omics/omics'
export type { NotificationPrefRow } from './settings/notifications'
export type { CaptureInput, ConditionScan, BioimpedanceScan, EyeglassesScan, EyeglassesEye, MedicationScanItem } from './vision/vision'
export type { BodyMetricDTO, BodyMetricInput } from './body/body'
export type { ResourceDTO, ResourceInput } from './resources/resources'
// Domínio Documentos do paciente (DOC-001/DOC-002) — receita · atestado · relatório · encaminhamento · outros.
export type { DocumentsApi } from './auth/types'
export type { PatientDocumentDTO, PatientDocumentInput, PatientDocumentPage, DocumentPageInput } from './documents/documents'
// Receita com DONO ÚNICO (DOC-002). `prescriptionUrlOf` é pura. `archivePrescription` é exportada AVULSA além
// de estar em ApiClient.documents porque o Mobile consome o ApiClient e a Web consome Supabase direto — mesmo
// arranjo de `getProfileStats`. As duas pontas executam a MESMA função; só o cliente é injetado por cada uma.
export { prescriptionUrlOf, archivePrescription } from './documents/prescription'
export { listDocumentsForTargets, listPagesForDocuments } from './documents/documents'
export type { MedicationDTO, MedicationInput } from './medications/medications'
export type { EventDraft } from './agenda/events'
export type { LinkedReminderOptions } from './agenda/reminder'
export type { LinkedExpenseOptions } from './agenda/expense'
export type { ConditionDTO, ConditionInput, ConditionScope } from './conditions/conditions'
export type { HabitDTO, HabitInput } from './habits/habits'
// Domínio Exames (ESCRITA) — contrato DEFINIDO p/ Inc.6 (Upload); implementação após aceite do Inc.5.
export type { ExamsWriteApi, UploadResult, CreateExamInput, UploadConstraints, ExamFieldsPatch } from './exams/write'
export { DEFAULT_UPLOAD_CONSTRAINTS } from './exams/write'
export { validateUpload, acceptedFormatsHint, type UploadValidation } from './exams/validateUpload'
// PORT de seleção de documento (device) — abstração injetada por plataforma (app não conhece a lib).
export type { DocumentPickerPort, PickedFile, PickedImage } from './device/documentPicker'
export { withTimeout, TimeoutError, DEFAULT_TIMEOUT_MS } from './net/timeout'
