// @sintera/api-client — Contratos do DOMÍNIO de autenticação (independentes de plataforma).
import type { Session, User } from '@supabase/supabase-js'
import type { StorageAdapter } from '../storage/adapter'
import type { ProfileApi } from '../profile/types'
import type { MinhaSaudeCounts } from '../summary/counts'
import type { ExamsApi } from '../exams/types'
import type { ExamsWriteApi } from '../exams/write'
import type { HealthEvent, EventLink } from '@sintera/core'
import type { EventDraft } from '../agenda/events'
import type { LinkedReminderOptions } from '../agenda/reminder'
import type { LinkedExpenseOptions } from '../agenda/expense'
import type { ConditionDTO, ConditionInput } from '../conditions/conditions'
import type { CaptureInput, ConditionScan, BioimpedanceScan, EyeglassesScan, MedicationScanItem } from '../vision/vision'
import type { HabitDTO, HabitInput } from '../habits/habits'
import type { ResourceDTO, ResourceInput } from '../resources/resources'
import type { MedicationDTO, MedicationInput } from '../medications/medications'
import type { ContraceptiveDTO, ContraceptiveInput } from '../cycle/contraception'
import type { PeriodDTO } from '../cycle/menstrual'
import type { NotificationPrefRow } from '../settings/notifications'
import type { BodyMetricDTO, BodyMetricInput } from '../body/body'
import type { ActivitySessionDTO, ActivitySessionInput, IngestResult } from '../activity/activity'
import type { CanonicalSample, PropagationResult, ClassificationResult } from '@sintera/core'
import type { ClassifyInput } from '../capture/classify'
import type { IdentityProvider } from './oauth'
import type { ShareDTO, TemplateDTO, OmicsPanelDTO } from '../report/report'
import type { OmicsPanelDTO as OmicsPanel, OmicsPanelDetail, OmicsResultDTO, OmicsHistoryPoint, OmicsCatalogMatch, OmicsResultInput } from '../omics/omics'
import type { Period, DocumentTargetDomain } from '@sintera/core'
import type { PatientDocumentDTO, PatientDocumentInput, PatientDocumentPage } from '../documents/documents'
import type { ConnectorState } from '@sintera/core'
import type { DocumentAssociation } from '@sintera/core'

export type { Session, User }

/** Ponto de extensão futuro (logging, timeout, observabilidade, feature flags, ambiente de testes). Vazio por ora. */
export interface ApiClientOptions {
  // reservado — mantém a assinatura de createApiClient estável quando surgirem novas necessidades.
}

export interface ApiClientConfig {
  url: string
  key: string
  storage: StorageAdapter
  /** URL base da Web para rotas de API reusadas — PONTE TRANSITÓRIA (ADR-020), ex.: análise de exames. Opcional. */
  webBaseUrl?: string
  options?: ApiClientOptions
}

export interface AuthResult {
  session: Session | null
  error: Error | null
}

export type SessionListener = (session: Session | null) => void

/** API pública de autenticação — o que Web e Mobile consomem. NÃO expõe o cliente Supabase (encapsulamento). */
export interface AuthApi {
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<{ error: Error | null }>
  getSession(): Promise<Session | null>
  /** Registra um observador de mudança de sessão; retorna a função de cancelamento (unsubscribe). */
  onAuthStateChange(listener: SessionListener): () => void
  /** Altera o e-mail da conta (Supabase envia link de confirmação ao NOVO e-mail; só vale após confirmar). */
  updateEmail(email: string): Promise<{ error: Error | null }>
  /** Envia o e-mail de redefinição de senha para o e-mail da conta atual. */
  sendPasswordReset(): Promise<{ error: Error | null }>
  /**
   * Login por provedor externo, em DUAS etapas — no aplicativo não existe "redirecionar a página": a tela
   * abre o navegador do sistema com a URL e depois devolve o endereço de retorno que chegou por deep link.
   * Acrescentar Apple ou Microsoft não muda a identidade interna: `auth.uid()` permanece o mesmo.
   */
  startOAuth(provider: IdentityProvider, redirectTo: string): Promise<{ url: string | null; error: Error | null }>
  completeOAuth(callbackUrl: string | null | undefined): Promise<{ error: Error | null }>
}

