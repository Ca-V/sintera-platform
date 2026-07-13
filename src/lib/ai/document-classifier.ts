import Anthropic from '@anthropic-ai/sdk'

// Content Classifier (leitura do DOCUMENTO). Complementa o pipeline de biomarcadores:
// quando o laudo NÃO gera biomarcadores (imagem/escaneado, exame de imagem, oftalmológico,
// EEG, pedido, guia…), a IA LÊ o próprio documento e devolve tipo + nome + emissor. Isolado
// e best-effort — nunca quebra a análise. Transcreve/classifica, não interpreta (RDC 657).
const MODEL = 'claude-haiku-4-5-20251001'

export interface DocClassification {
  documentType: string
  displayName: string | null
  issuer: string | null
}

const SYSTEM = `Você CLASSIFICA um documento de saúde e devolve seu TIPO e NOME, transcrevendo o
que está ESCRITO. NÃO infere diagnóstico nem interpreta clinicamente (RDC 657/2022).
Responda APENAS JSON válido:
{"document_type": "<um de: laboratory | imaging | neurophysiology | ophthalmology | cardiology | endoscopy | anatomopathology | medical_report | prescription | vaccination | medical_order | insurance_guide | unknown>", "display_name": "<título COMPLETO do exame/documento EXATAMENTE como escrito no laudo, incluindo a região/lateralidade; ex.: 'Ultrassonografia das mamas e axilas', 'Ultrassonografia pélvica endovaginal', 'Mamografia digital', 'Eletroencefalograma'; NÃO abrevie nem generalize; null se indefinido>", "issuer": "<laboratório/clínica/hospital emissor, ou null>"}
Regras:
- PEDIDO/SOLICITAÇÃO/REQUISIÇÃO de exame → document_type "medical_order"; GUIA de convênio/SADT → "insurance_guide" (o documento é uma SOLICITAÇÃO, não um resultado).
- Exame de IMAGEM → "imaging" e display_name = a modalidade (ex.: Ressonância magnética, Ultrassonografia).
- Laudo LABORATORIAL com vários exames → display_name "Exames laboratoriais".
- NUNCA use um biomarcador isolado como nome do documento.`

export async function classifyDocumentAI(args: { base64: string; mediaType: string }): Promise<DocClassification | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!args.base64) return null
  const isPdf = args.mediaType === 'application/pdf'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const block: any = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: args.base64 } }
    : { type: 'image', source: { type: 'base64', media_type: args.mediaType, data: args.base64 } }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 40_000 })
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 200, temperature: 0, system: SYSTEM,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: 'user', content: [block, { type: 'text', text: 'Classifique este documento no JSON pedido.' }] as any }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return null
    const o = JSON.parse(m[0]) as Record<string, unknown>
    const displayName = typeof o.display_name === 'string' && o.display_name.trim() ? o.display_name.trim().slice(0, 120) : null
    const issuer = typeof o.issuer === 'string' && o.issuer.trim() && !/^null$/i.test(o.issuer.trim()) ? o.issuer.trim().slice(0, 80) : null
    const documentType = typeof o.document_type === 'string' && o.document_type.trim() ? o.document_type.trim() : 'unknown'
    return { documentType, displayName, issuer }
  } catch {
    return null
  }
}
