'use client'

// Container da NOVA composição de Indicadores (dados reais, read-only).
// Consome só o indicator adapter + IndicatorView. Reutilizado por preview e Entry.

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { summarizeBiomarkers, type BiomarkerRow } from '@/lib/biomarkers/grouping'
import { biomarkerToIndicatorView } from '@/lib/ui/adapters/indicator'
import IndicatorView, { type IndicatorViewProps } from '@/components/indicator/IndicatorView'
import StateView from '@/components/ui/StateView'

type Phase = 'loading' | 'empty' | 'error' | 'ready'

export default function IndicatorNew() {
  const { user } = useUser()
  const [phase, setPhase] = useState<Phase>('loading')
  const [props, setProps] = useState<IndicatorViewProps | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const supabase = createClient() as unknown as SupabaseClient
      const { data, error } = await supabase
        .from('current_biomarkers')
        .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,exam_id,exams(exam_date,created_at)')
        .eq('user_id', user.id).eq('synthetic', false).eq('result_type', 'numeric')
      if (!active) return
      if (error) { setPhase('error'); return }
      const summaries = summarizeBiomarkers((data ?? []) as unknown as BiomarkerRow[])
      const best = summaries.filter((s) => s.measurements.length > 0).sort((a, b) => b.measurements.length - a.measurements.length)[0]
      if (!best) { setPhase('empty'); return }
      setProps(biomarkerToIndicatorView(best))
      setPhase('ready')
    })()
    return () => { active = false }
  }, [user])

  return (
    <div className="mx-auto max-w-2xl p-4">
      {phase === 'loading' && <StateView kind="loading" title="Carregando indicadores…" />}
      {phase === 'empty' && (
        <StateView kind="empty" title="Sem medições numéricas ainda"
          message="Envie um exame com biomarcadores para ver a evolução." />
      )}
      {phase === 'error' && (
        <StateView kind="error" title="Não foi possível carregar os indicadores"
          message="Tente novamente em instantes." />
      )}
      {phase === 'ready' && props && <IndicatorView {...props} />}
    </div>
  )
}
