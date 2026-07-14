'use client'

// ============================================================
// Ômica — lista de painéis (Nível 0, dentro de Exames)
// ============================================================
// A SINTERA armazena, organiza, versiona, compara e visualiza dados ômicos.
// Não interpreta, não classifica risco, não infere e não recomenda.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Loader2, Plus, X, Dna, ArrowLeft, ChevronRight, Upload, Camera, Paperclip } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { DOMAIN_LABEL, DOMAINS, fmtOmicsDate, type OmicsDomain } from '@/lib/omics/domains'
import { uploadAndIngest } from '@/lib/omics/ingestClient'
import ListCard from '@/components/ListCard'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/PageHeader'
import Disclaimer from '@/components/ui/Disclaimer'

interface Panel {
  id: string
  domain: OmicsDomain
  laboratory: string | null
  technology: string | null
  total_features: number | null
  collected_on: string | null
  created_at: string
}

export default function OmicsListPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [panels, setPanels] = useState<Panel[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [domain, setDomain] = useState<OmicsDomain>('metabolomics')
  const [lab, setLab] = useState('')
  const [tech, setTech] = useState('')
  const [date, setDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/omics/panels')
    const json = await res.json().catch(() => ({ panels: [] }))
    setPanels((json.panels ?? []) as Panel[])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega dados na montagem (data fetching)
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() { setDomain('metabolomics'); setLab(''); setTech(''); setDate(''); setFile(null); setErr(null); setProgress(null) }

  // Cria o painel e, se houver arquivo, já importa — num passo só.
  async function save() {
    if (!user || saving) return
    setSaving(true); setErr(null); setProgress('Criando exame…')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('omics_panels').insert({
      user_id: user.id, domain, laboratory: lab.trim() || null, technology: tech.trim() || null,
      collected_on: date || null,
    }).select('id').single()
    if (error || !data) { setSaving(false); setErr(error?.message ?? 'Falha ao criar.'); setProgress(null); return }
    const panelId = data.id as string

    if (file) {
      try {
        setProgress('Enviando e lendo o laudo…')
        await uploadAndIngest(panelId, file, user.id, supabase)
      } catch {
        // Painel criado; importação falhou — leva ao painel para tentar de novo lá.
        setSaving(false)
        router.push(`/dashboard/omics/${panelId}`)
        return
      }
    }
    setSaving(false); reset(); setShowForm(false)
    router.push(`/dashboard/omics/${panelId}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/exams" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Exames
      </Link>

      <PageHeader icon={<Dna size={16} />} eyebrow="Ômica" title="Ômica"
        subtitle={<>Metabolômica, proteômica, microbioma e outros. Toque em <strong className="text-onyx/70 font-medium">Adicionar exame</strong> e anexe o laudo (PDF, foto, CSV ou JSON). A SINTERA organiza, versiona e compara seus dados — sem interpretação clínica.</>}
        action={
          <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
            className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar exame'}
          </button>
        } />

      {showForm && (
        <Card padding="md" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="omics-tipo" className="font-body text-xs text-mauve block mb-1">Tipo de ômica</label>
              <select id="omics-tipo" value={domain} onChange={e => setDomain(e.target.value as OmicsDomain)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                {DOMAINS.map(d => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="omics-data" className="font-body text-xs text-mauve block mb-1">Data do exame</label>
              <input id="omics-data" type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="omics-laboratorio" className="font-body text-xs text-mauve block mb-1">Laboratório</label>
              <input id="omics-laboratorio" type="text" value={lab} onChange={e => setLab(e.target.value)} placeholder="Opcional"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label htmlFor="omics-tecnologia" className="font-body text-xs text-mauve block mb-1">Tecnologia</label>
              <input id="omics-tecnologia" type="text" value={tech} onChange={e => setTech(e.target.value)} placeholder="Ex.: LC-MS/MS"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {/* Upload do laudo (opcional) — selecionar arquivo ou tirar foto */}
          <div>
            <label className="font-body text-xs text-mauve block mb-1.5">Laudo do exame</label>
            <input ref={fileRef} type="file" aria-label="Selecionar arquivo do laudo" accept=".csv,.json,.pdf,image/*,text/csv,application/json,application/pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = '' }} />
            <input ref={cameraRef} type="file" aria-label="Fotografar o laudo" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = '' }} />
            {file ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-petal/30 bg-blush/30 px-3 py-2">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Paperclip size={14} className="text-petal flex-shrink-0" />
                  <span className="font-body text-xs text-onyx truncate">{file.name}</span>
                </span>
                <button onClick={() => setFile(null)} className="text-mauve hover:text-red-500 flex-shrink-0"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors">
                  <Upload size={15} /> Selecionar arquivo
                </button>
                <button onClick={() => cameraRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors">
                  <Camera size={15} /> Fotografar o laudo
                </button>
              </div>
            )}
            <p className="font-body text-[11px] text-mauve mt-1.5">PDF ou foto do laudo (a IA transcreve), ou CSV/JSON estruturado. Opcional — você também pode criar vazio e adicionar resultados depois.</p>
          </div>

          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex items-center justify-end gap-3">
            {saving && progress && <span className="font-body text-xs text-mauve">{progress}</span>}
            <button onClick={save} disabled={saving}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Processando…' : file ? 'Criar e importar' : 'Criar exame'}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : panels.length === 0 ? (
        <Card padding="xl" className="text-center space-y-1">
          <p className="font-body text-sm text-mauve">Nenhum exame de ômica registrado ainda.</p>
          <p className="font-body text-xs text-mauve">Toque em <strong>Adicionar exame</strong> e anexe o laudo (PDF, foto, CSV ou JSON).</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {panels.map(p => (
            <ListCard
              key={p.id}
              titleHref={`/dashboard/omics/${p.id}`}
              leading={
                <div className="w-9 h-9 rounded-xl bg-lavender-light flex items-center justify-center flex-shrink-0">
                  <Dna size={16} className="text-lavender" />
                </div>
              }
              title={DOMAIN_LABEL[p.domain]}
              trailing={<ChevronRight size={16} className="text-mauve/40 flex-shrink-0" />}
              meta={[fmtOmicsDate(p.collected_on ?? p.created_at), p.laboratory, p.technology].filter(Boolean).join(' · ')}
            />
          ))}
        </div>
      )}

      <Disclaimer variant="laudo" className="text-center" />
    </div>
  )
}
