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
import { authenticateRequest } from '@/lib/supabase/apiAuth'
import { classifyCheap, corroboratedConfidence } from '@/lib/capture/classifier/classify'
import type { ClassificationResult, DocumentKind } from '@/lib/capture/types'
import { transcribedIssuer, transcribedDate } from '@sintera/core'

const MODEL = 'claude-haiku-4-5-20251001'

// A distinção entre PEDIDO, LAUDO e RECEITA é a que motivou esta lista crescer (homologação de 25/08): sem
// `medical_order` e `clinical_document`, um pedido de exame e um laudo eram ambos "exam", e receita e atestado
// eram ambos "other" — então marcar "Receita" e anexar um laudo gravava o laudo como receita, em silêncio.
const SYSTEM = `Você classifica o TIPO de um documento de saúde a partir de uma IMAGEM ou PDF.
NÃO interprete o conteúdo clínico, NÃO diagnostique, NÃO extraia valores nem resultados — apenas identifique QUE TIPO de documento é e transcreva dois fatos que estejam ESCRITOS nele.
Escolha UM kind:
- "exam": laudo/resultado de exame JÁ REALIZADO (laboratorial, de imagem, ômico) — traz valores, medidas ou conclusão do exame.
- "medical_order": PEDIDO/solicitação/requisição de exame — pede que o exame SEJA FEITO, não traz resultado.
- "clinical_document": receita, atestado, relatório médico, encaminhamento ou declaração de comparecimento.
- "medication_label": bula, rótulo ou embalagem de medicamento ou suplemento.
- "eyeglass_prescription": receita de óculos ou lentes de contato (com grau/dioptria).
- "other": qualquer outro documento.

A diferença entre "exam" e "medical_order" é o que o papel FAZ: pedir o exame ou relatar o resultado dele. Na dúvida entre os dois, use confidence "low".
Receita de MEDICAMENTO é "clinical_document" (é uma prescrição, um documento emitido por alguém). Bula e caixa de remédio são "medication_label".

subtype: UMA palavra curta quando evidente ("hemograma", "receita", "atestado", "relatorio", "encaminhamento", "pedido", "bula", "omica", "ultrassom"); null se incerto.
confidence: "high" (o documento deixa claro), "medium" (provável), "low" (incerto).
issuer: nome do profissional, clínica ou laboratório que EMITIU, exatamente como está escrito; null se não estiver legível. NÃO deduza a partir de logotipo ou papel timbrado ambíguo.
docDate: data do documento no formato AAAA-MM-DD, apenas se estiver escrita de forma inequívoca; null caso contrário. NÃO estime, NÃO use a data de hoje, NÃO converta datas parciais.

Responda APENAS com JSON: {"kind":"","subtype":null,"confidence":"","issuer":null,"docDate":null}.`

const VALID_KINDS: DocumentKind[] = [
  'exam', 'medical_order', 'clinical_document', 'medication_label', 'eyeglass_prescription', 'other',
]

// A validação do que conta como fato transcrito é REGRA DE DOMÍNIO, não detalhe de HTTP — mora no core,
// onde é testada (tests/capture-hub/FUNC-transcription).
const SUPPORTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  // Aceita cookie (Web) OU Bearer (aplicativo). Sem isto o Mobile recebia 401 e a leitura assistida
  // simplesmente não acontecia — sem mensagem, como se o recurso não existisse.
  const { user } = await authenticateRequest(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { fileBase64?: string; mediaType?: string; filename?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }) }

  const fileBase64 = body.fileBase64
  const mediaType = body.mediaType || 'image/jpeg'
  const filename = typeof body.filename === 'string' ? body.filename : ''
  const isPdf = mediaType === 'application/pdf'

  // 1. Sinais baratos primeiro (mesma camada barata que a tela consome).
  const cheap = classifyCheap(mediaType, filename)

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
    const obj = JSON.parse(m[0]) as {
      kind?: unknown; subtype?: unknown; confidence?: unknown; issuer?: unknown; docDate?: unknown
    }
    // Fatos documentais transcritos — valem mesmo quando o kind degrada para o sinal barato.
    const issuer = transcribedIssuer(obj.issuer)
    const docDate = transcribedDate(obj.docDate)
    const kind = (typeof obj.kind === 'string' && (VALID_KINDS as string[]).includes(obj.kind))
      ? (obj.kind as DocumentKind)
      : 'unknown'
    // 'other'/'unknown' por conteúdo é fraco; prefere o sinal barato se ele apontou algo.
    if (kind === 'unknown' || kind === 'other') {
      // Mesmo sem acertar o TIPO, emissor e data lidos continuam sendo fatos úteis para o formulário.
      if (cheap.kind !== 'unknown') return NextResponse.json({ ...cheap, issuer, docDate })
      return NextResponse.json({ kind, confidence: 'low', reason: 'conteúdo do documento', source: 'content_ai', issuer, docDate } as ClassificationResult)
    }
    const visionConfidence: ClassificationResult['confidence'] =
      obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low' ? obj.confidence : 'medium'
    // Obs 6 — sem corroboração do sinal por nome (mesmo kind), um único resultado de visão não afirma
    // alta confiança: 'high' não corroborado → 'medium'. A UI então NÃO pré-seleciona a categoria de
    // saúde (só pré-seleciona em 'high'); o usuário escolhe ou cancela. Não rejeita, não altera medium/low.
    const confidence = corroboratedConfidence(kind, visionConfidence, cheap.kind)
    const subtype = typeof obj.subtype === 'string' && obj.subtype.trim() ? obj.subtype.trim().slice(0, 40) : undefined
    const result: ClassificationResult = { kind, confidence, reason: 'conteúdo do documento', subtype, source: 'content_ai', issuer, docDate }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(cheap)
  }
}
