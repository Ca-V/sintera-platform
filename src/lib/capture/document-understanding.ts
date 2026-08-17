// Document Understanding Engine (DUE) — CEF/ARCH (ADR-DUE-001 · ADR-CK-001). Componente ÚNICO de COMPREENSÃO do
// documento: recebe QUALQUER documento e devolve SEMPRE a MESMA estrutura de FATOS + EVIDÊNCIAS, ANTES da extração.
//
// AUDITABILIDADE (fundadora 13/08): o DUE não devolve só o valor — devolve um RELATÓRIO por atributo com ORIGEM +
// CONFIANÇA, e, quando um atributo esperado NÃO é encontrado, a RAZÃO da ausência (não localizado · ilegível ·
// confiança insuficiente · detector não aplicável) — nunca só `null`. Nenhum atributo é "oficial" só porque a IA
// sugeriu. Fronteira RDC-657: compreende/transcreve, não interpreta o resultado clínico. NÃO define o nome oficial
// (Terminology Service) nem possui conhecimento clínico (Clinical Knowledge Service).
import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'
import { extractJsonCandidate } from '@/lib/ai/gateway'

export type Confidence = 'high' | 'medium' | 'low'
export type FactSource = 'vision' | 'ocr' | 'kb' | 'terminology' | 'none'
export type AbsenceReason = 'not_found' | 'illegible' | 'low_confidence' | 'detector_not_applicable'

/** Fato auditável: valor + ORIGEM + CONFIANÇA; se ausente, a RAZÃO + uma NOTA do que foi observado (o que o
 *  detector viu onde o campo deveria estar e por que produziu/descartou) — para o relatório se explicar sozinho. */
export interface SourcedFact<T = string> {
  value: T | null
  source: FactSource
  confidence: Confidence | null
  absenceReason: AbsenceReason | null
  note?: string | null
}

// ── OBSERVAÇÕES — o DUE apenas OBSERVA (não classifica nem interpreta; decisão fica no Pipeline) ───────────────
/** Uma observação BRUTA do documento — SEM interpretação de significado. Reutilizável e desacoplada de regras
 *  clínicas/negócio: o DUE diz "vi a data '18/03/2026' com o rótulo 'Exam Date' no cabeçalho" — NÃO diz que é a
 *  data de realização. A CLASSIFICAÇÃO (realização/impressão/nascimento…) é feita depois, no Pipeline, por regra. */
export interface Observation {
  id: string              // ESTÁVEL — a Decisão referencia exatamente qual observação a originou/descartou
  type: string            // 'date' | 'text' | 'identifier' | 'patient_name' | 'physician' | 'signature' | 'image' | …
  value: string           // o que foi observado, verbatim
  label: string | null    // rótulo/texto adjacente OBSERVADO (ex.: "Exam Date"/"Nascimento"/"Firmware") — observação, não interpretação
  region: string | null   // onde no documento: 'cabeçalho' | 'rodapé' | 'metadados' | …
  bbox: number[] | null   // [x,y,w,h] quando o detector fornecer localização
  page: number | null
  confidence: number | null
  detector: string        // ex.: 'vision' | 'ocr' | 'dicom' | …
}

/** Diagnóstico ESTRUTURADO da execução do DUE (não é linguagem natural) — permite responder programaticamente
 *  "o modelo truncou?" (`stopReason='max_tokens'`), "quantos tokens?", "precisou reparar o JSON?" SEM reprocessar. */
export interface DueDiagnostics {
  stopReason: string | null
  outputTokens: number | null
  attempts: number
  recovered: boolean          // true = o JSON precisou de extração/reparo (truncado/malformado)
}

/** Relatório interno de compreensão — por atributo, auditável. */
export interface UnderstandingReport {
  diagnostics?: DueDiagnostics
  documentType: SourcedFact
  examNameCandidate: SourcedFact   // nome CANDIDATO (a decisão canônica é do Terminology Service)
  device: SourcedFact
  examModality: SourcedFact
  examDate: SourcedFact
  patientName: SourcedFact
  issuer: SourcedFact
  physician: SourcedFact
  originalTitle: SourcedFact
  examCategory: SourcedFact
  evidence: string[]
  documentLanguage: string | null
  observations: Observation[]     // LEITURA bruta (sem interpretação); a decisão/classificação é do Pipeline
}

