import Anthropic from '@anthropic-ai/sdk'

// Extrai o NOME do médico SOLICITANTE (quem pediu o exame) de um laudo, a partir do texto
// já extraído. Isolado e best-effort — NÃO toca no prompt de extração (governado/versionado/
// verificado por hash), exatamente como `extractIssuer`. Alimenta a identificação do card
// (tipo · laboratório/clínica · médico solicitante — backlog A1). Falha nunca quebra a análise:
// retorna null. TRANSCREVE, não infere (RDC 657 / Não-Produção de Conteúdo Clínico).
const MODEL = 'claude-haiku-4-5-20251001'

export async function extractRequestingPhysician(examText: string | null | undefined): Promise<string | null> {
  const text = (examText ?? '').trim()
  if (text.length < 20) return null
  if (!process.env.ANTHROPIC_API_KEY) return null
  const head = text.slice(0, 3000) // "Solicitante:"/"Médico:" costuma estar no cabeçalho
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 20_000 })
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 40, temperature: 0,
      system: 'Você recebe o texto de um laudo/exame e responde APENAS com o NOME do médico SOLICITANTE '
        + '(quem PEDIU o exame — costuma vir após "Solicitante:", "Médico solicitante:", "Requisitante:", '
        + '"Médico:"). TRANSCREVA exatamente como escrito (ex.: "Dr. João Silva", "Dra. Maria Souza"); '
        + 'NÃO infira. IGNORE o médico que assinou/executou o laudo, o responsável técnico, o emissor '
        + '(laboratório/clínica), o paciente e o convênio. Se não houver solicitante claro, responda '
        + 'exatamente "null". Responda só o nome, sem rótulos nem pontuação extra.',
      messages: [{ role: 'user', content: `Texto do laudo:\n"""${head}"""\n\nNome do médico solicitante:` }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    const cleaned = raw.replace(/^["'.\s]+|["'.\s]+$/g, '')
    if (!cleaned || /^null$/i.test(cleaned) || cleaned.length > 80) return null
    return cleaned.slice(0, 80)
  } catch {
    return null
  }
}
