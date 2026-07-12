import Anthropic from '@anthropic-ai/sdk'

// Extrai o NOME do laboratório/clínica/hospital EMISSOR de um laudo, a partir do texto
// já extraído. Isolado e best-effort: NÃO toca no prompt de extração (governado/versionado/
// verificado por hash). Alimenta o enriquecimento do display_title ("Exames laboratoriais •
// Hermes Pardini"). Falha nunca quebra a análise — retorna null.
const MODEL = 'claude-haiku-4-5-20251001'

export async function extractIssuer(examText: string | null | undefined): Promise<string | null> {
  const text = (examText ?? '').trim()
  if (text.length < 20) return null
  if (!process.env.ANTHROPIC_API_KEY) return null
  const head = text.slice(0, 3000) // o emissor costuma estar no cabeçalho do laudo
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 20_000 })
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 40, temperature: 0,
      system: 'Você recebe o texto de um laudo/exame e responde APENAS com o NOME do laboratório, '
        + 'clínica ou hospital que EMITIU o documento, exatamente como escrito (ex.: "Hermes Pardini", '
        + '"Fleury", "DASA", "Axial", "Sabin"). TRANSCREVA, não infira. Ignore nomes de médicos, do '
        + 'paciente e de convênios. Se não houver emissor claro, responda exatamente "null". '
        + 'Responda só o nome, sem rótulos nem pontuação extra.',
      messages: [{ role: 'user', content: `Texto do laudo:\n"""${head}"""\n\nNome do laboratório/clínica emissor:` }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    const cleaned = raw.replace(/^["'.\s]+|["'.\s]+$/g, '')
    if (!cleaned || /^null$/i.test(cleaned) || cleaned.length > 80) return null
    return cleaned.slice(0, 80)
  } catch {
    return null
  }
}
