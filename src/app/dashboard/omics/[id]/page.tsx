'use client'

// ============================================================
// Ômica — painel (Níveis 1→4) + comparação temporal
// ============================================================
// N1 resumo · N2 categorias · N3 features · N4 histórico temporal.
// Comparação APENAS factual — sem "melhorou/piorou/normalizou/sugere".
// Entrada manual de resultado usa a RESOLUÇÃO DE IDENTIDADE do catálogo.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, ArrowLeft, Dna, ChevronRight, ChevronDown, Plus, X, Trash2, ExternalLink, Upload, History, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import Sparkline, { parseNum } from '@/components/Sparkline'
import { Card } from "@/lib/ui/ds"
import ConfirmDialog from '@/components/ConfirmDialog'
import { DOMAIN_LABEL, fmtOmicsDate, type OmicsDomain } from '@/lib/omics/domains'
import { uploadAndIngest } from '@/lib/omics/ingestClient'

interface Panel { id: string; domain: OmicsDomain; technology: string | null; platform: string | null; total_features: number | null; laboratory: string | null; collected_on: string | null; created_at: string }
interface Category { category_id: string | null; name: string; display_order: number | null; count: number }
interface ResultRow { id: string; feature_id: string | null; feature_name: string; value: number | null; unit: string | null; raw_value: string | null; detection_status: string | null; method: string | null; measured_on: string | null }
interface HistPoint { measured_on: string | null; value: number | null; unit: string | null; laboratory: string | null }

