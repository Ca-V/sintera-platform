// ============================================================
// SINTERA — Motor de Insights: Render de Templates (mecanismo)
// ============================================================
// Mecanismo de substituição de placeholders para o texto do insight.
//
// ATENÇÃO — fronteira regulatória:
//   Os TEXTOS dos templates são conteúdo clínico/produto, aprovados à parte.
//   Aqui só vive o MECANISMO de substituição e a biblioteca VAZIA. Os
//   placeholders disponíveis são apenas dados FACTUAIS/ARITMÉTICOS do
//   biomarcador (valor, unidade, nome, faixa impressa) — nunca juízo clínico.
//
//   `TEMPLATE_LIBRARY` está VAZIO até a aprovação clínica. Enquanto vazio (e
//   com o RuleSet vazio), nenhum texto é renderizado.
// ============================================================

import type { TemplateRenderer } from './persistence'
import type { InsightCandidate } from './engine'
import type { AssembledBiomarker } from './types'

/**
 * Biblioteca de templates: template_key → texto com placeholders.
 * VAZIA até aprovação clínica. NÃO preencher com texto sem assinatura clínica.
 * Ex. de texto aprovado (FICTÍCIO): 'Seu {{displayName}} foi {{value}} {{unit}}.'
 */
export const TEMPLATE_LIBRARY: Record<string, string> = {}

/** Placeholders suportados — todos FACTUAIS (sem interpretação clínica). */
function placeholderValues(b: AssembledBiomarker): Record<string, string> {
  return {
    displayName: b.displayName ?? b.name,
    value: b.value !== null ? String(b.value) : (b.valueText ?? ''),
    unit: b.unit ?? '',
    referenceMin: b.referenceMin !== null ? String(b.referenceMin) : '',
    referenceMax: b.referenceMax !== null ? String(b.referenceMax) : '',
  }
}

/** Substitui {{chave}} pelos valores factuais do biomarcador. */
export function fillTemplate(template: string, b: AssembledBiomarker): string {
  const values = placeholderValues(b)
  return Object.keys(values).reduce(
    (acc, key) => acc.split(`{{${key}}}`).join(values[key]),
    template,
  )
}

/**
 * Cria um renderizador para a persistência, ligado a uma biblioteca de templates.
 * Lança se o `template_key` do candidato não existir na biblioteca — o que, com
 * a biblioteca vazia, nunca acontece porque não há candidatos (RuleSet vazio).
 */
export function makeTemplateRenderer(
  library: Record<string, string> = TEMPLATE_LIBRARY,
): TemplateRenderer {
  return (candidate: InsightCandidate): string => {
    const template = library[candidate.templateKey]
    if (template === undefined) {
      throw new Error(`Template ausente para template_key="${candidate.templateKey}" (biblioteca não aprovada?).`)
    }
    return fillTemplate(template, candidate.biomarker)
  }
}
