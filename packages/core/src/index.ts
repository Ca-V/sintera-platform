// @sintera/core — Domínio da SINTERA: entidades, casos de uso, regras de negócio e PORTAS de plataforma
// (contratos de infraestrutura independentes da interface). NÃO é depósito de utilitários (ver ADR-007).
// Fronteira: ver docs/HIP-012 §4 e docs/adr/ADR-007.

// Portas (infraestrutura, UI-independent) — a implementação entra atrás destes contratos.
export * from './ports/observability'
export * from './ports/sync'

// Contrato de módulo de domínio (capacidade da plataforma; ADR-009).
export * from './domain/module'

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
export * from './domain/exams/categories'
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
export * from './domain/capture/attachmentPolicy'
export * from './domain/copy'
