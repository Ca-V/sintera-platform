// Epic F1-M2 — Dual Pipeline: Quality Assessment → Path A (texto) | Path B (PDF nativo)
// URLs assinadas existem apenas em memória, nunca são persistidas.
// Reprocessamento: replace_biomarkers() — atômico via RPC (DELETE + INSERT em transação).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractBiomarkers, isGatewayError } from '@/lib/ai/gateway'
import { extractTextFromPdf, filterRelevantPages } from '@/lib/pdf/extractor'
import { loadCatalogIndex, resolveBiomarker } from '@/lib/ai/insights/resolver'
import { classifyExamDocument, deriveDisplayTitle, withProvenance } from '@/lib/capture/document-naming'
import { extractIssuer } from '@/lib/ai/issuer'
import { classifyDocumentAI } from '@/lib/ai/document-classifier'
import { representationFingerprint, isRepresentationCertified } from '@/lib/capture/reproducibility'
import { computeCoverage } from '@/lib/capture/coverage'
import { processBundle } from '@/lib/capture/clinical-information-pipeline'
import { processClinical, planRepresentation } from '@/lib/capture/clinical-processing-engine'
import { representationFromProcessor } from '@/lib/capture/ucda'
import { planBundleSplit, restrictPages, type SplitPlan } from '@/lib/capture/bundle-split'
import { pickExamDate } from '@/lib/capture/semantic-dates'
import { identifyClinical } from '@/lib/capture/clinical-identity-registry'

const ERROR_MESSAGES: Record<string, string> = {
  password_protected: 'O PDF está protegido por senha e não pode ser processado.',
  corrupted:          'O arquivo PDF está corrompido.',
  too_large:          'O arquivo PDF excede o limite de 50 MB.',
}

