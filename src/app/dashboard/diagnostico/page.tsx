'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

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

    // ── 10. Tabelas da Fase 0 — verificar existência ──────────────────────
    add({ label: '── Tabelas Phase 0 (Beta) ──', ok: true, detail: '' })
    {
      const { data, error } = await supabase
        .from('ai_processing_log').select('id').limit(1)
      if (error) {
        add({ label: 'SELECT ai_processing_log', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'SELECT ai_processing_log', ok: true, detail: `${(data ?? []).length} registro(s) — tabela acessível` })
      }
    }
    {
      const { data, error } = await supabase
        .from('audit_purge_log' as never).select('table_name, record_count, action').limit(10)
      if (error) {
        add({ label: 'SELECT audit_purge_log', ok: false, detail: `[${(error as {code:string}).code}] ${(error as {message:string}).message}` })
      } else {
        const summary = (data as Array<{table_name:string;record_count:number;action:string}> ?? [])
          .map(r => `${r.table_name}(${r.record_count}) ${r.action}`).join(' | ')
        add({ label: 'SELECT audit_purge_log', ok: true, detail: summary || '— vazio' })
      }
    }
    {
      const { data, error } = await supabase
        .from('biomarkers').select('id').eq('user_id', user.id).eq('synthetic', true).limit(1)
      if (error) {
        add({ label: 'SELECT biomarkers WHERE synthetic=true', ok: false, detail: `[${error.code}] ${error.message}` })
      } else {
        add({ label: 'SELECT biomarkers WHERE synthetic=true', ok: true, detail: `${(data ?? []).length}+ registros arquivados` })
      }
    }

    setRunning(false)
    setDone(true)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Diagnóstico de Exames</h1>
        <p className="font-body text-sm text-mauve">Verifica conectividade com Supabase e estado das tabelas da Fase 0 (Beta).</p>
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
