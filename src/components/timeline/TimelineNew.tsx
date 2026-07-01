'use client'

// Container da NOVA composição da Timeline (dados reais, read-only).
// Consome só o timeline adapter + Timeline. Reutilizado por preview e Entry.

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import type { HealthEventRow } from '@/lib/agenda/event'
import { eventsToTimeline } from '@/lib/ui/adapters/timeline'
import Timeline, { type TimelineEvent } from '@/components/timeline/Timeline'
import StateView from '@/components/ui/StateView'

type Phase = 'loading' | 'empty' | 'error' | 'ready'

export default function TimelineNew() {
  const { user } = useUser()
  const [phase, setPhase] = useState<Phase>('loading')
  const [events, setEvents] = useState<TimelineEvent[]>([])

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const supabase = createClient() as unknown as SupabaseClient
      const { data, error } = await supabase
        .from('health_events')
        .select('id,event_type,title,event_date,event_time,status,amount_cents,professional_name,establishment,links')
        .eq('user_id', user.id).eq('synthetic', false)
      if (!active) return
      if (error) { setPhase('error'); return }
      const rows = (data ?? []) as unknown as HealthEventRow[]
      if (rows.length === 0) { setPhase('empty'); return }
      setEvents(eventsToTimeline(rows))
      setPhase('ready')
    })()
    return () => { active = false }
  }, [user])

  return (
    <div className="mx-auto max-w-2xl p-4">
      {phase === 'loading' && <StateView kind="loading" title="Carregando histórico…" />}
      {phase === 'empty' && (
        <StateView kind="empty" title="Ainda não há acontecimentos registrados"
          message="Seus eventos aparecem aqui conforme forem sendo registrados." />
      )}
      {phase === 'error' && (
        <StateView kind="error" title="Não foi possível carregar seu histórico"
          message="Tente novamente em instantes." />
      )}
      {phase === 'ready' && <Timeline events={events} />}
    </div>
  )
}
