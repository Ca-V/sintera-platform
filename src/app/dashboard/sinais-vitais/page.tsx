'use client'

// ============================================================
// Sinais vitais — série temporal autorrelatada (dentro de Histórico)
// ============================================================
// Pressão arterial, frequência cardíaca, glicemia, saturação, temperatura.
// Registro factual da própria pessoa para acompanhar no tempo e levar ao
// profissional. Sem juízo clínico. Reaproveita a tabela body_metrics.
// ============================================================

import { useState } from 'react'
import { Loader2, Plus, X, Trash2 } from 'lucide-react'
import VoiceInput from '@/components/VoiceInput'
import Sparkline, { parseNum } from '@/components/Sparkline'
import ListCard from '@/components/ListCard'
import Card from '@/components/ui/Card'
import Disclaimer from '@/components/ui/Disclaimer'
import { fieldClass } from '@/components/ui/field'
import { useListResource } from '@/lib/ui/useListResource'
import { VITALS, type Vital, type VitalEntry } from '@/lib/sinais-vitais/service'

const VITAL_LABEL: Record<Vital, string> = {
  pressao_arterial: 'Pressão arterial', frequencia_cardiaca: 'Frequência cardíaca',
  glicemia: 'Glicemia', saturacao: 'Saturação (SpO₂)', temperatura: 'Temperatura', outro_sinal: 'Outro sinal',
}
const DEFAULT_UNIT: Record<Vital, string> = {
  pressao_arterial: 'mmHg', frequencia_cardiaca: 'bpm', glicemia: 'mg/dL',
  saturacao: '%', temperatura: '°C', outro_sinal: '',
}
const PLACEHOLDER: Record<Vital, string> = {
  pressao_arterial: 'Ex.: 120/80', frequencia_cardiaca: 'Ex.: 72', glicemia: 'Ex.: 95',
  saturacao: 'Ex.: 98', temperatura: 'Ex.: 36,5', outro_sinal: 'Valor',
}

function fmt(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SinaisVitaisPage() {
  // Ciclo de vida do recurso (lista/salvar/remover/estados) = dono único.
  const { items, loading, saving, busyId, error: err, setError: setErr, save: saveResource, remove: removeResource } =
    useListResource<VitalEntry>({ endpoint: '/api/sinais-vitais', listKey: 'vitals', editMethod: 'POST' })

  const [showForm, setShowForm] = useState(false)
  const [metric, setMetric] = useState<Vital>('pressao_arterial')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('mmHg')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')

  function chooseMetric(m: Vital) { setMetric(m); setUnit(DEFAULT_UNIT[m]) }
  function reset() { setMetric('pressao_arterial'); setLabel(''); setValue(''); setUnit('mmHg'); setDate(''); setNotes(''); setErr(null) }

  async function save() {
    if (saving || !value.trim() || !date) return
    const ok = await saveResource({ metric, value, unit, label, measuredOn: date, notes })
    if (ok) { reset(); setShowForm(false) }
  }

  async function remove(id: string) {
    if (busyId) return
    if (!window.confirm('Remover este registro?')) return
    await removeResource(id)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Sinais vitais</h1>
          <p className="font-body text-sm text-mauve mt-1">Acompanhe pressão arterial, frequência cardíaca, glicemia e outros ao longo do tempo.</p>
        </div>
        <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
        </button>
      </div>

      {showForm && (
        <Card padding="md" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vital-metric" className="font-body text-xs text-mauve block mb-1">Sinal vital</label>
              <select id="vital-metric" value={metric} onChange={e => chooseMetric(e.target.value as Vital)}
                className={fieldClass()}>
                <option value="pressao_arterial">Pressão arterial</option>
                <option value="frequencia_cardiaca">Frequência cardíaca</option>
                <option value="glicemia">Glicemia</option>
                <option value="saturacao">Saturação (SpO₂)</option>
                <option value="temperatura">Temperatura</option>
                <option value="outro_sinal">Outro sinal</option>
              </select>
            </div>
            <div>
              <label htmlFor="vital-date" className="font-body text-xs text-mauve block mb-1">Data</label>
              <input id="vital-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className={fieldClass()} />
            </div>
          </div>
          {metric === 'outro_sinal' && (
            <div>
              <label htmlFor="vital-label" className="font-body text-xs text-mauve block mb-1">Nome do sinal</label>
              <input id="vital-label" type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Saturação em exercício"
                className={fieldClass()} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vital-value" className="font-body text-xs text-mauve block mb-1">Valor</label>
              <input id="vital-value" type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[metric]}
                className={fieldClass()} />
            </div>
            <div>
              <label htmlFor="vital-unit" className="font-body text-xs text-mauve block mb-1">Unidade</label>
              <input id="vital-unit" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="mmHg, bpm, mg/dL…"
                className={fieldClass()} />
            </div>
          </div>
          <div>
            <label htmlFor="vital-notes" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea id="vital-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className={fieldClass({ className: 'flex-1' })} />
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
        </Card>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length === 0 ? (
        <Card padding="xl" className="text-center"><p className="font-body text-sm text-mauve">Nenhum sinal vital registrado. Use <strong>Adicionar</strong>.</p></Card>
      ) : (
        <div className="space-y-6">
          {VITALS.map(g => {
            const list = items.filter(i => i.metric === g)
            if (list.length === 0) return null
            // Série cronológica (lista vem do mais recente; invertemos para o gráfico).
            // Em pressão arterial, parseNum usa o primeiro número (sistólica).
            const serie = [...list].reverse().map(it => parseNum(it.valueText)).filter((v): v is number => v !== null)
            return (
              <div key={g}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-display text-base font-semibold text-onyx">{VITAL_LABEL[g]}</p>
                  {serie.length >= 2 && (
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[11px] text-mauve">{list.length} registros</span>
                      <Sparkline values={serie} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {list.map(it => (
                    <ListCard key={it.id}
                      title={`${it.metric === 'outro_sinal' && it.label ? `${it.label}: ` : ''}${it.valueText}${it.unit ? ` ${it.unit}` : ''}`}
                      meta={`${fmt(it.measuredOn)}${it.notes ? ` · ${it.notes}` : ''}`}
                      actions={
                        <button onClick={() => remove(it.id)} disabled={busyId === it.id} title="Remover"
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <Trash2 size={12} />
                        </button>
                      }
                    />
                  ))}
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
