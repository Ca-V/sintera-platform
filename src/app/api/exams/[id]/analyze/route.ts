// Epic F1-M2 — Dual Pipeline: Quality Assessment → Path A (texto) | Path B (PDF nativo)
// URLs assinadas existem apenas em memória, nunca são persistidas.
// Reprocessamento: replace_biomarkers() — atômico via RPC (DELETE + INSERT em transação).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractBiomarkers, isGatewayError } from '@/lib/ai/gateway'
import { extractTextFromPdf, filterRelevantPages } from '@/lib/pdf/extractor'
import { loadCatalogIndex, resolveBiomarker } from '@/lib/ai/insights/resolver'

const ERROR_MESSAGES: Record<string, string> = {
  password_protected: 'O PDF está protegido por senha e não pode ser processado.',
  corrupted:          'O arquivo PDF está corrompido.',
  too_large:          'O arquivo PDF excede o limite de 50 MB.',
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

  // 5–7. Foto do laudo (imagem) vs PDF. Detecta pela extensão do arquivo.
  const filePath = (() => {
    try { return new URL(exam.file_url!).pathname.toLowerCase() } catch { return exam.file_url!.toLowerCase() }
  })()
  const isImage = /\.(jpe?g|png|webp)$/.test(filePath)

  let gatewayParams: Parameters<typeof extractBiomarkers>[1]
  let filterResult: ReturnType<typeof filterRelevantPages> | null = null
  let pageCount = 1
  let pdfQuality = 'image'

  if (isImage) {
    // Caminho de imagem — modelo multimodal lê a foto. Sem extração de texto/PDF.
    const mediaType = filePath.endsWith('.png') ? 'image/png'
      : filePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    await supabase.from('exams').update({ pdf_quality: 'image', page_count: 1 } as never).eq('id', examId)
    gatewayParams = { examId, userId, imageBuffer: pdfBuffer, imageMediaType: mediaType, pdfQualityDetected: 'image' }
  } else {
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
    await supabase.from('exams').update({
      exam_text:   extraction.text,
      pdf_quality: extraction.quality,
      page_count:  extraction.pageCount,
    } as never).eq('id', examId)

    pageCount = extraction.pageCount
    pdfQuality = extraction.quality

    // 7. Filtro de páginas (Epic 1.4A) — remove conteúdo administrativo antes da IA
    filterResult = filterRelevantPages(extraction.pageTexts, 3)

    // 7b. Roteamento: Path A (texto) vs Path B (PDF nativo)
    const useNative = extraction.quality !== 'good_text' && filterResult.pagesRelevant <= 20
    const MAX_EXAM_CHARS = 40_000
    const filteredText = filterResult.filteredText.length > MAX_EXAM_CHARS
      ? filterResult.filteredText.slice(0, MAX_EXAM_CHARS)
      : filterResult.filteredText

    gatewayParams = useNative
      ? { examId, userId, pdfBuffer, pdfQualityDetected: extraction.quality }
      : {
          examId, userId,
          pdfQualityDetected: extraction.quality,
          examText: filteredText || (extraction.text.length > MAX_EXAM_CHARS
            ? extraction.text.slice(0, MAX_EXAM_CHARS)
            : extraction.text),
        }
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

  // 9. Registrar campos do filtro no ai_processing_log (só no caminho de PDF)
  if (filterResult) {
    await supabase.from('ai_processing_log').update({
      pages_total:     filterResult.pagesTotal,
      pages_relevant:  filterResult.pagesRelevant,
      pages_filtered:  filterResult.pagesFiltered,
      filter_applied:  filterResult.filterApplied,
      filter_fallback: filterResult.fallbackUsed,
    } as never).eq('id', result.aiLogId)
  }

  // 10. Salvar biomarcadores — substituição atômica via RPC replace_biomarkers
  //     (DELETE + INSERT numa única transação plpgsql). Se a gravação falhar,
  //     a transação é revertida e os biomarcadores anteriores ficam intactos —
  //     uma reanálise malsucedida não deixa o exame sem dados.
  if (result.biomarkers.length > 0) {
    // Resolver (best-effort): preenche catalog_id ligando o biomarcador ao
    // catálogo canônico. SEM juízo clínico — só normalização + casamento.
    // Falha aqui não pode quebrar a extração: cai para catalog_id nulo.
    let catalogIndex: Awaited<ReturnType<typeof loadCatalogIndex>> | null = null
    try {
      catalogIndex = await loadCatalogIndex(supabase)
    } catch {
      catalogIndex = null
    }

    const bmRows = result.biomarkers.map(b => ({
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
      catalog_id:       catalogIndex
        ? resolveBiomarker(catalogIndex, { name: b.name, unit: b.unit }).catalog?.id ?? null
        : null,
    }))

    // Dispatcher 1d.2 — Rollout Controlado. should_write_canonical encapsula
    // canonical_write_mode ('on') + canonical_write_pct (fração) com roteamento
    // determinístico por exame. Com pct=0 → sempre false → replace_biomarkers (INALTERADO).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: useCanonical } = await (supabase.rpc as any)('should_write_canonical', { p_exam_id: examId })

    let replaceErr: { message?: string } | null = null
    if (useCanonical === true) {
      // Escrita canônica append-only. p_meta mínimo por ora (proveniência completa = fase 1e).
      const t0 = Date.now()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cwRes, error } = await (supabase.rpc as any)('write_canonical_extraction', {
        p_exam_id:    examId,
        p_user_id:    userId,
        p_biomarkers: bmRows,
        p_meta:       { ai_log_id: result.aiLogId, origin: 'fresh', processing_mode: 'canonical_on' },
      })
      replaceErr = error
      // Telemetria do rollout (best-effort — nunca quebra a extração).
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('canonical_write_telemetry').insert({
          exam_id:     examId,
          version_id:  (cwRes as { version_id?: string } | null)?.version_id ?? null,
          action:      (cwRes as { action?: string } | null)?.action ?? null,
          duration_ms: Date.now() - t0,
        })
      } catch { /* telemetria não pode quebrar a extração */ }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('replace_biomarkers', {
        p_exam_id:    examId,
        p_user_id:    userId,
        p_biomarkers: bmRows,
      })
      replaceErr = error
    }

    if (replaceErr) {
      // Transação revertida: os biomarcadores anteriores seguem intactos.
      // Não marca 'processed' — preserva o estado anterior quando já era válido.
      const statusOnFailure = previousStatus === 'processed' ? 'processed' : 'error'
      await supabase.from('exams')
        .update({ status: statusOnFailure, error_reason: 'biomarker_persist_failed' } as never)
        .eq('id', examId)
      return NextResponse.json(
        { error: 'Falha ao salvar os biomarcadores extraídos.', code: 'BIOMARKER_PERSIST_FAILED' },
        { status: 500 },
      )
    }
  }

  // 10. Atualizar exame: status + data de realização + nome do paciente.
  //     NÃO sobrescreve `type` (o nome do exame) — mantém o nome do arquivo de
  //     origem definido no upload. A categoria detectada pela IA (result.examType)
  //     fica apenas no retorno/log; o nome que a usuária vê é o do arquivo.
  //     A data do laudo é FATO impresso — preenche exam_date só quando extraída.
  const finalUpdate: Record<string, unknown> = { status: 'processed' }
  if (result.examDate) finalUpdate.exam_date = result.examDate
  if (result.patientName) finalUpdate.patient_name = result.patientName
  await supabase.from('exams')
    .update(finalUpdate as never)
    .eq('id', examId)

  return NextResponse.json({
    success:        true,
    biomarkers:     result.biomarkers.length,
    examType:       result.examType,
    examDate:       result.examDate,
    rangeExtracted: result.biomarkers.filter(b => b.rangeExtracted).length,
    aiLogId:        result.aiLogId,
    model:          result.model,
    promptVersion:  result.promptVersion,
    durationMs:     result.durationMs,
    pageCount:      pageCount,
    extractionPath: result.extractionPath,
    pdfQuality:     pdfQuality,
    // PR1 1.3 — output truncado por max_tokens: biomarcadores podem estar incompletos
    truncated:      result.truncated,
  })
}
