'use client'

// Container da NOVA composição do Dashboard (dados reais, read-only).
// Consome só o dashboardAdapter; estado por bloco. Reutilizado pela rota de
// preview e, no cutover, pelo DashboardEntry. Escrita congelada (Estado 2).

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import type { BiomarkerRow } from '@/lib/biomarkers/grouping'
import type { HealthEventRow } from '@/lib/agenda/event'
import { buildDashboard, type DashboardModel } from '@/lib/ui/adapters/dashboard'
import { todayIso } from '@/lib/ui/date'
import DashboardPriority, { type BlockState } from '@/components/dashboard/DashboardPriority'

export default function DashboardNew() {
  const { user, profile } = useUser()
  const [model, setModel] = useState<DashboardModel | null>(null)
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
        supabase.from('exams').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).in('status', ['pending', 'processing']),
      ])
      if (!active) return

      const bioOk = bio.status === 'fulfilled' && !bio.value.error
      const evOk = events.status === 'fulfilled' && !events.value.error
      const examOk = exams.status === 'fulfilled' && !exams.value.error

      const bioRows = bioOk ? ((bio as PromiseFulfilledResult<{ data: unknown }>).value.data ?? []) as unknown as BiomarkerRow[] : []
      const eventRows = evOk ? ((events as PromiseFulfilledResult<{ data: unknown }>).value.data ?? []) as unknown as HealthEventRow[] : []
      const pendingExams = examOk ? ((exams as PromiseFulfilledResult<{ count: number | null }>).value.count ?? 0) : 0

      setBioState(bioOk ? 'ok' : 'error')
      setEvState(evOk ? 'ok' : 'error')
      setExamState(examOk ? 'ok' : 'error')
      setModel(buildDashboard({ bioRows, eventRows, pendingExams, refDate: todayIso() }))
    })()
    return () => { active = false }
  }, [user])

  const greeting = `Olá, ${profile?.name?.split(' ')[0] ?? 'por aqui'}`

  return (
    <div className="mx-auto max-w-3xl p-4">
      <DashboardPriority
        greeting={greeting}
        today={model?.today ?? []}
        attention={model?.attention ?? []}
        continuing={model?.continuing ?? []}
        upcoming={model?.upcoming ?? []}
        indicators={model?.indicators ?? []}
        programs={model?.programs ?? []}
        attentionState={evState === 'loading' || examState === 'loading' ? 'loading' : (evState === 'error' || examState === 'error' ? 'error' : 'ok')}
        upcomingState={evState}
        indicatorsState={bioState}
      />
    </div>
  )
}
