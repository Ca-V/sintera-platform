// Epic F1-M2 — Dual Pipeline: Quality Assessment → Path A (texto) | Path B (PDF nativo)
// URLs assinadas existem apenas em memória, nunca são persistidas.
// Reprocessamento: replace_biomarkers() — atômico via RPC (DELETE + INSERT em transação).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractBiomarkers, isGatewayError } from '@/lib/ai/gateway'
import { extractTextFromPdf, filterRelevantPages } from '@/lib/pdf/extractor'

const ERROR_MESSAGES: Record<string, string> = {
  password_protected: 'O PDF está protegido por senha e não pode ser processado.',
  corrupted:          'O arquivo PDF está corrompido.',
  too_large:          'O arquivo PDF excede o limite de 10 MB.',
}

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

  // 2. Ownership + busca file_url e status anterior (para preservar 'processed' em caso de falha)
  const { data: exam } = await supabase
    .from('exams')
    .select('id, file_url, status')
    .eq('id', examId)
    .eq('user_id', userId)
    .single() as { data: { id: string; file_url: string | null; status: string } | null }
  const previousStatus = (exam as { status: string } | null)?.status ?? 'pending'

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
  await supabase.from('exams').update({ status: 'processing' } as never).eq('id', examId)

  // 4. Baixar PDF via URL assinada (apenas em memória — não persistida)
  let pdfBuffer: Buffer
  try {
    const res = await fetch(exam.file_url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    pdfBuffer = Buffer.from(await res.arrayBuffer())
  } catch {
    await supabase.from('exams')
      .update({ status: 'error', error_reason: 'storage_download_failed' } as never)
      .eq('id', examId)
    return NextResponse.json({ error: 'Falha ao baixar o arquivo PDF.', code: 'STORAGE_DOWNLOAD_FAILED' }, { status: 502 })
  }

  // 5. Quality Assessment — classifica o PDF e decide o caminho
  const extraction = await extractTextFromPdf(pdfBuffer)

  if (!extraction.ok) {
    await supabase.from('exams')
      .update({ status: 'error', error_reason: extraction.quality, pdf_quality: extraction.quality } as never)
      .eq('id', examId)
    return NextResponse.json(
      { error: ERROR_MESSAGES[extraction.quality] ?? 'Falha na extração do texto.', code: extraction.quality.toUpperCase() },
      { status: 422 },
    )
  }

  // 6. Salvar exam_text (mesmo quando corrompido) + pdf_quality + page_count
  // exam_text garante auditabilidade independente do caminho usado
  await supabase.from('exams').update({
    exam_text:   extraction.text,
    pdf_quality: extraction.quality,
    page_count:  extraction.pageCount,
  } as never).eq('id', examId)

  // 7. Filtro de páginas (Epic 1.4A) — remove conteúdo administrativo antes da IA
  const filterResult = filterRelevantPages(extraction.pageTexts, 3)

  // 7b. Roteamento: Path A (texto) vs Path B (PDF nativo)
  //    good_text       → Path A (com texto filtrado)
  //    corrupted_text  → Path B, salvo se > 20 páginas relevantes → Path A
  //    insufficient_text → Path B, salvo se > 20 páginas relevantes → Path A
  const useNative = extraction.quality !== 'good_text' && filterResult.pagesRelevant <= 20
  const MAX_EXAM_CHARS = 40_000

  const filteredText = filterResult.filteredText.length > MAX_EXAM_CHARS
    ? filterResult.filteredText.slice(0, MAX_EXAM_CHARS)
    : filterResult.filteredText

  const gatewayParams = useNative
    ? { examId, userId, pdfBuffer, pdfQualityDetected: extraction.quality }
    : {
        examId, userId,
        pdfQualityDetected: extraction.quality,
        examText: filteredText || (extraction.text.length > MAX_EXAM_CHARS
          ? extraction.text.slice(0, MAX_EXAM_CHARS)
          : extraction.text),
      }

  // 8. Chamar o Gateway de IA
  const result = await extractBiomarkers(supabase, gatewayParams)

  if (isGatewayError(result)) {
    // Preservar status 'processed' se já havia biomarcadores válidos — reanálise falhada
    // não deve degradar um exame que já estava funcional para a usuária.
    const { count: existingBiomarkers } = await supabase
      .from('biomarkers').select('*', { count: 'exact', head: true })
      .eq('exam_id', examId) as { count: number | null }

    const statusOnFailure = (previousStatus === 'processed' && (existingBiomarkers ?? 0) > 0)
      ? 'processed'
      : 'error'

    await supabase.from('exams')
      .update({ status: statusOnFailure, error_reason: result.code.toLowerCase() } as never)
      .eq('id', examId)
    return NextResponse.json({ error: result.message, code: result.code }, { status: result.httpStatus })
  }

  // 9. Registrar campos do filtro no ai_processing_log
  await supabase.from('ai_processing_log').update({
    pages_total:     filterResult.pagesTotal,
    pages_relevant:  filterResult.pagesRelevant,
    pages_filtered:  filterResult.pagesFiltered,
    filter_applied:  filterResult.filterApplied,
    filter_fallback: filterResult.fallbackUsed,
  } as never).eq('id', result.aiLogId)

  // 10. Salvar biomarcadores — DELETE + INSERT direto (sem RPC)
  if (result.biomarkers.length > 0) {
    // Remover biomarcadores anteriores deste exame
    await supabase.from('biomarkers').delete().eq('exam_id', examId)

    const bmRows = result.biomarkers.map(b => ({
      exam_id:          examId,
      user_id:          userId,
      name:             b.name,
      value:            b.value,
      value_text:       b.valueText,
      unit:             b.unit,
      reference_min:    b.referenceMin,
      reference_max:    b.referenceMax,
      result_type:      b.resultType,
      interpretation:   b.value === null
        ? 'indisponivel'
        : b.referenceMin !== null && b.value < b.referenceMin
          ? 'abaixo_da_referencia'
          : b.referenceMax !== null && b.value > b.referenceMax
            ? 'acima_da_referencia'
            : b.referenceMin !== null || b.referenceMax !== null
              ? 'dentro_da_referencia'
              : 'sem_referencia_identificada',
      source:           'ai_extracted',
      confidence:       b.confidence,
      raw_text:         b.rawText,
      range_extracted:  b.rangeExtracted,
      reference_source: b.referenceSource,
      ai_log_id:        result.aiLogId,
      synthetic:        false,
    }))

    await supabase.from('biomarkers').insert(bmRows as unknown as never[])
  }

  // 10. Atualizar exame com tipo e status final
  await supabase.from('exams')
    .update({ status: 'processed', type: result.examType } as never)
    .eq('id', examId)

  return NextResponse.json({
    success:        true,
    biomarkers:     result.biomarkers.length,
    examType:       result.examType,
    rangeExtracted: result.biomarkers.filter(b => b.rangeExtracted).length,
    aiLogId:        result.aiLogId,
    model:          result.model,
    promptVersion:  result.promptVersion,
    durationMs:     result.durationMs,
    pageCount:      extraction.pageCount,
    extractionPath: result.extractionPath,
    pdfQuality:     extraction.quality,
  })
}
