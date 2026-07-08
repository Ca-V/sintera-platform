// ============================================================
// ContentClassifier — Centro de Entrada (TEMA C · infraestrutura transversal)
// ============================================================
// ORQUESTRADOR de classificação (não "é o modelo"): tenta sinais BARATOS primeiro
// (MIME/assinatura inequívoca → heurística por nome) e só chama a IA quando os
// sinais baratos não resolvem. Reduz custo, latência e dependência do modelo.
//
//   Documento → [MIME/assinatura] → [nome do arquivo] → [IA, se necessário] → ClassificationResult
//
// NÃO interpreta o conteúdo clínico, NÃO diagnostica, NÃO extrai valores — só
// identifica QUE documento é (RDC 657: classificar tipo é factual). Devolve o
// contrato `ClassificationResult` (drop-in, com `source`). Não armazena o documento.
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

/**
 * Sinais BARATOS (sem IA). Hoje: os formatos aceitos (PDF/JPEG/PNG) não são
 * autoexplicativos pelo MIME, então o único sinal barato é o nome do arquivo
 * (confiança baixa). Extensível para MIME/assinatura inequívocos (DICOM, XML…)
 * sem tocar o contrato — bastando devolver `confidence:'high'` para curto-circuitar.
 */
function cheapClassify(mediaType: string, filename: string): ClassificationResult {
  void mediaType // reservado p/ regras de MIME/assinatura futuras
  return classifyByFilename(filename)
}

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

  // 1. Sinais baratos primeiro.
  const cheap = cheapClassify(mediaType, filename)

  // 2. Se um sinal barato já for CONCLUSIVO (alta confiança), NÃO chama IA.
  if (cheap.confidence === 'high') return NextResponse.json(cheap)

  // 3. IA só quando necessária: há arquivo suportado + IA disponível (o conteúdo é
  //    o sinal forte para PDF/imagem). Caso contrário, devolve o melhor sinal barato.
  if (!fileBase64 || (!isPdf && !SUPPORTED_IMAGE.includes(mediaType)) || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(cheap)
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
    return NextResponse.json(cheap) // degrada para o sinal barato
  }

  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return NextResponse.json(cheap)
  try {
    const obj = JSON.parse(m[0]) as { kind?: unknown; subtype?: unknown; confidence?: unknown }
    const kind = (typeof obj.kind === 'string' && (VALID_KINDS as string[]).includes(obj.kind))
      ? (obj.kind as DocumentKind)
      : 'unknown'
    // 'other'/'unknown' por conteúdo é fraco; prefere o sinal barato se ele apontou algo.
    if (kind === 'unknown' || kind === 'other') {
      if (cheap.kind !== 'unknown') return NextResponse.json(cheap)
      return NextResponse.json({ kind, confidence: 'low', reason: 'conteúdo do documento', source: 'content_ai' } as ClassificationResult)
    }
    const confidence: ClassificationResult['confidence'] =
      obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'medium'
    const subtype = typeof obj.subtype === 'string' && obj.subtype.trim() ? obj.subtype.trim().slice(0, 40) : undefined
    const result: ClassificationResult = { kind, confidence, reason: 'conteúdo do documento', subtype, source: 'content_ai' }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(cheap)
  }
}