/** Saída canônica do DUE (FATOS achatados p/ consumidores) + `report` (auditoria por atributo). */
export interface DocumentUnderstanding {
  documentType: string
  originalTitle: string | null
  examName: string | null
  device: string | null
  examCategory: string | null
  examModality: string | null
  examDate: string | null
  patientName: string | null
  issuer: string | null
  physician: string | null
  evidence: string[]
  confidence: Confidence
  structuredPossible: boolean
  documentLanguage: string | null
  report: UnderstandingReport      // ← auditoria: origem/confiança por atributo + razão de ausência
}

const NON_STRUCTURED_TYPES = new Set(['imaging', 'ophthalmology'])
/** REGRA PERMANENTE (pura): imagem/oftalmologia = document_only. */
export function structuredPossibleFor(documentType: string | null | undefined): boolean {
  return !NON_STRUCTURED_TYPES.has((documentType ?? '').trim())
}

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você é um mecanismo de COMPREENSÃO de documentos de saúde. LÊ o documento e devolve METADADOS
AUDITÁVEIS, transcrevendo o que está ESCRITO. NÃO interpreta o resultado clínico nem diagnostica (RDC 657/2022).
Você NÃO decide o nome final do exame — fornece dados/evidências; a plataforma decide.
Para CADA campo devolva um objeto {"value","confidence","absence_reason","note"}:
- "value": o texto transcrito, ou null se ausente.
- "confidence": "high"|"medium"|"low" (quando há valor).
- "absence_reason": quando value=null, POR QUE — um de: "not_found" (não existe no documento) | "illegible" (existe mas ilegível) | "low_confidence" (viu algo, mas sem certeza) | "detector_not_applicable" (não se aplica a este tipo). Quando há valor, null.
- "note": curta, OBRIGATÓRIA para exam_date e patient_name — descreva O QUE você viu ONDE o campo deveria estar e por que produziu/descartou (ex.: "data 18/03/2026 no cabeçalho" · "há uma data no rodapé mas ilegível" · "nenhuma data visível no laudo" · "campo de data em branco").
Responda APENAS JSON válido:
{"document_type":"<laboratory|imaging|neurophysiology|ophthalmology|cardiology|endoscopy|anatomopathology|medical_report|prescription|vaccination|medical_order|insurance_guide|unknown>","document_language":"<'pt'|'en'|…|null>","evidence":["<sinais REAIS vistos: aparelho, tecnologia, mapas, títulos de seção; ex.: 'Pentacam','Topografia','Scheimpflug'>"],"fields":{"exam_name":{...},"device":{...},"exam_modality":{...},"exam_category":{...},"exam_date":{...},"patient_name":{...},"issuer":{...},"physician":{...},"original_title":{...}},"observations":[{"type":"<date|text|identifier|patient_name|physician>","value":"<verbatim>","label":"<rótulo/texto adjacente OBSERVADO, ex.: 'Exam Date'/'Nascimento'/'Firmware'; null>","region":"<cabeçalho|rodapé|metadados|…; null>","confidence":"<0..1>"}]}
Regras CRÍTICAS:
- EQUIPAMENTO ≠ EXAME. Aparelho → "device"; NÃO em "exam_name"; NÃO INFIRA o exame a partir do equipamento.
- "exam_name" só quando o EXAME está ESCRITO; senão value=null com absence_reason.
- "exam_date": OPCIONAL — você NÃO decide qual data é a do exame (a plataforma decide). Só preencha (YYYY-MM-DD) se houver UMA data claramente rotulada como do exame; senão value=null. A DECISÃO usa as "observations".
- "observations": OBSERVE, NÃO interprete. PRIORIDADE ABSOLUTA: o BLOCO DE IDENTIDADE do exame — normalmente no TOPO/cabeçalho — com o NOME DO PACIENTE (type:"patient_name") e a DATA de realização/aquisição (type:"date"). PROCURE a data ativamente aí e também em cantos/rodapé; aceite formatos dd/mm/aaaa, dd.mm.aaaa, aaaa-mm-dd, mm/dd/aaaa. LISTE TODA data como type:"date" com "value" (verbatim), "label" (o RÓTULO adjacente EXATAMENTE como impresso — "Exam Date"/"Data do exame"/"Nascimento"/"Impressão"/"Firmware"…), "region" e "confidence". NÃO classifique o SIGNIFICADO (não diga se é realização/impressão) — só o texto e onde está. NÃO gaste observações em texto DECORATIVO (URL, telefone, logotipo do fabricante, cabeçalhos de coluna) — priorize identidade e data.
- "evidence": os SINAIS reais vistos (base auditável).
- Tipo: PEDIDO/REQUISIÇÃO → "medical_order"; GUIA/SADT → "insurance_guide"; IMAGEM → "imaging"; oftalmológico de EQUIPAMENTO/IMAGEM (Pentacam, microscopia especular, OCT, campo visual, OCULUS/CEM) → "ophthalmology" mesmo com medidas por olho.
- Transcreva, não infira.`

/** Compreende um documento de IMAGEM (visão computacional). Best-effort: null sem chave de IA / erro. */
export async function understandImageDocument(args: { base64: string; mediaType: string }): Promise<DocumentUnderstanding | null> {
  if (!process.env.ANTHROPIC_API_KEY || !args.base64) return null
  // Retry (2 tentativas): erro/timeout/JSON truncado é transitório e NÃO pode derrubar o pipeline silenciosamente.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000 })
      const msg = await client.messages.create({
        // max_tokens generoso: o relatório auditável (fields×{value,confidence,absence_reason,note} + evidence) é
        // maior que a versão plana; 700 truncava o JSON → parse falhava → null → pipeline pulado (regressão).
        // 1500 ainda truncava guias multi-procedimento (ex. "Resumo de Guias de Procedimentos e Exames" Unimed,
        // ab5b5816: stop_reason=max_tokens em output_tokens=1500 → parse falhava → null → pending indevido). → 4000.
        model: MODEL, max_tokens: 4000, temperature: 0, system: SYSTEM,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: args.mediaType, data: args.base64 } }, { type: 'text', text: 'Compreenda este documento no JSON pedido.' }] as any }],
      })
      const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
      // Parse ROBUSTO reusando o gateway (extração por balanceamento de chaves + jsonrepair): recupera JSON
      // truncado/malformado → elimina a CLASSE de falha de parse (não só este documento). Componente melhor,
      // não prompt maior (fundadora #4). Regressão anterior: regex ingênuo + JSON.parse quebrava em truncação.
      const candidate = extractJsonCandidate(raw)
      let obj: Record<string, unknown> | null = null
      if (candidate) {
        try { obj = JSON.parse(candidate) as Record<string, unknown> }
        catch { try { obj = JSON.parse(jsonrepair(candidate)) as Record<string, unknown> } catch { obj = null } }
      }
      if (obj) {
        const du = parseUnderstanding(obj, 'vision')
        // DIAGNÓSTICO estruturado persistido (fundadora #1/#2): stop_reason='max_tokens' revela truncação sem reprocessar.
        du.report.diagnostics = { stopReason: msg.stop_reason ?? null, outputTokens: msg.usage?.output_tokens ?? null, attempts: attempt + 1, recovered: !!candidate && candidate.trim() !== raw.trim() }
        return du
      }
      // Parse falhou nesta tentativa → registra p/ diagnóstico (logs de runtime = fonte técnica), depois tenta de novo.
      console.error('[DUE] parse falhou', { attempt, stop_reason: msg.stop_reason, output_tokens: msg.usage?.output_tokens, preview: raw.slice(0, 160) })
    } catch (e) {
      console.error('[DUE] exceção', { attempt, error: String(e).slice(0, 200) })
    }
  }
  return null
}

const ABSENCE = new Set(['not_found', 'illegible', 'low_confidence', 'detector_not_applicable'])
function normConfidence(v: unknown): Confidence | null {
  return v === 'high' || v === 'medium' || v === 'low' ? v : null
}
/** Parseia um campo — objeto {value,confidence,absence_reason} OU string simples (compat). */
function parseField(v: unknown, source: FactSource, max: number): SourcedFact {
  const clean = (s: unknown): string | null => {
    if (typeof s !== 'string') return null
    const t = s.trim()
    return t && !/^null$/i.test(t) ? t.slice(0, max) : null
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    // Nota diagnóstica: capacidade ampla (o raciocínio de datas — quais viu, classificação, qual escolheu e por
    // quê — não pode ser truncado, senão o DUE deixa de ser explicável). Evidência: audit anterior cortava em 200.
    const note = typeof o.note === 'string' && o.note.trim() ? o.note.trim().slice(0, 600) : null
    const value = clean(o.value)
    if (value) return { value, source, confidence: normConfidence(o.confidence) ?? 'medium', absenceReason: null, note }
    const r = typeof o.absence_reason === 'string' && ABSENCE.has(o.absence_reason) ? o.absence_reason as AbsenceReason : 'not_found'
    return { value: null, source: 'none', confidence: null, absenceReason: r, note }
  }
  const value = clean(v)
  return value ? { value, source, confidence: 'medium', absenceReason: null, note: null } : { value: null, source: 'none', confidence: null, absenceReason: 'not_found', note: null }
}

/** Parseia as OBSERVAÇÕES brutas (sem interpretação). Aceita {value|text, type, label, region, confidence}. */
function parseObservations(v: unknown, source: FactSource): Observation[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, 30).map((item, i): Observation | null => {
    if (!item || typeof item !== 'object') return null
    const o = item as Record<string, unknown>
    const value = typeof o.value === 'string' && o.value.trim() ? o.value.trim().slice(0, 120)
      : typeof o.text === 'string' && o.text.trim() ? o.text.trim().slice(0, 120) : null
    if (!value) return null
    const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null)
    return {
      id: `obs-${i + 1}`,   // estável dentro da compreensão (ordem do modelo)
      type: typeof o.type === 'string' && o.type.trim() ? o.type.trim().slice(0, 24) : 'text',
      value,
      label: typeof o.label === 'string' && o.label.trim() ? o.label.trim().slice(0, 60) : null,
      region: typeof o.region === 'string' && o.region.trim() ? o.region.trim().slice(0, 40) : null,
      bbox: Array.isArray(o.bbox) ? o.bbox.map(num).filter((n): n is number => n !== null).slice(0, 4) : null,
      page: num(o.page),
      confidence: typeof o.confidence === 'number' && o.confidence >= 0 && o.confidence <= 1 ? o.confidence : null,
      detector: source,
    }
  }).filter((x): x is Observation => x !== null)
}

/** Normaliza o JSON cru → DocumentUnderstanding (fatos achatados + relatório auditável). `source` = de onde veio. */
export function parseUnderstanding(o: Record<string, unknown>, source: FactSource = 'vision'): DocumentUnderstanding {
  const f = (o.fields && typeof o.fields === 'object' ? o.fields : o) as Record<string, unknown>
  const documentTypeStr = (typeof o.document_type === 'string' && o.document_type.trim() ? o.document_type.trim() : 'unknown').slice(0, 40)
  const evidence = Array.isArray(o.evidence)
    ? o.evidence.map(e => (typeof e === 'string' ? e.trim() : '')).filter(Boolean).slice(0, 12).map(e => e.slice(0, 60))
    : []
  const documentLanguage = typeof o.document_language === 'string' && o.document_language.trim() && !/^null$/i.test(o.document_language.trim())
    ? o.document_language.trim().slice(0, 8) : null

  const examName = parseField(f.exam_name, source, 160)
  const device = parseField(f.device, source, 120)
  const examModality = parseField(f.exam_modality, source, 120)
  const examCategory = parseField(f.exam_category, source, 80)
  const originalTitle = parseField(f.original_title, source, 160)
  const issuer = parseField(f.issuer, source, 80)
  const physician = parseField(f.physician, source, 80)
  const patientName = parseField(f.patient_name, source, 120)
  const rawDate = parseField(f.exam_date, source, 10)
  // Data válida só se ISO; se veio com valor mas fora do formato, trata como ilegível (auditável).
  const examDate: SourcedFact = rawDate.value && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.value)
    ? rawDate
    : rawDate.value ? { value: null, source: 'none', confidence: null, absenceReason: 'illegible', note: rawDate.note ?? `formato não-ISO: "${rawDate.value}"` } : rawDate

  const report: UnderstandingReport = {
    documentType: { value: documentTypeStr, source, confidence: 'medium', absenceReason: null },
    examNameCandidate: examName, device, examModality, examDate, patientName, issuer, physician,
    originalTitle, examCategory, evidence, documentLanguage,
    observations: parseObservations(o.observations, source),
  }

  return {
    documentType: documentTypeStr,
    originalTitle: originalTitle.value,
    examName: examName.value,
    device: device.value,
    examCategory: examCategory.value,
    examModality: examModality.value,
    examDate: examDate.value,
    patientName: patientName.value,
    issuer: issuer.value,
    physician: physician.value,
    evidence,
    confidence: examName.confidence ?? examModality.confidence ?? 'medium',
    structuredPossible: structuredPossibleFor(documentTypeStr),
    documentLanguage,
    report,
  }
}
