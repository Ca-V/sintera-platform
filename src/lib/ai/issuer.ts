import Anthropic from '@anthropic-ai/sdk'
import { normalizeExtractedName } from './extractedFieldNormalize'

// Extrai o NOME do laboratório/clínica/hospital EMISSOR de um laudo, a partir do texto
// já extraído. Isolado e best-effort: NÃO toca no prompt de extração (governado/versionado/
// verificado por hash). Alimenta o enriquecimento do display_title ("Exames laboratoriais •
// Hermes Pardini"). Falha nunca quebra a análise — retorna null.
const MODEL = 'claude-haiku-4-5-20251001'

// Rótulo ecoado SEGURO de remover: nomes de emissor NÃO começam por "Emissor:"/"Emitido por:".
// NÃO incluímos "Laboratório/Clínica/Hospital" — nomes reais começam por essas palavras.
const ISSUER_LABEL = /^(emissor|laudo\s+emitido\s+por|emitido\s+por)\s*[:\-–—]\s*/i

/** Normaliza a resposta crua do extrator de emissor em nome confiável, ou `null`. PURA. */
export function normalizeIssuer(raw: string | null | undefined): string | null {
  return normalizeExtractedName(raw, ISSUER_LABEL)
}

/**
 * Guarda determinística (Obs 11) — rejeita um candidato a emissor cuja ÚNICA ocorrência na FONTE está
 * COLADA a um identificador alfanumérico (ex.: pedido "5003524-SAVA" → "SAVA"). CONSERVADORA: só rejeita
 * quando NÃO há nenhuma ocorrência "limpa" (isolada) do candidato no texto. Sem texto, ou candidato ausente
 * do texto (ex.: nome lido de logo por multimodal), NÃO rejeita — não temos como provar que é artefato.
 * Princípio: metadado não comprovado fica ausente; nunca inferir um laboratório de um token ambíguo. PURA.
 */
export function isOrderCodeArtifact(candidate: string | null | undefined, sourceText: string | null | undefined): boolean {
  const token = (candidate ?? '').trim()
  const text = sourceText ?? ''
  if (token.length < 2 || !text) return false
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Ocorrência LIMPA = vizinhos não são dígito, '-' nem '/' (separadores de código) → nome isolado, legítimo.
  if (new RegExp(`(^|[^0-9A-Za-z/-])${esc}([^0-9A-Za-z/-]|$)`, 'i').test(text)) return false
  // Não aparece no texto → não é artefato de código (conservador: não rejeita).
  if (!new RegExp(esc, 'i').test(text)) return false
  // Aparece SÓ colado a código → artefato de identificador de pedido → rejeitar.
  return true
}

const ISSUER_SYSTEM =
  'Você recebe um laudo/exame (texto ou imagem) e responde APENAS com o NOME do laboratório, clínica ou hospital '
  + 'que EMITIU o documento, exatamente como escrito (ex.: "Hermes Pardini", "Fleury", "DASA", "Axial", "Sabin", '
  + '"OCULUS"). TRANSCREVA, não infira. Ignore nomes de médicos, do paciente e de convênios. Se não houver '
  + 'emissor claro, responda exatamente "null". Responda só o nome, sem rótulos nem pontuação extra.'

export async function extractIssuer(examText: string | null | undefined): Promise<string | null> {
  const text = (examText ?? '').trim()
  if (text.length < 20) return null
  if (!process.env.ANTHROPIC_API_KEY) return null
  const head = text.slice(0, 3000) // o emissor costuma estar no cabeçalho do laudo
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 20_000 })
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 40, temperature: 0, system: ISSUER_SYSTEM,
      messages: [{ role: 'user', content: `Texto do laudo:\n"""${head}"""\n\nNome do laboratório/clínica emissor:` }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const issuer = normalizeIssuer(raw)
    // Obs 11: descarta candidato que só existe como fragmento de código de pedido (ex.: "5003524-SAVA").
    return issuer && isOrderCodeArtifact(issuer, text) ? null : issuer
  } catch {
    return null
  }
}

/** Emissor a partir da IMAGEM do laudo (foto/PDF escaneado) — multimodal. Corrige documentos sem texto extraível. */
export async function extractIssuerFromImage(imageBuffer: Buffer, mediaType: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const mt = (/^image\/(jpeg|png|webp|gif)$/.test(mediaType) ? mediaType : 'image/jpeg') as
    'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 20_000 })
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 40, temperature: 0, system: ISSUER_SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mt, data: imageBuffer.toString('base64') } },
          { type: 'text', text: 'Nome do laboratório/clínica emissor deste documento:' },
        ],
      }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    return normalizeIssuer(raw)
  } catch {
    return null
  }
}
