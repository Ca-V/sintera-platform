// @sintera/core — Domínio da SINTERA: entidades, casos de uso, regras de negócio e PORTAS de plataforma
// (contratos de infraestrutura independentes da interface). NÃO é depósito de utilitários (ver ADR-007).
// Fronteira: ver docs/HIP-012 §4 e docs/adr/ADR-007.

// Portas (infraestrutura, UI-independent) — a implementação entra atrás destes contratos.
export * from './ports/observability'
export * from './ports/sync'

// Contrato de módulo de domínio (capacidade da plataforma; ADR-009).
export * from './domain/module'

// Identificadores — funcionam em QUALQUER navegador e aparelho (princípio de disponibilidade universal).
export * from './domain/ids'

// Projeção cronológica (Timeline) — lógica pura reutilizável por qualquer domínio datado.
export * from './domain/timeline'

// Histórico de Saúde — projeção UNIFICADA (eventos + exames + …) para a linha do tempo. Aditiva.
export * from './domain/timelineProjection'

// Apresentação PURA de resultados (biomarcadores) — fonte única Web↔Mobile (paridade Exames).
export * from './domain/exams/biomarkerView'

// Agrupamento/sumarização LONGITUDINAL de biomarcadores (tendência/evolução) — fonte única Web↔Mobile.
export * from './domain/biomarkerGrouping'

// Regras puras do domínio Exames (identidade, classificação, fluxo assistencial) — fonte única Web↔Mobile.
export * from './domain/exams/identity'
export * from './domain/exams/classification'
export * from './domain/exams/orderTitle'
export * from './domain/exams/categories'
// O que a plataforma LEU de um documento — e o que ela nao leu, dito em vez de silenciado (01/09/2026).
export * from './domain/exams/textoDoLaudo'
export * from './domain/exams/orderStatus'
export * from './domain/exams/processingStatus'
export * from './domain/exams/careFlow'
export * from './domain/exams/ucda'
export * from './domain/exams/nameMatch'

// Financeiro puro (parsing de valor, documento fiscal) — fonte única Web↔Mobile.
export * from './domain/finance/money'
export * from './domain/finance/expense'
export * from './domain/finance/expenseProjection'

// Domínio Agenda / Evento Assistencial (health_events) — modelo, mapeadores, seletores PUROS. Fonte única.
export * from './domain/agenda/event'
export * from './domain/agenda/presentation'
export * from './domain/agenda/calendarExport'

// Regra de recorrência PURA (serialização/labels) — fonte única Web↔Mobile.
export * from './domain/recurrence'

// Taxonomia de Hábitos — fonte única Web↔Mobile.
export * from './domain/habits'

// Taxonomia de Recursos de Saúde — fonte única Web↔Mobile.
export * from './domain/resources'

// Taxonomia de Medicamentos/Suplementos — fonte única Web↔Mobile.
export * from './domain/medications'

// Taxonomia de contracepção (CTC-001) — fonte única Web↔Mobile.
export * from './domain/cycle'

// Matemática de datas pura + estatística do ciclo menstrual — fonte única Web↔Mobile.
export * from './domain/cycleStats'

// Preferências de notificação (NOTIF-001) — taxonomia/canais puros, fonte única Web↔Mobile.
export * from './domain/notificationPrefs'

// Composição Corporal (BOD-001) — taxonomia de métricas, jornada de peso, sumário/confiabilidade, evolução,
// snapshots, marcos. PUROS.
export * from './domain/body/metrics'
export * from './domain/body/weight-journey'
export * from './domain/body/summary'
// Quao atual e o "estado atual" — o cabecalho para de afirmar hoje sobre dado de 2023 (31/08/2026).
export * from './domain/body/atualidadeDoResumo'
export * from './domain/body/evolution'
export * from './domain/body/snapshots'
export * from './domain/body/milestones'
export * from './domain/communication/period'
export * from './domain/omics/domains'
export * from './domain/report/assemble'
export * from './domain/exams/duplicates'
export * from './domain/agenda/suggestions'

// Captura de documentos (HUB-001) — contratos puros + taxonomia de intenções. Fonte única Web↔Mobile.
export * from './domain/capture/types'
export * from './domain/capture/intents'
export * from './domain/copy'

