// Document Understanding Engine (DUE) — CEF/ARCH. Componente ÚNICO de COMPREENSÃO do documento: recebe QUALQUER
// documento (PDF pesquisável · PDF escaneado · JPG/PNG · foto · export de equipamento) e devolve SEMPRE a MESMA
// estrutura de metadados ANTES de qualquer extração clínica. Substitui a fragmentação (parsers soltos de OCR/
// título/data/paciente/modalidade/laboratório + multimodal).
//
// PRINCÍPIO (fundadora 13/08): motor BASEADO EM EVIDÊNCIAS, não "consulta uma IA". A IA é FONTE DE EVIDÊNCIA;
// quem DECIDE o nome é uma REGRA DETERMINÍSTICA sobre a Base de Conhecimento. Toda informação carrega: origem
// (regra | KB | IA | OCR), evidências usadas e grau de confiança. NUNCA afirma o que não comprovou.
//
// EQUIPAMENTO ≠ EXAME: um aparelho (OCULUS Pentacam) faz protocolos diferentes → o nome do exame NÃO é inferido
// do equipamento; vem do catálogo + evidências do documento. Fronteira RDC-657: compreende/transcreve o documento,
// não interpreta o resultado clínico (isso é do Clinical Extraction Engine).
import Anthropic from '@anthropic-ai/sdk'

export type Confidence = 'high' | 'medium' | 'low'
export type FieldSource = 'rule' | 'kb' | 'ai' | 'ocr'

/** Saída canônica e ÚNICA da compreensão documental — igual para todo tipo de arquivo. */
export interface DocumentUnderstanding {
  documentType: string
  originalTitle: string | null   // TÍTULO impresso no cabeçalho, VERBATIM (auditoria)
  examName: string | null        // nome do exame SÓ SE explícito no documento; null se só há equipamento
  device: string | null          // EQUIPAMENTO/aparelho + modelo — NUNCA vira o nome do exame
  examCategory: string | null
  examModality: string | null
  examDate: string | null
  patientName: string | null
  issuer: string | null
  physician: string | null
  evidence: string[]             // SINAIS lidos do documento (ex.: 'Pentacam','Scheimpflug','Belin ABCD') — auditoria
  confidence: Confidence         // confiança da COMPREENSÃO reportada pela fonte de leitura
  structuredPossible: boolean
  documentLanguage: string | null
}

/** Terminologia clínica OFICIAL (autoridade da nomenclatura — NÃO é a SINTERA). Nulo até a integração (roadmap). */
export interface TerminologyRef { system: 'LOINC' | 'SNOMEDCT' | 'RNDS'; code: string; version: string }

/** Identidade resolvida (AUDITÁVEL): nome + confiança + ORIGEM + PROVENIÊNCIA + evidências.
 *  Princípio: a SINTERA não é autoridade de nomenclatura. Enquanto não há mapeamento à terminologia oficial
 *  (`terminology`), o nome é PROVISÓRIO (Base de Conhecimento SINTERA), com a base declarada em `basis`. */
export interface ExamIdentity {
  name: string | null
  confidence: Confidence
  source: FieldSource            // origem da DECISÃO do nome: 'kb' | 'ai' | 'rule' | 'ocr'
  terminology: TerminologyRef | null  // fonte OFICIAL (LOINC/SNOMED/RNDS) quando mapeada — senão null
  provisional: boolean           // true = nome ainda não ancorado em terminologia oficial
  basis: string[]                // em que o nome se apoia sem terminologia oficial (ex.: 'AAO','SBO','fabricante')
  evidence: string[]
  equipment: string | null
}

const NON_STRUCTURED_TYPES = new Set(['imaging', 'ophthalmology'])
/** REGRA PERMANENTE (pura): imagem/oftalmologia = document_only. */
export function structuredPossibleFor(documentType: string | null | undefined): boolean {
  return !NON_STRUCTURED_TYPES.has((documentType ?? '').trim())
}

const SPECIALTY_ADJECTIVE: Record<string, string> = {
  oftalmologia: 'oftalmológico', cardiologia: 'cardiológico', radiologia: 'radiológico',
  neurologia: 'neurológico', dermatologia: 'dermatológico', pneumologia: 'pneumológico',
}
function specialtyAdjective(category: string | null): string | null {
  const c = (category ?? '').trim().toLowerCase()
  return c ? (SPECIALTY_ADJECTIVE[c] ?? null) : null
}

