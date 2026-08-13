// Versões dos componentes do pipeline de compreensão (ADR-CK-001 / ADR-ARCH-002). Persistidas no relatório
// auditável de cada exame → rastreabilidade real: "por que este exame recebeu este nome?" responde-se com as
// versões usadas + a data. Incrementar quando a lógica/valor-set/contrato do componente mudar.
export const PIPELINE_VERSIONS = {
  due: 'due-0.2.0',                    // Document Understanding Engine (observação + relatório auditável)
  terminology: 'terminology-valueset-0.1.0', // value-set provisório (sem ancoragem LOINC/SNOMED ainda)
  clinicalKnowledge: 'clinical-knowledge-0.1.0' as string | null,  // C6 — base curada inicial (oftalmo) + proveniência por atributo
  evidence: null as string | null,           // Evidence Service — não implementado (C8)
} as const
