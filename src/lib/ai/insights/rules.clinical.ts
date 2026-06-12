// ============================================================
// SINTERA — Regras Clínicas do Motor de Insights (TEMPLATE)
// ============================================================
// ⚠️ ESTE ARQUIVO CONTÉM DECISÃO CLÍNICA. Deve ser preenchido e APROVADO
//    por responsável clínico humano identificado, e versionado com registro
//    da aprovação (ver docs/GOVERNANCA-CLINICA-SINTERA.md §6 e §7).
//
//    Enquanto não houver regras aprovadas, `CLINICAL_RULESET` permanece VAZIO
//    e o motor não emite nenhum insight — comportamento intencional e seguro.
//
//    NÃO adicione regras com valores "de exemplo" ou inferidos por IA. Cada
//    limiar e cada clinical_flag precisa de respaldo clínico explícito.
// ============================================================

import type { RuleSet } from './engine'

/**
 * Conjunto de regras clínicas APROVADAS, em uso pelo motor.
 * VAZIO até a aprovação clínica. Não preencher sem assinatura de responsável.
 */
export const CLINICAL_RULESET: RuleSet = []

// ── Como preencher (quando houver aprovação clínica) ──────────────────────────
//
// Cada regra liga um biomarcador (catalogCode do biomarker_catalog) a uma
// condição e à classificação resultante. Estrutura de uma regra:
//
//   {
//     catalogCode: 'HEMOGLOBINA_SANGUE',     // code do catálogo
//     when: { kind: 'rangeStatus', status: ['below'] },  // ou numericThreshold/always
//     clinicalFlag: 'acompanhar',            // atencao_imediata | acompanhar | normal
//     templateKey: 'hemoglobina_baixa_v1',   // qual texto narrativo usar
//     insightType: 'biomarker',
//     priority: 'medium',
//   }
//
// Tipos de condição (`when`) disponíveis:
//   - { kind: 'rangeStatus', status: ['below'|'above'|'within'|'no_reference'|'non_numeric'] }
//       dispara conforme o valor está fora/dentro da faixa IMPRESSA no laudo.
//   - { kind: 'numericThreshold', op: '<'|'<='|'>'|'>=', value: <número> }
//       dispara por limiar absoluto definido pela clínica.
//   - { kind: 'always' }
//       sempre dispara para aquele biomarcador.
//
// EXEMPLO ESTRUTURAL (valores FICTÍCIOS — NÃO usar em produção):
//   // const exemploNaoAprovado = {
//   //   catalogCode: 'GLICEMIA',
//   //   when: { kind: 'numericThreshold', op: '>=', value: 999 }, // valor fictício
//   //   clinicalFlag: 'acompanhar',
//   //   templateKey: 'glicemia_alta_v1',
//   //   insightType: 'biomarker',
//   // }
//
// Os 6 biomarcadores marcados is_critical no catálogo (candidatos prioritários
// para as primeiras regras): HEMOGLOBINA_SANGUE, GLICEMIA, CREATININA_SERICA,
// SODIO, POTASSIO, CALCIO_IONICO. A lista de criticidade também é decisão
// clínica a confirmar (ver governança §1.1).
