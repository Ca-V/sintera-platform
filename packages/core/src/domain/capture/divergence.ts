// @sintera/core — LEITURA DO DOCUMENTO: o que a plataforma identificou × o que a pessoa declarou.
//
// CASO REAL QUE ORIGINOU ESTE ARQUIVO (homologação da fundadora, 25/08): em "Receitas e atestados" ela
// selecionou **Receita**, anexou um **pedido de exame** e um **laudo**, e os dois foram gravados como receita.
// A plataforma TINHA como saber — a classificação existe desde sempre — mas tinha um único consumidor, o
// Capture Center da Web. Nenhuma outra tela olhava.
//
// Não é desorganização: é registro clínico errado. Um laudo arquivado como receita passa a ser, para todos os
// efeitos da plataforma, uma receita.
//
// A REGRA (fundadora, PERMANENTE): a plataforma LÊ o documento, IDENTIFICA o tipo, SINALIZA quando diverge do
// que a pessoa declarou, e a DIRECIONA à categoria correta. Ela decide — nunca automático.
//
// FRONTEIRA (ADR-000 · RDC 657): identificar QUE documento é, e transcrever emissor e data, são fatos
// documentais. Interpretar o conteúdo clínico não é, e não se faz aqui.
import type { DocumentKind } from './types'
import type { PatientDocumentSubtype } from '../documents/patientDocuments'

/** O que a leitura do documento devolve. Tudo opcional: leitura que falha degrada, não bloqueia. */
export interface DocumentReading {
  kind: DocumentKind
  /** Subtipo documental quando o documento é do domínio Documentos (receita, atestado…). */
  subtype?: PatientDocumentSubtype | null
  /** Quem emitiu — transcrito do documento, não inferido. */
  issuer?: string | null
  /** Data de emissão, AAAA-MM-DD. */
  docDate?: string | null
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Todo subtipo do domínio Documentos (receita · atestado · relatório · encaminhamento · outro) corresponde ao
 * kind `clinical_document`. Qualquer OUTRO kind lido significa que o documento pertence a outra categoria da
 * plataforma — é essa comparação que permite dizer "você marcou Receita, mas isto parece um laudo".
 */
export const DOCUMENT_DOMAIN_KIND: DocumentKind = 'clinical_document'

/** Como cada kind é DITO à pessoa, na frase do aviso. Uma redação só. */
const KIND_NOUN: Partial<Record<DocumentKind, string>> = {
  exam:                  'um laudo de exame',
  medical_order:         'um pedido de exame',
  medication_label:      'uma bula ou rótulo de medicamento',
  eyeglass_prescription: 'uma receita de óculos',
  omics:                 'um exame ômico',
  clinical_document:     'um documento clínico',
}
export function kindNoun(k: DocumentKind): string | null {
  return KIND_NOUN[k] ?? null
}

export interface DivergenceVerdict {
  /** Há divergência que valha AVISAR? */
  diverges: boolean
  /** A frase que a pessoa lê. `null` quando não há o que dizer. */
  message: string | null
  /** Para onde o documento pertenceria, se ela quiser mover. `null` quando não há destino melhor. */
  suggestedKind: DocumentKind | null
}

const SEM_DIVERGENCIA: DivergenceVerdict = { diverges: false, message: null, suggestedKind: null }

/**
 * Compara o que foi lido com o que foi declarado.
 *
 * AVISA SÓ COM CONFIANÇA SUFICIENTE: um palpite fraco que contradiz a pessoa é pior do que ficar calado — ela
 * escolheu o tipo, e duvidar dela sem base treina a ignorar o aviso. `low` nunca avisa.
 *
 * NUNCA move sozinho. Devolve a frase e o destino; quem decide é ela.
 */
export function documentDivergence(
  declared: PatientDocumentSubtype,
  reading: DocumentReading | null | undefined,
  subtypeLabel: (s: PatientDocumentSubtype) => string,
): DivergenceVerdict {
  if (!reading) return SEM_DIVERGENCIA
  if (reading.confidence === 'low') return SEM_DIVERGENCIA

  // Dentro do domínio documental: divergência é de SUBTIPO (marcou receita, é atestado).
  if (reading.kind === 'clinical_document') {
    if (!reading.subtype || reading.subtype === declared || reading.subtype === 'outro') return SEM_DIVERGENCIA
    return {
      diverges: true,
      message: `Você marcou ${subtypeLabel(declared)}, mas este documento parece ${artigo(subtypeLabel(reading.subtype))}.`,
      suggestedKind: 'clinical_document',
    }
  }

  // Fora do domínio documental: o documento pertence a OUTRA categoria da plataforma.
  const noun = kindNoun(reading.kind)
  if (!noun) return SEM_DIVERGENCIA
  return {
    diverges: true,
    message: `Você marcou ${subtypeLabel(declared)}, mas este documento parece ${noun}.`,
    suggestedKind: reading.kind,
  }
}

/** "um atestado" / "uma receita" — concordância simples, para a frase não sair truncada. */
function artigo(label: string): string {
  const l = label.toLowerCase()
  return /^(receita|guia|solicita)/.test(l) ? `uma ${l}` : `um ${l}`
}

/**
 * O que a leitura preenche no formulário, para REVISÃO. Só fatos documentais.
 * Não sobrescreve o que a pessoa já digitou — ela é a autoridade sobre o próprio registro.
 */
export function autofillFrom(
  reading: DocumentReading | null | undefined,
  atual: { issuer: string; docDate: string },
): { issuer: string; docDate: string } {
  if (!reading) return atual
  return {
    issuer:  atual.issuer.trim()  !== '' ? atual.issuer  : (reading.issuer ?? ''),
    docDate: atual.docDate.trim() !== '' ? atual.docDate : (reading.docDate ?? ''),
  }
}
