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
    // Ordem TOTAL — a mesma representação em qualquer ordem gera a MESMA assinatura. O desempate
    // por unit/refMin/refMax é necessário: dois resultados idênticos em (name,value,valueText) mas
    // com unidade/faixa diferentes ficariam na ordem de ENTRADA (sort estável) e quebrariam a
    // ordem-independência. Preserva EXATAMENTE a ordem anterior nos casos não-empatados (fingerprints
    // existentes inalterados); só ordena deterministicamente o caso antes ambíguo.
    .sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name)
      const av = a.value + '|' + a.valueText, bv = b.value + '|' + b.valueText
      if (av !== bv) return av.localeCompare(bv)
      return (a.unit + '|' + a.refMin + '|' + a.refMax).localeCompare(b.unit + '|' + b.refMin + '|' + b.refMax)
    })

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