// ── CATÁLOGO (Base de Conhecimento) — equipamento → exames POSSÍVEIS + SINAIS de cada exame específico ─────────
// Artefato CURADO/versionado e GOVERNADO (revisão clínica + expansão — backlog C6). NÃO é a IA inventando: o nome
// só é afirmado (alta confiança) quando há SINAL no documento. `defaultName` só p/ equipamento de propósito ÚNICO
// (ex.: perímetro = campo visual). Pentacam é multiprotocolo → sem defaultName (exige sinal).
export interface ExamCatalogEntry {
  equipment: RegExp
  equipmentLabel: string
  category: string
  basis: string[]                 // em que o nome PROVISÓRIO se apoia (até haver mapeamento a terminologia oficial)
  defaultName?: string            // exame quando o equipamento é de propósito único (sem sinal extra)
  specific: { re: RegExp; name: string }[]  // SINAL → exame específico
  // terminology?: TerminologyRef — quando um revisor clínico ancorar a entrada a LOINC/SNOMED (roadmap governado).
}
export const EXAM_CATALOG: ExamCatalogEntry[] = [
  {
    equipment: /oculus|pentacam/i, equipmentLabel: 'Pentacam', category: 'Oftalmologia',
    basis: ['Documentação OCULUS/Pentacam', 'AAO', 'SBO'],
    specific: [
      { re: /topografia/i, name: 'Topografia da córnea' },
      { re: /tomografia|scheimpflug|belin|elevation|eleva[çc][ãa]o|paquimetr|pachymetr/i, name: 'Tomografia da córnea' },
    ],
  },
  { equipment: /humphrey|field\s*analyzer|perimetr|campo\s*visual|campimetria/i, equipmentLabel: 'Humphrey Field Analyzer', category: 'Oftalmologia', basis: ['AAO', 'SBO'], defaultName: 'Campo visual computadorizado', specific: [] },
  { equipment: /cirrus|\boct\b|coer[êe]ncia\s*[óo]ptica/i, equipmentLabel: 'OCT', category: 'Oftalmologia', basis: ['AAO', 'SBO'], defaultName: 'Tomografia de coerência óptica (OCT)', specific: [] },
  { equipment: /cem[-\s]?530|microscopia\s*especular|specular\s*microscopy|endothelial|c[ée]lulas?\s*endotelia|contagem\s*endotelial/i, equipmentLabel: 'Microscópio especular', category: 'Oftalmologia', basis: ['AAO', 'SBO'], defaultName: 'Microscopia especular da córnea', specific: [] },
]

/** RESOLUÇÃO DA IDENTIDADE — determinística, baseada em EVIDÊNCIAS (a IA não decide o nome). Faixas de confiança:
 *  ALTA → nome canônico (sinal/equipamento de propósito único ou nome explícito no documento);
 *  MÉDIA → "Exame <especialidade> realizado no equipamento <X>" (equipamento reconhecido, protocolo não comprovado);
 *  BAIXA → "Exame <especialidade> (identificação pendente)" — NUNCA fabrica um exame. */