/** Telemetria de produto + "reportar problema" (usage_events). */
export interface EventsApi {
  /** Registra um evento de uso do próprio usuário. Best-effort — `{ error }`, nunca lança. */
  logEvent(eventName: string, metadata?: Record<string, unknown> | null): Promise<{ error: Error | null }>
}

/** Domínio AGENDA / Evento Assistencial (health_events) — Web/Mobile consomem via ApiClient.agenda. */
export interface AgendaApi {
  /** TODOS os eventos do usuário (legado+canônico, dedup, ordem canônica). `[]` se não houver. LANÇA em falha. */
  listEvents(signal?: AbortSignal): Promise<HealthEvent[]>
  /** Cria/atualiza um evento (upsert no canônico). `{ error }`, NÃO lança. */
  saveEvent(draft: EventDraft): Promise<{ error: Error | null }>
  /** Exclui um evento canônico (por id, dono via RLS). `{ error }`, NÃO lança. */
  deleteEvent(id: string): Promise<{ error: Error | null }>
  /** Sincroniza um lembrete recorrente vinculado a um fato (hábito/recurso/medicamento…). `{ error }`, NÃO lança. */
  syncReminder(link: EventLink, opts: LinkedReminderOptions): Promise<{ error: Error | null }>
  /** Sincroniza uma DESPESA vinculada a um fato (recurso/medicamento…) → Gastos/Histórico. `{ error }`, NÃO lança. */
  syncExpense(link: EventLink, opts: LinkedExpenseOptions): Promise<{ error: Error | null }>
}

/** Domínio Hábitos (life_habits) — CRUD do estado permanente + meta. */
export interface HabitsApi {
  listHabits(signal?: AbortSignal): Promise<HabitDTO[]>
  saveHabit(input: HabitInput): Promise<{ data: { id: string } | null; error: Error | null }>
  deleteHabit(id: string): Promise<{ error: Error | null }>
}

/** Domínio Recursos de Saúde (health_resources) — CRUD + atributos por tipo. */
export interface ResourcesApi {
  listResources(signal?: AbortSignal): Promise<ResourceDTO[]>
  saveResource(input: ResourceInput): Promise<{ data: { id: string } | null; error: Error | null }>
  deleteResource(id: string): Promise<{ error: Error | null }>
}

/**
 * Domínio Documentos do paciente (DOC-001/DOC-002) — receita · atestado · relatório · encaminhamento · outros.
 * SEPARADO de exames: criar um documento nunca cria exame nem muta o registro-alvo.
 */
export interface DocumentsApi {
  listDocuments(signal?: AbortSignal): Promise<PatientDocumentDTO[]>
  listDocumentsForTarget(target_domain: DocumentTargetDomain, target_id: string, signal?: AbortSignal): Promise<PatientDocumentDTO[]>
  listDocumentsForTargets(target_domain: DocumentTargetDomain, target_ids: string[], signal?: AbortSignal): Promise<Record<string, PatientDocumentDTO[]>>
  /** ANEXO-001 — páginas de vários documentos, em lote. */
  listPagesForDocuments(documentIds: string[], signal?: AbortSignal): Promise<Record<string, PatientDocumentPage[]>>
  saveDocument(input: PatientDocumentInput): Promise<{ data: { id: string } | null; error: Error | null }>
  updateDocument(id: string, patch: Partial<Pick<PatientDocumentInput, 'subtype' | 'issuer' | 'doc_date' | 'notes'>>): Promise<{ error: Error | null }>
  deleteDocument(id: string): Promise<{ error: Error | null }>
  /**
   * Arquiva uma receita em Documentos e vincula ao registro-alvo (medicamento, suplemento…).
   * IDEMPOTENTE: salvar o mesmo medicamento de novo não duplica a receita.
   */
  archivePrescription(params: {
    target: DocumentAssociation
    fileUrl: string | null | undefined
    meta?: { issuer?: string | null; doc_date?: string | null }
  }): Promise<{ documentId: string | null; error: Error | null }>
}

/**
 * HIP-001 · Conexões — dispositivos e serviços de saúde. Ponte para as rotas /api/connectors da Web
 * (ADR-020): a regra de integração é UMA só, não duplicada por plataforma.
 */
