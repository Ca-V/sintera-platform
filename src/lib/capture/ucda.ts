// UCDA — Universal Clinical Data Architecture: o CONTRATO ÚNICO DE SAÍDA da plataforma.
//
// Fundadora (14/07): a CONVERGÊNCIA da plataforma acontece no Clinical Processing Engine e na UCDA — NUNCA
// por migração prematura dos domínios maduros. A UCDA é o contrato universal que TODA fonte produz (via CPE)
// e que TODO consumidor lê (Timeline · Evolução · Care Space · Compartilhamento · Pesquisa · Analytics).
//
//   Laboratório · Imagem · Patologia · EEG · DICOM · FHIR · Wearables
//                              │  (via CPE + adapters)
//                              ▼
//                             UCDA   ← contrato universal (isto)
//                              │
//                              ▼
//              Timeline · Evolução · Care Space · Compartilhamento · Pesquisa
//
// `clinical_results` e `biomarkers` são apenas BACKENDS DE PERSISTÊNCIA de certas modalidades — não o centro.
// A UCDA é o modelo de REPRESENTAÇÃO (leitura), independente de fonte e de persistência.
//
// RDC 657: transcreve/estrutura, não interpreta. Puro/determinístico.

import type { ProcessorResult } from './clinical-processors/types'

/** Versão do Clinical Processing Engine — proveniência/auditabilidade (Certificação §4). */
export const ENGINE_VERSION = 'cpe-v1'

// MODELO ABERTO (Princípio do Modelo Aberto, GOVERNANCA): representa CLASSES de informação clínica — nunca
// listas fechadas de analitos/modalidades/fabricantes. Um analito novo, um nome diferente para o mesmo
// analito, um equipamento/laboratório novo → representável SEM alteração estrutural. Todos os campos além do
// essencial são OPCIONAIS e ABERTOS (códigos por sistema livre: LOINC/SNOMED/BI-RADS/local).
/** Item clínico canônico — qualquer informação clínica estruturada, independente de fonte/persistência. */
export interface UcdaItem {
  itemType: 'measure' | 'parameter' | 'finding' | 'classification' | 'observation'
  /** Nome apresentado no documento (transcrição). */
  name: string
  /** Transcrição FIEL do valor (como no documento). */
  valueText: string
  /** Valor numérico parseado (nullable) — habilita evolução/comparação. */
  valueNum?: number | null
  unit?: string
  /** Código do ITEM/analito, sistema ABERTO (LOINC/SNOMED/local) — quando existir. */
  code?: string
  codeSystem?: string
  /** Código do VALOR quando é categoria codificada (ex.: '2' de BI-RADS 2). */
  valueCode?: string
  /** Lateralidade (OD/OE, direito/esquerdo, derivação). */
  region?: string
  /** Estrutura anatômica/órgão. */
  anatomy?: string
  /** Material/amostra biológico (laboratório: sangue/urina/fezes…). */
  specimen?: string
  /** Método de análise/aquisição (quando informado). */
  method?: string
  /** Contexto clínico/da coleta (ex.: jejum, pós-esforço) — quando informado. */
  context?: string
  /** Grupo dentro do exame (painel, quadrante, região agrupada). */
  group?: string
  /** Faixa/valor de referência COMO transcrito (não interpretativo). */
  referenceText?: string
  // ── AUDITABILIDADE (Certificação §4) — proveniência por ELEMENTO ──
  /** Página de origem (1-based) no documento. */
  page?: number
  /** Trecho-fonte exato de onde o elemento foi lido (transcrição/auditoria). */
  excerpt?: string
}

export type UcdaResultKind = 'structured' | 'narrative' | 'parametric'

/** Proveniência auditável de uma representação (Certificação §4). Fecha o ciclo de rastreabilidade. */
export interface UcdaProvenance {
  source: string
  /** Versão do Engine que produziu. */
  engineVersion?: string
  /** Versão do processador/contrato que produziu. */
  processorVersion?: string
  /** Documento de origem (exam_id). */
  documentId?: string
  /** Quando foi produzido (ISO). Carimbado na persistência. */
  producedAt?: string
}

/** Representação canônica de uma evidência clínica (a saída universal do CPE). */
export interface UcdaRepresentation {
  clinicalModel: string
  resultKind: UcdaResultKind
  items: UcdaItem[]
  /** Proveniência auditável — de onde veio esta representação. */
  provenance: UcdaProvenance
}

/**
 * Converte a saída de um PROCESSADOR do CPE (ProcessorResult) na representação canônica UCDA. Puro.
 * Sem saída → null (document_only; nada a representar). Cada tipo de resultado mapeia para UcdaItems.
 */