// Política de anexos (Fase C) — allowlist pura de tipos aceitos. Fonte única Web↔Mobile.
export * from './domain/capture/attachmentPolicy'
export * from './domain/capture/attachmentSet'
export * from './domain/capture/divergence'
// POR QUE a leitura não rodou. `null` respondia por cinco situações diferentes, todas caladas.
export * from './domain/capture/motivoLeitura'
// O que conta como FATO transcrito de um documento — a fronteira entre transcrever e inferir (RDC 657).
export * from './domain/capture/transcription'
// TODO documento que entra e lido e transcrito — decisao da fundadora em 01/09/2026. O que nao se leu e DITO.
export * from './domain/capture/transcricaoDeDocumento'
// Política de preparo de imagem — a DECISÃO é uma só; o mecanismo é de cada plataforma.
export * from './domain/capture/imagePrep'
export * from './domain/connectors/state'

// Sessão de atividade física (HIP-014 §3) — FATO observado, distinto da INTENÇÃO em life_habits.
export * from './domain/body/activity'
// A rotina declarada (Habitos) reencontra as sessoes observadas (Monitoramento) — decisao de 31/08/2026.
export * from './domain/body/rotinaDeAtividade'
// Pressão arterial escrita à mão — nota a forma falada ("12/8") e sugere, sem converter.
export * from './domain/body/bloodPressure'
// Passos por dia — observação de atividade, lida do bruto. Nem sinal vital nem sessão: natureza própria.
export * from './domain/body/steps'
// "Isto já está na plataforma?" — o MESMO fato por caminhos diferentes. Suspeita e explica; nunca decide sozinho.
export * from './domain/ingest/sameFact'

// IDENTIDADE — leitura do retorno de login por provedor externo (Google; Apple e Microsoft depois).
// NÃO confundir com a autorização de dados de saúde, que vive na camada de conectores e é separada de
// propósito (ver tests/contracts/identidade-vs-autorizacao.ARCH.test.ts).
export * from './domain/auth/oauthCallback'

// Camada de Conectores (HIP-001) — contratos + lógica PURA, vendor-neutral. Vive no core porque o Mobile
// precisa alcançá-la: o Health Connect roda NO APARELHO (HIP-014). Quem resolve a CHAVE service-role a partir
// do ambiente (`runtime.server.ts`) e os adaptadores de fornecedor permanecem no servidor da Web — nunca no
// pacote. A IO agnóstica de credencial vive em `@sintera/api-client` e serve as duas pontas.
export * from './domain/connectors/connector'
export * from './domain/connectors/oauth'
export * from './domain/connectors/registry'
export * from './domain/connectors/persistence'
export * from './domain/connectors/orchestrator'
export * from './domain/connectors/connections'
export * from './domain/connectors/syncService'
export * from './domain/connectors/webhook'
export * from './domain/connectors/mock'
// Health Connect (HIP-014 §5) — adaptador PURO; a leitura nativa vive no aplicativo.
export * from './domain/connectors/healthConnect'
// O que a pessoa precisa fazer EM CADA APP para o dado chegar. Autorizar a SINTERA é só metade.
export * from './domain/connectors/healthConnectGuide'
export * from './domain/connectors/healthConnectDiagnostico'
// Por que um dado nao aparece nesta pagina — ausencia com motivo, pedido da fundadora em 01/09/2026.
export * from './domain/connectors/ausenciaNaWeb'
export * from './domain/connectors/reingestao'
export * from './domain/connectors/janelaImportacao'
export * from './domain/connectors/appleHealth'

// Telefone com código de país (E.164) — fonte única Web↔Mobile.
export * from './domain/profile/phone'
// Fase da vida a partir da data de nascimento — aritmetica de calendario, ZERO conteudo clinico.
export * from './domain/profile/fasesDaVida'
export * from './domain/documents/patientDocuments'
export * from './domain/documents/prescricaoParaRegistro'
// Catálogo único das seções da plataforma (nome · ordem · grupo · resumo). Sidebar da Web e menus do
// aplicativo leem daqui — a taxonomia estava escrita em três lugares.
export * from './domain/navigation/sections'
// Busca global — encontra o que a pessoa REGISTROU, não só as seções. Puro; as consultas ficam no api-client.
export * from './domain/search/globalSearch'
// Para onde a busca LEVA: abrir o registro, e nao so a secao. A tela de destino negava o que a busca achou.
export * from './domain/search/destinoDoAchado'
export * from './domain/documents/cardActions'
