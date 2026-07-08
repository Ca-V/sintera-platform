// ============================================================
// ContentClassifier — Centro de Entrada (TEMA C · infraestrutura transversal)
// ============================================================
// Classifica o TIPO de um documento pelo CONTEÚDO (imagem/PDF), não pelo nome do
// arquivo. NÃO interpreta o conteúdo clínico, NÃO diagnostica, NÃO extrai valores —
// só identifica QUE documento é (RDC 657: classificar tipo é factual). Devolve o
// MESMO contrato `ClassificationResult` (drop-in). Degrada com elegância para a
// heurística por nome de arquivo quando não há IA/arquivo ou a chamada falha.
// A rota não armazena o documento.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { classifyByFilename } from '@/lib/capture/classifier/classify'
import type { ClassificationResult, DocumentKind } from '@/lib/capture/types'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você classifica o TIPO de um documento de saúde a partir de uma IMAGEM ou PDF.
NÃO interprete o conteúdo clínico, NÃO diagnostique, NÃO extraia valores — apenas identifique QUE TIPO de documento é.
Escolha UM kind:
- "exam": laudo laboratorial, resultado de exame, exame de imagem (raio-x, ultrassom, tomografia) ou laudo ômico/genético.
- "medication_label": bula, rótulo/embalagem de medicamento ou suplemento, ou receita de medicamento.
- "eyeglass_prescription": receita de óculos ou lentes de contato (com grau/dioptria).
- "other": qualquer outro documento.
subtype: UMA palavra curta do subtipo quando evidente (ex.: "hemograma", "bula", "receita", "omica", "ultrassom"); null se incerto.
confidence: "high" (o documento deixa claro), "medium" (provável), "low" (incerto).
Responda APENAS com JSON: {"kind":"","subtype":null,"confidence":""}.`

const VALID_KINDS: DocumentKind[] = ['exam', 'medication_label', 'eyeglass_prescription', 'other']
const SUPPORTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { fileBase64?: string; mediaType?: string; filename?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }) }

  const fileBase64 = body.fileBase64
  const mediaType = body.mediaType || 'image/jpeg'
  const filename = typeof body.filename === 'string' ? body.filename : ''
  const isPdf = mediaType === 'application/pdf'

  // Fallback determinístico por nome de arquivo (a heurística vira rede de segurança).
  const fallback: ClassificationResult = classifyByFilename(filename)

  // Sem arquivo, formato não suportado por visão, ou sem IA → devolve o palpite por nome.
  if (!fileBase64 || (!isPdf && !SUPPORTED_IMAGE.includes(mediaType)) || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(fallback)
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docBlock: any = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      temperature: 0,
      system: SYSTEM,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: 'user', content: [docBlock, { type: 'text', text: 'Classifique o TIPO deste documento no formato JSON pedido.' }] as any }],
    })
    raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  } catch (e) {
    console.error('[capture/classify] falha na chamada de visão:', e instanceof Error ? e.message : String(e))
    return NextResponse.json(fallback) // degrada para o palpite por nome
  }

  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return NextResponse.json(fallback)
  try {
    const obj = JSON.parse(m[0]) as { kind?: unknown; subtype?: unknown; confidence?: unknown }
    const kind = (typeof obj.kind === 'string' && (VALID_KINDS as string[]).includes(obj.kind))
      ? (obj.kind as DocumentKind)
      : 'unknown'
    if (kind === 'unknown' || kind === 'other') {
      // 'other' por conteúdo é fraco; se o nome sugerir algo, prefere o nome.
      return NextResponse.json(fallback.kind !== 'unknown' ? fallback : { kind, confidence: 'low', reason: 'conteúdo do documento' })
    }
    const confidence: ClassificationResult['confidence'] =
      obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'medium'
    const subtype = typeof obj.subtype === 'string' && obj.subtype.trim() ? obj.subtype.trim().slice(0, 40) : undefined
    const result: ClassificationResult = { kind, confidence, reason: 'conteúdo do documento', subtype }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(fallback)
  }
}
