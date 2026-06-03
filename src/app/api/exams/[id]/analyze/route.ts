// Fase 1 (Beta): pipeline de IA real via AI Gateway.
// Extrai biomarcadores e intervalos de referência do próprio laudo.
// Sem interpretação clínica, sem Knowledge Base, sem scores.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractBiomarkers, isGatewayError } from '@/lib/ai/gateway'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params
  const supabase = await createClient()

  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const user = authData.user

  const body = await request.json()
  const examText = String(body.examText ?? '').trim()

  if (examText.length < 50) {
    return NextResponse.json(
      { error: 'Texto do exame muito curto ou ausente.' },
      { status: 400 },
    )
  }

  // Verificar ownership
  const { data: examOwner } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('user_id', user.id)
    .single()

  if (!examOwner) {
    return NextResponse.json({ error: 'Exame não encontrado.' }, { status: 404 })
  }

  // Chamar o Gateway
  const result = await extractBiomarkers(supabase, {
    examText,
    examId,
    userId: user.id,
  })

  if (isGatewayError(result)) {
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: result.httpStatus },
    )
  }

  // Salvar biomarcadores com rastreabilidade completa
  if (result.biomarkers.length > 0) {
    await supabase.from('biomarkers').delete().eq('exam_id', examId)

    const bmRows = result.biomarkers.map(b => ({
      exam_id: examId,
      user_id: user.id,
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
      synthetic: false,
    }))

    await supabase.from('biomarkers').insert(bmRows as unknown as never[])
  }

  // Atualizar exame com tipo e status
  await supabase
    .from('exams')
    .update({ status: 'processed', type: result.examType } as unknown as never)
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
  })
}