export default function OmicsPanelPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const supabase = createClient()

  const [panel, setPanel] = useState<Panel | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  const [open, setOpen] = useState<string | null>(null)            // categoria expandida
  const [rowsByCat, setRowsByCat] = useState<Record<string, ResultRow[]>>({})
  const [loadingCat, setLoadingCat] = useState<string | null>(null)

  const [openFeature, setOpenFeature] = useState<string | null>(null) // feature_id expandida (Nível 4)
  const [hist, setHist] = useState<Record<string, HistPoint[]>>({})
  const [refs, setRefs] = useState<Record<string, { source: string; external_id: string; url: string | null }[]>>({})

  const loadPanel = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/omics/panels/${id}`)
    if (!res.ok) { setPanel(null); setLoading(false); return }
    const json = await res.json()
    setPanel(json.panel); setCategories(json.categories ?? []); setTotal(json.total_results ?? 0)
    setLoading(false)
  }, [id])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega o painel na montagem (data fetching)
  useEffect(() => { loadPanel() }, [loadPanel])

  async function toggleCategory(c: Category) {
    const key = c.category_id ?? 'none'
    if (open === key) { setOpen(null); return }
    setOpen(key)
    if (!rowsByCat[key]) {
      setLoadingCat(key)
      const res = await fetch(`/api/omics/panels/${id}/results?category_id=${key}`)
      const json = await res.json().catch(() => ({ results: [] }))
      setRowsByCat(prev => ({ ...prev, [key]: (json.results ?? []) as ResultRow[] }))
      setLoadingCat(null)
    }
  }

  async function toggleFeature(r: ResultRow) {
    if (!r.feature_id) return
    if (openFeature === r.feature_id) { setOpenFeature(null); return }
    setOpenFeature(r.feature_id)
    if (!hist[r.feature_id]) {
      const [hRes, fRes] = await Promise.all([
        fetch(`/api/omics/features/${r.feature_id}/history`),
        fetch(`/api/omics/features/${r.feature_id}`),
      ])
      const hJson = await hRes.json().catch(() => ({ history: [] }))
      const fJson = await fRes.json().catch(() => ({ external_references: [] }))
      setHist(prev => ({ ...prev, [r.feature_id!]: (hJson.history ?? []) as HistPoint[] }))
      setRefs(prev => ({ ...prev, [r.feature_id!]: (fJson.external_references ?? []) }))
    }
  }

  function removePanel() {
    if (!panel || !user) return
    setConfirm({ message: 'Remover este painel e todos os seus resultados?', confirmLabel: 'Remover', onYes: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('omics_panels').delete().eq('id', panel.id)
      router.push('/dashboard/omics')
    } })
  }

  if (loading) return <div className="p-16 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
  if (!panel) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-3">
      <p className="font-body text-sm text-mauve">Painel não encontrado.</p>
      <Link href="/dashboard/omics" className="font-body text-sm text-petal hover:underline">Voltar para Ômica</Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <Link href="/dashboard/omics" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Ômica
      </Link>

      {/* Nível 1 — resumo do painel */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-lavender-light flex items-center justify-center flex-shrink-0">
              <Dna size={22} className="text-lavender" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold text-onyx">{DOMAIN_LABEL[panel.domain]}</h1>
              <p className="font-body text-sm text-mauve mt-0.5">
                {[fmtOmicsDate(panel.collected_on ?? panel.created_at), panel.laboratory].filter(Boolean).join(' · ')}
              </p>
              {panel.technology && <p className="font-body text-xs text-mauve mt-0.5">Tecnologia: {panel.technology}</p>}
            </div>
          </div>
          <button onClick={removePanel} title="Remover painel"
            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve hover:text-red-500 flex-shrink-0">
            <Trash2 size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl bg-ivory/60 py-3 text-center">
            <p className="font-display text-2xl font-bold text-onyx">{(panel.total_features ?? total).toLocaleString('pt-BR')}</p>
            <p className="font-body text-[11px] text-mauve mt-0.5">Features no exame</p>
          </div>
          <div className="rounded-2xl bg-ivory/60 py-3 text-center">
            <p className="font-display text-2xl font-bold text-onyx">{categories.length}</p>
            <p className="font-body text-[11px] text-mauve mt-0.5">Categorias identificadas</p>
          </div>
        </div>
        {categories.length > 0 && (
          <p className="font-body text-[11px] text-mauve mt-3">
            {categories.map(c => c.name).join(' · ')}
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <AddResult panelId={panel.id} domain={panel.domain} defaultDate={panel.collected_on}
          onSaved={() => { setRowsByCat({}); setOpen(null); loadPanel() }} />
        <ImportResults panelId={panel.id}
          onDone={() => { setRowsByCat({}); setOpen(null); loadPanel() }} />
      </div>

      {/* Níveis 2 e 3 — categorias → features */}
      {categories.length === 0 ? (
        <Card padding="xl" className="text-center">
          <p className="font-body text-sm text-mauve">Nenhum resultado neste painel ainda.</p>
          <p className="font-body text-xs text-mauve mt-1">Use <strong>Adicionar resultado</strong> acima.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map(c => {
            const key = c.category_id ?? 'none'
            const expanded = open === key
            return (
              <Card key={key} padding="none" className="overflow-hidden">
                <button onClick={() => toggleCategory(c)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-blush/20 transition-colors text-left">
                  <span className="font-body text-sm font-semibold text-onyx">{c.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-body text-[11px] text-mauve">{c.count} {c.count === 1 ? 'feature' : 'features'}</span>
                    {expanded ? <ChevronDown size={15} className="text-mauve" /> : <ChevronRight size={15} className="text-mauve" />}
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-border/40">
                    {loadingCat === key ? (
                      <div className="p-5 text-center"><Loader2 size={18} className="animate-spin text-petal mx-auto" /></div>
                    ) : (rowsByCat[key] ?? []).length === 0 ? (
                      <p className="px-4 py-3 font-body text-xs text-mauve">Sem resultados.</p>
                    ) : (
                      <div className="divide-y divide-border/20">
                        {(rowsByCat[key] ?? []).map(r => (
                          <div key={r.id}>
                            <button onClick={() => toggleFeature(r)} disabled={!r.feature_id}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${r.feature_id ? 'hover:bg-ivory/50' : 'cursor-default'}`}>
                              <span className="font-body text-sm text-onyx flex-1 min-w-0 break-words">{r.feature_name}</span>
                              <span className="font-body text-sm font-semibold text-onyx">{r.value ?? r.raw_value ?? '—'}</span>
                              <span className="font-body text-xs text-mauve flex-shrink-0">{r.unit}</span>
                              {r.feature_id && (openFeature === r.feature_id
                                ? <ChevronDown size={14} className="text-mauve/40 flex-shrink-0" />
                                : <ChevronRight size={14} className="text-mauve/40 flex-shrink-0" />)}
                            </button>
                            {/* Nível 4 — histórico temporal (factual) */}
                            {openFeature === r.feature_id && r.feature_id && (
                              <FeatureHistory points={hist[r.feature_id]} refs={refs[r.feature_id]} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <p className="font-body text-[11px] text-mauve text-center leading-relaxed">
        Comparação factual ao longo do tempo. A SINTERA não indica melhora, piora ou normalização — apenas mostra os valores registrados.
      </p>

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

// ── Nível 4: histórico temporal ───────────────────────────────────────────
function FeatureHistory({ points, refs }: {
  points: HistPoint[] | undefined
  refs: { source: string; external_id: string; url: string | null }[] | undefined
}) {
  if (!points) return <div className="px-4 py-4 bg-ivory/40"><Loader2 size={16} className="animate-spin text-petal" /></div>
  const serie = points.map(p => parseNum(p.value != null ? String(p.value) : null)).filter((v): v is number => v !== null)
  return (
    <div className="px-4 py-3 bg-ivory/40 space-y-2">
      {serie.length >= 2 && (
        <div className="flex items-center gap-2 text-lavender"><Sparkline values={serie} className="text-lavender" /></div>
      )}
      {points.length === 0 ? (
        <p className="font-body text-xs text-mauve">Sem histórico.</p>
      ) : (
        <table className="w-full text-left">
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="border-b border-border/20 last:border-0">
                <td className="font-body text-[11px] text-mauve py-1 pr-3 whitespace-nowrap align-top">{fmtOmicsDate(p.measured_on) || '—'}</td>
                <td className="font-body text-xs text-onyx py-1"><strong>{p.value ?? '—'}</strong>{p.unit ? ` ${p.unit}` : ''}</td>
                <td className="font-body text-[11px] text-mauve py-1 text-right">{p.laboratory ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {refs && refs.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {refs.map((rf, i) => (
            <a key={i} href={rf.url ?? '#'} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline">
              {rf.source.toUpperCase()}: {rf.external_id} <ExternalLink size={9} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Entrada manual de resultado (usa a resolução de identidade do catálogo) ──
function AddResult({ panelId, domain, defaultDate, onSaved }: {
  panelId: string; domain: OmicsDomain; defaultDate: string | null; onSaved: () => void
}) {
  const { user } = useUser()
  const supabase = createClient()
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [method, setMethod] = useState('')
  const [date, setDate] = useState(defaultDate ?? '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resolved, setResolved] = useState<any>(null)
  const [resolving, setResolving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function resolve() {
    const term = name.trim()
    if (!term) { setResolved(null); return }
    setResolving(true)
    const res = await fetch(`/api/omics/search?q=${encodeURIComponent(term)}&domain=${domain}`)
    const json = await res.json().catch(() => ({}))
    const hit = json.resolved ?? (json.matches?.[0] ?? null)
    setResolved(hit)
    if (hit?.unit_default && !unit) setUnit(hit.unit_default)
    setResolving(false)
  }

  async function save() {
    if (!user || saving || !name.trim()) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('omics_results').insert({
      panel_id: panelId, user_id: user.id, domain,
      feature_id: resolved?.id ?? null,
      feature_name: resolved?.canonical_name ?? name.trim(),
      category_id: resolved?.category_id ?? null,
      value: value.trim() ? Number(value.replace(',', '.')) : null,
      unit: unit.trim() || null, raw_value: value.trim() || null,
      method: method.trim() || null, measured_on: date || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    setName(''); setValue(''); setUnit(''); setMethod(''); setResolved(null); setShow(false)
    onSaved()
  }

  if (!show) return (
    <button onClick={() => setShow(true)}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors">
      <Plus size={15} /> Adicionar resultado
    </button>
  )

  return (
    <Card padding="md" className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm font-semibold text-onyx">Adicionar resultado</p>
        <button onClick={() => setShow(false)} className="text-mauve hover:text-onyx"><X size={16} /></button>
      </div>
      <div>
        <label htmlFor="omics-result-feature" className="font-body text-xs text-mauve block mb-1">Feature (nome, sinônimo ou ID externo)</label>
        <input id="omics-result-feature" value={name} onChange={e => setName(e.target.value)} onBlur={resolve} placeholder="Ex.: Leucine, L-Leucine ou HMDB0000687"
          className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
        {resolving && <p className="font-body text-[11px] text-mauve mt-1">Resolvendo no catálogo…</p>}
        {resolved && (
          <p className="font-body text-[11px] text-petal mt-1">
            ✓ Identificado: <strong>{resolved.canonical_name}</strong>{resolved.omics_categories?.name ? ` · ${resolved.omics_categories.name}` : ''}
          </p>
        )}
        {!resolving && !resolved && name.trim() && (
          <p className="font-body text-[11px] text-mauve mt-1">Não encontrado no catálogo — será salvo como texto.</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="omics-result-valor" className="font-body text-xs text-mauve block mb-1">Valor</label>
          <input id="omics-result-valor" value={value} onChange={e => setValue(e.target.value)} placeholder="420"
            className="w-full px-2 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
        </div>
        <div>
          <label htmlFor="omics-result-unidade" className="font-body text-xs text-mauve block mb-1">Unidade</label>
          <input id="omics-result-unidade" value={unit} onChange={e => setUnit(e.target.value)} placeholder="µmol/L"
            className="w-full px-2 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
        </div>
        <div>
          <label htmlFor="omics-result-data" className="font-body text-xs text-mauve block mb-1">Data</label>
          <input id="omics-result-data" type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-2 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
        </div>
      </div>
      <div>
        <label htmlFor="omics-result-metodo" className="font-body text-xs text-mauve block mb-1">Método (opcional)</label>
        <input id="omics-result-metodo" value={method} onChange={e => setMethod(e.target.value)} placeholder="Ex.: LC-MS/MS"
          className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
      </div>
      {err && <p className="font-body text-xs text-red-500">{err}</p>}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving || !name.trim()}
          className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </Card>
  )
}

// ── Ingestão estruturada (CSV/JSON) + versões ──────────────────────────────
interface Version { version_number: number; source_file: string | null; note: string | null; created_at: string }

function ImportResults({ panelId, onDone }: { panelId: string; onDone: () => void }) {
  const { user } = useUser()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [showVersions, setShowVersions] = useState(false)

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/omics/panels/${panelId}/versions`)
    const json = await res.json().catch(() => ({ versions: [] }))
    setVersions((json.versions ?? []) as Version[])
  }, [panelId])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega versões na montagem (data fetching)
  useEffect(() => { loadVersions() }, [loadVersions])

  async function onFile(file: File) {
    if (!user) return
    setBusy(true); setErr(null); setMsg(null)
    try {
      const json = await uploadAndIngest(panelId, file, user.id, supabase)
      setMsg(`Versão v${json.version}: ${json.inserted} resultados importados (${json.resolved} identificados no catálogo).`)
      await loadVersions(); onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao importar o arquivo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" aria-label="Selecionar arquivo do laudo" accept=".csv,.json,.pdf,image/*,text/csv,application/json,application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
        <input ref={cameraRef} type="file" aria-label="Fotografar o laudo" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
        <button onClick={() => fileRef.current?.click()} disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Selecionar arquivo
        </button>
        <button onClick={() => cameraRef.current?.click()} disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors disabled:opacity-50">
          <Camera size={15} /> Fotografar o laudo
        </button>
        {versions.length > 0 && (
          <button onClick={() => setShowVersions(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-body text-xs text-mauve hover:text-petal transition-colors">
            <History size={13} /> {versions.length} {versions.length === 1 ? 'versão' : 'versões'}
          </button>
        )}
      </div>
      <p className="font-body text-[11px] text-mauve mt-1.5">PDF ou foto do laudo (a IA transcreve), ou CSV/JSON estruturado. O arquivo original é guardado e cada importação vira uma versão.</p>
      {msg && <p className="font-body text-xs text-petal mt-2">{msg}</p>}
      {err && <p className="font-body text-xs text-red-500 mt-2">{err}</p>}
      {showVersions && versions.length > 0 && (
        <Card padding="sm" className="mt-2 space-y-1.5">
          {versions.map(v => (
            <div key={v.version_number} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-body text-xs font-semibold text-onyx">v{v.version_number}</span>
                {v.note && <span className="font-body text-[11px] text-mauve"> · {v.note}</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-body text-[11px] text-mauve">{fmtOmicsDate(v.created_at)}</span>
                {v.source_file && (
                  <a href={v.source_file} target="_blank" rel="noopener noreferrer" className="text-petal hover:underline" title="Arquivo original">
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
          <p className="font-body text-[11px] text-mauve pt-1">Nenhuma versão é sobrescrita — todas permanecem acessíveis.</p>
        </Card>
      )}
    </div>
  )
}
