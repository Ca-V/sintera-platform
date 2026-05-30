import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcScores, buildInsights } from '@/lib/exam-processor'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params
  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY nao configurada' }, { status: 500 })
  }
  const { examText } = await request.json()
  if (!examText || examText.trim().length < 20) {
    return NextResponse.json({ error: 'Texto muito curto' }, { status: 400 })
  }
  const prompt = 'Voce e especialista em medicina laboratorial feminina. Analise este exame e extraia biomarcadores. Retorne APENAS JSON valido neste formato: {"biomarkers":[{"name":"string","value":0.0,"unit":"string","reference_min":0.0,"reference_max":0.0,"interpretation":"normal|low|high|critical","ai_insight":"string ou null"}],"exam_type":"string"}. Regras: interpretation normal=dentro referencia low=abaixo high=acima critical=>1.5x. ai_insight null se normal. Texto do exame: '
  const geminiRes = await fetch(GEMINI_URL + '?key=' + geminiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt + examText }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    }),
  })
  if (!geminiRes.ok) {
    return NextResponse.json({ error: 'Gemini error: ' + geminiRes.status }, { status: 500 })
  }
  const geminiData = await geminiRes.json()
  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  let parsed: any
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? rawText)
  } catch {
    return NextResponse.json({ error: 'Resposta invalida do Gemini' }, { status: 500 })
  }
  if (!parsed.biomarkers?.length) {
    return NextResponse.json({ error: 'Nenhum biomarcador encontrado' }, { status: 422 })
  }
  const user = authData.user
  await supabase.from('exams').update({ status: 'processing' } as unknown as never).eq('id', examId)
  await supabase.from('biomarkers').delete().eq('exam_id', examId)
  const bmRows = parsed.biomarkers.map((b: any) => ({
    exam_id: examId, user_id: user.id,
    name: b.name, value: b.value, unit: b.unit,
    reference_min: b.reference_min, reference_max: b.reference_max,
    interpretation: b.interpretation, ai_insight: b.ai_insight,
  }))
  const { error: bmErr } = await supabase.from('biomarkers').insert(bmRows as unknown as never[])
  if (bmErr) {
    await supabase.from('exams').update({ status: 'error' } as unknown as never).eq('id', examId)
    return NextResponse.json({ error: bmErr.message }, { status: 500 })
  }
  const bm = parsed.biomarkers.map((b: any) => ({ ...b, category: 'metabolic' }))
  const scores = calcScores(bm)
  await supabase.from('biological_scores').insert({ user_id: user.id, ...scores } as unknown as never)
  const insights = buildInsights(bm, user.id)
  await supabase.from('ai_insights').insert(insights as unknown as never[])
  await supabase.from('exams').update({ status: 'processed', type: parsed.exam_type } as unknown as never).eq('id', examId)
  return NextResponse.json({ success: true, biomarkers: parsed.biomarkers.length, scores })
}
