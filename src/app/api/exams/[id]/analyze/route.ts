import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcScores, buildInsights } from '@/lib/exam-processor'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = await params
  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return NextResponse.json({ error: 'GROQ_API_KEY nao configurada' }, { status: 500 })
  const body = await request.json()
  const examText = String(body.examText ?? '')
  const prompt = 'Analise este exame medico e extraia biomarcadores numericos. Retorne APENAS um objeto JSON valido, sem markdown, sem blocos de codigo. Formato: {"biomarkers":[{"name":"string","value":0.0,"unit":"string","reference_min":0.0,"reference_max":0.0,"interpretation":"normal|low|high","ai_insight":"string"}],"exam_type":"string"}. Texto do exame: ' + examText.slice(0, 4000)
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
    body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.1 }),
  })
  if (!groqRes.ok) {
    const errBody = await groqRes.text()
    return NextResponse.json({ error: 'Groq ' + groqRes.status + ': ' + errBody.slice(0, 500) }, { status: 500 })
  }
  const groqData = await groqRes.json()
  const rawText = groqData.choices?.[0]?.message?.content ?? ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try { const m = rawText.match(/{[sS]*}/); parsed = JSON.parse(m?.[0] ?? rawText) }
  catch { return NextResponse.json({ error: 'JSON invalido: ' + rawText.slice(0, 200) }, { status: 500 }) }
  if (!parsed.biomarkers?.length) return NextResponse.json({ error: 'Nenhum biomarcador' }, { status: 422 })
  const user = authData.user
  await supabase.from('exams').update({ status: 'processing' } as unknown as never).eq('id', examId)
  await supabase.from('biomarkers').delete().eq('exam_id', examId)
  const bmRows = parsed.biomarkers.map((b: any) => ({ exam_id: examId, user_id: user.id, name: b.name, value: b.value, unit: b.unit, reference_min: b.reference_min, reference_max: b.reference_max, interpretation: b.interpretation, ai_insight: b.ai_insight }))
  const { error: bmErr } = await supabase.from('biomarkers').insert(bmRows as unknown as never[])
  if (bmErr) return NextResponse.json({ error: bmErr.message }, { status: 500 })
  const scores = calcScores(parsed.biomarkers.map((b: any) => ({ ...b, category: 'metabolic' })))
  await supabase.from('biological_scores').insert({ user_id: user.id, ...scores } as unknown as never)
  await supabase.from('ai_insights').insert(buildInsights(parsed.biomarkers, user.id) as unknown as never[])
  await supabase.from('exams').update({ status: 'processed', type: parsed.exam_type } as unknown as never).eq('id', examId)
  return NextResponse.json({ success: true, biomarkers: parsed.biomarkers.length })
}
