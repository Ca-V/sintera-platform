'use client'

// ============================================================
// Relatório de saúde — compilação factual para levar/enviar ao profissional
// ============================================================
// Reúne, num documento imprimível (Salvar como PDF), os dados que a usuária
// registrou: medicamentos, eventos da jornada (consultas/procedimentos/exames)
// e a lista de exames. ORGANIZAÇÃO FACTUAL — não é laudo, diagnóstico nem
// parecer. Para qualquer profissional de saúde (médico, psicólogo,
// nutricionista, fisioterapeuta, dentista, etc.).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Printer, ArrowLeft, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', vacina: 'Vacina', procedimento: 'Procedimento',
  estetico: 'Procedimento estético', medicamento: 'Medicamento', exame: 'Exame', outro: 'Evento',
}

interface Med { name: string; dose: string | null; frequency: string | null; startedOn: string | null; status: string }
interface Ev { title: string; eventType: string; date: string; notes: string | null }
interface Ex { type: string; date: string }

function fmt(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function RelatorioPage() {
  const { user, profile, loading: authLoading } = useUser()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [meds, setMeds] = useState<Med[]>([])
  const [events, setEvents] = useState<Ev[]>([])
  const [exams, setExams] = useState<Ex[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [medRes, evRes, exRes] = await Promise.all([
      db.from('medications').select('name, dose, frequency, started_on, status').eq('user_id', user.id).order('status'),
      db.from('health_events').select('title, event_type, event_date, notes').eq('user_id', user.id).eq('synthetic', false).order('event_date', { ascending: false }),
      db.from('exams').select('type, exam_date, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setMeds(((medRes.data ?? []) as Array<Record<string, unknown>>).map(m => ({
      name: m.name as string, dose: (m.dose as string) ?? null, frequency: (m.frequency as string) ?? null,
      startedOn: (m.started_on as string) ?? null, status: (m.status as string) ?? 'em_uso',
    })))
    setEvents(((evRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      title: e.title as string, eventType: (e.event_type as string) ?? 'outro',
      date: e.event_date as string, notes: (e.notes as string) ?? null,
    })))
    setExams(((exRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      type: (e.type as string) || 'Exame', date: (e.exam_date as string) || (e.created_at as string),
    })))
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  const nome = (profile as { name?: string } | null)?.name ?? user?.email ?? '—'
  const medsEmUso = meds.filter(m => m.status === 'em_uso')
  const medsSusp = meds.filter(m => m.status === 'suspenso')
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  if (loading) {
    return <div className="p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Barra de ações — escondida na impressão */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/dashboard/timeline" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal">
          <ArrowLeft size={15} /> Minha Jornada
        </Link>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
          <Printer size={15} /> Imprimir / Salvar PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-8 space-y-6 print:border-0 print:p-0">
        {/* Cabeçalho */}
        <div className="border-b border-border pb-4">
          <div className="inline-flex items-center gap-1.5 text-petal mb-1 print:hidden">
            <FileText size={16} /><span className="font-body text-xs font-medium uppercase tracking-wider">Relatório de saúde</span>
          </div>
          <h1 className="font-display text-xl font-semibold text-onyx">Relatório de saúde — {nome}</h1>
          <p className="font-body text-xs text-mauve mt-1">Gerado em {hoje} · organização dos dados registrados pela própria pessoa.</p>
        </div>

        {/* Medicamentos */}
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Medicamentos em uso</h2>
          {medsEmUso.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum medicamento em uso registrado.</p>
          ) : (
            <ul className="space-y-1">
              {medsEmUso.map((m, i) => (
                <li key={i} className="font-body text-sm text-onyx">
                  • <strong>{m.name}</strong>{[m.dose, m.frequency].filter(Boolean).length ? ` — ${[m.dose, m.frequency].filter(Boolean).join(', ')}` : ''}
                  {m.startedOn ? ` (desde ${fmt(m.startedOn)})` : ''}
                </li>
              ))}
            </ul>
          )}
          {medsSusp.length > 0 && (
            <p className="font-body text-xs text-mauve/60 mt-2">Suspensos: {medsSusp.map(m => m.name).join(', ')}.</p>
          )}
        </section>

        {/* Jornada */}
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Consultas, procedimentos e eventos</h2>
          {events.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum evento registrado.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {events.map((e, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="font-body text-xs text-mauve py-1.5 pr-3 whitespace-nowrap align-top">{fmt(e.date)}</td>
                    <td className="font-body text-sm text-onyx py-1.5">
                      <span className="text-mauve/70">{TYPE_LABEL[e.eventType] ?? 'Evento'}:</span> {e.title}
                      {e.notes ? <span className="block text-xs text-mauve/60">{e.notes}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Exames */}
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Exames enviados</h2>
          {exams.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum exame enviado.</p>
          ) : (
            <ul className="space-y-1">
              {exams.map((e, i) => (
                <li key={i} className="font-body text-sm text-onyx">• {fmt(e.date)} — {e.type}</li>
              ))}
            </ul>
          )}
        </section>

        <p className="font-body text-[11px] text-mauve/60 border-t border-border pt-3 leading-relaxed">
          Este relatório organiza os dados informados pela própria pessoa na plataforma SINTERA. <strong>Não é laudo, diagnóstico
          ou parecer</strong> e não substitui avaliação profissional. Destinado a apoiar a conversa com seu profissional de saúde
          (médico, psicólogo, nutricionista, fisioterapeuta, dentista, entre outros).
        </p>
      </div>
    </div>
  )
}
