// Epic 1.1 — Pipeline backend: Storage → extração PDF → IA
// URLs assinadas existem apenas em memória, nunca são persistidas.
// Reprocessamento: replace_biomarkers() — atômico via RPC (DELETE + INSERT em transação).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractBiomarkers, isGatewayError } from '@/lib/ai/gateway'
import { extractTextFromPdf } from '@/lib/pdf/extractor'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params
  const supabase = await createClient()

  // 1. Auth
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = authData.user.id

  // 2. Ownership + busca file_url
  const { data: exam } = await supabase
    .from('exams')
    .select('id, file_url, status')
    .eq('id', examId)
    .eq('user_id', userId)
    .single() as { data: { id: string; file_url: string | null; status: string } | null }

  if (!exam) {
    return NextResponse.json({ error: 'Exame não encontrado.' }, { status: 404 })
  }

  // HTTP 409 — protege contra requisições duplicadas e chamadas diretas via DevTools
  if (exam.status === 'processing') {
    return NextResponse.json(
      { error: 'Este exame já está sendo processado.', code: 'ALREADY_PROCESSING' },
      { status: 409 },
    )
  }

  if (!exam.file_url) {
    return NextResponse.json({ error: 'Arquivo PDF não encontrado para este exame.' }, { status: 422 })
  }

  // 3. Marcar como processing
  await supabase
    .from('exams')
    .update({ status: 'processing' } as never)
    .eq('id', examId)

  // 4. Baixar PDF via URL assinada (apenas em memória — não persistida)
  // file_url é uma URL assinada com validade de 1 ano — fetch direto é mais seguro
  // que reconverter para storage path, pois evita dependência do formato interno da URL.
  let pdfBuffer: Buffer
  try {
    const res = await fetch(exam.file_url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    pdfBuffer = Buffer.from(await res.arrayBuffer())
  } catch {
    await supabase
      .from('exams')
      .update({ status: 'error', error_reason: 'storage_download_failed' } as never)
      .eq('id', examId)
    return NextResponse.json({ error: 'Falha ao baixar o arquivo PDF.', code: 'STORAGE_DOWNLOAD_FAILED' }, { status: 502 })
  }

  // 5. Extrair texto do PDF
  const extraction = await extractTextFromPdf(pdfBuffer)

  if (!extraction.ok) {
    await supabase
      .from('exams')
      .update({ status: 'error', error_reason: extraction.reason } as never)
      .eq('id', examId)

    const messages: Record<string, string> = {
      pdf_no_text_layer: 'Este PDF não possui camada de texto. PDFs escaneados não são suportados no momento.',
      pdf_password_protected: 'Este PDF está protegido por senha e não pode ser processado.',
      pdf_corrupted: 'O arquivo PDF está corrompido.',
      pdf_too_large: 'O arquivo PDF excede o limite de 10 MB.',
    }
    return NextResponse.json(
      { error: messages[extraction.reason] ?? 'Falha na extração do texto.', code: extraction.reason.toUpperCase() },
      { status: 422 },
    )
  }

  // 6. Salvar exam_text para auditoria e reprocessamento futuro
  await supabase
    .from('exams')
    .update({ exam_text: extraction.text } as never)
    .eq('id', examId)

  // 7. Chamar o Gateway de IA
  const result = await extractBiomarkers(supabase, {
    examText: extraction.text,
    examId,
    userId,
  })

  if (isGatewayError(result)) {
    await supabase
      .from('exams')
      .update({ status: 'error', error_reason: result.code.toLowerCase() } as never)
      .eq('id', examId)
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: result.httpStatus },
    )
  }

  // 8. Salvar biomarcadores atomicamente via RPC (reprocessamento seguro)
  if (result.biomarkers.length > 0) {
    const bmRows = result.biomarkers.map(b => ({
      name: b.name,
      value: b.value,
      unit: b.unit,
      reference_min: b.referenceMin,
      reference_max: b.referenceMax,
      interpretation: b.value === null
        ? 'indisponivel'
        : b.referenceMin !== null && b.value < b.referenceMin
          ? 'abaixo_da_referencia'
          : b.referenceMax !== null && b.value > b.referenceMax
            ? 'acima_da_referencia'
            : b.referenceMin !== null || b.referenceMax !== null
              ? 'dentro_da_referencia'
              : 'sem_referencia_identificada',
      source: 'ai_extracted',
      confidence: b.confidence,
      raw_text: b.rawText,
      range_extracted: b.rangeExtracted,
      reference_source: b.referenceSource,
      ai_log_id: result.aiLogId,
    }))

    await supabase.rpc('replace_biomarkers' as never, {
      p_exam_id: examId,
      p_user_id: userId,
      p_biomarkers: JSON.stringify(bmRows),
    } as never)
  }

  // 9. Atualizar exame com tipo e status final
  await supabase
    .from('exams')
    .update({ status: 'processed', type: result.examType } as never)
    .eq('id', examId)

  return NextResponse.json({
    success: true,
    biomarkers: result.biomarkers.length,
    examType: result.examType,
    rangeExtracted: result.biomarkers.filter(b => b.rangeExtracted).length,
    aiLogId: result.aiLogId,
    model: result.model,
    promptVersion: result.promptVersion,
    durationMs: result.durationMs,
    pageCount: extraction.pageCount,
  })
}
