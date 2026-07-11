'use client'

// ============================================================
// Medidas corporais — série temporal autorrelatada
// ============================================================
// Peso, altura, circunferência e composição corporal (bioimpedância). Registro
// factual da própria pessoa para acompanhar no tempo e levar ao profissional.
// Sem juízo clínico. Sinais vitais (pressão, etc.) ficam em aba própria.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, X, Activity, Trash2, Camera, ScanLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import Sparkline, { parseNum } from '@/components/Sparkline'
import ListCard from '@/components/ListCard'
import Card from '@/components/ui/Card'
import Section from '@/components/ui/Section'
import Disclaimer from '@/components/ui/Disclaimer'
import ProvenanceLine from '@/components/ui/ProvenanceLine'
import { examProvenance } from '@/lib/provenance'

type Metric =
  | 'peso' | 'altura' | 'circunferencia_cintura'
  | 'imc' | 'gordura_corporal' | 'massa_muscular' | 'agua_corporal' | 'gordura_visceral' | 'massa_ossea' | 'taxa_metabolica'
  | 'outro'

const METRIC_LABEL: Record<Metric, string> = {
  peso: 'Peso', altura: 'Altura', circunferencia_cintura: 'Circunferência (cintura)',
  imc: 'IMC', gordura_corporal: 'Gordura corporal', massa_muscular: 'Massa muscular',
  agua_corporal: 'Água corporal', gordura_visceral: 'Gordura visceral', massa_ossea: 'Massa óssea',
  taxa_metabolica: 'Taxa metabólica basal', outro: 'Outra medida',
}
const DEFAULT_UNIT: Record<Metric, string> = {
  peso: 'kg', altura: 'cm', circunferencia_cintura: 'cm',
  imc: 'kg/m²', gordura_corporal: '%', massa_muscular: 'kg', agua_corporal: '%',
  gordura_visceral: 'nível', massa_ossea: 'kg', taxa_metabolica: 'kcal', outro: '',
}
const PLACEHOLDER: Record<Metric, string> = {
  peso: 'Ex.: 72,5', altura: 'Ex.: 165', circunferencia_cintura: 'Ex.: 84',
  imc: 'Ex.: 24,2', gordura_corporal: 'Ex.: 28', massa_muscular: 'Ex.: 24', agua_corporal: 'Ex.: 55',
  gordura_visceral: 'Ex.: 7', massa_ossea: 'Ex.: 2,8', taxa_metabolica: 'Ex.: 1450', outro: 'Valor',
}

interface Entry {
  id: string
  metric: Metric
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  notes: string | null
  examId: string | null
}

// Exame (laudo) que a pessoa já enviou em Exames — usado para vincular a medida ao
// documento original (ex.: laudo de bioimpedância).
interface ExamRef { id: string; type: string; examDate: string | null; fileUrl: string | null }

function fmt(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Reduz a foto do laudo antes de enviar à IA de visão: corta MUITO os tokens de
// entrada (custo) e acelera. Laudo de bioimpedância tem números finos → mantém um
// pouco mais de resolução que o scan de rótulo. Se o navegador não decodificar
// (ex.: HEIC do iPhone), lança mensagem clara em vez de mandar formato inválido.
async function downscaleImage(file: File, maxDim = 1300): Promise<{ base64: string; mediaType: string }> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file)
  })
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new window.Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl
    })
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    if (scale < 1) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const out = canvas.toDataURL('image/jpeg', 0.85)
        return { base64: out.split(',')[1] ?? '', mediaType: 'image/jpeg' }
      }
    }
  } catch { /* fallback p/ a imagem original */ }
  const t = file.type || 'image/jpeg'
  const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!SUPPORTED.includes(t)) {
    throw new Error('Formato de foto não suportado (ex.: HEIC do iPhone). Tire a foto como JPG, ou em Ajustes → Câmera → Formatos escolha "Mais compatível".')
  }
  return { base64: dataUrl.split(',')[1] ?? '', mediaType: t }
}

// Métricas extraídas de um laudo de bioimpedância (IMC é calculado à parte).
const BIO_METRICS: Metric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica']

