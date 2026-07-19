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

import { useCallback, useEffect, useState, type ElementType } from 'react'
import Link from 'next/link'
import ReportEntry from '@/components/entry/ReportEntry'
import Disclaimer from '@/components/ui/Disclaimer'
import ConfirmDialog from '@/components/ConfirmDialog'
import ProvenanceLine from '@/components/ui/ProvenanceLine'
import SelectionToolbar from '@/components/ui/SelectionToolbar'
import PeriodSelector from '@/components/ui/PeriodSelector'
import { examProvenance, resourceProvenance } from '@/lib/provenance'
import { type Period, resolvePeriod, inPeriod, overlapsPeriod, periodLabel } from '@/lib/communication/period'
import ViewModeSwitcher from '@/components/ViewModeSwitcher'
import Card from '@/components/ui/Card'
import { applySort, type SortSpec } from '@/lib/listview'
import {
  Loader2, Printer, ArrowLeft, FileText, Share2, Copy, Trash2, Check,
  CalendarDays, FlaskConical, Pill, Stethoscope, HeartPulse, Ruler, Activity, Eye,
  ChevronDown, Minus, Droplet, Receipt, Leaf, Clock, TrendingUp, TrendingDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { assembleOrganizedBiomarkers } from '@/lib/ai/insights/assembler'
import { summarizeBiomarkers, type BiomarkerSummary, type BiomarkerRow } from '@/lib/biomarkers/grouping'
import { useUser } from '@/context/UserContext'
import { DOMAIN_LABEL, type OmicsDomain } from '@/lib/omics/domains'
import { typeLabel, professionalKindLabel, type HealthEvent } from '@/lib/agenda' // fonte ÚNICA de rótulos de tipo/profissional
import { useEventForm } from '@/components/eventForm' // serviço de domínio (query.listFinancial = Despesas)
import { contraceptiveLabel } from '@/lib/cycle'       // SSOT dos métodos contraceptivos
import { todayISO as currentISO } from '@/lib/date'    // SSOT dos cálculos de data

interface Med { name: string; kind: string; dose: string | null; frequency: string | null; startedOn: string | null; untilOn: string | null; status: string }
interface Ev { title: string; eventType: string; prof: string | null; date: string; notes: string | null; status: string }
interface Ex { id: string; type: string; date: string; fileUrl: string | null }
interface Measure { metric: string; label: string | null; valueText: string; unit: string | null; date: string; examId: string | null }
interface Condition { scope: string; name: string; relative: string | null; since: string | null; notes: string | null }
interface Habit { category: string; description: string; frequency: string | null; notes: string | null }
interface Eyewear {
  kind: string; prescribedOn: string | null; prescriber: string | null
  odSph: string | null; odCyl: string | null; odAxis: string | null; odAdd: string | null
  oeSph: string | null; oeCyl: string | null; oeAxis: string | null; oeAdd: string | null
  dnp: string | null; bc: string | null; dia: string | null; fileUrl: string | null
}
const EYEWEAR_LABEL: Record<string, string> = { oculos: 'Óculos', lentes_contato: 'Lentes de contato' }
interface Omics { domain: string; laboratory: string | null; totalFeatures: number | null; date: string | null }
interface Contraceptive { kind: string; brand: string | null; startedOn: string | null; replaceOn: string | null; status: string }
interface Menstruation { startedOn: string; notes: string | null }
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

// Faixa divisória de GRUPO no corpo do relatório (espelha os grupos do menu:
// Acompanhamento · Minha Saúde · Organização) — dá identidade visual às seções.
function ReportBand({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 pt-2" role="presentation">
      <span className="h-px flex-1 bg-petal/25" aria-hidden="true" />
      <span className="font-display text-xs font-bold uppercase tracking-[0.25em] text-petal whitespace-nowrap">{children}</span>
      <span className="h-px flex-1 bg-petal/25" aria-hidden="true" />
    </div>
  )
}

// Passo 7 (cutover) — a rota decide legacy × v2 pelo Entry. Default: legacy.
// Flip por página via NEXT_PUBLIC_REPORT_V2=true.
export default function RelatorioRoute() {
  return <ReportEntry legacy={<LegacyReport />} />
}

function LegacyReport() {
  const { user, profile, loading: authLoading } = useUser()
  const supabase = createClient()
  const { services } = useEventForm() // Despesas = projeção financeira dos eventos (mesmo serviço do módulo Gastos)
  const [loading, setLoading] = useState(true)
  const [meds, setMeds] = useState<Med[]>([])
  const [events, setEvents] = useState<Ev[]>([])
  const [exams, setExams] = useState<Ex[]>([])
  const [measures, setMeasures] = useState<Measure[]>([])
  const [conditions, setConditions] = useState<Condition[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [eyewear, setEyewear] = useState<Eyewear[]>([])
  const [omics, setOmics] = useState<Omics[]>([])
  const [contraceptives, setContraceptives] = useState<Contraceptive[]>([])
  const [menstruations, setMenstruations] = useState<Menstruation[]>([])
  const [expenses, setExpenses] = useState<HealthEvent[]>([])
  const [shares, setShares] = useState<{ id: string; token: string; expiresAt: string }[]>([])
  const [shareBusy, setShareBusy] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [sections, setSections] = useState({ medicamentos: true, suplementos: true, condicoes: true, habitos: true, visao: true, eventos: true, registros: true, histexames: true, exames: true, omica: true, medidas: true, sinais: true, ciclo: true, gastos: true })
  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))
  // Filtro temporal (capacidade transversal da Camada de Comunicação).
  const [period, setPeriod] = useState<Period>({ preset: 'all' })
  const [examSort, setExamSort] = useState('data')   // ordenação via @/lib/listview
  // Perfis de Comunicação personalizados (report_templates).
  const [templates, setTemplates] = useState<{ id: string; name: string; selection: Record<string, unknown> }[]>([])
  const [tplName, setTplName] = useState('')
  const [configOpen, setConfigOpen] = useState(false)   // "Configurações de relatório" (discreto)
  // Síntese factual dos biomarcadores ORGANIZADOS (TEMA C) — consome o SSOT único.
  // Consumidor INTERNO chama o serviço de DOMÍNIO direto (sem hop HTTP): o
  // Assembler é isomórfico e a RLS do client autenticado protege os dados. A rota
  // /api/biomarkers/organized permanece apenas como adaptador p/ consumidores
  // externos. A tela não reagrupa; só exibe o resumo.
  const [bioOrg, setBioOrg] = useState<{ total: number; categories: number; outOfRange: number } | null>(null)
  // A2 — Histórico de Exames: resumo LONGITUDINAL por indicador (último valor · tendência · última realização).
  // Reutiliza a mesma view/summarize de /dashboard/saude (não reagrupa). Factual (RDC 657).
  const [bioSummaries, setBioSummaries] = useState<BiomarkerSummary[]>([])
  useEffect(() => {
    if (!user?.id) return
    let alive = true
    assembleOrganizedBiomarkers(supabase, { userId: user.id })
      .then(org => {
        if (alive) setBioOrg({ total: org.counts.total, categories: org.counts.categories, outOfRange: org.counts.outOfRange })
      })
      .catch(() => { /* silencioso — o resumo funciona sem a síntese */ })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('current_biomarkers')
      .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,reference_source,catalog_id,source_material,source_exam_name,exam_id,exams(exam_date,created_at)')
      .eq('user_id', user.id).eq('synthetic', false).eq('result_type', 'numeric')
      .then((res: { data: unknown[] | null }) => {
        if (alive && res.data) setBioSummaries(summarizeBiomarkers(res.data as BiomarkerRow[]))
      })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Árvore de seleção = espelho do menu lateral (UX-001): grupos expansíveis,
  // seleção por grupo (tri-state) e por item. Mesma ordem/nomenclatura da sidebar.
  type SectionKey = keyof typeof sections
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})   // 3º nível (itens de Exames/Medicamentos)
  const [excluded, setExcluded] = useState<Record<string, Set<string>>>({})        // itens desmarcados por seção
  const setGroup = (keys: SectionKey[], on: boolean) =>
    setSections(s => { const n = { ...s }; keys.forEach(k => { n[k] = on }); return n })
  // Seções com seleção item a item: Exames, Medicamentos e Agenda (por TIPO de evento
  // — consulta/exame/procedimento/vacina/cirurgia… — granularidade máxima sem inventar
  // módulos que não existem no domínio; "Agenda" é UMA entidade, os tipos são seus itens).
  const hasItems = (k: SectionKey): boolean => k === 'exames' || k === 'medicamentos' || k === 'eventos'
  const sectionItems = (k: SectionKey): { key: string; label: string }[] => {
    if (k === 'exames') return exams.map(e => ({ key: `${e.type}__${e.date}`, label: `${fmt(e.date)} — ${e.type}` }))
    if (k === 'medicamentos') return meds.map(m => ({ key: m.name, label: m.name + (m.status === 'suspenso' ? ' (suspenso)' : '') }))
    if (k === 'eventos') {
      const seen = new Set<string>()
      const out: { key: string; label: string }[] = []
      for (const e of events) if (!seen.has(e.eventType)) { seen.add(e.eventType); out.push({ key: e.eventType, label: typeLabel(e.eventType) }) }
      return out.sort((a, b) => a.label.localeCompare(b.label))
    }
    return []
  }
  const isItemOn = (k: string, key: string): boolean => !(excluded[k]?.has(key))
  const toggleItem = (k: string, key: string) =>
    setExcluded(e => { const s = new Set(e[k] ?? []); if (s.has(key)) s.delete(key); else s.add(key); return { ...e, [k]: s } })
  // Espelho da Sidebar (FB-010): mesma taxonomia por domínio. Acompanhamento (Agenda, Composição Corporal,
  // Monitoramento) · Documentos (Exames, ômica) · Minha Saúde (Condições, Medicamentos, Recursos, Hábitos,
  // Ciclo) · Organização (Despesas). Qualquer mudança na Sidebar deve refletir aqui.
  const SELECT_GROUPS: { title: string; items: [SectionKey, string, ElementType][] }[] = [
    { title: 'Acompanhamento', items: [
      ['eventos', 'Agenda', CalendarDays],
      ['registros', 'Histórico de Saúde', Clock],
      ['histexames', 'Histórico de Exames', TrendingUp],
      ['medidas', 'Composição Corporal', Ruler],
      ['sinais', 'Monitoramento', Activity],
    ] },
    { title: 'Documentos', items: [
      ['exames', 'Exames', FileText],
      ['omica', 'Exames de ômica', FlaskConical],
    ] },
    { title: 'Minha Saúde', items: [
      ['condicoes', 'Condições de Saúde', Stethoscope],
      ['medicamentos', 'Medicamentos', Pill],
      ['suplementos', 'Suplementos', Leaf],
      ['visao', 'Recursos de Saúde', Eye],
      ['habitos', 'Hábitos', HeartPulse],
      ['ciclo', 'Ciclo e Contracepção', Droplet],
    ] },
    { title: 'Organização', items: [
      ['gastos', 'Despesas', Receipt],
    ] },
  ]
  // Comandos de seleção (via SelectionToolbar reutilizável).
  const DEFAULT_SECTIONS = { medicamentos: true, suplementos: true, condicoes: true, habitos: true, visao: true, eventos: true, registros: true, histexames: true, exames: true, omica: true, medidas: true, sinais: true, ciclo: true, gastos: true }
  const allSections = (v: boolean) => Object.fromEntries(Object.keys(sections).map(k => [k, v])) as typeof sections
  const selectAllSections = () => { setSections(allSections(true)); setExcluded({}) }
  const clearSections = () => setSections(allSections(false))
  const resetSections = () => { setSections({ ...DEFAULT_SECTIONS }); setExcluded({}) }
  const expandAll = () => { setOpenGroups(Object.fromEntries(SELECT_GROUPS.map(g => [g.title, true]))); setOpenSections({ exames: true, medicamentos: true, eventos: true }) }
  const collapseAll = () => { setOpenGroups(Object.fromEntries(SELECT_GROUPS.map(g => [g.title, false]))); setOpenSections({}) }

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [medRes, evAll, exRes, mzRes, cdRes, hbRes, ewRes, omRes, ccRes, mpRes, finRes] = await Promise.all([
      db.from('medications').select('name, kind, dose, frequency, started_on, until_date, status').eq('user_id', user.id).order('status'),
      // EVT-C1 (NC-0013/0014): leitura ÚNICA pelo contrato canônico — inclui eventos legados + canônicos (dedup).
      services.query.listAll(user.id),
      db.from('exams').select('id, type, exam_date, created_at, file_url').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('body_metrics').select('metric, label, value_text, unit, measured_on, exam_id').eq('user_id', user.id).order('measured_on', { ascending: false }),
      db.from('health_conditions').select('scope, name, relative, since_label, notes').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('life_habits').select('category, description, frequency, notes').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('health_resources').select('name, resource_type, prescriber, started_on, attributes, file_url').eq('user_id', user.id).eq('resource_type', 'correcao_visual').order('created_at', { ascending: false }),
      db.from('omics_panels').select('domain, laboratory, total_features, collected_on, created_at').eq('user_id', user.id).order('collected_on', { ascending: false, nullsFirst: false }),
      db.from('contraceptive_methods').select('kind, brand, started_on, replace_on, status').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('menstrual_periods').select('started_on, notes').eq('user_id', user.id).order('started_on', { ascending: false }).limit(24),
      services.query.listFinancial(user.id), // Despesas = eventos realizados com valor pago (mesma fonte do módulo Gastos)
    ])
    setMeds(((medRes.data ?? []) as Array<Record<string, unknown>>).map(m => ({
      name: m.name as string, kind: (m.kind as string) ?? 'medicamento', dose: (m.dose as string) ?? null, frequency: (m.frequency as string) ?? null,
      startedOn: (m.started_on as string) ?? null, untilOn: (m.until_date as string) ?? null, status: (m.status as string) ?? 'em_uso',
    })))
    setEvents([...evAll]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))   // mais recentes primeiro (como antes)
      .map(e => ({
        title: e.title, eventType: e.type ?? 'outro', prof: e.professionalKind ?? null,
        date: e.date, notes: e.notes ?? null, status: e.status ?? 'planejado',
      })))
    setExams(((exRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      id: e.id as string, type: (e.type as string) || 'Exame', date: (e.exam_date as string) || (e.created_at as string),
      fileUrl: (e.file_url as string) ?? null,
    })))
    setMeasures(((mzRes.data ?? []) as Array<Record<string, unknown>>).map(m => ({
      metric: (m.metric as string) ?? 'outro', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null, date: m.measured_on as string,
      examId: (m.exam_id as string) ?? null,
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
        fileUrl: (e.file_url as string) ?? null,
      }
    }))
    setOmics(((omRes.data ?? []) as Array<Record<string, unknown>>).map(o => ({
      domain: (o.domain as string) ?? 'metabolomics', laboratory: (o.laboratory as string) ?? null,
      totalFeatures: (o.total_features as number) ?? null, date: (o.collected_on as string) ?? (o.created_at as string) ?? null,
    })))
    setContraceptives(((ccRes.data ?? []) as Array<Record<string, unknown>>).map(c => ({
      kind: (c.kind as string) ?? 'outro', brand: (c.brand as string) ?? null,
      startedOn: (c.started_on as string) ?? null, replaceOn: (c.replace_on as string) ?? null, status: (c.status as string) ?? 'ativo',
    })))
    setMenstruations(((mpRes.data ?? []) as Array<Record<string, unknown>>).map(p => ({
      startedOn: p.started_on as string, notes: (p.notes as string) ?? null,
    })))
    setExpenses((finRes ?? []) as HealthEvent[])
    const { data: sh } = await db.from('report_shares')
      .select('id, token, expires_at').eq('user_id', user.id).eq('revoked', false)
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
    setShares(((sh ?? []) as Array<Record<string, unknown>>).map(s => ({
      id: s.id as string, token: s.token as string, expiresAt: s.expires_at as string,
    })))
    const { data: tpls } = await db.from('report_templates')
      .select('id, name, selection').eq('user_id', user.id).order('created_at', { ascending: false })
    setTemplates(((tpls ?? []) as Array<Record<string, unknown>>).map(t => ({
      id: t.id as string, name: t.name as string, selection: (t.selection as Record<string, unknown>) ?? {},
    })))
    setLoading(false)
  }, [user, supabase, services])

  async function createShare() {
    if (!user || shareBusy) return
    setShareBusy(true)
    const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const sel = (Object.keys(sections) as (keyof typeof sections)[]).filter(k => sections[k])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('report_shares').insert({ user_id: user.id, token, expires_at: expires, sections: sel, period })
    await load()
    setShareBusy(false)
  }

  function revokeShare(id: string) {
    if (shareBusy) return
    setConfirm({ message: 'Revogar este link? Quem o tiver não verá mais o relatório.', confirmLabel: 'Revogar', onYes: async () => {
      setShareBusy(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('report_shares').update({ revoked: true }).eq('id', id)
      await load()
      setShareBusy(false)
    } })
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
  // Aplicam a seleção item a item ao relatório exibido/impresso (PDF). O PERÍODO
  // propaga ao link (/r/[token], persistido no share); a exclusão item a item no
  // link é refinamento futuro (seção-nível e período já propagam).
  // FB-010 — Medicamentos e Suplementos separados (espelho da Sidebar). Mesma tabela (`medications.kind`);
  // Medicamentos = tudo que NÃO é suplemento; Suplementos = kind='suplemento'.
  const isSup = (m: Med) => m.kind === 'suplemento'
  const visMedsEmUso = medsEmUso.filter(m => !isSup(m) && isItemOn('medicamentos', m.name))
  const visMedsSusp = medsSusp.filter(m => !isSup(m) && isItemOn('medicamentos', m.name))
  const visSupEmUso = medsEmUso.filter(m => isSup(m) && isItemOn('suplementos', m.name))
  const visSupSusp = medsSusp.filter(m => isSup(m) && isItemOn('suplementos', m.name))
  const visExams = exams.filter(e => isItemOn('exames', `${e.type}__${e.date}`))
  // Faixas de grupo (espelham a Sidebar, FB-010): exibidas se houver ao menos uma seção do grupo.
  const showAcompanhamento = sections.eventos || sections.registros || sections.histexames || sections.medidas || sections.sinais
  const showDocumentos = sections.exames || sections.omica
  const showMinhaSaude = sections.condicoes || sections.medicamentos || sections.suplementos || sections.visao || sections.habitos || sections.ciclo
  const showOrganizacao = sections.gastos
  const condProprias = conditions.filter(c => c.scope === 'propria')
  const condFamiliar = conditions.filter(c => c.scope === 'familiar')
  const measuresCorpo = measures.filter(m => !isVital(m.metric))
  const measuresVitais = measures.filter(m => isVital(m.metric))
  // Aplica o período aos módulos TEMPORAIS (eventos/exames/ômica/medidas/sinais e
  // medicamentos suspensos por sobreposição). Estados atuais (condições, meds em
  // uso, recursos, hábitos) aparecem independentemente do período.
  const rp = resolvePeriod(period)
  // Agenda: aplica período E a seleção por TIPO de evento (item a item).
  const perEvents = events.filter(e => inPeriod(e.date, rp) && isItemOn('eventos', e.eventType))
  // Separação DEFINITIVA Agenda × Histórico (mesma regra do módulo Histórico/timeline):
  // Agenda = futuro ainda planejado; Histórico = já aconteceu (realizado/cancelado, ou passado).
  const today = currentISO()   // SSOT @/lib/date
  const isAgendaEvent = (e: Ev) => e.date.slice(0, 10) >= today && e.status !== 'realizado' && e.status !== 'cancelado'
  const perAgenda = perEvents.filter(isAgendaEvent)
  const perHistorico = perEvents.filter(e => !isAgendaEvent(e))
  const perOmics = omics.filter(o => inPeriod(o.date, rp))
  const perMeasuresCorpo = measuresCorpo.filter(m => inPeriod(m.date, rp))
  const perMeasuresVitais = measuresVitais.filter(m => inPeriod(m.date, rp))
  const perVisExams = visExams.filter(e => inPeriod(e.date, rp))
  const perMedsSusp = visMedsSusp.filter(m => overlapsPeriod(m.startedOn, m.untilOn, rp))
  const perSupSusp = visSupSusp.filter(m => overlapsPeriod(m.startedOn, m.untilOn, rp))
  const perExpenses = expenses.filter(x => inPeriod(x.date, rp))       // Despesas (temporal)
  const perMenstruations = menstruations.filter(m => inPeriod(m.startedOn, rp)) // Ciclo — menstruação (temporal)
  // Métodos contraceptivos = estado atual (independentes do período, como condições/meds em uso).
  // Ordenação de Exames — declara a config; a mecânica é a infra comum (listview).
  const EXAM_SORTS: SortSpec<Ex>[] = [
    { key: 'data', label: 'Por data', compare: (a, b) => (b.date ?? '').localeCompare(a.date ?? '') },
    { key: 'tipo', label: 'Por tipo', compare: (a, b) => (a.type ?? '').localeCompare(b.type ?? '') },
  ]
  const sortedExams = applySort(perVisExams, EXAM_SORTS, examSort)

  // Configurações de relatório (salvas): salvar/aplicar/excluir (personalizadas).
  const currentConfig = () => ({
    sections,
    excluded: Object.fromEntries(Object.entries(excluded).map(([k, v]) => [k, [...v]])),
    period,
  })
  const applyConfig = (cfg: Record<string, unknown>) => {
    // Merge com o estado atual: templates salvos antes da separação Agenda×Histórico de Saúde não têm
    // 'registros' — sem o merge, a nova seção ficaria oculta. Chaves ausentes herdam o default (on).
    if (cfg.sections) setSections(s => ({ ...s, ...(cfg.sections as Partial<typeof sections>) }))
    setExcluded(Object.fromEntries(Object.entries((cfg.excluded as Record<string, string[]>) ?? {}).map(([k, v]) => [k, new Set(v)])))
    if (cfg.period) setPeriod(cfg.period as Period)
  }
  async function saveTemplate() {
    if (!user || !tplName.trim()) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('report_templates').insert({ user_id: user.id, name: tplName.trim(), selection: currentConfig() })
    setTplName(''); await load()
  }
  async function deleteTemplate(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('report_templates').delete().eq('id', id)
    await load()
  }

  // Resumo/tamanho — o que está incluído (seções selecionadas, dentro do período).
  const resumoItems = [
    sections.eventos && { label: 'agenda', n: perAgenda.length },
    sections.registros && { label: 'histórico de saúde', n: perHistorico.length },
    sections.histexames && { label: 'histórico de exames', n: bioSummaries.length },
    sections.exames && { label: 'exames', n: perVisExams.length },
    sections.omica && { label: 'ômica', n: perOmics.length },
    sections.medicamentos && { label: 'medicamentos', n: visMedsEmUso.length + perMedsSusp.length },
    sections.suplementos && { label: 'suplementos', n: visSupEmUso.length + perSupSusp.length },
    sections.condicoes && { label: 'condições', n: condProprias.length + condFamiliar.length },
    sections.visao && { label: 'recursos', n: eyewear.length },
    sections.medidas && { label: 'medidas', n: perMeasuresCorpo.length },
    sections.sinais && { label: 'sinais vitais', n: perMeasuresVitais.length },
    sections.habitos && { label: 'hábitos', n: habits.length },
    sections.ciclo && { label: 'ciclo', n: contraceptives.length + perMenstruations.length },
    sections.gastos && { label: 'despesas', n: perExpenses.length },
  ].filter((x): x is { label: string; n: number } => !!x && x.n > 0)
  const totalRegistros = resumoItems.reduce((s, r) => s + r.n, 0)
  const lastUpdate = ([
    ...perEvents.map(e => e.date), ...perVisExams.map(e => e.date), ...perOmics.map(o => o.date),
    ...perMeasuresCorpo.map(m => m.date), ...perMeasuresVitais.map(m => m.date),
  ].filter(Boolean) as string[]).sort().slice(-1)[0] ?? null
  const alturaCm = (profile as { height_cm?: number | null } | null)?.height_cm ?? null
  // Resumo antropométrico (estado atual): peso mais recente + altura do perfil + IMC calculado.
  // Ignora o período (é snapshot atual, como condições/itens em uso). IMC = só aritmética, sem juízo.
  const examById = new Map(exams.map(e => [e.id, e]))
  const latestPeso = measuresCorpo.find(m => m.metric === 'peso') ?? null
  const pesoNum = latestPeso ? parseFloat(String(latestPeso.valueText).replace(',', '.')) : NaN
  const imcVal = !Number.isNaN(pesoNum) && alturaCm ? pesoNum / Math.pow(alturaCm / 100, 2) : null
  // Laudos vinculados às medidas (ex.: bioimpedância): mostramos o DOCUMENTO (nome +
  // data + link), como em Exames, em vez de discriminar cada métrica. Dedup por exame.
  const medLaudos = Array.from(new Set(perMeasuresCorpo.map(m => m.examId).filter(Boolean) as string[]))
    .map(id => examById.get(id)).filter((e): e is Ex => !!e)
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const brl = (cents: number | null) => `R$ ${((cents ?? 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
      <Card padding="md" className="mb-6 print:hidden">
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
                <input readOnly aria-label="Link de compartilhamento do relatório" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/r/${s.token}`}
                  className="flex-1 min-w-0 bg-transparent font-body text-xs text-mauve outline-none" />
                <button onClick={() => copyLink(s.token)} title="Copiar" className="text-mauve hover:text-petal flex-shrink-0">
                  {copied === s.token ? <Check size={14} className="text-petal" /> : <Copy size={14} />}
                </button>
                <button onClick={() => revokeShare(s.id)} title="Revogar" className="text-mauve hover:text-red-500 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Período — parâmetro da Camada de Comunicação (aplica a todos os módulos temporais) */}
      <Card padding="md" className="mb-6 print:hidden">
        <p className="font-body text-sm font-semibold text-onyx mb-3">Período</p>
        <PeriodSelector period={period} onChange={setPeriod} />
        <p className="font-body text-[11px] text-mauve mt-3">Recorte aplicado ao relatório, à impressão/PDF e ao link compartilhado. Condições atuais e itens em uso aparecem independentemente do período.</p>
      </Card>

      {/* Seleção = árvore do menu lateral (UX-001): grupos expansíveis, seleção por
          grupo (tri-state) e por item, com a mesma ordem, nomenclatura e ícones. */}
      <Card padding="md" className="mb-6 print:hidden">
        <p className="font-body text-sm font-semibold text-onyx mb-2">Mostrar no relatório</p>
        <SelectionToolbar className="mb-3"
          onSelectAll={selectAllSections} onClear={clearSections} onReset={resetSections}
          onExpandAll={expandAll} onCollapseAll={collapseAll} />
        <div className="space-y-2">
          {SELECT_GROUPS.map(group => {
            const keys = group.items.map(i => i[0])
            const sel = keys.filter(k => sections[k]).length
            const groupState = sel === 0 ? 'none' : sel === keys.length ? 'all' : 'some'
            const open = openGroups[group.title] ?? true
            return (
              <div key={group.title} className="rounded-xl border border-border/60 overflow-hidden">
                {/* Cabeçalho do grupo: expandir/recolher + seleção do grupo (tri-state) */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-ivory/40">
                  <button type="button" onClick={() => setOpenGroups(g => ({ ...g, [group.title]: !open }))}
                    aria-label={open ? 'Recolher' : 'Expandir'} aria-expanded={open}
                    className="text-mauve hover:text-petal transition-colors flex-shrink-0">
                    <ChevronDown size={16} className="transition-transform" style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
                  </button>
                  <button type="button" onClick={() => setGroup(keys, groupState !== 'all')}
                    aria-label={`Selecionar ${group.title}`}
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      groupState === 'none' ? 'border-border bg-white' : 'border-petal bg-petal'}`}>
                    {groupState === 'all' && <Check size={11} className="text-white" />}
                    {groupState === 'some' && <Minus size={11} className="text-white" />}
                  </button>
                  <span className="font-body text-[11px] font-semibold text-mauve uppercase tracking-wider flex-1 min-w-0">{group.title}</span>
                  <span className="font-body text-[11px] text-mauve flex-shrink-0 tabular-nums">{sel}/{keys.length}</span>
                </div>
                {/* Itens do grupo (módulos) — Exames/Medicamentos abrem seleção item a item */}
                {open && (
                  <div className="flex flex-col gap-0.5 px-3 py-2 pl-9">
                    {group.items.map(([k, label, Icon]) => {
                      const withItems = hasItems(k)
                      const items = withItems ? sectionItems(k) : []
                      const secOpen = openSections[k] ?? false
                      const onCount = items.filter(it => isItemOn(k, it.key)).length
                      return (
                        <div key={k}>
                          <div className="flex items-center gap-2 py-0.5">
                            {withItems ? (
                              <button type="button" onClick={() => setOpenSections(o => ({ ...o, [k]: !secOpen }))}
                                aria-label={secOpen ? 'Recolher itens' : 'Expandir itens'} aria-expanded={secOpen}
                                className="text-mauve/40 hover:text-petal transition-colors flex-shrink-0">
                                <ChevronDown size={13} className="transition-transform" style={{ transform: secOpen ? 'none' : 'rotate(-90deg)' }} />
                              </button>
                            ) : <span className="w-[13px] flex-shrink-0" aria-hidden="true" />}
                            <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                              <input type="checkbox" checked={sections[k]} onChange={() => toggle(k)} className="accent-petal w-4 h-4 flex-shrink-0" />
                              <Icon size={15} className="text-petal/70 flex-shrink-0" />
                              <span className="min-w-0 break-words font-body text-sm text-onyx">{label}</span>
                            </label>
                            {withItems && sections[k] && items.length > 0 && (
                              <span className="font-body text-[11px] text-mauve flex-shrink-0 tabular-nums">{onCount}/{items.length}</span>
                            )}
                          </div>
                          {withItems && sections[k] && secOpen && (
                            <div className="flex flex-col gap-0.5 pl-[3.4rem] pb-1">
                              {items.length === 0
                                ? <span className="font-body text-xs text-mauve">Nenhum registro.</span>
                                : items.map(it => (
                                    <label key={it.key} className="flex items-center gap-2 font-body text-[13px] text-onyx/90 cursor-pointer">
                                      <input type="checkbox" checked={isItemOn(k, it.key)} onChange={() => toggleItem(k, it.key)} className="accent-petal w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="min-w-0 break-words">{it.label}</span>
                                    </label>
                                  ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="font-body text-[11px] text-mauve mt-3">Marque o que deseja incluir. Vale para a impressão e para o link compartilhado.</p>
      </Card>

      {/* Configurações de relatório — salvar/reutilizar (discreto, recolhido por padrão) */}
      <Card padding="sm" className="mb-6 print:hidden">
        <button type="button" onClick={() => setConfigOpen(o => !o)} aria-expanded={configOpen} className="w-full flex items-center justify-between gap-2 text-left">
          <div className="min-w-0">
            <p className="font-body text-sm font-semibold text-onyx">Configurações de relatório</p>
            <p className="font-body text-[11px] text-mauve">Salve esta configuração (seções, itens e período) para reutilizar depois{templates.length > 0 ? ` · ${templates.length} salva${templates.length > 1 ? 's' : ''}` : ''}.</p>
          </div>
          <ChevronDown size={16} className="text-mauve flex-shrink-0 transition-transform" style={{ transform: configOpen ? 'none' : 'rotate(-90deg)' }} />
        </button>
        {configOpen && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            {templates.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => applyConfig(t.selection)}
                      className="flex-1 min-w-0 truncate text-left font-body text-xs rounded-full px-3 py-1 border border-petal/30 text-petal bg-blush/40 hover:bg-blush transition-colors">
                      {t.name}
                    </button>
                    <button type="button" onClick={() => deleteTemplate(t.id)} title="Remover"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" aria-label="Nome da configuração de relatório" value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Ex.: Consulta endócrino, Viagem…"
                className="flex-1 min-w-0 px-3 py-1.5 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <button type="button" onClick={saveTemplate} disabled={!tplName.trim()}
                className="px-3 py-1.5 rounded-full gradient-sintera text-white font-body text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0">
                Salvar configuração
              </button>
            </div>
          </div>
        )}
      </Card>

      <div className="bg-white rounded-2xl border border-border p-5 sm:p-8 space-y-6 print:border-0 print:p-0">
        {/* Cabeçalho */}
        <div className="border-b border-border pb-4">
          <h1 className="font-display text-2xl font-semibold text-onyx">Relatório</h1>
          <p className="font-body text-sm text-mauve mt-1">A SINTERA reúne seus exames, medicamentos e consultas num relatório pronto para o seu médico.</p>
          <p className="font-body text-xs text-mauve mt-1.5">{nome} · Gerado em {hoje}</p>
        </div>

        {/* Resumo do relatório — cabeçalho executivo, totalmente factual (RDC 657) */}
        <div className="rounded-2xl border border-border bg-ivory/40 p-4 sm:p-5">
          <p className="font-display text-sm font-semibold text-onyx mb-1">Resumo do relatório</p>
          <p className="font-body text-xs font-semibold text-petal mb-2.5">Período considerado neste relatório: {periodLabel(period)}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-body text-xs text-onyx">
            <p><span className="text-mauve">Registros incluídos:</span> <strong>{totalRegistros}</strong></p>
            {sections.exames && <p><span className="text-mauve">Exames:</span> {perVisExams.length}</p>}
            {sections.eventos && <p><span className="text-mauve">Agenda (previstos):</span> {perAgenda.length}</p>}
            {sections.registros && <p><span className="text-mauve">Histórico de Saúde (realizados):</span> {perHistorico.length}</p>}
            {sections.histexames && bioSummaries.length > 0 && <p><span className="text-mauve">Histórico de Exames (indicadores):</span> {bioSummaries.length}</p>}
            {sections.medicamentos && <p><span className="text-mauve">Medicamentos em uso:</span> {visMedsEmUso.length}</p>}
            {sections.suplementos && <p><span className="text-mauve">Suplementos em uso:</span> {visSupEmUso.length}</p>}
            {sections.condicoes && <p><span className="text-mauve">Condições registradas:</span> {condProprias.length + condFamiliar.length}</p>}
            {sections.visao && <p><span className="text-mauve">Recursos de saúde:</span> {eyewear.length}</p>}
            <p><span className="text-mauve">Última atualização:</span> {lastUpdate ? fmt(lastUpdate) : hoje}</p>
            {sections.exames && bioOrg && bioOrg.total > 0 && (
              <p className="col-span-2">
                <span className="text-mauve">Biomarcadores atuais:</span>{' '}
                <strong>{bioOrg.total}</strong> organizados em {bioOrg.categories} categoria{bioOrg.categories !== 1 ? 's' : ''}
                {bioOrg.outOfRange > 0 ? ` · ${bioOrg.outOfRange} fora da faixa impressa do laudo` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Índice navegável — espelha o menu (grupos → seções selecionadas), clicável no PDF */}
        {resumoItems.length > 0 && (
        <nav className="rounded-2xl border border-border p-4 sm:p-5" aria-label="Índice do relatório">
          <p className="font-display text-sm font-semibold text-onyx mb-2.5">Índice</p>
          <div className="space-y-2">
            {SELECT_GROUPS.map(g => {
              const items = g.items.filter(([k]) => sections[k])
              if (!items.length) return null
              return (
                <div key={g.title}>
                  <p className="font-body text-[11px] font-semibold text-petal uppercase tracking-wider mb-0.5">{g.title}</p>
                  <ul className="flex flex-col gap-0.5 pl-3">
                    {items.map(([k, label]) => (
                      <li key={k}><a href={`#sec-${k}`} className="font-body text-xs text-onyx hover:text-petal transition-colors">{label}</a></li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </nav>
        )}

        {/* ══════════ ACOMPANHAMENTO ══════════ */}
        {showAcompanhamento && <ReportBand>Acompanhamento</ReportBand>}

        {/* Agenda — eventos FUTUROS ainda previstos (separação definitiva do Histórico de Saúde). */}
        {sections.eventos && (
        <section id="sec-eventos" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Agenda <span className="font-body text-xs font-normal text-mauve">(previstos)</span></h2>
          {perAgenda.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum evento previsto no período.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {perAgenda.map((e, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="font-body text-xs text-mauve py-1.5 pr-3 whitespace-nowrap align-top">{fmt(e.date)}</td>
                    <td className="font-body text-xs text-onyx py-1.5">
                      <span className="text-mauve">{typeLabel(e.eventType)}{professionalKindLabel(e.prof) ? ` (${professionalKindLabel(e.prof)})` : ''}:</span> {e.title}
                      {e.notes ? <span className="block text-xs text-mauve">{e.notes}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        )}

        {/* Histórico de Saúde — eventos que JÁ ACONTECERAM (consultas, procedimentos, vacinas…). */}
        {sections.registros && (
        <section id="sec-registros" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Histórico de Saúde <span className="font-body text-xs font-normal text-mauve">(realizados)</span></h2>
          {perHistorico.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum evento realizado no período.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {perHistorico.map((e, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="font-body text-xs text-mauve py-1.5 pr-3 whitespace-nowrap align-top">{fmt(e.date)}</td>
                    <td className="font-body text-xs text-onyx py-1.5">
                      <span className="text-mauve">{typeLabel(e.eventType)}{professionalKindLabel(e.prof) ? ` (${professionalKindLabel(e.prof)})` : ''}:</span> {e.title}
                      {e.status === 'cancelado' && <span className="text-mauve"> · cancelado</span>}
                      {e.notes ? <span className="block text-xs text-mauve">{e.notes}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        )}

        {/* Histórico de Exames — resumo LONGITUDINAL por indicador (A2). Responde "como evoluiu / quando foi a
            última", sem abrir cada exame. Factual (RDC 657): direção do valor e faixa do laudo, nunca conclusão clínica. */}
        {sections.histexames && bioSummaries.length > 0 && (
        <section id="sec-histexames" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Histórico de Exames <span className="font-body text-xs font-normal text-mauve">(evolução dos resultados)</span></h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-xs">
              <thead>
                <tr className="text-mauve align-bottom">
                  <th className="py-1 pr-2 font-medium">Indicador</th>
                  <th className="py-1 pr-2 font-medium">Último resultado</th>
                  <th className="py-1 pr-2 font-medium">Última realização</th>
                  <th className="py-1 font-medium">Evolução</th>
                </tr>
              </thead>
              <tbody>
                {[...bioSummaries].sort((a, b) => a.displayName.localeCompare(b.displayName)).map(s => {
                  const L = s.latest
                  const range = L == null ? null
                    : (L.referenceMin != null && L.value < L.referenceMin) ? 'abaixo da faixa'
                    : (L.referenceMax != null && L.value > L.referenceMax) ? 'acima da faixa'
                    : (L.referenceMin != null || L.referenceMax != null) ? 'dentro da faixa' : null
                  const TrendIcon = s.trend === 'up' ? TrendingUp : s.trend === 'down' ? TrendingDown : s.trend === 'stable' ? Minus : null
                  const trendWord = s.trend === 'up' ? 'subiu' : s.trend === 'down' ? 'desceu' : s.trend === 'stable' ? 'estável' : null
                  return (
                    <tr key={s.canonicalName} className="border-t border-border/50 align-top">
                      <td className="py-1.5 pr-2 text-mauve whitespace-nowrap">
                        {s.latest?.examId ? <Link href={`/dashboard/exams/${s.latest.examId}`} className="hover:text-petal hover:underline">{s.displayName}</Link> : s.displayName}
                      </td>
                      <td className="py-1.5 pr-2 text-onyx whitespace-nowrap">
                        {L ? <>{L.value}{L.unit ? ` ${L.unit}` : ''}{range ? <span className={`block text-[10px] ${range === 'dentro da faixa' ? 'text-mauve' : 'text-gold'}`}>{range}</span> : null}</> : '—'}
                      </td>
                      <td className="py-1.5 pr-2 text-mauve whitespace-nowrap">{L ? fmt(L.date) : '—'}</td>
                      <td className="py-1.5 text-onyx whitespace-nowrap">
                        {s.count > 1 && trendWord ? (
                          <span className="inline-flex items-center gap-1">
                            {TrendIcon && <TrendIcon size={12} className="text-mauve" />}{trendWord}
                            {s.totalDeltaPercent != null ? ` ${s.totalDeltaPercent > 0 ? '+' : ''}${s.totalDeltaPercent}% desde a 1ª` : ''} · {s.count} medições
                          </span>
                        ) : <span className="text-mauve">medição única</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="font-body text-[10px] text-mauve mt-1">Evolução completa dos seus indicadores numéricos. &quot;Subiu/desceu&quot; indica apenas a direção do valor; &quot;dentro/acima/abaixo&quot; refere-se à faixa do laudo. Organização factual — não é diagnóstico.</p>
        </section>
        )}

        {/* Medidas corporais */}
        {sections.medidas && (
        <section id="sec-medidas" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Composição Corporal</h2>
          {(latestPeso || alturaCm != null || imcVal != null) && (
            <p className="font-body text-xs text-onyx mb-2">
              {[
                latestPeso ? `Peso ${latestPeso.valueText}${latestPeso.unit ? ` ${latestPeso.unit}` : ''} (${fmt(latestPeso.date)})` : null,
                alturaCm != null ? `Altura ${alturaCm} cm` : null,
                imcVal != null ? `IMC ${imcVal.toFixed(1)} kg/m²` : null,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          {medLaudos.length > 0 ? (
            <ul className="space-y-1">
              {medLaudos.map((ex, i) => (
                <li key={i} className="font-body text-xs text-onyx flex flex-wrap items-baseline gap-x-2">
                  <span>• {ex.type}{ex.date ? ` · ${fmt(ex.date)}` : ''}</span>
                  {ex.fileUrl ? <ProvenanceLine provenance={examProvenance({ fileUrl: ex.fileUrl })} showOrigin={false} /> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-xs text-mauve">{latestPeso || alturaCm != null ? 'Nenhum laudo vinculado às medidas.' : 'Nenhuma medida registrada.'}</p>
          )}
        </section>
        )}

        {/* Sinais vitais */}
        {sections.sinais && (
        <section id="sec-sinais" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Monitoramento</h2>
          {perMeasuresVitais.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum sinal vital registrado.</p>
          ) : (
            <table className="w-full text-left">
              <tbody>
                {perMeasuresVitais.map((m, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="font-body text-xs text-mauve py-1.5 pr-3 whitespace-nowrap align-top">{fmt(m.date)}</td>
                    <td className="font-body text-xs text-onyx py-1.5">
                      <span className="text-mauve">{m.metric === 'outro_sinal' && m.label ? m.label : METRIC_LABEL[m.metric] ?? 'Sinal'}:</span> {m.valueText}{m.unit ? ` ${m.unit}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        )}

        {/* ══════════ DOCUMENTOS ══════════ */}
        {showDocumentos && <ReportBand>Documentos</ReportBand>}

        {/* Exames */}
        {sections.exames && (
        <section id="sec-exames" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Exames</h2>
          {perVisExams.length > 1 && (
            <ViewModeSwitcher className="mb-2 print:hidden"
              modes={EXAM_SORTS.map(s => ({ value: s.key, label: s.label }))}
              active={examSort} onChange={setExamSort} />
          )}
          {perVisExams.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum exame enviado.</p>
          ) : (
            <ul className="space-y-1">
              {sortedExams.map((e, i) => (
                <li key={i} className="font-body text-xs text-onyx flex flex-wrap items-baseline gap-x-2">
                  <span>• {fmt(e.date)} — {e.type}</span>
                  <ProvenanceLine provenance={examProvenance({ fileUrl: e.fileUrl })} showOrigin={false} />
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {/* Exames de ômica */}
        {sections.omica && (
        <section id="sec-omica" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Exames de ômica</h2>
          {perOmics.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum exame de ômica registrado.</p>
          ) : (
            <ul className="space-y-1">
              {perOmics.map((o, i) => (
                <li key={i} className="font-body text-xs text-onyx">
                  • {o.date ? `${fmt(o.date)} — ` : ''}<strong>{DOMAIN_LABEL[o.domain as OmicsDomain] ?? 'Ômica'}</strong>
                  {[o.laboratory, o.totalFeatures != null ? `${o.totalFeatures.toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).length
                    ? ` (${[o.laboratory, o.totalFeatures != null ? `${o.totalFeatures.toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).join(', ')})` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {/* ══════════ MINHA SAÚDE ══════════ */}
        {showMinhaSaude && <ReportBand>Minha Saúde</ReportBand>}

        {/* Condições de saúde — próprias + histórico familiar */}
        {sections.condicoes && (
        <section id="sec-condicoes" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Condições de Saúde</h2>
          {condProprias.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhuma condição registrada.</p>
          ) : (
            <ul className="space-y-1.5">
              {condProprias.map((c, i) => (
                <li key={i} className="font-body text-xs text-onyx">
                  • <strong>{c.name}</strong>{c.since ? ` (desde ${c.since})` : ''}
                  {c.notes ? <span className="block text-xs text-mauve ml-3">{c.notes}</span> : null}
                </li>
              ))}
            </ul>
          )}
          {condFamiliar.length > 0 && (
            <>
              <h3 className="font-body text-xs font-bold text-mauve/80 mt-3 mb-1 uppercase tracking-wider">Histórico familiar</h3>
              <ul className="space-y-1.5">
                {condFamiliar.map((c, i) => (
                  <li key={i} className="font-body text-xs text-onyx">
                    • <strong>{c.name}</strong>{c.relative ? ` — ${c.relative}` : ''}{c.since ? ` (desde ${c.since})` : ''}
                    {c.notes ? <span className="block text-xs text-mauve ml-3">{c.notes}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        )}

        {/* Medicamentos (FB-010: separado de Suplementos) */}
        {sections.medicamentos && (
        <section id="sec-medicamentos" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Medicamentos em uso</h2>
          {visMedsEmUso.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum registrado em uso.</p>
          ) : (
            <ul className="space-y-1.5">
              {visMedsEmUso.map((m, i) => {
                const detalhe = `${[m.dose, m.frequency].filter(Boolean).join(', ')}${periodo(m.startedOn, m.untilOn)}`.trim()
                return (
                <li key={i} className="font-body text-xs text-onyx">
                  • <strong>{m.name}</strong>
                  {detalhe ? <span className="block text-xs text-mauve ml-3">{detalhe}</span> : null}
                </li>
                )
              })}
            </ul>
          )}
          {perMedsSusp.length > 0 && (
            <p className="font-body text-xs text-mauve mt-2">Suspensos: {perMedsSusp.map(m => m.name).join(', ')}.</p>
          )}
        </section>
        )}

        {/* Suplementos (FB-010: separado de Medicamentos; mesma tabela, kind='suplemento') */}
        {sections.suplementos && (
        <section id="sec-suplementos" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Suplementos em uso</h2>
          {visSupEmUso.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum registrado em uso.</p>
          ) : (
            <ul className="space-y-1.5">
              {visSupEmUso.map((m, i) => {
                const detalhe = `${[m.dose, m.frequency].filter(Boolean).join(', ')}${periodo(m.startedOn, m.untilOn)}`.trim()
                return (
                <li key={i} className="font-body text-xs text-onyx">
                  • <strong>{m.name}</strong>
                  {detalhe ? <span className="block text-xs text-mauve ml-3">{detalhe}</span> : null}
                </li>
                )
              })}
            </ul>
          )}
          {perSupSusp.length > 0 && (
            <p className="font-body text-xs text-mauve mt-2">Suspensos: {perSupSusp.map(m => m.name).join(', ')}.</p>
          )}
        </section>
        )}

        {/* Recursos de Saúde (correção visual: óculos e lentes de contato) */}
        {sections.visao && (
        <section id="sec-visao" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Recursos de Saúde</h2>
          {eyewear.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum recurso registrado.</p>
          ) : (
            <ul className="space-y-1.5">
              {eyewear.map((e, i) => {
                const extras = [
                  e.dnp ? `DNP ${e.dnp}` : null, e.bc ? `BC ${e.bc}` : null, e.dia ? `DIA ${e.dia}` : null,
                  e.prescribedOn ? fmt(e.prescribedOn) : null, e.prescriber,
                ].filter(Boolean)
                return (
                  <li key={i} className="font-body text-xs text-onyx">
                    • <strong>{EYEWEAR_LABEL[e.kind] ?? 'Óculos'}</strong>
                    {grauStr(e.odSph, e.odCyl, e.odAxis, e.odAdd) ? <span className="block text-xs text-mauve ml-3">OD: {grauStr(e.odSph, e.odCyl, e.odAxis, e.odAdd)}</span> : null}
                    {grauStr(e.oeSph, e.oeCyl, e.oeAxis, e.oeAdd) ? <span className="block text-xs text-mauve ml-3">OE: {grauStr(e.oeSph, e.oeCyl, e.oeAxis, e.oeAdd)}</span> : null}
                    {extras.length ? <span className="block text-xs text-mauve ml-3">{extras.join(' · ')}</span> : null}
                    {e.fileUrl ? <span className="block ml-3 mt-0.5"><ProvenanceLine provenance={resourceProvenance({ fileUrl: e.fileUrl, prescriber: e.prescriber })} showOrigin={false} /></span> : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        )}

        {/* Hábitos de vida */}
        {sections.habitos && (
        <section id="sec-habitos" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Hábitos</h2>
          {habits.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum hábito registrado.</p>
          ) : (
            <ul className="space-y-1">
              {habits.map((h, i) => (
                <li key={i} className="font-body text-xs text-onyx">
                  • <span className="text-mauve">{HABIT_LABEL[h.category] ?? 'Hábito'}:</span> {h.description}{h.frequency ? ` — ${h.frequency}` : ''}
                  {h.notes ? <span className="block text-xs text-mauve">{h.notes}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {/* Ciclo e Contracepção */}
        {sections.ciclo && (
        <section id="sec-ciclo" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Ciclo e Contracepção</h2>
          {contraceptives.length === 0 && perMenstruations.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum registro de ciclo ou contracepção.</p>
          ) : (
            <>
              {contraceptives.length > 0 && (
                <ul className="space-y-1">
                  {contraceptives.map((c, i) => (
                    <li key={i} className="font-body text-xs text-onyx">
                      • <strong>{contraceptiveLabel(c.kind)}</strong>{c.brand ? ` (${c.brand})` : ''}
                      {c.startedOn ? ` — desde ${fmt(c.startedOn)}` : ''}{c.replaceOn ? ` · troca prevista ${fmt(c.replaceOn)}` : ''}
                      {c.status && c.status !== 'ativo' ? ` (${c.status})` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {perMenstruations.length > 0 && (
                <>
                  <h3 className="font-body text-xs font-bold text-mauve/80 mt-3 mb-1 uppercase tracking-wider">Menstruação</h3>
                  <p className="font-body text-xs text-onyx">{perMenstruations.map(m => fmt(m.startedOn)).join(' · ')}</p>
                </>
              )}
            </>
          )}
        </section>
        )}

        {/* ══════════ ORGANIZAÇÃO ══════════ */}
        {showOrganizacao && <ReportBand>Organização</ReportBand>}

        {/* Despesas — eventos realizados com valor pago (projeção financeira da Agenda) */}
        {sections.gastos && (
        <section id="sec-gastos" style={{ scrollMarginTop: 16 }}>
          <h2 className="font-display text-sm font-semibold text-onyx mb-2.5">Despesas</h2>
          {perExpenses.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhuma despesa registrada.</p>
          ) : (
            <>
              <table className="w-full text-left">
                <tbody>
                  {perExpenses.map((x, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="font-body text-xs text-mauve py-1.5 pr-3 whitespace-nowrap align-top">{fmt(x.date)}</td>
                      <td className="font-body text-xs text-onyx py-1.5"><span className="text-mauve">{typeLabel(x.type)}:</span> {x.title}</td>
                      <td className="font-body text-xs text-onyx py-1.5 pl-3 text-right whitespace-nowrap align-top">{brl(x.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="font-body text-xs font-semibold text-onyx mt-2 text-right">Total: {brl(perExpenses.reduce((s, x) => s + (x.amountCents ?? 0), 0))}</p>
            </>
          )}
        </section>
        )}

        <Disclaimer variant="relatorio" className="border-t border-border pt-3" />
      </div>

      <ConfirmDialog
        open={!!confirm}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirmar'}
        onConfirm={() => { const c = confirm; setConfirm(null); c?.onYes() }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
