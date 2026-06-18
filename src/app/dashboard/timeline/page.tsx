'use client'

// Health Timeline — a jornada de saúde consolidada (exames + eventos) numa linha
// do tempo única. ORGANIZAÇÃO FACTUAL, sem juízo clínico. Cada item carrega
// proveniência e confiança (autorrelato é marcado como tal).
// Ver docs/estrategia/SINTERA-VALUE-PROPOSITION-NORTH-STAR.md.

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  Clock, Plus, X, Stethoscope, Syringe, Activity, FlaskConical, CalendarDays, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

type EventType = 'consulta' | 'vacina' | 'procedimento' | 'exame' | 'outro'

interface TimelineItem {
  id: string
  kind: 'exam' | 'event'
  eventType: EventType
  title: string
  subtitle: string | null
  date: string            // ISO (YYYY-MM-DD ou timestamp)
  source: string          // autorrelato | upload | integracao
  confidence: string      // alta | media | baixa
}

const TYPE_META: Record<EventType, { label: string; Icon: React.ElementType; cls: string }> = {
  consulta:     { label: 'Consulta',     Icon: Stethoscope,  cls: 'bg-blush text-petal' },
  vacina:       { label: 'Vacina',       Icon: Syringe,      cls: 'bg-sage-light text-sage' },
  procedimento: { label: 'Procedimento', Icon: Activity,     cls: 'bg-lavender-light text-lavender' },
  exame:        { label: 'Exame',        Icon: FlaskConical, cls: 'bg-warm text-gold' },
  outro:        { label: 'Evento',       Icon: CalendarDays, cls: 'bg-ivory text-mauve' },
}

const CONFIDENCE_CLS: Record<string, string> = {
  alta:  'text-sage bg-sage-light border-sage/20',
  media: 'text-gold bg-warm border-amber-200',
  baixa: 'text-mauve/60 bg-ivory border-border',
}

function fmt(date: string): string {
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TimelinePage() {
  const { user } = useUser()
  const supabase = useRef(createClient() as unknown as SupabaseClient).current

  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Formulário de novo evento
  const [evType, setEvType] = useState<EventType>('consulta')
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evNotes, setEvNotes] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [examsRes, eventsRes] = await Promise.all([
      supabase.from('exams')
        .select('id, type, exam_date, status, notes, created_at')
        .eq('user_id', user.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('health_events')
        .select('id, event_type, title, event_date, notes, source, confidence, synthetic')
        .eq('user_id', user.id)
        .eq('synthetic', false),
    ])

    const merged: TimelineItem[] = []

    for (const e of (examsRes.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: `exam-${e.id as string}`,
        kind: 'exam',
        eventType: 'exame',
        title: (e.type as string) || 'Exame laboratorial',
        subtitle: (e.status as string) === 'processed' ? 'Analisado' : (e.status as string) ?? null,
        date: (e.exam_date as string) || (e.created_at as string),
        source: 'upload',
        confidence: 'alta',
      })
    }
    for (const ev of (eventsRes.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: `event-${ev.id as string}`,
        kind: 'event',
        eventType: (ev.event_type as EventType) ?? 'outro',
        title: (ev.title as string) ?? 'Evento',
        subtitle: (ev.notes as string) ?? null,
        date: ev.event_date as string,
        source: (ev.source as string) ?? 'autorrelato',
        confidence: (ev.confidence as string) ?? 'baixa',
      })
    }

    merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    setItems(merged)
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { load() }, [load])

  async function addEvent() {
    if (!user || saving || !evTitle.trim() || !evDate) return
    setSaving(true)
    try {
      // Entrada manual = autorrelato, confiança baixa (proveniência honesta).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('health_events').insert({
        user_id: user.id,
        event_type: evType,
        title: evTitle.trim(),
        event_date: evDate,
        notes: evNotes.trim() || null,
        source: 'autorrelato',
        confidence: 'baixa',
      })
      if (!error) {
        setEvTitle(''); setEvDate(''); setEvNotes(''); setEvType('consulta')
        setShowForm(false)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Minha Jornada</h1>
          <p className="font-body text-sm text-mauve">Sua linha do tempo de saúde — exames, consultas, vacinas e procedimentos</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Fechar' : 'Adicionar evento'}
        </button>
      </motion.div>

      {/* Formulário */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card-premium p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Tipo</label>
              <select value={evType} onChange={e => setEvType(e.target.value as EventType)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="consulta">Consulta</option>
                <option value="vacina">Vacina</option>
                <option value="procedimento">Procedimento</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Data</label>
              <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Título</label>
            <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)}
              placeholder="Ex.: Consulta ginecologista, Vacina HPV…"
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Observações (opcional)</label>
            <textarea value={evNotes} onChange={e => setEvNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-body text-[11px] text-mauve/50">Registro manual entra como autorrelato (confiança baixa).</p>
            <button onClick={addEvent} disabled={saving || !evTitle.trim() || !evDate}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-petal" />
        </div>
      ) : items.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
            <Clock size={26} className="text-petal" />
          </div>
          <h2 className="font-display text-lg font-semibold text-onyx mb-1">Sua jornada começa aqui</h2>
          <p className="font-body text-sm text-mauve max-w-sm mx-auto">
            Envie um exame ou adicione uma consulta, vacina ou procedimento para começar a
            construir sua linha do tempo de saúde.
          </p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Linha vertical */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/60" />
          <div className="space-y-4">
            {items.map((it, i) => {
              const meta = TYPE_META[it.eventType]
              return (
                <motion.div key={it.id}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="relative">
                  {/* Marcador */}
                  <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-cream ${meta.cls}`} />
                  <div className="card-premium p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.cls}`}>
                          <meta.Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-onyx">{it.title}</p>
                          <p className="font-body text-[11px] text-mauve/60">{meta.label}{it.subtitle ? ` · ${it.subtitle}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="font-body text-[11px] text-mauve/60">{fmt(it.date)}</span>
                        <span className={`font-body text-[10px] rounded-full px-1.5 py-0.5 border ${CONFIDENCE_CLS[it.confidence] ?? CONFIDENCE_CLS.baixa}`}>
                          {it.source === 'autorrelato' ? 'autorrelato' : it.source}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/40 text-center">
        Organização factual da sua jornada. Não constitui diagnóstico nem avaliação clínica.
      </p>
    </div>
  )
}
