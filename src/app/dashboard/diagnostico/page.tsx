'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { buildBiomarkers, calcScores, buildInsights, detectExamType } from '@/lib/exam-processor'

interface Row { label: string; ok: boolean; detail: string }

export default function DiagnosticoPage() {
  const { user } = useUser()
  const supabase = useRef(createClient()).current
  const [rows, setRows]     = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone]     = useState(false)

  const add = (r: Row) => setRows(prev => [...prev, r])

  useEffect(() => { run() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    if (!user) return
    setRunning(true)
    setRows([])

    // ── 1. Sessão ─────────────────────────────────────────────────────────
    add({ label: 'Usuário autenticado', ok: true, detail: user.id })

    // ── 2. public.exams — leitura ─────────────────────────────────────────
    {
      const { data, error } = await supabase
        .from('exams').select('id,status,type,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) {
        add({ label: 'SELECT public.exams', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        const list = (data ?? []).map((e: Record<string, unknown>) =>
          `${String(e.id).slice(0,8)}… status="${e.status}" type="${e.type}"`).join(' | ')
        add({ label: `SELECT public.exams (${(data ?? []).length} registros)`, ok: true, detail: list || '— vazio' })
      }
    }

    // ── 3. public.biomarkers — leitura ────────────────────────────────────
    {
      const { data, error } = await supabase
        .from('biomarkers').select('id').eq('user_id', user.id).limit(1)
      if (error) {
        add({ label: 'SELECT public.biomarkers', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'SELECT public.biomarkers', ok: true, detail: `${(data ?? []).length} registro(s) visíveis` })
      }
    }

    // ── 4. public.biological_scores — leitura ─────────────────────────────
    {
      const { data, error } = await supabase
        .from('biological_scores').select('id').eq('user_id', user.id).limit(1)
      if (error) {
        add({ label: 'SELECT public.biological_scores', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'SELECT public.biological_scores', ok: true, detail: `${(data ?? []).length} registro(s) visíveis` })
      }
    }

    // ── 5. public.ai_insights — leitura ───────────────────────────────────
    {
      const { data, error } = await supabase
        .from('ai_insights').select('id').eq('user_id', user.id).limit(1)
      if (error) {
        add({ label: 'SELECT public.ai_insights', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'SELECT public.ai_insights', ok: true, detail: `${(data ?? []).length} registro(s) visíveis` })
      }
    }

    // ── 6. INSERT de teste em biomarkers ──────────────────────────────────
    const testExamId = crypto.randomUUID()
    {
      const { error } = await supabase.from('biomarkers').insert({
        exam_id: testExamId,
        user_id: user.id,
        name: '__diag_test__',
        value: 1,
        unit: 'test',
        reference_min: 0,
        reference_max: 2,
        interpretation: 'normal',
        ai_insight: null,
      } as unknown as never)
      if (error) {
        add({ label: 'INSERT public.biomarkers (teste)', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'INSERT public.biomarkers (teste)', ok: true, detail: 'Inserção OK' })
        // Limpa o registro de teste
        await supabase.from('biomarkers').delete().eq('user_id', user.id).eq('name', '__diag_test__')
      }
    }

    // ── 7. INSERT de teste em biological_scores ───────────────────────────
    {
      const { error } = await supabase.from('biological_scores').insert({
        user_id: user.id,
        score_total: 0,
      } as unknown as never)
      if (error) {
        add({ label: 'INSERT public.biological_scores (teste)', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'INSERT public.biological_scores (teste)', ok: true, detail: 'Inserção OK' })
        await supabase.from('biological_scores').delete().eq('user_id', user.id).eq('score_total', 0)
      }
    }

    // ── 8. INSERT de teste em ai_insights ─────────────────────────────────
    {
      const { error } = await supabase.from('ai_insights').insert({
        user_id: user.id,
        insight: '__diag_test__',
        category: 'general',
        priority: 'low',
      } as unknown as never)
      if (error) {
        add({ label: 'INSERT public.ai_insights (teste)', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'INSERT public.ai_insights (teste)', ok: true, detail: 'Inserção OK' })
        await supabase.from('ai_insights').delete().eq('user_id', user.id).eq('insight', '__diag_test__')
      }
    }

    // ── 9. UPDATE de teste em public.exams ────────────────────────────────
    // Cria um exam fictício para testar o UPDATE
    const diagExamId = crypto.randomUUID()
    {
      const { error: insErr } = await supabase.from('exams').insert({
        id: diagExamId,
        user_id: user.id,
        type: '__diag_test__',
        status: 'pending',
      } as unknown as never)

      if (insErr) {
        add({ label: 'INSERT public.exams (teste UPDATE)', ok: false, detail: `[${insErr.code}] ${insErr.message}` })
      } else {
        const { error: updErr } = await supabase.from('exams')
          .update({ status: 'processing' } as unknown as never)
          .eq('id', diagExamId).eq('user_id', user.id)
        if (updErr) {
          add({ label: 'UPDATE public.exams status (teste)', ok: false, detail: `[${updErr.code}] ${updErr.message}` })
        } else {
          add({ label: 'UPDATE public.exams status (teste)', ok: true, detail: 'pending → processing OK' })
        }
        await supabase.from('exams').delete().eq('id', diagExamId)
      }
    }

    // ── 10. Simulação completa do pipeline com exam fictício ───────────────
    add({ label: '── Simulação de pipeline completo ──', ok: true, detail: '' })
    const fakeExamId   = crypto.randomUUID()
    const fakeExamName = 'hemograma_diagnostico'
    let pipelineOk = true

    // insert exam
    {
      const { error } = await supabase.from('exams').insert({
        id: fakeExamId, user_id: user.id, type: fakeExamName, status: 'pending',
      } as unknown as never)
      if (error) {
        add({ label: '  [1] insert exam', ok: false, detail: `[${error.code}] ${error.message}` })
        pipelineOk = false
      } else {
        add({ label: '  [1] insert exam', ok: true, detail: fakeExamId })
      }
    }

    if (pipelineOk) {
      // update processing
      {
        const { error } = await supabase.from('exams')
          .update({ status: 'processing' } as unknown as never)
          .eq('id', fakeExamId).eq('user_id', user.id)
        if (error) {
          add({ label: '  [2] update → processing', ok: false, detail: `[${error.code}] ${error.message}` })
          pipelineOk = false
        } else {
          add({ label: '  [2] update → processing', ok: true, detail: 'OK' })
        }
      }
    }

    if (pipelineOk) {
      const examType   = detectExamType(fakeExamName)
      const biomarkers = buildBiomarkers(examType, fakeExamId)
      const bmRows = biomarkers.map(b => ({
        exam_id: fakeExamId, user_id: user.id,
        name: b.name, value: b.value, unit: b.unit,
        reference_min: b.reference_min, reference_max: b.reference_max,
        interpretation: b.interpretation, ai_insight: b.ai_insight,
      }))
      const { error } = await supabase.from('biomarkers').insert(bmRows as unknown as never)
      if (error) {
        add({ label: `  [3] insert biomarkers (${bmRows.length}x)`, ok: false, detail: `[${error.code}] ${error.message}` })
        pipelineOk = false
      } else {
        add({ label: `  [3] insert biomarkers (${bmRows.length}x)`, ok: true, detail: 'OK' })
      }
    }

    if (pipelineOk) {
      const biomarkers = buildBiomarkers(detectExamType(fakeExamName), fakeExamId)
      const scores = calcScores(biomarkers)
      const { error } = await supabase.from('biological_scores')
        .insert({ user_id: user.id, ...scores } as unknown as never)
      if (error) {
        add({ label: '  [4] insert biological_scores', ok: false, detail: `[${error.code}] ${error.message}` })
        pipelineOk = false
      } else {
        add({ label: '  [4] insert biological_scores', ok: true, detail: `score_total=${scores.score_total}` })
      }
    }

    if (pipelineOk) {
      const biomarkers = buildBiomarkers(detectExamType(fakeExamName), fakeExamId)
      const insights = buildInsights(biomarkers, user.id)
      const { error } = await supabase.from('ai_insights').insert(insights as unknown as never)
      if (error) {
        add({ label: `  [5] insert ai_insights (${insights.length}x)`, ok: false, detail: `[${error.code}] ${error.message}` })
        pipelineOk = false
      } else {
        add({ label: `  [5] insert ai_insights (${insights.length}x)`, ok: true, detail: 'OK' })
      }
    }

    if (pipelineOk) {
      const { error } = await supabase.from('exams')
        .update({ status: 'processed' } as unknown as never)
        .eq('id', fakeExamId).eq('user_id', user.id)
      if (error) {
        add({ label: '  [6] update → processed', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: '  [6] update → processed', ok: true, detail: 'PIPELINE COMPLETO OK' })
      }
    }

    // Limpa todos os registros de diagnóstico
    await supabase.from('biomarkers').delete().eq('exam_id', fakeExamId)
    if (!pipelineOk) await supabase.from('biological_scores').delete().eq('user_id', user.id).eq('score_total', 0)
    await supabase.from('ai_insights').delete().eq('user_id', user.id).eq('category', 'general').eq('insight', 'Seus biomarcadores estão dentro das faixas de referência. Continue com seus hábitos saudáveis e repita os exames em 6–12 meses.')
    await supabase.from('exams').delete().eq('id', fakeExamId)

    setRunning(false)
    setDone(true)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Diagnóstico de Exames</h1>
        <p className="font-body text-sm text-mauve">Testa cada etapa do pipeline diretamente no Supabase com seu usuário autenticado.</p>
      </div>

      {running && rows.length === 0 && (
        <p className="font-body text-sm text-mauve animate-pulse">Executando testes…</p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className={`rounded-xl px-4 py-3 font-mono text-xs border ${
            r.label.startsWith('──')
              ? 'bg-ivory border-border text-mauve font-semibold'
              : r.ok
                ? 'bg-sage-light border-sage/30 text-onyx'
                : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className="mr-2">{r.label.startsWith('──') ? '' : r.ok ? '✓' : '✗'}</span>
            <span className="font-semibold">{r.label}</span>
            {r.detail && <span className="ml-2 opacity-70">{r.detail}</span>}
          </div>
        ))}
      </div>

      {done && (
        <button
          onClick={() => { setDone(false); run() }}
          className="mt-2 inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"
        >
          Executar novamente
        </button>
      )}
    </div>
  )
}