export interface ConnectorsApi {
  listConnectors(): Promise<ConnectorState[]>
  /** Endereço do fluxo OAuth — abre no NAVEGADOR; o app nunca manipula a credencial da pessoa. */
  connectUrl(source: string): string | null
  syncConnector(source: string): Promise<{ error: Error | null }>
  disconnectConnector(source: string): Promise<{ error: Error | null }>
}

/** Domínio Medicamentos/Suplementos (medications) — CRUD clínico + estoque + recompra. */
export interface MedicationsApi {
  listMedications(signal?: AbortSignal): Promise<MedicationDTO[]>
  saveMedication(input: MedicationInput): Promise<{ data: { id: string } | null; error: Error | null }>
  deleteMedication(id: string): Promise<{ error: Error | null }>
}

/** Domínio Ciclo e Contracepção — métodos contraceptivos (com lembrete de troca) + ciclo menstrual. */
export interface CycleApi {
  listContraceptives(signal?: AbortSignal): Promise<ContraceptiveDTO[]>
  saveContraceptive(input: ContraceptiveInput): Promise<{ error: Error | null }>
  toggleContraceptiveStatus(m: ContraceptiveDTO): Promise<{ error: Error | null }>
  deleteContraceptive(m: ContraceptiveDTO): Promise<{ error: Error | null }>
  listPeriods(signal?: AbortSignal): Promise<PeriodDTO[]>
  addPeriod(startedOn: string): Promise<{ error: Error | null }>
  deletePeriod(id: string): Promise<{ error: Error | null }>
}

/** Domínio Condições de Saúde (health_conditions) — CRUD do estado permanente da pessoa/familiares. */
export interface ConditionsApi {
  listConditions(signal?: AbortSignal): Promise<ConditionDTO[]>
  saveCondition(input: ConditionInput): Promise<{ error: Error | null }>
  deleteCondition(id: string): Promise<{ error: Error | null }>
}

/** Captura assistida (T1) — capacidade TRANSVERSAL de OCR/IA: envia um documento (base64) e devolve os campos
 *  pré-preenchidos para a usuária revisar. Reusa os serviços da Web via ponte Bearer (ADR-020). */
export interface VisionApi {
  readCondition(input: CaptureInput): Promise<{ data: ConditionScan | null; error: Error | null }>
  readBioimpedance(input: CaptureInput): Promise<{ data: BioimpedanceScan | null; error: Error | null }>
  readEyeglasses(input: CaptureInput): Promise<{ data: EyeglassesScan | null; error: Error | null }>
  scanMedications(input: CaptureInput): Promise<{ data: MedicationScanItem[]; error: Error | null }>
}

export interface ApiClient {
  auth: AuthApi
  profile: ProfileApi
  exams: ExamsApi & ExamsWriteApi
  events: EventsApi
  agenda: AgendaApi
  conditions: ConditionsApi
  habits: HabitsApi
  resources: ResourcesApi
  documents: DocumentsApi
  connectors: ConnectorsApi
  medications: MedicationsApi
  cycle: CycleApi
  settings: SettingsApi
  body: BodyApi
  activity: ActivityApi
  wearables: WearablesApi
  capture: CaptureApi
  report: ReportApi
  omics: OmicsApi
  vision: VisionApi
  summary: SummaryApi
}

/** Síntese de navegação (§5d) — contagens por domínio para os indicadores de conteúdo do menu/Sidebar. */
export interface SummaryApi {
  /** Contagens por domínio do usuário (exames, medicamentos, suplementos, recursos, condições, hábitos). LANÇA em falha. */
  getMinhaSaudeCounts(signal?: AbortSignal): Promise<MinhaSaudeCounts>
}

/** Exames de Ômica — leituras via ponte /api/omics (reusa joins/catálogo do servidor); escritas diretas (RLS dono). */
export interface OmicsApi {
  listPanels(domain?: string): Promise<OmicsPanel[]>
  getPanel(id: string): Promise<OmicsPanelDetail>
  getResults(panelId: string, categoryId?: string | null): Promise<OmicsResultDTO[]>
  getFeatureHistory(featureId: string): Promise<OmicsHistoryPoint[]>
  searchCatalog(term: string, domain: string): Promise<{ resolved: OmicsCatalogMatch | null; matches: OmicsCatalogMatch[] }>
  createPanel(input: { domain: string; laboratory?: string | null; technology?: string | null; collectedOn?: string | null }): Promise<{ data: { id: string } | null; error: Error | null }>
  addResult(panelId: string, input: OmicsResultInput): Promise<{ error: Error | null }>
  deleteResult(id: string): Promise<{ error: Error | null }>
  deletePanel(id: string): Promise<{ error: Error | null }>
}