export function representationFromProcessor(result: ProcessorResult): UcdaRepresentation | null {
  const out = result.output
  if (!out) return null
  const provenance: UcdaProvenance = { source: 'cpe', engineVersion: ENGINE_VERSION, processorVersion: result.contractVersion }

  if (out.kind === 'parametric') {
    return {
      clinicalModel: result.clinicalModel, resultKind: 'parametric', provenance,
      items: out.parameters.map(p => ({
        itemType: 'measure' as const, name: p.name, valueText: p.value,
        valueNum: toNum(p.value), ...(p.unit ? { unit: p.unit } : {}), ...(p.region ? { region: p.region } : {}),
        ...(p.page != null ? { page: p.page } : {}), ...(p.excerpt ? { excerpt: p.excerpt } : {}),
      })),
    }
  }
  if (out.kind === 'structured') {
    return {
      clinicalModel: result.clinicalModel, resultKind: 'structured', provenance,
      items: out.biomarkers.map(b => ({
        itemType: 'measure' as const, name: b.name, valueText: b.value,
        valueNum: toNum(b.value), ...(b.unit ? { unit: b.unit } : {}),
      })),
    }
  }
  // narrative
  return {
    clinicalModel: result.clinicalModel, resultKind: 'narrative', provenance,
    items: out.findings.map((f, i) => ({ itemType: 'finding' as const, name: `achado ${i + 1}`, valueText: f })),
  }
}

/** Parse numérico tolerante (vírgula decimal). Retorna null quando não é número. */
export function toNum(value: string): number | null {
  const n = Number(String(value).replace(',', '.').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) && /\d/.test(value) ? n : null
}

// ── LEITURA: persistência (clinical_results) → UCDA. O consumidor (Timeline/Evolução/Care/…) lê SEMPRE UCDA,
// nunca o backend. Contrato fechado dos dois lados (escrita via representationFromProcessor; leitura aqui).

/** Linha de `clinical_results` como vem do banco (snake_case). */
export interface ClinicalResultRow {
  clinical_model: string
  result_kind: string
  item_type: string | null
  name: string
  value_text: string | null
  value_num: number | string | null
  unit: string | null
  code: string | null
  code_system: string | null
  value_code: string | null
  region: string | null
  anatomy: string | null
  specimen: string | null
  method: string | null
  context: string | null
  group_label: string | null
  reference_text: string | null
  // Auditabilidade
  page: number | null
  raw_text: string | null
}

const asItemType = (t: string | null): UcdaItem['itemType'] =>
  t === 'measure' || t === 'parameter' || t === 'finding' || t === 'classification' || t === 'observation' ? t : 'observation'

function itemFromRow(r: ClinicalResultRow): UcdaItem {
  const num = r.value_num == null ? null : Number(r.value_num)
  return {
    itemType: asItemType(r.item_type),
    name: r.name,
    valueText: r.value_text ?? '',
    valueNum: Number.isFinite(num as number) ? (num as number) : null,
    ...(r.unit ? { unit: r.unit } : {}),
    ...(r.code ? { code: r.code } : {}),
    ...(r.code_system ? { codeSystem: r.code_system } : {}),
    ...(r.value_code ? { valueCode: r.value_code } : {}),
    ...(r.region ? { region: r.region } : {}),
    ...(r.anatomy ? { anatomy: r.anatomy } : {}),
    ...(r.specimen ? { specimen: r.specimen } : {}),
    ...(r.method ? { method: r.method } : {}),
    ...(r.context ? { context: r.context } : {}),
    ...(r.group_label ? { group: r.group_label } : {}),
    ...(r.reference_text ? { referenceText: r.reference_text } : {}),
    ...(r.page != null ? { page: r.page } : {}),
    ...(r.raw_text ? { excerpt: r.raw_text } : {}),
  }
}

/** Colunas de `clinical_results` que descrevem UM item (sem chaves de exame/modelo/proveniência de linha). */
export type ClinicalResultItemFields = Omit<ClinicalResultRow, 'clinical_model' | 'result_kind'>

/**
 * Mapeia um UcdaItem para as colunas de `clinical_results` — o ÚNICO ponto de persistência de item (usado
 * pelo analyze e auditável por CERT-persistence). Genérico: representa QUALQUER tipo de item (parâmetro,
 * biomarcador, achado, classificação, medida, anatomia, lateralidade, grupo, texto…) sem adaptação por
 * modalidade (Princípio do Modelo Aberto).
 */
export function ucdaItemToRow(item: UcdaItem): ClinicalResultItemFields {
  return {
    item_type: item.itemType,
    name: item.name,
    value_text: item.valueText ?? null,
    value_num: item.valueNum ?? null,
    unit: item.unit ?? null,
    code: item.code ?? null,
    code_system: item.codeSystem ?? null,
    value_code: item.valueCode ?? null,
    region: item.region ?? null,
    anatomy: item.anatomy ?? null,
    specimen: item.specimen ?? null,
    method: item.method ?? null,
    context: item.context ?? null,
    group_label: item.group ?? null,
    reference_text: item.referenceText ?? null,
    page: item.page ?? null,
    raw_text: item.excerpt ?? null,
  }
}

/**
 * Converte linhas de `clinical_results` (de UM exame/modelo) na representação canônica UCDA. Puro.
 * Vazio → null. O consumidor lê UCDA, não o backend.
 */
export function clinicalResultsToUcda(rows: ClinicalResultRow[]): UcdaRepresentation | null {
  if (!rows.length) return null
  const first = rows[0]
  return {
    clinicalModel: first.clinical_model,
    resultKind: (['structured', 'narrative', 'parametric'].includes(first.result_kind)
      ? first.result_kind : 'structured') as UcdaResultKind,
    items: rows.map(itemFromRow),
    provenance: { source: 'clinical_results' },
  }
}
