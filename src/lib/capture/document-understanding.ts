// Document Understanding Engine (DUE) — CEF/ARCH. Componente ÚNICO de COMPREENSÃO do documento: recebe QUALQUER
// documento (PDF pesquisável · PDF escaneado · JPG/PNG · foto de celular · export de equipamento) e devolve SEMPRE
// a MESMA estrutura de metadados, ANTES de qualquer extração clínica. Substitui a fragmentação atual (parser de
// data + de paciente + de modalidade + de laboratório + de título + OCR + multimodal, cada um por conta própria).
//
// Fronteira regulatória: o DUE só COMPREENDE/TRANSCREVE o documento (fatos). NÃO interpreta o resultado clínico
// (RDC 657) — essa é a fronteira do Clinical Extraction Engine (consome esta compreensão + o conteúdo e decide
// extrair biomarcadores OU document_only).
//
// EQUIPAMENTO ≠ EXAME (fundadora 13/08): um mesmo aparelho (ex.: OCULUS Pentacam) realiza protocolos diferentes.
// Logo o NOME do exame NÃO é inferido do equipamento por heurística — vem da BASE DE CONHECIMENTO (taxonomia da
// SINTERA). Guardamos 4 informações distintas: nome canônico do exame · equipamento · título original · confiança.
import Anthropic from '@anthropic-ai/sdk'

export type Confidence = 'high' | 'medium' | 'low'

/** Saída canônica e ÚNICA da compreensão documental — igual para todo tipo de arquivo. */
export interface DocumentUnderstanding {
  documentType: string           // mídia/categoria: laboratory | imaging | ophthalmology | neurophysiology | cardiology | endoscopy | anatomopathology | medical_report | prescription | vaccination | medical_order | insurance_guide | unknown
  originalTitle: string | null   // TÍTULO impresso no cabeçalho, VERBATIM (auditoria/rastreabilidade)
  examName: string | null        // nome do exame SÓ SE explícito no documento (protocolo/tipo); null se só há equipamento
  device: string | null          // EQUIPAMENTO/aparelho + modelo (ex.: "OCULUS Pentacam HR") — NUNCA vira o nome do exame
  examCategory: string | null    // especialidade/categoria (ex.: "Oftalmologia")
  examModality: string | null    // modalidade legível (ex.: "Tomografia do segmento anterior")
  examDate: string | null        // data de REALIZAÇÃO impressa (YYYY-MM-DD)
  patientName: string | null
  issuer: string | null          // laboratório/clínica/hospital emissor
  physician: string | null       // médico solicitante
  confidence: Confidence         // confiança da COMPREENSÃO/identificação
  structuredPossible: boolean    // admite extração estruturada (laboratorial) OU é document_only (imagem/laudo)
  documentLanguage: string | null
}

/** Modalidades de IMAGEM/laudo sem processador estruturado nesta versão → document_only (não force biomarcadores). */
const NON_STRUCTURED_TYPES = new Set(['imaging', 'ophthalmology'])

/** REGRA PERMANENTE (pura): admite estruturação? Imagem/oftalmologia = não (document_only). */
export function structuredPossibleFor(documentType: string | null | undefined): boolean {
  return !NON_STRUCTURED_TYPES.has((documentType ?? '').trim())
}

// ── BASE DE CONHECIMENTO equipamento → NOME CANÔNICO do exame (taxonomia SINTERA) ─────────────────────────────
// Artefato CURADO/versionado (governado — carece de revisão clínica e expansão; ver backlog C6). NÃO é a IA
// "inventando" o nome. Conservador: quando o protocolo específico não é claro no documento, o nome canônico é
// GENÉRICO e a confiança é menor (nunca assume um procedimento específico). Casamento por device/título/modalidade.
export interface ExamKnowledgeEntry { re: RegExp; canonicalName: string; category: string; confidence: Confidence }
export const EXAM_KNOWLEDGE_BASE: ExamKnowledgeEntry[] = [
  { re: /microscopia\s*especular|c[ée]lulas?\s*endotelia(l|is)|endothelial|contagem\s*endotelial|specular\s*microscopy|cem[-\s]?530/i, canonicalName: 'Microscopia especular da córnea', category: 'Oftalmologia', confidence: 'high' },
  { re: /campo\s*visual|campimetria|humphrey|field\s*analyzer|perimetr/i, canonicalName: 'Campo visual computadorizado', category: 'Oftalmologia', confidence: 'high' },
  { re: /\boct\b|cirrus|tomografia\s*de\s*coer[êe]ncia\s*[óo]ptica/i, canonicalName: 'Tomografia de coerência óptica (OCT)', category: 'Oftalmologia', confidence: 'high' },
  // Pentacam realiza vários protocolos → nome GENÉRICO do segmento anterior + confiança MÉDIA (protocolo exato exige o laudo).
  { re: /oculus|pentacam/i, canonicalName: 'Exame do segmento anterior (Pentacam)', category: 'Oftalmologia', confidence: 'medium' },
]

/** Normalização do NOME do exame (não-heurística): Base de Conhecimento (por equipamento) → nome explícito no
 *  documento → modalidade → categoria genérica. O EQUIPAMENTO nunca é usado como nome. Devolve nome + confiança. */
