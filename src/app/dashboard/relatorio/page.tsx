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
import { Loader2, Printer, ArrowLeft, FileText, Share2, Copy, Trash2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', vacina: 'Vacina', procedimento: 'Procedimento',
  estetico: 'Procedimento estético', medicamento: 'Medicamento', exame: 'Exame', outro: 'Evento',
}

interface Med { name: string; kind: string; dose: string | null; frequency: string | null; startedOn: string | null; untilOn: string | null; status: string }
interface Ev { title: string; eventType: string; prof: string | null; date: string; notes: string | null }
interface Ex { type: string; date: string }
interface Measure { metric: string; label: string | null; valueText: string; unit: string | null; date: string }

const METRIC_LABEL: Record<string, string> = {
  peso: 'Peso', altura: 'Altura', pressao_arterial: 'Pressão arterial', circunferencia_cintura: 'Circunferência (cintura)',
  gordura_corporal: 'Gordura corporal', massa_muscular: 'Massa muscular', outro: 'Outra medida',
}
const PROF_LABEL: Record<string, string> = {
  medico: 'Médico(a)', psicologo: 'Psicólogo(a)', nutricionista: 'Nutricionista',
  fisioterapeuta: 'Fisioterapeuta', dentista: 'Dentista', outro: 'Outro profissional',
}

