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
// Login por provedor externo (IDENTIDADE) — separado da autorização de dados de saúde, de propósito.
export { IDENTITY_PROVIDERS } from './auth/oauth'
export type { IdentityProvider } from './auth/oauth'
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
// Atividade física (HIP-014 §3) — FATO observado, com proveniência obrigatória.
export type { ActivityApi } from './auth/types'
export type { ActivitySessionDTO, ActivitySessionInput } from './activity/activity'
// Funções standalone — a Web (que consome Supabase direto) reusa as MESMAS consultas do Mobile (SSOT),
// como já acontece em getProfileStats. Sem isto as duas pontas escreveriam a query duas vezes.
export { listActivitySessions, saveActivitySession, deleteActivitySession, ingestActivitySessions } from './activity/activity'
export type { IngestResult } from './activity/activity'
// Persistência de conector — AGNÓSTICA de credencial (ver o cabeçalho do módulo). O servidor passa um cliente
// service-role; o aplicativo passa o cliente da sessão. Mesma implementação, dois caminhos.
export { createSupabasePersistClient, createSupabaseSyncRecorder, createSupabaseWatermarkReader } from './connectors/persist'
// Ingestão de leituras de conector — o aplicativo grava por aqui, sem tocar no SDK do Supabase.
export type { WearablesApi } from './auth/types'
export { ingestWearableSamples } from './wearables/wearables'
// PASSOS por dia, lidos do bruto — não têm projeção em body_metrics (a restrição da coluna não os aceita).
export { listDailySteps } from './wearables/steps'
// Leitura assistida de documento — ponte para a rota da Web (ADR-020), para que a regra seja UMA só.
export type { CaptureApi } from './auth/types'
export type { ClassifyInput } from './capture/classify'
export type { ShareDTO, TemplateDTO, OmicsPanelDTO } from './report/report'
export type { OmicsPanelDTO as OmicsPanel, OmicsPanelDetail, OmicsCategoryDTO, OmicsResultDTO, OmicsHistoryPoint, OmicsCatalogMatch, OmicsResultInput } from './omics/omics'
export type { NotificationPrefRow } from './settings/notifications'
export type { CaptureInput, ConditionScan, BioimpedanceScan, EyeglassesScan, EyeglassesEye, MedicationScanItem } from './vision/vision'
export type { BodyMetricDTO, BodyMetricInput } from './body/body'
// `saveBodyMetric` cria E corrige (o `id` distingue) — a Web passa a usá-la em vez de escrever seu próprio
// insert, para as duas pontas gravarem a medição pelo MESMO caminho (base única, 27/08).
// `listBodyMetrics` e `deleteBodyMetric` faltavam aqui: existiam, o aplicativo as usava pela fachada, e a Web
// não tinha como chamá-las — foi o que impediu a tela "Dados recebidos" de existir no navegador.
export { saveBodyMetric, listBodyMetrics, deleteBodyMetric } from './body/body'
export type { ResourceDTO, ResourceInput } from './resources/resources'
// Domínio Documentos do paciente (DOC-001/DOC-002) — receita · atestado · relatório · encaminhamento · outros.
export type { DocumentsApi } from './auth/types'
export type { PatientDocumentDTO, PatientDocumentInput, PatientDocumentPage, DocumentPageInput } from './documents/documents'
// Receita com DONO ÚNICO (DOC-002). `prescriptionUrlOf` é pura. `archivePrescription` é exportada AVULSA além
// de estar em ApiClient.documents porque o Mobile consome o ApiClient e a Web consome Supabase direto — mesmo
// arranjo de `getProfileStats`. As duas pontas executam a MESMA função; só o cliente é injetado por cada uma.
export { prescriptionUrlOf, archivePrescription } from './documents/prescription'
export { listDocumentsForTargets, listPagesForDocuments } from './documents/documents'
// Corrigir os fatos de um documento (tipo · emissor · data · observação). O contrato do core exige
// ver/editar/excluir em todo cartão; a Web só tinha ver e excluir, e esta função nunca teve consumidor lá.
export { updateDocument, replaceDocument } from './documents/documents'
// Busca global nos registros da pessoa — uma implementação, duas pontas. Atravessa o RLS: enxerga o que ela enxerga.
export { searchRecords } from './search/search'
// VÍNCULO documento → registro (receita → medicamento/suplemento/recurso). Espelha exame → pedido: a pergunta
// é feita pelo lado do REGISTRO, ao cadastrá-lo, porque é aí que a receita já existe guardada.
export { listLinkableDocuments, linkDocumentToTarget, unlinkDocumentFromTarget } from './documents/links'
// Nome dos alvos vinculados — a Web consome direto (mesma consulta do Mobile, SSOT).
export { targetNamesByDocument } from './documents/targetNames'
export type { ConnectorsApi } from './auth/types'
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