export function normalizeExamName(du: Pick<DocumentUnderstanding, 'device' | 'originalTitle' | 'examModality' | 'examName' | 'examCategory' | 'confidence'>): { name: string | null; confidence: Confidence } {
  const pick = (s: string | null | undefined) => { const v = (s ?? '').trim(); return v.length ? v : null }
  const hay = [du.device, du.originalTitle, du.examModality, du.examName].filter(Boolean).join(' ')
  const kb = hay ? EXAM_KNOWLEDGE_BASE.find(e => e.re.test(hay)) : undefined
  if (kb) return { name: kb.canonicalName, confidence: kb.confidence }
  // Sem KB: nome explícito do documento → modalidade → "Exame de <categoria>" (genérico, confiança baixa).
  const explicit = pick(du.examName) ?? pick(du.examModality)
  if (explicit) return { name: explicit, confidence: du.confidence }
  const cat = pick(du.examCategory)
  if (cat) return { name: `Exame de ${cat}`, confidence: 'low' }
  return { name: null, confidence: 'low' }
}

/** IDENTIDADE DOCUMENTAL (display) — o nome que aparece na lista. NUNCA o equipamento nem uma linha do laudo:
 *  nome canônico (Base de Conhecimento) → nome explícito → modalidade → categoria. */
export function resolveDocumentIdentity(du: Pick<DocumentUnderstanding, 'device' | 'originalTitle' | 'examModality' | 'examName' | 'examCategory' | 'confidence'>): string | null {
  return normalizeExamName(du).name
}

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você é um mecanismo de COMPREENSÃO de documentos de saúde. LÊ o documento e devolve seus metadados,
transcrevendo o que está ESCRITO. NÃO interpreta o resultado clínico nem diagnostica (RDC 657/2022).
Responda APENAS JSON válido, exatamente com estas chaves:
{"document_type":"<laboratory|imaging|neurophysiology|ophthalmology|cardiology|endoscopy|anatomopathology|medical_report|prescription|vaccination|medical_order|insurance_guide|unknown>","original_title":"<TÍTULO impresso no CABEÇALHO do documento, VERBATIM; null se não houver>","exam_name":"<nome do EXAME/protocolo APENAS se estiver ESCRITO no documento (ex.: 'Campo visual computadorizado'); null se o documento só mostra o EQUIPAMENTO e NÃO nomeia o exame>","device":"<EQUIPAMENTO/aparelho + modelo impresso (ex.: 'OCULUS Pentacam HR', 'Zeiss Cirrus OCT'); null>","exam_category":"<especialidade/categoria (ex.: 'Oftalmologia'); null>","exam_modality":"<modalidade legível, se clara; null>","exam_date":"<data de REALIZAÇÃO impressa, YYYY-MM-DD; NUNCA nascimento/impressão/protocolo; null>","patient_name":"<nome do paciente impresso; null>","issuer":"<laboratório/clínica/hospital emissor; null>","physician":"<médico solicitante; null>","document_language":"<'pt'|'en'|…; null>","confidence":"<high|medium|low>"}
Regras CRÍTICAS:
- EQUIPAMENTO ≠ EXAME. O aparelho (Pentacam, OCULUS, Cirrus, CEM-530…) vai em "device". NÃO coloque o equipamento em "exam_name" e NÃO INFIRA o exame a partir do equipamento — um mesmo aparelho faz protocolos diferentes.
- "exam_name" só é preenchido quando o EXAME/protocolo está ESCRITO no documento. Se o documento só mostra o equipamento e não nomeia o exame, deixe "exam_name": null e use confidence "low"/"medium".
- NUNCA use uma LINHA INTERNA/parâmetro/biomarcador como título ou nome do exame.
- Tipo: PEDIDO/REQUISIÇÃO → "medical_order"; GUIA/SADT → "insurance_guide"; IMAGEM → "imaging"; oftalmológico de EQUIPAMENTO/IMAGEM (Pentacam, microscopia especular, OCT, campo visual, OCULUS/CEM) → "ophthalmology" MESMO com medidas por olho.
- Transcreva, não infira. Campo ausente → null.`

/** Compreende um documento de IMAGEM (visão computacional) → estrutura canônica. Best-effort: null sem chave de IA. */
export async function understandImageDocument(args: { base64: string; mediaType: string }): Promise<DocumentUnderstanding | null> {
  if (!process.env.ANTHROPIC_API_KEY || !args.base64) return null
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 40_000 })
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 400, temperature: 0, system: SYSTEM,
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

/** Normaliza o JSON cru do modelo → DocumentUnderstanding (validação/limpeza determinística de cada campo). */
export function parseUnderstanding(o: Record<string, unknown>): DocumentUnderstanding {
  const str = (v: unknown, max: number): string | null => {
    if (typeof v !== 'string') return null
    const s = v.trim()
    return s && !/^null$/i.test(s) ? s.slice(0, max) : null
  }
  const documentType = str(o.document_type, 40) ?? 'unknown'
  const confRaw = str(o.confidence, 10)
  const confidence: Confidence = confRaw === 'high' || confRaw === 'low' ? confRaw : 'medium'
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
    confidence,
    structuredPossible: structuredPossibleFor(documentType),
    documentLanguage: str(o.document_language, 8),
  }
}
