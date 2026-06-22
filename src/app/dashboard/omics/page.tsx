'use client'

// ============================================================
// Ômica — lista de painéis (Nível 0, dentro de Exames e Documentos)
// ============================================================
// A SINTERA armazena, organiza, versiona, compara e visualiza dados ômicos.
// Não interpreta, não classifica risco, não infere e não recomenda.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, X, Dna, ArrowLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { DOMAIN_LABEL, DOMAINS, fmtOmicsDate, type OmicsDomain } from '@/lib/omics/domains'

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
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [panels, setPanels] = useState<Panel[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [domain, setDomain] = useState<OmicsDomain>('metabolomics')
  const [lab, setLab] = useState('')
  const [tech, setTech] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/omics/panels')
    const json = await res.json().catch(() => ({ panels: [] }))
    setPanels((json.panels ?? []) as Panel[])
    setLoading(false)
  }, [])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() { setDomain('metabolomics'); setLab(''); setTech(''); setDate(''); setErr(null) }

  async function save() {
    if (!user || saving) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('omics_panels').insert({
      user_id: user.id, domain, laboratory: lab.trim() || null, technology: tech.trim() || null,
      collected_on: date || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/exams" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Exames e Documentos
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <Dna size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Exames e Documentos</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Ômica</h1>
          <p className="font-body text-sm text-mauve mt-1">Metabolômica, proteômica, microbioma e outros. A SINTERA organiza, versiona e compara seus dados — sem interpretação clínica.</p>
        </div>
        <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Novo painel'}
        </button>
      </div>

      {showForm && (
        <div className="card-premium p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Tipo de ômica</label>
              <select value={domain} onChange={e => setDomain(e.target.value as OmicsDomain)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                {DOMAINS.map(d => <option key={d} value={d}>{DOMAIN_LABEL[d]}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Data do exame</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Laboratório</label>
              <input type="text" value={lab} onChange={e => setLab(e.target.value)} placeholder="Opcional"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Tecnologia</label>
              <input type="text" value={tech} onChange={e => setTech(e.target.value)} placeholder="Ex.: LC-MS/MS"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : 'Criar painel'}
            </button>
          </div>
          <p className="font-body text-[11px] text-mauve/50">Entrada manual. A importação por PDF/CSV entra em uma próxima fase.</p>
        </div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
      ) : panels.length === 0 ? (
        <div className="card-premium p-8 text-center space-y-1">
          <p className="font-body text-sm text-mauve">Nenhum painel de ômica registrado ainda.</p>
          <p className="font-body text-xs text-mauve/60">Use <strong>Novo painel</strong> para começar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {panels.map(p => (
            <Link key={p.id} href={`/dashboard/omics/${p.id}`}
              className="card-premium p-4 flex items-center justify-between gap-3 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-lavender-light flex items-center justify-center flex-shrink-0">
                  <Dna size={16} className="text-lavender" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-onyx">{DOMAIN_LABEL[p.domain]}</p>
                  <p className="font-body text-[11px] text-mauve/70">
                    {[fmtOmicsDate(p.collected_on ?? p.created_at), p.laboratory, p.technology].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-mauve/40 group-hover:text-petal transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Organização factual dos seus dados ômicos. A SINTERA não interpreta resultados nem gera conclusões clínicas.
      </p>
    </div>
  )
}
