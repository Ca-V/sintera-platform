'use client'

// Container da NOVA composição do Relatório (dados reais, read-only).
// Consome só o reportAdapter + ReportView; estado por seção. Reutilizado por
// preview e Entry. O relatório nunca cria conhecimento (RDC 657).

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import type { BiomarkerRow } from '@/lib/biomarkers/grouping'
import type { HealthEventRow } from '@/lib/agenda/event'
import { buildReport, type ReportModel, type ExamRow } from '@/lib/ui/adapters/report'
import { todayIso } from '@/lib/ui/date'
import ReportView from '@/components/report/ReportView'
import type { BlockState } from '@/components/dashboard/DashboardPriority'

export default function ReportNew() {
  const { user, profile } = useUser()
  const [model, setModel] = useState<ReportModel | null>(null)
  const [bioState, setBioState] = useState<BlockState>('loading')
  const [evState, setEvState] = useState<BlockState>('loading')
  const [examState, setExamState] = useState<BlockState>('loading')

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const supabase = createClient() as unknown as SupabaseClient
      const [bio, events, exams] = await Promise.allSettled([
        supabase.from('current_biomarkers')
          .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,exam_id,exams(exam_date,created_at)')
          .eq('user_id', user.id).eq('synthetic', false).eq('result_type', 'numeric'),
        supabase.from('health_events')
          .select('id,event_type,title,event_date,event_time,status,amount_cents,professional_name,establishment,links')
          .eq('user_id', user.id).eq('synthetic', false),
        supabase.from('exams').select('id,type,status,created_at,exam_date').eq('user_id', user.id),
      ])
      if (!active) return

      const bioOk = bio.status === 'fulfilled' && !bio.value.error
      const evOk = events.status === 'fulfilled' && !events.value.error
      const examOk = exams.status === 'fulfilled' && !exams.value.error

      const bioRows = bioOk ? ((bio as PromiseFulfilledResult<{ data: unknown }>).value.data ?? []) as unknown as BiomarkerRow[] : []
      const eventRows = evOk ? ((events as PromiseFulfilledResult<{ data: unknown }>).value.data ?? []) as unknown as HealthEventRow[] : []
      const examRows = examOk ? ((exams as PromiseFulfilledResult<{ data: unknown }>).value.data ?? []) as unknown as ExamRow[] : []

      setBioState(bioOk ? 'ok' : 'error')
      setEvState(evOk ? 'ok' : 'error')
      setExamState(examOk ? 'ok' : 'error')
      setModel(buildReport({
        name: profile?.name ?? 'Você', objective: 'consulta',
        bioRows, eventRows, examRows, generatedAt: todayIso(),
      }))
    })()
    return () => { active = false }
  }, [user, profile])

  const empty: ReportModel = {
    cover: { name: profile?.name ?? 'Você', period: '—', generatedAt: '—', objective: 'consulta' },
    summary: [], timeline: [], situation: [], evolution: undefined, documents: [], attachments: [],
  }
  const m = model ?? empty

  return (
    <div className="mx-auto max-w-2xl p-4">
      <ReportView
        {...m}
        summaryState={examState === 'loading' || evState === 'loading' ? 'loading' : (examState === 'error' || evState === 'error' ? 'error' : 'ok')}
        timelineState={evState}
        evolutionState={bioState}
        documentsState={examState}
      />
    </div>
  )
}