// Contrato de extração prompt↔app. v2 = Fidelidade da Ingestão (source_material +
// source_exam_name). Gravado na extraction_versions p/ auditoria (fundadora 03/07).
const EXTRACTION_SCHEMA_VERSION = 2

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
    .select('id, type, file_url, status, display_title, document_type, source_bundle_exam_id, bundle_cdu_index, bundle_cdu_count, bundle_page_start, bundle_page_end')
    .eq('id', examId)
    .eq('user_id', userId)
    .single() as { data: {
      id: string; type: string | null; file_url: string | null; status: string
      display_title: string | null; document_type: string | null
      source_bundle_exam_id: string | null; bundle_cdu_index: number | null; bundle_cdu_count: number | null
      bundle_page_start: number | null; bundle_page_end: number | null
    } | null }
  const previousStatus = (exam as { status: string } | null)?.status ?? 'pending'

  if (!exam) {
    return NextResponse.json({ error: 'Exame não encontrado.' }, { status: 404 })
  }

  // Princípio da Identidade Documental (GOVERNANCA) — a identidade documental é WRITE-ONCE:
  // estabelecida na 1ª extração e imutável nas reextrações. `document_type` só é gravado pelo
  // bloco de identidade, então != null sinaliza que a identidade já foi estabelecida.
  // INTERINO (Passo 1, escopo RI-001): este gatilho é provisório. O modelo-alvo (pós-RI-001,
  // antes do HUB-001) substitui isto por `document_identity_status` (draft/validated/locked) +
  // `resolution` + `identity_source` por atributo + separação Identidade Documental × Identidade
  // Semântica Clínica, num log de eventos append-only. Ver GOVERNANCA (modelo-alvo).
  const identityEstablished = exam.document_type != null

  // HTTP 409 — protege contra requisições duplicadas e chamadas diretas via DevTools
  if (exam.status === 'processing') {
    return NextResponse.json(
      { error: 'Este exame já está sendo processado.', code: 'ALREADY_PROCESSING' },
      { status: 409 },
    )
  }

  // Representação Estruturada Certificada (GOVERNANCA — Passo 1b, escopo RI-001). Um exame com
  // extração anterior bem-sucedida está CERTIFICADO: "Extrair novamente" NÃO re-executa o extrator
  // nem sobrescreve resultados/identidade — a representação é um ativo permanente e reproduzível
  // (mesmo documento → mesma representação). Curto-circuita ANTES de baixar/processar. O Passo 2
  // (pós-RI-001) fará candidato+comparação quando houver `extractor_version` mais novo.
  const representationCertified = isRepresentationCertified({ previousStatus, identityEstablished })
  if (representationCertified) {
    return NextResponse.json({
      certified: true,
      code: 'ALREADY_CERTIFIED',
      notice: 'Este exame já possui uma representação estruturada certificada. "Extrair novamente" não altera os resultados — eles são um ativo permanente e reproduzível do documento.',
    }, { status: 200 })
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
  let examTextForIssuer: string | null = null // texto do laudo p/ extrair o emissor
  let bundlePages: string[] = []              // texto por página (reparado) → Bundle p/ o pipeline
  let pagesProcessed: string[] = []           // páginas que a IA de fato leu (após restrição de CDU — M3)
  let splitPlan: SplitPlan | null = null      // plano de split do bundle (M3)

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
    examTextForIssuer = extraction.text
    bundlePages = extraction.pageTexts // páginas reparadas → Bundle para o ClinicalInformationPipeline

    // ── M3 — Bundle Split: COMPREENDER a estrutura ANTES de extrair. Cada CDU/irmão processa só as SUAS
    // páginas (isolamento por intervalo). Documento de 1 CDU (a maioria) → intervalo cobre tudo → sem
    // qualquer mudança de comportamento. `isRoot`: upload ainda não dividido (não é irmão nem já-dividido).
    const isRootBundle = exam.source_bundle_exam_id == null && exam.bundle_cdu_count == null
    const existingRange = exam.bundle_page_start != null && exam.bundle_page_end != null
      ? { start: exam.bundle_page_start, end: exam.bundle_page_end } : null
    const understood = processBundle({ pageTexts: bundlePages, hasImages: false })
    splitPlan = planBundleSplit({
      cdus: understood.cdus.map(c => ({
        index: c.index, pages: c.pages, title: c.title,
        discoveredUnits: c.discoveredUnits, status: c.status, reviewType: c.reviewType,
      })),
      isRoot: isRootBundle,
      existingRange,
    })
    const coversAll = !splitPlan.thisRange
      || (splitPlan.thisRange.start === 0 && splitPlan.thisRange.end === bundlePages.length - 1)
    const pagesForAI = coversAll ? extraction.pageTexts : restrictPages(bundlePages, splitPlan.thisRange)
    if (!coversAll) examTextForIssuer = pagesForAI.join('\n')
    pagesProcessed = pagesForAI

    // 7. Filtro de páginas (Epic 1.4A) — remove conteúdo administrativo antes da IA (páginas DESTA CDU)
    filterResult = filterRelevantPages(pagesForAI, 3)

    // 7b. Roteamento: Path A (texto) vs Path B (PDF nativo). CDU restrita força o caminho de TEXTO
    // (o PDF nativo não é fatiável por página aqui) — usa exatamente o texto das páginas da CDU.
    const useNative = coversAll && extraction.quality !== 'good_text' && filterResult.pagesRelevant <= 20
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
      // Fidelidade da Ingestão (RF-01/RF-02): contexto do laudo, texto original (ou null).
      source_material:  b.sourceMaterial,
      source_exam_name: b.sourceExamName,
    }))

    // Dispatcher 1d.2 — Rollout Controlado. canonical_route devolve o motivo da rota
    // ('mode_off' | 'allowlist' | 'percent' | 'percent_miss'): allowlist (caso controlado,
    // determinístico) tem precedência sobre o percentual; hash de produção intacto.
    // Escreve canônico só quando 'allowlist' ou 'percent'. Com mode=off → 'mode_off' →
    // replace_biomarkers (INALTERADO). route_reason é gravado na telemetria (origem da escrita).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: route } = await (supabase.rpc as any)('canonical_route', { p_exam_id: examId })
    const useCanonical = route === 'allowlist' || route === 'percent'

    let replaceErr: { message?: string } | null = null
    if (useCanonical) {
      // Escrita canônica append-only. p_meta mínimo por ora (proveniência completa = fase 1e).
      const t0 = Date.now()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cwRes, error } = await (supabase.rpc as any)('write_canonical_extraction', {
        p_exam_id:    examId,
        p_user_id:    userId,
        p_biomarkers: bmRows,
        p_meta:       { ai_log_id: result.aiLogId, origin: 'fresh', processing_mode: 'canonical_on', extraction_schema_version: EXTRACTION_SCHEMA_VERSION },
      })
      replaceErr = error
      // Telemetria do rollout (best-effort — nunca quebra a extração).
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('canonical_write_telemetry').insert({
          exam_id:      examId,
          version_id:   (cwRes as { version_id?: string } | null)?.version_id ?? null,
          action:       (cwRes as { action?: string } | null)?.action ?? null,
          duration_ms:  Date.now() - t0,
          route_reason: route,
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

  // 10. Atualizar exame: status + data + paciente + NOME DOCUMENTAL.
  //     Nomenclatura documental (CAP-002 §Content Classifier, fundadora 12/07/2026):
  //     o nome do registro representa o DOCUMENTO, nunca um resultado interno. A IA
  //     descreve a estrutura; o domínio (deriveDisplayTitle) aplica um nome
  //     DETERMINÍSTICO — painel → "Exames laboratoriais" (jamais um biomarcador).
  //     Só sobrescreve o nome do arquivo quando a estrutura é confiável, para não
  //     degradar um nome bom quando a extração não classificou nada.
  //     A data do laudo é FATO impresso — preenche exam_date só quando extraída.
  const finalUpdate: Record<string, unknown> = { status: 'processed' }

  // classifyExamDocument é DETERMINÍSTICO (regra sobre biomarcadores/texto). Usado para os
  // metadados de extração sempre, e — só na 1ª vez — para estabelecer a identidade documental.
  const structure = classifyExamDocument({
    examType: result.examType,
    biomarkers: result.biomarkers.map(b => ({ name: b.name, sourceExamName: b.sourceExamName })),
    text: examTextForIssuer,
  })

  // Quando a identidade já está travada, o family/tipo segue o document_type estabelecido.
  const effectiveDocType = identityEstablished ? (exam.document_type ?? structure.documentType) : structure.documentType

  // Bundle → CDUs (compreensão) — vem antes do plano de representação. Com o split (M3), ESTE registro
  // representa UMA CDU; a Cobertura soma só as unidades do que a IA leu (não conta as CDUs-irmãs).
  const bundle = processBundle({
    pageTexts: pagesProcessed.length ? pagesProcessed : (examTextForIssuer ? [examTextForIssuer] : []),
    hasImages: isImage,
  })
  const primaryCdu = bundle.ready[0] ?? bundle.cdus[0]

  // ── DELEGAÇÃO DE MODALIDADE AO ENGINE (Convergência Progressiva) ──
  // O `analyze` NÃO decide modalidade. O ENGINE decide COMO representar a CDU. Daqui em diante o analyze
  // opera SÓ sobre abstrações do plano — nunca "laboratório"/"imagem"/"Pentacam"/"mamografia". Comportamento
  // EQUIVALENTE ao legado (só a decisão mudou de lugar); o caminho laboratorial permanece intacto.
  const plan = planRepresentation(primaryCdu, {
    documentType: effectiveDocType, examCount: structure.examCount, biomarkerCount: result.biomarkers.length,
  })

  // Laudo narrativo: o laudo É o resultado — se o extrator raspou "resultados", descarta-os (document_only,
  // Rastreabilidade Documental). Decisão do PLANO do Engine, não de um `if` de modalidade no analyze.
  if (!plan.structured && result.biomarkers.length > 0) {
    await supabase.from('biomarkers').delete().eq('exam_id', examId)
  }

  // Metadados de extração (CEF) — SEMPRE atualizam (refletem a EXTRAÇÃO, não a identidade).
  const bmN = plan.structured ? result.biomarkers.length : 0
  const bmWithRef = plan.structured ? result.biomarkers.filter(b => b.rangeExtracted || b.referenceMin != null || b.referenceMax != null).length : 0
  let completeness = bmN === 0 ? 'document_only' : (bmWithRef / bmN >= 0.5 ? 'structured' : 'partial')

  // COBERTURA (comparador puro, §Cobertura Documental) — direção SEGURA: só REBAIXA, nunca alega completude.
  if (plan.structured && completeness === 'structured' && bmN > 0) {
    const discovered = bundle.cdus.reduce((s, c) => s + (c.structure.resultUnits || 0), 0)
    const cov = computeCoverage({ cdu: { index: 1, discoveredUnits: discovered }, structuredUnits: bmN })
    if (discovered > 0 && !cov.certifiedComplete) completeness = 'partial'
  }
  finalUpdate.extraction_completeness = completeness
  finalUpdate.structural_confidence = completeness === 'structured' ? 'high' : completeness === 'partial' ? 'medium' : 'low'
  finalUpdate.extractor_family = plan.family
  finalUpdate.extractor_version = plan.extractorVersion
  finalUpdate.processed_at = new Date().toISOString()

  // ── Clinical Processing Engine — resultado por MODELO CLÍNICO (não-biomarcador) → clinical_results ──
  // O analyze conhece SÓ o Engine: processClinical(cdu) identifica → seleciona o MODELO → executa o
  // processador. Persistência ADITIVA e fiel (parâmetros por região; nunca disfarçados de biomarcador —
  // evita o churn "Pentacam = N biomarcadores"). RDC 657: transcreve, não interpreta. Idempotente
  // (delete-then-insert do próprio modelo). Não altera a UI atual — a exibição por olho é decisão de
  // produto (o usuário continua vendo o documento original). Imagem sem texto → sem parâmetros (multimodal
  // é etapa futura). Roda sobre a CDU certificada desta extração (a MESMA do plano de representação).
  if (primaryCdu) {
    const cpe = processClinical(primaryCdu)
    // A persistência fala UCDA: a saída do processador é convertida no CONTRATO canônico (UcdaRepresentation)
    // e gravada genericamente (qualquer kind/campo). clinical_results é apenas o BACKEND; UCDA é o contrato.
    const ucda = representationFromProcessor(cpe.result)
    if (ucda && ucda.items.length > 0) {
      const rows = ucda.items.map((it, i) => ({
        exam_id: examId, user_id: userId,
        clinical_model: ucda.clinicalModel, result_kind: ucda.resultKind,
        item_type: it.itemType, name: it.name, value_text: it.valueText, value_num: it.valueNum ?? null,
        unit: it.unit ?? null, region: it.region ?? null, anatomy: it.anatomy ?? null,
        code: it.code ?? null, code_system: it.codeSystem ?? null, value_code: it.valueCode ?? null,
        method: it.method ?? null, context: it.context ?? null, group_label: it.group ?? null,
        reference_text: it.referenceText ?? null,
        // Auditabilidade (Certificação §4): documento(exam_id) · página · trecho · Engine · processador · quando(created_at)
        page: it.page ?? null, raw_text: it.excerpt ?? null,
        engine_version: ucda.provenance.engineVersion ?? null,
        sort_order: i, source: 'cpe', contract_version: cpe.result.contractVersion,
      }))
      // Idempotente (delete-then-insert do próprio modelo): reprocessar não duplica.
      await supabase.from('clinical_results').delete().eq('exam_id', examId).eq('clinical_model', ucda.clinicalModel)
      await supabase.from('clinical_results').insert(rows as never)
    }
  }

  // ── IDENTIDADE DOCUMENTAL — WRITE-ONCE (Princípio da Identidade Documental, GOVERNANCA) ──
  // Estabelecida SÓ na 1ª extração; "Extrair novamente" NUNCA altera nome/type/scope/data/
  // paciente — só os resultados estruturados (biomarcadores) e os metadados acima. Só uma
  // ação explícita de correção pode mudar a identidade. Corrige o churn do Pentacam
  // (reextrair mudava "Mapeamento ocular"/"OCULUS Pentacam"/… a cada clique).
  if (!identityEstablished) {
    // A data do laudo e o paciente são FATOS documentais — fixados na 1ª extração.
    // Data SEMÂNTICA (CEF §5): prefere coleta/realização do texto (alta/média confiança) à data da IA —
    // evita pegar nascimento/impressão/protocolo (bug do EEG "2002" e do laudo 2009). Baixa confiança
    // ou sem texto → mantém a data da IA (§5.2: baixa confiança não sobrescreve).
    const semDate = examTextForIssuer ? pickExamDate(examTextForIssuer) : null
    const examDate = semDate && semDate.iso && semDate.confidence !== 'low' ? semDate.iso : result.examDate
    if (examDate) finalUpdate.exam_date = examDate
    if (result.patientName) finalUpdate.patient_name = result.patientName

    // Identidade CLÍNICA (Clinical Identity Registry, CEF §3.0) — "que tipo de exame é", por ensemble de
    // evidências. Aditivo (não altera a classificação documental aqui); alimenta o extrator do CEF (M5).
    // Write-once (dentro do bloco de identidade). Só grava quando a confiança não é baixa.
    const clin = examTextForIssuer ? identifyClinical(examTextForIssuer) : null
    if (clin && clin.clinicalType && clin.confidence !== 'low') {
      finalUpdate.clinical_family = clin.clinicalFamily
      finalUpdate.clinical_type = clin.clinicalType
    }
    // Estrutura confiável (para nomear) — abstração vinda do PLANO do Engine (o analyze não interpreta
    // modalidade): categoria estruturada detectada, OU ≥1 exame distinto, OU qualquer biomarcador.
    const confidentStructure = plan.structureConfident
    // Estado da identidade (M4) — write-once. 'validated' quando reconhecemos com confiança (estrutura
    // confiável OU identidade clínica não-ambígua de confiança alta); senão 'draft' (sinaliza revisão).
    const clinValidated = !!clin && clin.confidence === 'high' && !clin.ambiguous
    finalUpdate.document_identity_status = (confidentStructure || clinValidated) ? 'validated' : 'draft'
    finalUpdate.document_type = structure.documentType
    finalUpdate.document_scope = structure.documentScope

    // Só sobrescreve o nome do arquivo quando aprendemos estrutura de verdade (confidentStructure acima).
    if (confidentStructure) {
      const displayTitle = deriveDisplayTitle(structure)
      finalUpdate.display_title = displayTitle
      // Enriquecimento (fundadora): nome do laboratório emissor. Best-effort.
      const issuer = await extractIssuer(examTextForIssuer)
      if (issuer) finalUpdate.issuer = issuer
      finalUpdate.type = issuer ? withProvenance(displayTitle, { issuer }) : displayTitle
    } else if (result.biomarkers.length === 0) {
      // Sem biomarcadores E sem estrutura confiável (imagem, oftalmológico, pedido…): o
      // Content Classifier LÊ o próprio documento para nomear. Roda APENAS na 1ª extração
      // (é uma chamada de IA — write-once garante que a reextração não a repita nem varie).
      const docMediaType = isImage
        ? (filePath.endsWith('.png') ? 'image/png' : filePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg')
        : 'application/pdf'
      const doc = await classifyDocumentAI({ base64: pdfBuffer.toString('base64'), mediaType: docMediaType })
      if (doc?.displayName) {
        const derived = deriveDisplayTitle({
          documentType: doc.documentType as never,
          documentScope: 'single', examCount: 0,
          singleExamName: doc.displayName, modality: doc.displayName,
        })
        const title = derived === 'Documento' ? doc.displayName : derived
        finalUpdate.document_type = doc.documentType
        finalUpdate.display_title = title
        finalUpdate.type = doc.issuer ? withProvenance(title, { issuer: doc.issuer }) : title
        if (doc.issuer) finalUpdate.issuer = doc.issuer
      }
    }
  }
  // Assinatura da representação estruturada certificada (Princípio da Reprodutibilidade). Mesma versão
  // de extrator + mesmo documento => mesma assinatura. Serve de prova permanente e base do evento de
  // consistência do Passo 2 (comparar candidato × certificado sem substituir automaticamente).
  finalUpdate.representation_fingerprint = representationFingerprint({
    documentType:  (finalUpdate.document_type as string | undefined) ?? exam.document_type,
    documentScope: finalUpdate.document_scope as string | undefined,
    displayTitle:  finalUpdate.display_title as string | undefined,
    results: plan.structured ? result.biomarkers : [],
  })

  // ── M3 — Bundle Split (materialização) ──
  // Este exame passa a ser a CDU#1 do bundle; grava a sua proveniência (aponta para si) + intervalo.
  if (splitPlan && splitPlan.split && splitPlan.thisRange) {
    finalUpdate.source_bundle_exam_id = examId
    finalUpdate.bundle_cdu_index = 1
    finalUpdate.bundle_cdu_count = splitPlan.count
    finalUpdate.bundle_page_start = splitPlan.thisRange.start
    finalUpdate.bundle_page_end = splitPlan.thisRange.end
  }

  await supabase.from('exams')
    .update(finalUpdate as never)
    .eq('id', examId)

  // Cria os registros-irmãos (CDUs 2..N) como 'pending', com proveniência do Bundle. Cada um, ao ser
  // analisado, processa SÓ o seu intervalo de páginas (existingRange) — extração isolada por CDU. O
  // disparo/confirmação da segmentação é a decisão de produto sinalizada; aqui apenas materializamos.
  // Idempotente: na raiz já-dividida, isRootBundle=false → splitPlan.split=false → não recria.
  if (splitPlan && splitPlan.split && splitPlan.siblings.length && exam.file_url) {
    const rootName = exam.type ?? (finalUpdate.display_title as string | undefined) ?? 'Exame'
    const siblingRows = splitPlan.siblings.map(s => ({
      user_id: userId,
      type: s.title || `${rootName} — parte ${s.index}/${splitPlan!.count}`,
      exam_date: null,
      file_url: exam.file_url,
      status: 'pending',
      source_bundle_exam_id: examId,
      bundle_cdu_index: s.index,
      bundle_cdu_count: splitPlan!.count,
      bundle_page_start: s.range.start,
      bundle_page_end: s.range.end,
    }))
    await supabase.from('exams').insert(siblingRows as never)
  }

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