export default function MedidasPage() {
  const { user, profile, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Entry[]>([])
  const [exams, setExams] = useState<ExamRef[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [metric, setMetric] = useState<Metric>('peso')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [examId, setExamId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Escanear laudo de bioimpedância
  const [scanning, setScanning] = useState(false)
  const [scanRows, setScanRows] = useState<{ metric: Metric; value: string; unit: string }[] | null>(null)
  const [scanDate, setScanDate] = useState('')
  const [scanExamId, setScanExamId] = useState('')
  const [scanErr, setScanErr] = useState<string | null>(null)
  const [savingScan, setSavingScan] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [{ data }, exRes] = await Promise.all([
      db.from('body_metrics')
        .select('id, metric, label, value_text, unit, measured_on, notes, exam_id')
        .eq('user_id', user.id).order('measured_on', { ascending: false }),
      db.from('exams').select('id, type, exam_date, file_url').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, metric: (m.metric as Metric) ?? 'outro', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null,
      measuredOn: m.measured_on as string, notes: (m.notes as string) ?? null,
      examId: (m.exam_id as string) ?? null,
    })))
    setExams(((exRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      id: e.id as string, type: (e.type as string) || 'Exame',
      examDate: (e.exam_date as string) ?? null, fileUrl: (e.file_url as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  // Carrega na montagem (e após mutações); o setLoading(true) síncrono — o spinner —
  // é intencional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function chooseMetric(m: Metric) { setMetric(m); setUnit(DEFAULT_UNIT[m]) }
  function reset() { setMetric('peso'); setLabel(''); setValue(''); setUnit('kg'); setDate(''); setNotes(''); setExamId(''); setErr(null) }

  async function save() {
    if (!user || saving || !value.trim() || !date) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert({
      user_id: user.id, metric, label: metric === 'outro' ? (label.trim() || 'Medida') : null,
      value_text: value.trim(), unit: unit.trim() || null, measured_on: date, notes: notes.trim() || null,
      exam_id: examId || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function remove(id: string) {
    if (busyId) return
    if (!window.confirm('Remover esta medida?')) return
    setBusyId(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('body_metrics').delete().eq('id', id)
    await load(); setBusyId(null)
  }

  // Escanear laudo de bioimpedância → pré-preenche várias medidas de uma vez.
  async function onScanFile(file: File) {
    if (!file.type.startsWith('image/')) { setScanErr('Envie uma imagem do laudo.'); return }
    if (file.size > 10 * 1024 * 1024) { setScanErr('Imagem muito grande (máx. 10 MB).'); return }
    setScanning(true); setScanErr(null); setScanRows(null); setShowForm(false)
    try {
      const { base64, mediaType } = await downscaleImage(file)
      const resp = await fetch('/api/vision/bioimpedance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const json = await resp.json()
      const r = json?.result as Record<string, string | null> | null
      if (!r) { setScanErr('Não consegui ler o laudo. Tente outra foto ou registre manualmente.'); setScanning(false); return }
      const rows = BIO_METRICS
        .filter(m => r[m])
        .map(m => ({ metric: m, value: String(r[m]), unit: DEFAULT_UNIT[m] }))
      if (rows.length === 0) { setScanErr('Não encontrei medidas no laudo. Tente outra foto ou registre manualmente.'); setScanning(false); return }
      setScanRows(rows)
      setScanDate(r.measured_on || new Date().toISOString().slice(0, 10))
    } catch (e) {
      setScanErr(e instanceof Error ? e.message : 'Falha ao processar a foto. Tente novamente ou registre manualmente.')
    } finally {
      setScanning(false)
    }
  }

  async function saveScan() {
    if (!user || !scanRows || !scanDate || savingScan) return
    const rows = scanRows.filter(r => r.value.trim())
    if (rows.length === 0) { setScanRows(null); return }
    setSavingScan(true); setScanErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert(
      rows.map(r => ({
        user_id: user.id, metric: r.metric, label: null,
        value_text: r.value.trim(), unit: r.unit || null, measured_on: scanDate,
        notes: 'Importado de laudo de bioimpedância', exam_id: scanExamId || null,
      })),
    )
    setSavingScan(false)
    if (error) { setScanErr(error.message); return }
    setScanRows(null); setScanExamId(''); await load()
  }

  // IMC calculado a partir do peso mais recente e da altura do perfil (factual).
  const alturaCm = (profile?.height_cm as number | null | undefined) ?? null
  const latestPeso = items.find(i => i.metric === 'peso')
  const pesoNum = latestPeso ? parseNum(latestPeso.valueText) : null
  const imcVal = pesoNum && alturaCm ? pesoNum / Math.pow(alturaCm / 100, 2) : null

  // IMC é calculado (não é registrado manualmente).
  const groups: Metric[] = ['peso', 'altura', 'circunferencia_cintura', 'gordura_corporal', 'massa_muscular', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica', 'outro']

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-onyx">Medidas</h1>
          <p className="font-body text-sm text-mauve mt-1">Acompanhe peso, altura, circunferência e composição corporal (bioimpedância) ao longo do tempo.</p>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end flex-shrink-0">
          <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
            className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
          </button>
          <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { const file = e.target.files?.[0]; if (file) onScanFile(file); e.target.value = '' }} />
          <button onClick={() => scanRef.current?.click()} disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors disabled:opacity-50">
            {scanning ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />} Escanear bioimpedância
          </button>
        </div>
      </div>

      {/* Onde registrar bioimpedância (ex.: do nutricionista) */}
      <div className="rounded-2xl border border-petal/30 bg-blush/30 px-4 py-3 flex items-start gap-3">
        <Activity size={16} className="text-petal flex-shrink-0 mt-0.5" />
        <p className="font-body text-xs text-onyx leading-relaxed">
          Fez <strong>bioimpedância</strong> (por exemplo, com seu nutricionista)? Registre cada resultado em
          <strong> Adicionar → Bioimpedância</strong> (gordura corporal, massa muscular, água, IMC e outros).
          Para guardar o laudo completo, envie o arquivo em{' '}
          <Link href="/dashboard/exams" className="text-petal hover:underline font-medium">Exames</Link>.
        </p>
      </div>

      {/* IMC calculado automaticamente (peso ÷ altura²) */}
      <Card padding="sm" className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-0.5">IMC (calculado)</p>
          {imcVal != null ? (
            <>
              <p className="font-display text-2xl font-bold text-onyx leading-none">
                {imcVal.toFixed(1)} <span className="text-sm font-normal text-mauve">kg/m²</span>
              </p>
              <p className="font-body text-[11px] text-mauve mt-1">
                A partir de {latestPeso!.valueText} kg ({fmt(latestPeso!.measuredOn)}) e {alturaCm} cm de altura.
              </p>
            </>
          ) : (
            <p className="font-body text-xs text-mauve leading-relaxed">
              {alturaCm == null
                ? <>Informe sua <Link href="/dashboard/profile" className="text-petal hover:underline font-medium">altura no perfil</Link> e registre seu peso para o IMC ser calculado automaticamente.</>
                : <>Registre seu <strong>peso</strong> para o IMC ser calculado automaticamente.</>}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-2xl bg-lavender-light flex items-center justify-center flex-shrink-0">
          <Activity size={18} className="text-lavender" />
        </div>
      </Card>

      {/* Revisão do laudo de bioimpedância escaneado */}
      {scanRows && (
        <Section padding="md" bodyClassName="space-y-3" icon={<Camera size={16} className="text-petal" />} title="Revise os dados lidos do laudo">
          <div>
            <label htmlFor="medida-scan-date" className="font-body text-xs text-mauve block mb-1">Data do exame</label>
            <input id="medida-scan-date" type="date" value={scanDate} onChange={e => setScanDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          {exams.length > 0 && (
            <div>
              <label htmlFor="medida-scan-exam" className="font-body text-xs text-mauve block mb-1">Vincular ao laudo em Exames (opcional)</label>
              <select id="medida-scan-exam" value={scanExamId} onChange={e => setScanExamId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="">Nenhum</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.type}{ex.examDate ? ` · ${fmt(ex.examDate)}` : ''}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            {scanRows.map((row, i) => (
              <div key={row.metric} className="flex items-center gap-2">
                <span className="font-body text-xs text-onyx w-40 flex-shrink-0">{METRIC_LABEL[row.metric]}</span>
                <input value={row.value} aria-label={METRIC_LABEL[row.metric]}
                  onChange={e => setScanRows(rows => rows!.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                  className="flex-1 px-2 py-1.5 border border-border rounded-lg font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                <span className="font-body text-xs text-mauve w-12 flex-shrink-0">{row.unit}</span>
                <button onClick={() => setScanRows(rows => rows!.filter((_, j) => j !== i))} title="Descartar"
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve hover:text-red-500 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {scanErr && <p className="font-body text-xs text-red-500">{scanErr}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setScanRows(null); setScanErr(null) }}
              className="px-4 py-2 rounded-full border border-border text-mauve font-body text-sm hover:bg-ivory transition-colors">
              Cancelar
            </button>
            <button onClick={saveScan} disabled={savingScan || !scanDate}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {savingScan ? 'Salvando…' : 'Salvar tudo'}
            </button>
          </div>
        </Section>
      )}

      {scanErr && !scanRows && <p className="font-body text-xs text-red-500">{scanErr}</p>}

      {showForm && (
        <Card padding="md" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="medida-metric" className="font-body text-xs text-mauve block mb-1">Medida</label>
              <select id="medida-metric" value={metric} onChange={e => chooseMetric(e.target.value as Metric)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <optgroup label="Corpo">
                  <option value="peso">Peso</option>
                  <option value="altura">Altura</option>
                  <option value="circunferencia_cintura">Circunferência (cintura)</option>
                </optgroup>
                <optgroup label="Bioimpedância">
                  <option value="gordura_corporal">Gordura corporal</option>
                  <option value="massa_muscular">Massa muscular</option>
                  <option value="agua_corporal">Água corporal</option>
                  <option value="gordura_visceral">Gordura visceral</option>
                  <option value="massa_ossea">Massa óssea</option>
                  <option value="taxa_metabolica">Taxa metabólica basal</option>
                </optgroup>
                <option value="outro">Outra medida</option>
              </select>
            </div>
            <div>
              <label htmlFor="medida-date" className="font-body text-xs text-mauve block mb-1">Data</label>
              <input id="medida-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {metric === 'outro' && (
            <div>
              <label htmlFor="medida-label" className="font-body text-xs text-mauve block mb-1">Nome da medida</label>
              <input id="medida-label" type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Glicemia capilar"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="medida-value" className="font-body text-xs text-mauve block mb-1">Valor</label>
              <input id="medida-value" type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[metric]}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label htmlFor="medida-unit" className="font-body text-xs text-mauve block mb-1">Unidade</label>
              <input id="medida-unit" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg, mmHg, cm…"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div>
            <label htmlFor="medida-notes" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea id="medida-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setNotes(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {exams.length > 0 && (
            <div>
              <label htmlFor="medida-exam" className="font-body text-xs text-mauve block mb-1">Vincular a um laudo (opcional)</label>
              <select id="medida-exam" value={examId} onChange={e => setExamId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="">Nenhum</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.type}{ex.examDate ? ` · ${fmt(ex.examDate)}` : ''}</option>
                ))}
              </select>
              <p className="font-body text-[11px] text-mauve mt-1">
                Veio de um exame/laudo já enviado em <Link href="/dashboard/exams" className="text-petal hover:underline">Exames</Link>? Vincule para abrir o documento original aqui e no relatório.
              </p>
            </div>
          )}
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving || !value.trim() || !date}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length === 0 ? (
        <Card padding="xl" className="text-center"><p className="font-body text-sm text-mauve">Nenhuma medida registrada. Use <strong>Adicionar</strong>.</p></Card>
      ) : (
        <div className="space-y-6">
          {groups.map(g => {
            const list = items.filter(i => i.metric === g)
            if (list.length === 0) return null
            // Série cronológica (lista vem do mais recente; invertemos para o gráfico).
            const serie = [...list].reverse().map(it => parseNum(it.valueText)).filter((v): v is number => v !== null)
            return (
              <div key={g}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-display text-base font-semibold text-onyx">{METRIC_LABEL[g]}</p>
                  {serie.length >= 2 && (
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[11px] text-mauve">{list.length} registros</span>
                      <Sparkline values={serie} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {list.map(it => {
                    const prefix = it.metric === 'outro' && it.label ? `${it.label}: ` : ''
                    const ex = it.examId ? exams.find(e => e.id === it.examId) : null
                    return (
                      <ListCard
                        key={it.id}
                        title={`${prefix}${it.valueText}${it.unit ? ` ${it.unit}` : ''}`}
                        meta={
                          <>
                            {fmt(it.measuredOn)}{it.notes ? ` · ${it.notes}` : ''}
                            {ex && (
                              <span className="block mt-0.5">
                                Laudo: {ex.type}{ex.examDate ? ` · ${fmt(ex.examDate)}` : ''}{' '}
                                {ex.fileUrl ? <ProvenanceLine provenance={examProvenance({ fileUrl: ex.fileUrl })} showOrigin={false} className="ml-1" /> : null}
                              </span>
                            )}
                          </>
                        }
                        actions={
                          <button onClick={() => remove(it.id)} disabled={busyId === it.id} title="Remover"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        }
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Disclaimer variant="geral" className="text-center" />
    </div>
  )
}