/** Relatório (Camada de Comunicação) — links públicos, perfis salvos e leitura de ômica p/ a compilação.
 *  A MONTAGEM/formatação vive no @sintera/core (assembleReport); esta API só persiste/lê. */
export interface ReportApi {
  listShares(signal?: AbortSignal): Promise<ShareDTO[]>
  /** Cria um link público (30 dias por padrão) das seções + período; retorna o token gerado. */
  createShare(input: { sections: string[]; excluded?: Partial<Record<string, string[]>>; period: Period; days?: number }): Promise<{ data: { token: string } | null; error: Error | null }>
  revokeShare(id: string): Promise<{ error: Error | null }>
  listTemplates(signal?: AbortSignal): Promise<TemplateDTO[]>
  saveTemplate(input: { name: string; selection: Record<string, unknown> }): Promise<{ error: Error | null }>
  deleteTemplate(id: string): Promise<{ error: Error | null }>
  listOmicsPanels(signal?: AbortSignal): Promise<OmicsPanelDTO[]>
}

/** Composição Corporal (body_metrics) — série temporal + meta de peso (GLP-1). */
export interface BodyApi {
  listBodyMetrics(signal?: AbortSignal): Promise<BodyMetricDTO[]>
  saveBodyMetric(input: BodyMetricInput): Promise<{ error: Error | null }>
  deleteBodyMetric(id: string): Promise<{ error: Error | null }>
  /** Altura (cm) do perfil — base do IMC calculado. `null` se ausente. */
  getHeightCm(signal?: AbortSignal): Promise<number | null>
  getWeightGoal(signal?: AbortSignal): Promise<number | null>
  setWeightGoal(kg: number | null): Promise<{ error: Error | null }>
}

/**
 * Sessões de Atividade Física (activity_sessions) — FATO observado, distinto da INTENÇÃO em life_habits.
 * Origem manual ou de conector; a proveniência é obrigatória em toda escrita (HIP-014 §3/§4).
 */
export interface ActivityApi {
  listActivitySessions(signal?: AbortSignal): Promise<ActivitySessionDTO[]>
  saveActivitySession(input: ActivitySessionInput): Promise<{ error: Error | null }>
  deleteActivitySession(id: string): Promise<{ error: Error | null }>
  /** Ingestão IDEMPOTENTE de um lote de conector — o re-sync sempre reprocessa janela sobreposta. */
  ingestActivitySessions(drafts: readonly ActivitySessionInput[]): Promise<{ result: IngestResult; error: Error | null }>
}

/**
 * Ingestão de leituras vindas de conector (HIP-014 §5/§6). Existe porque o Health Connect roda NO APARELHO e
 * o aplicativo precisa gravar o que leu — sem receber o cliente Supabase cru, que a regra do pacote proíbe.
 */
/**
 * Leitura assistida de documento (ANEXO-001 · item D) — o que o documento PARECE ser, mais emissor e data
 * transcritos. Nunca lança: `null` quando não deu para ler, e a pessoa preenche à mão.
 */
export interface CaptureApi {
  classify(input: ClassifyInput): Promise<ClassificationResult | null>
}

export interface WearablesApi {
  ingestSamples(samples: readonly CanonicalSample[]): Promise<{ result: PropagationResult; error: Error | null }>
}

/** Configurações — Central de Notificações (canal por categoria) + operações de conta. */
export interface SettingsApi {
  listNotificationPrefs(signal?: AbortSignal): Promise<NotificationPrefRow[]>
  saveNotificationPrefs(prefs: NotificationPrefRow[]): Promise<{ error: Error | null }>
  /** Exporta todos os dados do usuário (JSON). PONTE ADR-020. */
  exportAccountData(): Promise<{ data: unknown; error: Error | null }>
  /** Exclui a conta e TODOS os dados (irreversível). PONTE ADR-020. */
  deleteAccount(): Promise<{ error: Error | null }>
}
