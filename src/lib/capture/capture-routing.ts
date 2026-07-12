// Roteamento da captura documental (Capture Hub) — DECISÃO pura, testável.
// Dado o que a IA leu + o que a usuária confirmou, decide O QUE persistir. É o núcleo
// de negócio do "salvamento duplo" de Condições (reference implementation do CAP-002).
//
// Regras (fundadora):
//  • EXAME é criado SEMPRE que o documento é um laudo lab/imagem (isExam) e há arquivo —
//    INDEPENDENTE da conclusão (normal/negativo/positivo). A existência do exame não
//    depende do resultado.
//  • CONDIÇÃO só é criada quando há um diagnóstico/condição AFIRMADO (hasCondition) —
//    manual ou transcrito. Exame negativo/sem diagnóstico NÃO gera condição (RDC 657).
//  • VÍNCULO (source_exam_id) quando ambos existem.
// Sem juízo clínico — só roteia o que já foi lido/confirmado.

export interface CaptureRoutingInput {
  /** A usuária afirmou uma condição (nome preenchido no formulário)? */
  hasCondition: boolean
  /** A IA classificou o documento como exame/laudo (lab/imagem)? */
  isExam: boolean
  /** Há um arquivo anexado (documento) para persistir? */
  hasFile: boolean
}

export interface CaptureRoutingDecision {
  createExam: boolean
  createCondition: boolean
  /** Vincular a condição ao exame criado (source_exam_id). */
  linkConditionToExam: boolean
  /** Ao menos um registro é criado (senão não há o que salvar). */
  canSave: boolean
}

export function decideCaptureRouting(input: CaptureRoutingInput): CaptureRoutingDecision {
  const createExam = input.hasFile && input.isExam
  const createCondition = input.hasCondition
  const linkConditionToExam = createExam && createCondition
  return {
    createExam,
    createCondition,
    linkConditionToExam,
    canSave: createExam || createCondition,
  }
}
