// Document Understanding Engine (DUE) — CEF/ARCH (ADR-DUE-001 · ADR-CK-001). Componente ÚNICO de COMPREENSÃO do
// documento: recebe QUALQUER documento (PDF pesquisável · escaneado · JPG/PNG · foto · export de equipamento) e
// devolve SEMPRE a MESMA estrutura de FATOS + EVIDÊNCIAS, ANTES de qualquer extração clínica.
//
// RESPONSABILIDADE (única): "o que EXISTE neste documento?" — modalidade, equipamento, data, paciente, emissor,
// solicitante, evidências. O DUE NÃO define o NOME oficial do exame (isso é do Terminology Service) e NÃO possui
// conhecimento clínico (isso é do Clinical Knowledge Service). Fronteira RDC-657: compreende/transcreve, não
// interpreta o resultado clínico.
import Anthropic from '@anthropic-ai/sdk'

export type Confidence = 'high' | 'medium' | 'low'

/** Saída canônica e ÚNICA da compreensão documental (FATOS) — igual para todo tipo de arquivo. */
export interface DocumentUnderstanding {
  documentType: string
  originalTitle: string | null   // TÍTULO impresso no cabeçalho, VERBATIM (auditoria)
  examName: string | null        // nome do exame SÓ SE explícito no documento; null se só há equipamento
  device: string | null          // EQUIPAMENTO/aparelho + modelo — guardado à parte; NUNCA é o nome do exame
  examCategory: string | null
  examModality: string | null
  examDate: string | null        // YYYY-MM-DD
  patientName: string | null
  issuer: string | null
  physician: string | null
  evidence: string[]             // SINAIS lidos do documento (ex.: 'Pentacam','Scheimpflug') — base auditável
  confidence: Confidence         // confiança da COMPREENSÃO reportada pela leitura
  structuredPossible: boolean    // admite extração estruturada (laboratorial) OU document_only (imagem/laudo)
  documentLanguage: string | null
}

/** Modalidades de IMAGEM/laudo sem processador estruturado nesta versão → document_only (não force biomarcadores). */
const NON_STRUCTURED_TYPES = new Set(['imaging', 'ophthalmology'])
/** REGRA PERMANENTE (pura): imagem/oftalmologia = document_only. */
export function structuredPossibleFor(documentType: string | null | undefined): boolean {
  return !NON_STRUCTURED_TYPES.has((documentType ?? '').trim())
}

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você é um mecanismo de COMPREENSÃO de documentos de saúde. LÊ o documento e devolve METADADOS e as
EVIDÊNCIAS que você observou, transcrevendo o que está ESCRITO. NÃO interpreta o resultado clínico nem diagnostica
(RDC 657/2022). Você NÃO decide o nome final do exame — você fornece dados e evidências; a plataforma decide.
Responda APENAS JSON válido, exatamente com estas chaves:
{"document_type":"<laboratory|imaging|neurophysiology|ophthalmology|cardiology|endoscopy|anatomopathology|medical_report|prescription|vaccination|medical_order|insurance_guide|unknown>","original_title":"<TÍTULO impresso no CABEÇALHO, VERBATIM; null>","exam_name":"<nome do EXAME/protocolo APENAS se ESCRITO no documento; null se só há o EQUIPAMENTO>","device":"<EQUIPAMENTO+modelo impresso (ex.: 'OCULUS Pentacam HR'); null>","exam_category":"<especialidade (ex.: 'Oftalmologia'); null>","exam_modality":"<modalidade, se clara; null>","exam_date":"<data de REALIZAÇÃO, YYYY-MM-DD; NUNCA nascimento/impressão/protocolo; null>","patient_name":"<paciente; null>","issuer":"<emissor; null>","physician":"<solicitante; null>","evidence":["<termos/marcadores que você VIU e embasam a identificação: aparelho, tecnologia, mapas, títulos de seção; ex.: 'Pentacam','Scheimpflug','Belin ABCD','Anterior Elevation'>"],"document_language":"<'pt'|'en'|…; null>","confidence":"<high|medium|low>"}
Regras CRÍTICAS:
- EQUIPAMENTO ≠ EXAME. Aparelho → "device". NÃO coloque o equipamento em "exam_name" e NÃO INFIRA o exame a partir do equipamento.
- "exam_name" só quando o EXAME está ESCRITO. Caso contrário null (a plataforma decide pela evidência).
- "evidence": liste os SINAIS reais vistos (aparelho, tecnologia, nomes de mapas/seções) — base auditável.
- NUNCA use uma LINHA INTERNA/parâmetro/biomarcador como título/nome.
- Tipo: PEDIDO/REQUISIÇÃO → "medical_order"; GUIA/SADT → "insurance_guide"; IMAGEM → "imaging"; oftalmológico de EQUIPAMENTO/IMAGEM (Pentacam, microscopia especular, OCT, campo visual, OCULUS/CEM) → "ophthalmology" mesmo com medidas por olho.
- Transcreva, não infira. Campo ausente → null.`

/** Compreende um documento de IMAGEM (visão computacional = fonte de evidência). Best-effort: null sem chave de IA. */
export async function understandImageDocument(args: { base64: string; mediaType: string }): Promise<DocumentUnderstanding | null> {
  if (!process.env.ANTHROPIC_API_KEY || !args.base64) return null
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 40_000 })
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 500, temperature: 0, system: SYSTEM,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: args.mediaType, data: args.base64 } }, { type: 'text', text: 'Compreenda este documento no JSON pedido.' }] as any }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return null
    return parseUnderstanding(JSON.parse(m[0]) as Record<string, unknown>)
  } catch {
    return null
  }
}

/** Normaliza o JSON cru do modelo → DocumentUnderstanding (validação/limpeza determinística). */
export function parseUnderstanding(o: Record<string, unknown>): DocumentUnderstanding {
  const str = (v: unknown, max: number): string | null => {
    if (typeof v !== 'string') return null
    const s = v.trim()
    return s && !/^null$/i.test(s) ? s.slice(0, max) : null
  }
  const documentType = str(o.document_type, 40) ?? 'unknown'
  const confRaw = str(o.confidence, 10)
  const confidence: Confidence = confRaw === 'high' || confRaw === 'low' ? confRaw : 'medium'
  const evidence = Array.isArray(o.evidence)
    ? o.evidence.map(e => (typeof e === 'string' ? e.trim() : '')).filter(Boolean).slice(0, 12).map(e => e.slice(0, 60))
    : []
  return {
    documentType,
    originalTitle: str(o.original_title, 160),
    examName: str(o.exam_name, 160),
    device: str(o.device, 120),
    examCategory: str(o.exam_category, 80),
    examModality: str(o.exam_modality, 120),
    examDate: (() => { const d = str(o.exam_date, 10); return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null })(),
    patientName: str(o.patient_name, 120),
    issuer: str(o.issuer, 80),
    physician: str(o.physician, 80),
    evidence,
    confidence,
    structuredPossible: structuredPossibleFor(documentType),
    documentLanguage: str(o.document_language, 8),
  }
}
