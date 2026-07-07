'use client'

// ============================================================
// Relatório — compilação factual para levar/enviar ao profissional
// ============================================================
// Reúne, num documento imprimível (Salvar como PDF), os dados que a usuária
// registrou: medicamentos, eventos da jornada (consultas/procedimentos/exames)
// e a lista de exames. ORGANIZAÇÃO FACTUAL — não é laudo, diagnóstico nem
// parecer. Para qualquer profissional de saúde (médico, psicólogo,
// nutricionista, fisioterapeuta, dentista, etc.).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import ReportEntry from '@/components/entry/ReportEntry'
import {
  Loader2, Printer, ArrowLeft, FileText, Share2, Copy, Trash2, Check,
  CalendarDays, FlaskConical, Pill, Stethoscope, HeartPulse, Ruler, Activity, Eye,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { DOMAIN_LABEL, type OmicsDomain } from '@/lib/omics/domains'
import { typeLabel } from '@/lib/agenda' // fonte ÚNICA de rótulos de tipo de evento

interface Med { name: string; kind: string; dose: string | null; frequency: string | null; startedOn: string | null; untilOn: string | null; status: string }
interface Ev { title: string; eventType: string; prof: string | null; date: string; notes: string | null }
interface Ex { type: string; date: string }
interface Measure { metric: string; label: string | null; valueText: string; unit: string | null; date: string }
interface Condition { scope: string; name: string; relative: string | null; since: string | null; notes: string | null }
interface Habit { category: string; description: string; frequency: string | null; notes: string | null }
interface Eyewear {
  kind: string; prescribedOn: string | null; prescriber: string | null
  odSph: string | null; odCyl: string | null; odAxis: string | null; odAdd: string | null
  oeSph: string | null; oeCyl: string | null; oeAxis: string | null; oeAdd: string | null
  dnp: string | null; bc: string | null; dia: string | null
}
const EYEWEAR_LABEL: Record<string, string> = { oculos: 'Óculos', lentes_contato: 'Lentes de contato' }
interface Omics { domain: string; laboratory: string | null; totalFeatures: number | null; date: string | null }
function grauStr(sph: string | null, cyl: string | null, axis: string | null, add: string | null): string {
  return [sph ? `Esf ${sph}` : null, cyl ? `Cil ${cyl}` : null, axis ? `Eixo ${axis}` : null, add ? `Adição ${add}` : null].filter(Boolean).join(', ')
}

const METRIC_LABEL: Record<string, string> = {
  peso: 'Peso', altura: 'Altura', circunferencia_cintura: 'Circunferência (cintura)',
  imc: 'IMC', gordura_corporal: 'Gordura corporal', massa_muscular: 'Massa muscular',
  agua_corporal: 'Água corporal', gordura_visceral: 'Gordura visceral', massa_ossea: 'Massa óssea',
  taxa_metabolica: 'Taxa metabólica basal',
  pressao_arterial: 'Pressão arterial', frequencia_cardiaca: 'Frequência cardíaca', glicemia: 'Glicemia',
  saturacao: 'Saturação (SpO₂)', temperatura: 'Temperatura', outro_sinal: 'Outro sinal',
  outro: 'Outra medida',
}
// Sinais vitais (registrados em body_metrics, separados das medidas corporais).
const VITAL_METRICS = ['pressao_arterial', 'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura', 'outro_sinal']
const isVital = (m: string) => VITAL_METRICS.includes(m)
const HABIT_LABEL: Record<string, string> = {
  atividade_fisica: 'Atividade física', sono: 'Sono', tabagismo: 'Tabagismo',
  alcool: 'Álcool', alimentacao: 'Alimentação', hidratacao: 'Hidratação', outro: 'Outro',
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

// Passo 7 (cutover) — a rota decide legacy × v2 pelo Entry. Default: legacy.
// Flip por página via NEXT_PUBLIC_REPORT_V2=true.
export default function RelatorioRoute() {
  return <ReportEntry legacy={<LegacyReport />} />
}

function LegacyReport() {
  const { user, profile, loading: authLoading } = useUser()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [meds, setMeds] = useState<Med[]>([])
  const [events, setEvents] = useState<Ev[]>([])
  const [exams, setExams] = useState<Ex[]>([])
  const [measures, setMeasures] = useState<Measure[]>([])
  const [conditions, setConditions] = useState<Condition[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [eyewear, setEyewear] = useState<Eyewear[]>([])
  const [omics, setOmics] = useState<Omics[]>([])
  const [shares, setShares] = useState<{ id: string; token: string; expiresAt: string }[]>([])
  const [shareBusy, setShareBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [sections, setSections] = useState({ medicamentos: true, condicoes: true, habitos: true, visao: true, eventos: true, exames: true, omica: true, medidas: true, sinais: true })
  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [medRes, evRes, exRes, mzRes, cdRes, hbRes, ewRes, omRes] = await Promise.all([
      db.from('medications').select('name, kind, dose, frequency, started_on, until_date, status').eq('user_id', user.id).order('status'),
      db.from('health_events').select('title, event_type, professional_kind, event_date, notes').eq('user_id', user.id).eq('synthetic', false).order('event_date', { ascending: false }),
      db.from('exams').select('type, exam_date, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('body_metrics').select('metric, label, value_text, unit, measured_on').eq('user_id', user.id).order('measured_on', { ascending: false }),
      db.from('health_conditions').select('scope, name, relative, since_label, notes').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('life_habits').select('category, description, frequency, notes').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('health_resources').select('name, resource_type, prescriber, started_on, attributes').eq('user_id', user.id).eq('resource_type', 'correcao_visual').order('created_at', { ascending: false }),
      db.from('omics_panels').select('domain, laboratory, total_features, collected_on, created_at').eq('user_id', user.id).order('collected_on', { ascending: false, nullsFirst: false }),
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
    setConditions(((cdRes.data ?? []) as Array<Record<string, unknown>>).map(c => ({
      scope: (c.scope as string) ?? 'propria', name: (c.name as string) ?? '',
      relative: (c.relative as string) ?? null, since: (c.since_label as string) ?? null, notes: (c.notes as string) ?? null,
    })))
    setHabits(((hbRes.data ?? []) as Array<Record<string, unknown>>).map(h => ({
      category: (h.category as string) ?? 'outro', description: (h.description as string) ?? '',
      frequency: (h.frequency as string) ?? null, notes: (h.notes as string) ?? null,
    })))
    setEyewear(((ewRes.data ?? []) as Array<Record<string, unknown>>).map(e => {
      const a = (e.attributes as Record<string, unknown>) ?? {}
      const od = (a.od as Record<string, string>) ?? {}
      const oe = (a.oe as Record<string, string>) ?? {}
      return {
        kind: (a.vision_kind as string) ?? 'oculos', prescribedOn: (e.started_on as string) ?? null, prescriber: (e.prescriber as string) ?? null,
        odSph: od.sph ?? null, odCyl: od.cyl ?? null, odAxis: od.axis ?? null, odAdd: od.add ?? null,
        oeSph: oe.sph ?? null, oeCyl: oe.cyl ?? null, oeAxis: oe.axis ?? null, oeAdd: oe.add ?? null,
        dnp: (a.dnp as string) ?? null, bc: (a.bc as string) ?? null, dia: (a.dia as string) ?? null,
      }
    }))
    setOmics(((omRes.data ?? []) as Array<Record<string, unknown>>).map(o => ({
      domain: (o.domain as string) ?? 'metabolomics', laboratory: (o.laboratory as string) ?? null,
      totalFeatures: (o.total_features as number) ?? null, date: (o.collected_on as string) ?? (o.created_at as string) ?? null,
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  const nome = (profile as { name?: string } | null)?.name ?? user?.email ?? '—'
  const medsEmUso = meds.filter(m => m.status === 'em_uso')
  const medsSusp = meds.filter(m => m.status === 'suspenso')
  const condProprias = conditions.filter(c => c.scope === 'propria')
  const condFamiliar = conditions.filter(c => c.scope === 'familiar')
  const measuresCorpo = measures.filter(m => !isVital(m.metric))
  const measuresVitais = measures.filter(m => isVital(m.metric))
  const alturaCm = (profile as { height_cm?: number | null } | null)?.height_cm ?? null
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  if (loading) {
    return <div className="p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Barra de ações — escondida na impressão */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal">
          <ArrowLeft size={15} /> Painel Inicial
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

      {/* Seleção do que mostrar — segue a mesma estrutura da navegação (sidebar):
          agrupada em Minha Saúde / Acompanhamento, com os mesmos rótulos, ordem e ícones. */}
      <div className="card-premium p-5 mb-6 print:hidden">
        <p className="font-body text-sm font-semibold text-onyx mb-3">Mostrar no relatório</p>
        <div className="space-y-4">
          {([
            ['Acompanhamento', [
              ['eventos', 'Consultas e eventos', CalendarDays],
              ['exames', 'Exames', FileText],
              ['omica', 'Exames de ômica', FlaskConical],
              ['medicamentos', 'Medicamentos e Suplementos', Pill],
            ]],
            ['Minha Saúde', [
              ['condicoes', 'Condições de Saúde', Stethoscope],
              ['visao', 'Recursos de Saúde (óculos e lentes)', Eye],
              ['medidas', 'Medidas Corporais', Ruler],
              ['sinais', 'Sinais Vitais', Activity],
              ['habitos', 'Hábitos', HeartPulse],
            ]],
          ] as const).map(([groupTitle, items]) => (
            <div key={groupTitle}>
              <p className="font-body text-[10px] font-semibold text-mauve/50 uppercase tracking-[0.15em] mb-1.5">{groupTitle}</p>
              <div className="flex flex-col gap-1.5">
                {items.map(([k, label, Icon]) => (
                  <label key={k} className="flex items-center gap-2.5 font-body text-sm text-onyx cursor-pointer">
                    <input type="checkbox" checked={sections[k]} onChange={() => toggle(k)} className="accent-petal w-4 h-4 flex-shrink-0" />
                    <Icon size={15} className="text-petal/70 flex-shrink-0" />
                    <span className="min-w-0">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="font-body text-[11px] text-mauve/60 mt-3">Marque o que deseja incluir. Vale para a impressão e para o link compartilhado.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-8 space-y-6 print:border-0 print:p-0">
        {/* Cabeçalho */}
        <div className="border-b border-border pb-4">
          <div className="inline-flex items-center gap-1.5 text-petal mb-1 print:hidden">
            <FileText size={16} /><span className="font-body text-xs font-medium uppercase tracking-wider">Relatórios</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Relatório — {nome}</h1>
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

        {/* Condições de saúde — próprias + histórico familiar */}
        {sections.condicoes && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Condições de saúde</h2>
          {condProprias.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhuma condição registrada.</p>
          ) : (
            <ul className="space-y-1">
              {condProprias.map((c, i) => (
                <li key={i} className="font-body text-sm text-onyx">
                  • <strong>{c.name}</strong>{c.since ? ` (desde ${c.since})` : ''}
                  {c.notes ? <span className="block text-xs text-mauve/60">{c.notes}</span> : null}
                </li>
              ))}
            </ul>
          )}
          {condFamiliar.length > 0 && (
            <>
              <h3 className="font-body text-xs font-bold text-mauve/80 mt-3 mb-1 uppercase tracking-wider">Histórico familiar</h3>
              <ul className="space-y-1">
                {condFamiliar.map((c, i) => (
                  <li key={i} className="font-body text-sm text-onyx">
                    • <strong>{c.name}</strong>{c.relative ? ` — ${c.relative}` : ''}{c.since ? ` (desde ${c.since})` : ''}
                    {c.notes ? <span className="block text-xs text-mauve/60">{c.notes}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        )}

        {/* Hábitos de vida */}
        {sections.habitos && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Hábitos de vida</h2>
          {habits.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum hábito registrado.</p>
          ) : (
            <ul className="space-y-1">
              {habits.map((h, i) => (
                <li key={i} className="font-body text-sm text-onyx">
                  • <span className="text-mauve/70">{HABIT_LABEL[h.category] ?? 'Hábito'}:</span> {h.description}{h.frequency ? ` — ${h.frequency}` : ''}
                  {h.notes ? <span className="block text-xs text-mauve/60">{h.notes}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {/* Óculos e lentes de contato */}
        {sections.visao && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Óculos e lentes de contato</h2>
          {eyewear.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum registro.</p>
          ) : (
            <ul className="space-y-1.5">
              {eyewear.map((e, i) => {
                const extras = [
                  e.dnp ? `DNP ${e.dnp}` : null, e.bc ? `BC ${e.bc}` : null, e.dia ? `DIA ${e.dia}` : null,
                  e.prescribedOn ? fmt(e.prescribedOn) : null, e.prescriber,
                ].filter(Boolean)
                return (
                  <li key={i} className="font-body text-sm text-onyx">
                    • <strong>{EYEWEAR_LABEL[e.kind] ?? 'Óculos'}</strong>
                    {grauStr(e.odSph, e.odCyl, e.odAxis, e.odAdd) ? <span className="block text-xs text-mauve/70 ml-3">OD: {grauStr(e.odSph, e.odCyl, e.odAxis, e.odAdd)}</span> : null}
                    {grauStr(e.oeSph, e.oeCyl, e.oeAxis, e.oeAdd) ? <span className="block text-xs text-mauve/70 ml-3">OE: {grauStr(e.oeSph, e.oeCyl, e.oeAxis, e.oeAdd)}</span> : null}
                    {extras.length ? <span className="block text-xs text-mauve/60 ml-3">{extras.join(' · ')}</span> : null}
                  </li>
                )
              })}
            </ul>
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
                      <span className="text-mauve/70">{typeLabel(e.eventType)}{e.prof && PROF_LABEL[e.prof] ? ` (${PROF_LABEL[e.prof]})` : ''}:</span> {e.title}
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

        {/* Exames de ômica */}
        {sections.omica && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Exames de ômica</h2>
          {omics.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum exame de ômica registrado.</p>
          ) : (
            <ul className="space-y-1">
              {omics.map((o, i) => (
                <li key={i} className="font-body text-sm text-onyx">
                  • {o.date ? `${fmt(o.date)} — ` : ''}<strong>{DOMAIN_LABEL[o.domain as OmicsDomain] ?? 'Ômica'}</strong>
                  {[o.laboratory, o.totalFeatures != null ? `${o.totalFeatures.toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).length
                    ? ` (${[o.laboratory, o.totalFeatures != null ? `${o.totalFeatures.toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).join(', ')})` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {/* Medidas corporais */}
        {sections.medidas && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Medidas corporais</h2>
          {alturaCm != null && (
            <p className="font-body text-sm text-onyx mb-1"><span className="text-mauve/70">Altura:</span> {alturaCm} cm</p>
          )}
          {measuresCorpo.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">{alturaCm != null ? 'Sem outras medidas registradas.' : 'Nenhuma medida registrada.'}</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {measuresCorpo.map((m, i) => (
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

        {/* Sinais vitais */}
        {sections.sinais && (
        <section>
          <h2 className="font-body text-sm font-bold text-onyx mb-2">Sinais vitais</h2>
          {measuresVitais.length === 0 ? (
            <p className="font-body text-sm text-mauve/60">Nenhum sinal vital registrado.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {measuresVitais.map((m, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="font-body text-xs text-mauve py-1.5 pr-3 whitespace-nowrap align-top">{fmt(m.date)}</td>
                    <td className="font-body text-sm text-onyx py-1.5">
                      <span className="text-mauve/70">{m.metric === 'outro_sinal' && m.label ? m.label : METRIC_LABEL[m.metric] ?? 'Sinal'}:</span> {m.valueText}{m.unit ? ` ${m.unit}` : ''}
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
