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
import { Loader2, Plus, X, Activity, ArrowLeft, Trash2, Camera, ScanLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import Sparkline, { parseNum } from '@/components/Sparkline'

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
}

function fmt(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Métricas extraídas de um laudo de bioimpedância (IMC é calculado à parte).
const BIO_METRICS: Metric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica']

export default function MedidasPage() {
  const { user, profile, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [metric, setMetric] = useState<Metric>('peso')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Escanear laudo de bioimpedância
  const [scanning, setScanning] = useState(false)
  const [scanRows, setScanRows] = useState<{ metric: Metric; value: string; unit: string }[] | null>(null)
  const [scanDate, setScanDate] = useState('')
  const [scanErr, setScanErr] = useState<string | null>(null)
  const [savingScan, setSavingScan] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('body_metrics')
      .select('id, metric, label, value_text, unit, measured_on, notes')
      .eq('user_id', user.id).order('measured_on', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, metric: (m.metric as Metric) ?? 'outro', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null,
      measuredOn: m.measured_on as string, notes: (m.notes as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  // Carrega na montagem (e após mutações); o setLoading(true) síncrono — o spinner —
  // é intencional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function chooseMetric(m: Metric) { setMetric(m); setUnit(DEFAULT_UNIT[m]) }
  function reset() { setMetric('peso'); setLabel(''); setValue(''); setUnit('kg'); setDate(''); setNotes(''); setErr(null) }

  async function save() {
    if (!user || saving || !value.trim() || !date) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert({
      user_id: user.id, metric, label: metric === 'outro' ? (label.trim() || 'Medida') : null,
      value_text: value.trim(), unit: unit.trim() || null, measured_on: date, notes: notes.trim() || null,
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
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(String(reader.result).split(',')[1] ?? '')
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const resp = await fetch('/api/vision/bioimpedance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
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
    } catch {
      setScanErr('Falha ao processar a foto. Tente novamente ou registre manualmente.')
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
        notes: 'Importado de laudo de bioimpedância',
      })),
    )
    setSavingScan(false)
    if (error) { setScanErr(error.message); return }
    setScanRows(null); await load()
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
      <Link href="/dashboard/saude" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Histórico de Saúde
      </Link>

      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/saude" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Atual</Link>
        <span className="px-3.5 py-1.5 rounded-full gradient-sintera text-white font-body text-sm font-medium">Medidas</span>
        <Link href="/dashboard/sinais-vitais" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Sinais vitais</Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <Activity size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Histórico de Saúde</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Medidas</h1>
          <p className="font-body text-sm text-mauve mt-1">Acompanhe peso, altura, circunferência e composição corporal (bioimpedância) ao longo do tempo. Registro seu — sem juízo clínico.</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
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
          <Link href="/dashboard/exams" className="text-petal hover:underline font-medium">Exames e Documentos</Link>.
        </p>
      </div>

      {/* IMC calculado automaticamente (peso ÷ altura²) */}
      <div className="card-premium p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[10px] text-mauve/70 uppercase tracking-wider mb-0.5">IMC (calculado)</p>
          {imcVal != null ? (
            <>
              <p className="font-display text-2xl font-bold text-onyx leading-none">
                {imcVal.toFixed(1)} <span className="text-sm font-normal text-mauve">kg/m²</span>
              </p>
              <p className="font-body text-[11px] text-mauve/60 mt-1">
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
      </div>

      {/* Revisão do laudo de bioimpedância escaneado */}
      {scanRows && (
        <div className="card-premium p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-petal" />
            <p className="font-body text-sm font-semibold text-onyx">Revise os dados lidos do laudo</p>
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Data do exame</label>
            <input type="date" value={scanDate} onChange={e => setScanDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div className="space-y-2">
            {scanRows.map((row, i) => (
              <div key={row.metric} className="flex items-center gap-2">
                <span className="font-body text-xs text-onyx w-40 flex-shrink-0">{METRIC_LABEL[row.metric]}</span>
                <input value={row.value}
                  onChange={e => setScanRows(rows => rows!.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                  className="flex-1 px-2 py-1.5 border border-border rounded-lg font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                <span className="font-body text-xs text-mauve w-12 flex-shrink-0">{row.unit}</span>
                <button onClick={() => setScanRows(rows => rows!.filter((_, j) => j !== i))} title="Descartar"
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-500 flex-shrink-0">
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
        </div>
      )}

      {scanErr && !scanRows && <p className="font-body text-xs text-red-500">{scanErr}</p>}

      {showForm && (
        <div className="card-premium p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Medida</label>
              <select value={metric} onChange={e => chooseMetric(e.target.value as Metric)}
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
              <label className="font-body text-xs text-mauve/70 block mb-1">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {metric === 'outro' && (
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Nome da medida</label>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Glicemia capilar"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Valor</label>
              <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[metric]}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Unidade</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg, mmHg, cm…"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setNotes(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving || !value.trim() || !date}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card-premium p-8 text-center"><p className="font-body text-sm text-mauve">Nenhuma medida registrada. Use <strong>Adicionar</strong>.</p></div>
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
                      <span className="font-body text-[10px] text-mauve/50">{list.length} registros</span>
                      <Sparkline values={serie} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {list.map(it => (
                    <div key={it.id} className="card-premium p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-body text-sm text-onyx">
                          {it.metric === 'outro' && it.label ? <span className="text-mauve/70">{it.label}: </span> : null}
                          <strong>{it.valueText}</strong>{it.unit ? ` ${it.unit}` : ''}
                        </p>
                        <p className="font-body text-[11px] text-mauve/60">{fmt(it.measuredOn)}{it.notes ? ` · ${it.notes}` : ''}</p>
                      </div>
                      <button onClick={() => remove(it.id)} disabled={busyId === it.id} title="Remover"
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-500 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Registro factual das suas medidas. Não interpreta nem diagnostica — leve os dados ao seu profissional de saúde.
      </p>
    </div>
  )
}