export function resolveExamIdentity(du: Pick<DocumentUnderstanding, 'device' | 'originalTitle' | 'examModality' | 'examName' | 'examCategory' | 'evidence' | 'confidence'>): ExamIdentity {
  const pick = (s: string | null | undefined) => { const v = (s ?? '').trim(); return v.length ? v : null }
  const evidence = (du.evidence ?? []).filter(Boolean)
  const hay = [du.device, du.originalTitle, du.examModality, du.examName, ...evidence].filter(Boolean).join(' ')
  const entry = hay ? EXAM_CATALOG.find(e => e.equipment.test(hay)) : undefined

  // PROVENIÊNCIA: enquanto não há mapeamento à terminologia OFICIAL, todo nome é PROVISÓRIO (terminology=null).
  // O encaixe do LOINC/SNOMED entra AQUI (roadmap governado): quando a entrada estiver ancorada, terminology≠null
  // e provisional=false. Ver ADR-DUE-001 + backlog de Serviço de Terminologia.
  if (entry) {
    // (1) Sinal de exame específico presente → confiança alta na identificação (nome ainda provisório).
    const sig = entry.specific.find(s => s.re.test(hay))
    if (sig) return { name: sig.name, confidence: 'high', source: 'kb', terminology: null, provisional: true, basis: entry.basis, evidence, equipment: entry.equipmentLabel }
    // (2) Equipamento de propósito ÚNICO → alta confiança pelo defaultName.
    if (entry.defaultName) return { name: entry.defaultName, confidence: 'high', source: 'kb', terminology: null, provisional: true, basis: entry.basis, evidence, equipment: entry.equipmentLabel }
    // (3) Equipamento multiprotocolo sem sinal → MÉDIA: nomeia pelo EQUIPAMENTO, sem afirmar o exame.
    const adj = specialtyAdjective(entry.category)
    const nome = adj ? `Exame ${adj} realizado no equipamento ${entry.equipmentLabel}` : `Exame realizado no equipamento ${entry.equipmentLabel}`
    return { name: nome, confidence: 'medium', source: 'kb', terminology: null, provisional: true, basis: entry.basis, evidence, equipment: entry.equipmentLabel }
  }

  // Sem equipamento no catálogo: nome EXPLÍCITO do documento (transcrito) → modalidade → pendente. Nunca o equipamento cru.
  const explicit = pick(du.examName)
  if (explicit) return { name: explicit, confidence: du.confidence, source: 'ai', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device) }
  const modality = pick(du.examModality)
  if (modality) return { name: modality, confidence: 'medium', source: 'ai', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device) }
  // (4) BAIXA confiança → identificação pendente. NUNCA inventa um exame.
  const adj = specialtyAdjective(du.examCategory)
  const nome = adj ? `Exame ${adj} (identificação pendente)` : 'Documento (identificação pendente)'
  return { name: nome, confidence: 'low', source: 'rule', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device) }
}

/** IDENTIDADE DOCUMENTAL (display) — o nome que aparece na lista. Delega à resolução por evidências. */
export function resolveDocumentIdentity(du: Pick<DocumentUnderstanding, 'device' | 'originalTitle' | 'examModality' | 'examName' | 'examCategory' | 'evidence' | 'confidence'>): string | null {
  return resolveExamIdentity(du).name
}

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você é um mecanismo de COMPREENSÃO de documentos de saúde. LÊ o documento e devolve METADADOS e as
EVIDÊNCIAS que você observou, transcrevendo o que está ESCRITO. NÃO interpreta o resultado clínico nem diagnostica
(RDC 657/2022). Você NÃO decide o nome final do exame — você fornece dados e evidências; a plataforma decide.
Responda APENAS JSON válido, exatamente com estas chaves:
{"document_type":"<laboratory|imaging|neurophysiology|ophthalmology|cardiology|endoscopy|anatomopathology|medical_report|prescription|vaccination|medical_order|insurance_guide|unknown>","original_title":"<TÍTULO impresso no CABEÇALHO, VERBATIM; null>","exam_name":"<nome do EXAME/protocolo APENAS se ESCRITO no documento; null se só há o EQUIPAMENTO>","device":"<EQUIPAMENTO+modelo impresso (ex.: 'OCULUS Pentacam HR'); null>","exam_category":"<especialidade (ex.: 'Oftalmologia'); null>","exam_modality":"<modalidade, se clara; null>","exam_date":"<data de REALIZAÇÃO, YYYY-MM-DD; NUNCA nascimento/impressão/protocolo; null>","patient_name":"<paciente; null>","issuer":"<emissor; null>","physician":"<solicitante; null>","evidence":["<termos/marcadores que você VIU no documento e embasam a identificação: nome do aparelho, tecnologia, mapas, títulos de seção; ex.: 'Pentacam','Scheimpflug','Belin ABCD','Anterior Elevation'>"],"document_language":"<'pt'|'en'|…; null>","confidence":"<high|medium|low>"}
Regras CRÍTICAS:
- EQUIPAMENTO ≠ EXAME. Aparelho → "device". NÃO coloque o equipamento em "exam_name" e NÃO INFIRA o exame a partir do equipamento.
- "exam_name" só quando o EXAME está ESCRITO. Caso contrário null (a plataforma decide pela evidência).
- "evidence": liste os SINAIS reais que você viu (aparelho, tecnologia, nomes de mapas/seções). São a base auditável.
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
