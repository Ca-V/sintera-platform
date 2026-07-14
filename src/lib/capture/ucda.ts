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
}

export type UcdaResultKind = 'structured' | 'narrative' | 'parametric'

/** Representação canônica de uma evidência clínica (a saída universal do CPE). */
export interface UcdaRepresentation {
  clinicalModel: string
  resultKind: UcdaResultKind
  items: UcdaItem[]
  /** Proveniência auditável — de onde veio esta representação. */
  provenance: { source: string; contractVersion?: string }
}

/**
 * Converte a saída de um PROCESSADOR do CPE (ProcessorResult) na representação canônica UCDA. Puro.
 * Sem saída → null (document_only; nada a representar). Cada tipo de resultado mapeia para UcdaItems.
 */
export function representationFromProcessor(result: ProcessorResult): UcdaRepresentation | null {
  const out = result.output
  if (!out) return null
  const provenance = { source: 'cpe', contractVersion: result.contractVersion }

  if (out.kind === 'parametric') {
    return {
      clinicalModel: result.clinicalModel, resultKind: 'parametric', provenance,
      items: out.parameters.map(p => ({
        itemType: 'measure' as const, name: p.name, valueText: p.value,
        valueNum: toNum(p.value), ...(p.unit ? { unit: p.unit } : {}), ...(p.region ? { region: p.region } : {}),
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
