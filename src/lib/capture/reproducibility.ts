import { createHash } from 'node:crypto'

// Princípio da Reprodutibilidade (GOVERNANCA — constitucional): para o MESMO documento, com a MESMA
// versão do extrator, a plataforma deve produzir exatamente a MESMA representação estruturada (mesmo
// nome documental, mesma classificação, mesmos resultados). Diferença = regressão.
//
// Reprodutibilidade NÃO vem de determinismo do LLM (visão não é bit-a-bit reprodutível nem a temp 0):
// vem de CONGELAR a representação certificada e não re-derivá-la na mesma versão. O fingerprint é a
// prova permanente disso — a assinatura da 1ª extração; qualquer re-derivação que difira é um EVENTO
// DE CONSISTÊNCIA e nunca substitui automaticamente os dados existentes.

export interface FingerprintResult {
  name?: string | null
  value?: number | string | null
  valueText?: string | null
  unit?: string | null
  referenceMin?: number | null
  referenceMax?: number | null
}

export interface RepresentationInput {
  documentType?: string | null
  documentScope?: string | null
  displayTitle?: string | null
  results: FingerprintResult[]
}

const norm = (v: unknown): string => (v == null ? '' : String(v).trim())

/**
 * Assinatura determinística da representação estruturada. Canoniza (ordena os resultados por
 * nome+valor, normaliza vazios) para que a MESMA representação — em qualquer ordem — gere a MESMA
 * assinatura, e qualquer mudança de conteúdo gere uma assinatura diferente.
 */
export function representationFingerprint(rep: RepresentationInput): string {
  const results = (rep.results ?? [])
    .map(r => ({
      name:      norm(r.name),
      value:     norm(r.value),
      valueText: norm(r.valueText),
      unit:      norm(r.unit),
      refMin:    norm(r.referenceMin),
      refMax:    norm(r.referenceMax),
    }))
    .sort((a, b) =>
      a.name !== b.name
        ? a.name.localeCompare(b.name)
        : (a.value + '|' + a.valueText).localeCompare(b.value + '|' + b.valueText),
    )

  const canonical = JSON.stringify({
    documentType:  norm(rep.documentType),
    documentScope: norm(rep.documentScope),
    displayTitle:  norm(rep.displayTitle),
    results,
  })

  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Uma representação está CERTIFICADA quando uma extração anterior foi bem-sucedida (status
 * `processed`) e a identidade documental já foi estabelecida. Nesse estado, uma reextração com a
 * mesma versão do extrator NÃO pode re-executar nem sobrescrever — a representação é imutável.
 */
export function isRepresentationCertified(args: { previousStatus: string; identityEstablished: boolean }): boolean {
  return args.previousStatus === 'processed' && args.identityEstablished
}