function periodo(start: string | null, until: string | null): string {
  if (start && until) return ` (de ${fmt(start)} até ${fmt(until)})`
  if (start) return ` (desde ${fmt(start)})`
  if (until) return ` (até ${fmt(until)})`
  return ''
}

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
  const [measures, setMeasures] = useState<Measure[]>([])
  const [shares, setShares] = useState<{ id: string; token: string; expiresAt: string }[]>([])
  const [shareBusy, setShareBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [sections, setSections] = useState({ medicamentos: true, eventos: true, exames: true, medidas: true })
  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [medRes, evRes, exRes, mzRes] = await Promise.all([
      db.from('medications').select('name, kind, dose, frequency, started_on, until_date, status').eq('user_id', user.id).order('status'),
      db.from('health_events').select('title, event_type, professional_kind, event_date, notes').eq('user_id', user.id).eq('synthetic', false).order('event_date', { ascending: false }),
      db.from('exams').select('type, exam_date, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('body_metrics').select('metric, label, value_text, unit, measured_on').eq('user_id', user.id).order('measured_on', { ascending: false }),
    ])
    setMeds(((medRes.data ?? []) as Array<Record<string, unknown>>).map(m => ({
      name: m.name as string, kind: (m.kind as string) ?? 'medicamento', dose: (m.dose as string) ?? null, frequency: (m.frequency as string) ?? null,
      startedOn: (m.started_on as string) ?? null, untilOn: (m.until_date as string) ?? null, status: (m.status as string) ?? 'em_uso',
    })))
    setEvents(((evRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      title: e.title as string, eventType: (e.event_type as string) ?? 'outro', prof: (e.professional_kind as string) ?? null,
      date: e.event_date as string, notes: (e.notes as string) ?? null,
    })))
    setExams(((exRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      type: (e.type as string) || 'Exame', date: (e.exam_date as string) || (e.created_at as string),
    })))
    setMeasures(((mzRes.data ?? []) as Array<Record<string, unknown>>).map(m => ({
      metric: (m.metric as string) ?? 'outro', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null, date: m.measured_on as string,
    })))
    const { data: sh } = await db.from('report_shares')
      .select('id, token, expires_at').eq('user_id', user.id).eq('revoked', false)
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
    setShares(((sh ?? []) as Array<Record<string, unknown>>).map(s => ({
      id: s.id as string, token: s.token as string, expiresAt: s.expires_at as string,
    })))
    setLoading(false)
  }, [user, supabase])

  async function createShare() {
    if (!user || shareBusy) return
    setShareBusy(true)
    const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const sel = (Object.keys(sections) as (keyof typeof sections)[]).filter(k => sections[k])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('report_shares').insert({ user_id: user.id, token, expires_at: expires, sections: sel })
    await load()
    setShareBusy(false)
  }

  async function revokeShare(id: string) {
    if (shareBusy) return
    if (!window.confirm('Revogar este link? Quem o tiver não verá mais o relatório.')) return
    setShareBusy(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('report_shares').update({ revoked: true }).eq('id', id)
    await load()
    setShareBusy(false)
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/r/${token}`
    navigator.clipboard?.writeText(url)
    setCopied(token); setTimeout(() => setCopied(null), 1800)
  }

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
          <ArrowLeft size={15} /> Histórico de Saúde
        </Link>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
          <Printer size={15} /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* Compartilhar com profissional — link revogável, somente leitura */}
      <div className="card-premium p-5 mb-6 print:hidden">
        <div className="flex items-center gap-2 mb-2">
          <Share2 size={16} className="text-petal" />
          <h2 className="font-display text-base font-semibold text-onyx">Compartilhar com um profissional</h2>
        </div>
        <p className="font-body text-xs text-mauve leading-relaxed mb-3">
          Gere um link <strong>somente-leitura</strong> e <strong>temporário</strong> (30 dias) deste relatório, para enviar a um profissional de saúde —
          sem precisar dar acesso à sua conta. Você pode <strong>revogar</strong> quando quiser. Ao gerar, você concorda em compartilhar estes dados com quem receber o link.
        </p>
        <button onClick={createShare} disabled={shareBusy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
          <Share2 size={14} /> Gerar link
        </button>
        {shares.length > 0 && (
          <div className="space-y-2 mt-4">
            {shares.map(s => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl border border-border bg-ivory px-3 py-2">
                <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/r/${s.token}`}
                  className="flex-1 min-w-0 bg-transparent font-body text-xs text-mauve outline-none" />
                <button onClick={() => copyLink(s.token)} title="Copiar" className="text-mauve/60 hover:text-petal flex-shrink-0">
                  {copied === s.token ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
                </button>
                <button onClick={() => revokeShare(s.id)} title="Revogar" className="text-mauve/60 hover:text-red-500 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seleção do que mostrar — vale para impressão e link compartilhado */}
      <div className="card-premium p-5 mb-6 print:hidden">
        <p className="font-body text-sm font-semibold text-onyx mb-2">Mostrar no relatório</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {([['medicamentos', 'Medicamentos'], ['eventos', 'Consultas e eventos'], ['exames', 'Exames'], ['medidas', 'Medidas']] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 font-body text-sm text-onyx cursor-pointer">
              <input type="checkbox" checked={sections[k]} onChange={() => toggle(k)} className="accent-petal w-4 h-4" />
              {label}
            </label>
          ))}
        </div>
        <p className="font-body text-[11px] text-mauve/60 mt-2">Marque o que deseja incluir. Vale para a impressão e para o link compartilhado.</p>
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

        {/* Medicamentos e suplementos */}
        {sections.medicamentos && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Medicamentos e suplementos em uso</h2>
          {medsEmUso.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum registrado em uso.</p>
          ) : (
            <ul className="space-y-1">
              {medsEmUso.map((m, i) => (
                <li key={i} className="font-body text-sm text-onyx">
                  • <strong>{m.name}</strong>{m.kind === 'suplemento' ? ' (suplemento)' : ''}{[m.dose, m.frequency].filter(Boolean).length ? ` — ${[m.dose, m.frequency].filter(Boolean).join(', ')}` : ''}
                  {periodo(m.startedOn, m.untilOn)}
                </li>
              ))}
            </ul>
          )}
          {medsSusp.length > 0 && (
            <p className="font-body text-xs text-mauve/60 mt-2">Suspensos: {medsSusp.map(m => m.name).join(', ')}.</p>
          )}
        </section>
        )}

        {/* Jornada */}
        {sections.eventos && (
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
                      <span className="text-mauve/70">{TYPE_LABEL[e.eventType] ?? 'Evento'}{e.prof && PROF_LABEL[e.prof] ? ` (${PROF_LABEL[e.prof]})` : ''}:</span> {e.title}
                      {e.notes ? <span className="block text-xs text-mauve/60">{e.notes}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        )}

        {/* Exames */}
        {sections.exames && (
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
        )}

        {/* Medidas corporais */}
        {sections.medidas && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Medidas corporais</h2>
          {measures.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhuma medida registrada.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {measures.map((m, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="font-body text-xs text-mauve py-1.5 pr-3 whitespace-nowrap align-top">{fmt(m.date)}</td>
                    <td className="font-body text-sm text-onyx py-1.5">
                      <span className="text-mauve/70">{m.metric === 'outro' && m.label ? m.label : METRIC_LABEL[m.metric] ?? 'Medida'}:</span> {m.valueText}{m.unit ? ` ${m.unit}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        )}

        <p className="font-body text-[11px] text-mauve/60 border-t border-border pt-3 leading-relaxed">
          Este relatório organiza os dados informados pela própria pessoa na plataforma SINTERA. <strong>Não é laudo, diagnóstico
          ou parecer</strong> e não substitui avaliação profissional. Destinado a apoiar a conversa com seu profissional de saúde
          (médico, psicólogo, nutricionista, fisioterapeuta, dentista, entre outros).
        </p>
      </div>
    </div>
  )
}
