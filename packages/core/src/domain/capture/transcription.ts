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

/**
 * O que foi PRESCRITO numa receita, transcrito do papel.
 *
 * PEDIDO DA FUNDADORA (30/08): "não aparece o nome do medicamento, que é o item mais importante — sinalizar
 * que aquela receita é de qual medicamento". Ela está certa: uma receita identificada só por médico e data
 * obriga a abrir o arquivo para saber do que se trata, que é o trabalho que a plataforma existe para poupar.
 *
 * ISTO É TRANSCRIÇÃO, NÃO INTERPRETAÇÃO (RDC 657). Copiar "Losartana 50mg" do papel é preservar o que o médico
 * escreveu — a mesma coisa que a plataforma já faz ao extrair valores de um laudo. O que ela não faz, e continua
 * não fazendo, é dizer para que serve, se a dose está certa, ou o que significa.
 *
 * A GUARDA aqui é a mesma dos outros fatos: o que não parece transcrito é DESCARTADO. Item vazio, longo demais
 * para ser um nome de medicamento, ou que contenha frase de orientação, não entra — um dado inventado com
 * aparência de transcrito é pior que dado nenhum.
 */
export function transcribedItems(v: unknown): string[] {
  if (!Array.isArray(v)) return []

  // Frases de POSOLOGIA e ORIENTAÇÃO. Elas são conteúdo clínico de uso, não identificação do que foi prescrito —
  // e é exatamente a fronteira que a plataforma não atravessa.
  const orientacao = /\b(tomar|usar|aplicar|ingerir|administrar|a cada|de \d+ em \d+|ao dia|por dia|em jejum|antes de|depois de|caso|se necess)/i

  const limpos: string[] = []
  for (const item of v) {
    if (typeof item !== 'string') continue
    const t = item.trim().replace(/\s+/g, ' ')
    if (t.length < 2) continue
    // Um nome de medicamento com concentração cabe folgado em 80 caracteres. Acima disso é frase, não nome.
    if (t.length > 80) continue
    if (orientacao.test(t)) continue
    // Sem repetir o mesmo item: a mesma linha lida duas vezes não é duas prescrições.
    if (limpos.some(j => j.toLowerCase() === t.toLowerCase())) continue
    limpos.push(t)
  }
  // Uma receita com mais de dez itens quase certamente é leitura errada — o papel virou lista de outra coisa.
  return limpos.slice(0, 10)
}

/**
 * Como a receita se apresenta quando se sabe o que ela prescreve.
 *
 * "Receita de Losartana" em vez de só "Receita" — o que a fundadora pediu. Com mais de um item, nomeia o
 * primeiro e conta o resto, porque o cartão tem uma linha e a lista inteira não caberia.
 */
export function prescribedLabel(items: readonly string[]): string | null {
  const validos = items.map(i => i.trim()).filter(Boolean)
  if (validos.length === 0) return null
  if (validos.length === 1) return validos[0]
  return `${validos[0]} e mais ${validos.length - 1}`
}
