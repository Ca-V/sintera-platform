// @sintera/core — o que conta como FATO TRANSCRITO de um documento (ANEXO-001 · RDC 657).
//
// A plataforma não produz conteúdo clínico: ela transcreve o que está escrito no papel para que a pessoa
// REVISE. A fronteira entre transcrever e inferir é o que estas funções guardam.
//
// A regra que as governa: **preencher errado é pior que não preencher**. Um campo em branco a pessoa nota e
// completa; um campo preenchido com um palpite ela confirma sem ler, e o palpite vira fato no prontuário dela.
// Por isso tudo aqui recusa por padrão e só aceita o que é inequívoco.

/**
 * Data do documento, transcrita. Aceita só ISO completo (AAAA-MM-DD) e dentro de faixa plausível.
 *
 * Recusa data fora de faixa porque documento de saúde de 1900 ou de 2100 é erro de leitura, não fato — e uma
 * data errada no formulário contamina a ordenação da linha do tempo inteira.
 *
 * `hoje` é injetado para manter a função determinística (DATE-001): sem isso o teste dependeria do relógio.
 */
export function transcribedDate(v: unknown, hoje: Date = new Date()): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const d = new Date(`${s}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return undefined
  // Rejeita data inexistente que o construtor "conserta" (31/02 vira 03/03).
  if (d.toISOString().slice(0, 10) !== s) return undefined
  const ano = Number(s.slice(0, 4))
  if (ano < 1950 || ano > hoje.getUTCFullYear() + 1) return undefined
  return s
}

/**
 * Nome de quem emitiu, transcrito. Recusa o que é curto ou longo demais para ser nome — ruído de OCR
 * (um caractere solto, ou um parágrafo inteiro capturado por engano) não é emissor.
 */
export function transcribedIssuer(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim().replace(/\s+/g, ' ')
  return s.length >= 3 && s.length <= 120 ? s : undefined
}
