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
  examDate: string | null   // data de REALIZAÇÃO impressa no documento (YYYY-MM-DD), quando houver
}

const SYSTEM = `Você CLASSIFICA um documento de saúde e devolve seu TIPO, NOME, EMISSOR e DATA, transcrevendo o
que está ESCRITO. NÃO infere diagnóstico nem interpreta clinicamente (RDC 657/2022).
Responda APENAS JSON válido:
{"document_type": "<um de: laboratory | imaging | neurophysiology | ophthalmology | cardiology | endoscopy | anatomopathology | medical_report | prescription | vaccination | medical_order | insurance_guide | unknown>", "display_name": "<TÍTULO PRINCIPAL do documento — o nome do exame/EQUIPAMENTO impresso no CABEÇALHO, como está escrito, com região/lateralidade quando houver; ex.: 'OCULUS Pentacam', 'Pentacam HR', 'Mamografia digital', 'Ultrassonografia das mamas e axilas', 'Eletroencefalograma'; NÃO abrevie nem generalize; null se indefinido>", "issuer": "<laboratório/clínica/hospital/fabricante emissor, ou null>", "exam_date": "<data de REALIZAÇÃO do exame impressa no documento, formato YYYY-MM-DD; a data ao lado do exame/resultado; NUNCA a data de nascimento, de impressão ou de protocolo; null se não houver>"}
HIERARQUIA DO NOME (display_name) — a pessoa reencontra o exame pelo nome que conhece:
- (1) PRIORIDADE ABSOLUTA: o título/cabeçalho IMPRESSO no documento (nome do exame ou do EQUIPAMENTO + modelo). Se houver fabricante+modelo (Pentacam, OCULUS, CEM-530, Pentacam HR…), ELE é a identidade do exame.
- (2) Se não houver título confiável no cabeçalho: o nome do exame reconhecido.
- (3) SÓ em último recurso, a categoria/especialidade (ex.: 'Oftalmologia', 'Cardiologia').
- NUNCA use uma LINHA INTERNA do laudo, um PARÂMETRO medido, nem um BIOMARCADOR isolado como nome (ex.: não nomear um Pentacam como 'Campo visual' ou 'Paquimetria' — esses são itens internos, não o título do documento).
Regras de tipo:
- PEDIDO/SOLICITAÇÃO/REQUISIÇÃO de exame → document_type "medical_order"; GUIA de convênio/SADT → "insurance_guide" (o documento é uma SOLICITAÇÃO, não um resultado).
- Exame de IMAGEM → "imaging"; display_name = a modalidade/título impresso (ex.: Ressonância magnética, Ultrassonografia).
- Exame OFTALMOLÓGICO de EQUIPAMENTO/IMAGEM (topografia de córnea/Pentacam, microscopia especular/contagem endotelial de células, OCT, biometria, campo visual, aparelhos OCULUS/CEM) → "ophthalmology" MESMO quando traz medidas numéricas por olho (NÃO é "laboratory"); display_name = o EQUIPAMENTO/título impresso (ex.: 'OCULUS Pentacam', 'Microscopia especular de córnea (CEM-530)').
- Laudo LABORATORIAL com vários exames → display_name "Exames laboratoriais".`

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
      model: MODEL, max_tokens: 300, temperature: 0, system: SYSTEM,
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
    // Data de realização transcrita da imagem (fato documental) — só aceita YYYY-MM-DD plausível.
    const examDate = typeof o.exam_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.exam_date.trim()) ? o.exam_date.trim() : null
    return { documentType, displayName, issuer, examDate }
  } catch {
    return null
  }
}
