// ============================================================
// SINTERA — Motor de Insights: tipos centrais
// ============================================================
// Esta camada cobre os componentes do Sprint 2 que NÃO dependem
// de decisão clínica: Resolver (resolução de biomarcadores contra
// o catálogo canônico) e Assembler (montagem de contexto).
//
// IMPORTANTE — limites de escopo (ver docs/GOVERNANCA-CLINICA-SINTERA.md):
//   - NADA aqui emite juízo clínico (clinical_flag, severidade).
//   - `rangeStatus` é ARITMÉTICO: compara o valor com o intervalo de
//     referência IMPRESSO no laudo. Não é classificação de criticidade.
//   - O motor determinístico (valor → clinical_flag), a narrativa e o
//     gate de QA ficam de fora: dependem de aprovação clínica.
// ============================================================

/** Categorias canônicas do biomarker_catalog (migração 022). */
export type BiomarkerCategory =
  | 'hematologia_vermelha'
  | 'hematologia_branca_plaquetas'
  | 'coagulacao'
  | 'metabolismo_ferro'
  | 'metabolismo_glicose'
  | 'funcao_tireoidiana'
  | 'inflamacao_imunologia'
  | 'funcao_hepatica_proteinas'
  | 'funcao_renal_eletrolitos'
  | 'urina_24h'
  | 'vitaminas_minerais'
  | 'hormonios_sexuais_reprodutivo'
  | 'cardiometabolico'
  | 'urinalise_eas'

export type Specimen = 'sangue' | 'urina' | 'urina_24h'
export type MeasureKind = 'absoluto' | 'percentual' | 'qualitativo'

/** Classificação de criticidade (ai_insights.clinical_flag). DECISÃO CLÍNICA. */
export type ClinicalFlag = 'atencao_imediata' | 'acompanhar' | 'normal'

/** Tipo do insight (ai_insights.insight_type). */
export type InsightType = 'biomarker' | 'cluster' | 'longitudinal' | 'priority'

/** Entrada do catálogo canônico (biomarker_catalog). */
export interface CatalogEntry {
  id: string
  code: string
  displayName: string
  category: BiomarkerCategory
  specimen: Specimen
  canonicalUnit: string | null
  measureKind: MeasureKind
  isCritical: boolean
}

/** Apelido de biomarcador (biomarker_aliases). */
export interface AliasEntry {
  aliasNormalized: string
  catalogId: string
  /** Substring LITERAL casada contra a unidade (ver migração 022b). null = genérico. */
  unitPattern: string | null
}

/** Índice em memória do catálogo + apelidos, para resolução O(1) por nome. */
export interface CatalogIndex {
  /** catalog_id → CatalogEntry */
  byId: Map<string, CatalogEntry>
  /** alias_normalized → lista de candidatos (mais de um quando há desambiguação por unidade) */
  aliasesByName: Map<string, AliasEntry[]>
}

/** Biomarcador a resolver: nome e unidade como aparecem no laudo. */
export interface ResolvableBiomarker {
  name: string
  unit: string | null
}

/** Resultado da resolução de um biomarcador contra o catálogo. */
export interface ResolutionResult {
  /** Entrada do catálogo, ou null se nenhum apelido casou. */
  catalog: CatalogEntry | null
  /** Chave normalizada usada na busca (lower + sem acento + trim). */
  normalizedKey: string
  /** true quando havia mais de um candidato e a unidade decidiu. */
  disambiguatedByUnit: boolean
}

// ── Assembler ─────────────────────────────────────────────────────────────────

/**
 * Status do valor em relação ao intervalo de referência IMPRESSO no laudo.
 * ARITMÉTICO, não clínico. 'no_reference' = laudo não trouxe faixa.
 */
export type RangeStatus = 'below' | 'above' | 'within' | 'no_reference' | 'non_numeric'

/** Biomarcador já resolvido e enriquecido para montagem de contexto. */
export interface AssembledBiomarker {
  id: string
  name: string
  catalogId: string | null
  catalogCode: string | null
  displayName: string | null
  category: BiomarkerCategory | null
  isCritical: boolean
  value: number | null
  valueText: string | null
  unit: string | null
  resultType: string
  referenceMin: number | null
  referenceMax: number | null
  referenceSource: string
  rangeStatus: RangeStatus
}

/** Perfil mínimo da usuária relevante para o contexto (sem PII sensível além do necessário). */
export interface AssembledProfile {
  ageRange: string | null
  cycleLength: number | null
  cycleRegularity: string | null
}

/**
 * Contexto estruturado de um exame, pronto para o motor determinístico (futuro).
 * Organiza dados já existentes; não cria informação clínica nova.
 */
export interface InsightContext {
  examId: string
  userId: string
  profile: AssembledProfile | null
  biomarkers: AssembledBiomarker[]
  /** Agrupados por categoria canônica (resolvidos). */
  byCategory: Partial<Record<BiomarkerCategory, AssembledBiomarker[]>>
  /** Subconjunto mecânico: valor fora do intervalo impresso (below/above). */
  outOfPrintedRange: AssembledBiomarker[]
  /** Biomarcadores marcados como críticos no catálogo presentes neste exame. */
  criticalPresent: AssembledBiomarker[]
  /** Nomes que não casaram com o catálogo (telemetria para evoluir os apelidos). */
  unresolved: ResolvableBiomarker[]
  generatedAt: string
}
