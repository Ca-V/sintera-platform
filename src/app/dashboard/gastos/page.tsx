'use client'

// Gastos com saúde — PROJEÇÃO dos eventos da jornada REALIZADOS com valor.
// Não cria registros próprios: lê o contrato @/lib/agenda (query.listFinancial),
// nunca o banco. Agrupa por ano, com comprovantes para download. Não é orientação
// tributária — apenas organiza.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Paperclip, Receipt, ArrowLeft, Info, Plus, X, RotateCcw, Trash2 } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { typeLabel, formatDateBR, type HealthEvent } from '@/lib/agenda'
import AgendarModal, { type AgendaEventInput } from '@/components/AgendarModal'
import { useEventForm } from '@/components/eventForm'

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function GastosPage() {
  const { user, loading: authLoading, } = useUser()
  const { services, saveEvent, supabase } = useEventForm()
  const [items, setItems] = useState<HealthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [showAddInfo, setShowAddInfo] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    let active = true
    ;(async () => {
      if (!user) { if (active) setLoading(false); return }
      const fin = await services.query.listFinancial(user.id)
      if (!active) return
      const sorted = [...fin].sort((a, b) => (a.date < b.date ? 1 : -1))
      setItems(sorted)
      const years = [...new Set(sorted.map(r => Number(r.date.slice(0, 4))))].sort((a, b) => b - a)
      setYear(years[0] ?? new Date().getFullYear())
      setLoading(false)
    })()
    return () => { active = false }
  }, [authLoading, user, services, reloadKey])

  async function handleSave(input: AgendaEventInput) {
    if (!user) return
    await saveEvent(user.id, input, null)
    setModalOpen(false); setShowAddInfo(false); setReloadKey(k => k + 1)
  }

  // Reabrir: desfaz a conclusão (correção) — sai de Gastos, volta para a Agenda.
  async function reopenGasto(r: HealthEvent) {
    if (busyId || !user) return
    setBusyId(r.id); setActionError(null)
    try { await services.command.reopen(user.id, r); setReloadKey(k => k + 1) }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Não foi possível reabrir.') }
    finally { setBusyId(null) }
  }
  // Excluir o lançamento (o evento) de vez.
  async function deleteGasto(r: HealthEvent) {
    if (busyId || !user) return
    if (!window.confirm(`Excluir "${r.title}" das suas despesas? O evento é removido.`)) return
    setBusyId(r.id); setActionError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('health_events').delete().eq('id', r.id)
      if (error) { setActionError(`Não foi possível excluir: ${error.message}`); return }
      setReloadKey(k => k + 1)
    } finally { setBusyId(null) }
  }

  const years = [...new Set(items.map(r => Number(r.date.slice(0, 4))))].sort((a, b) => b - a)
  const ofYear = items.filter(r => Number(r.date.slice(0, 4)) === year)
  const total = ofYear.reduce((s, r) => s + (r.amountCents ?? 0), 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <Receipt size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Despesas</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Despesas</h1>
          <p className="font-body text-sm text-mauve mt-1 leading-relaxed">
            Os valores dos eventos que você <strong>concluiu</strong> na Agenda, com os comprovantes para baixar.
          </p>
        </div>
        <button onClick={() => setShowAddInfo(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          <Plus size={15} /> Adicionar despesa
        </button>
      </div>

      {showAddInfo && (
        <div className="card-premium p-5 flex items-start gap-3 border border-petal/20 bg-blush/15">
          <Info size={17} className="text-petal flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            <p className="font-body text-xs text-mauve leading-relaxed">A despesa é o <strong className="text-onyx">valor pago</strong> de um evento ou de uma compra.</p>
            <div>
              <p className="font-body text-xs font-semibold text-onyx mb-1.5">Ainda não registrei</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-mauve font-body text-xs font-medium hover:border-petal/40 hover:text-petal transition-colors">
                  Novo evento
                </button>
                <Link href="/dashboard/medicamentos"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-mauve font-body text-xs font-medium hover:border-petal/40 hover:text-petal transition-colors">
                  Novo medicamento
                </Link>
              </div>
            </div>
            <div>
              <p className="font-body text-xs font-semibold text-onyx mb-1.5">Já registrei — só faltou o valor</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/timeline"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-mauve font-body text-xs font-medium hover:border-petal/40 hover:text-petal transition-colors">
                  Ir ao Histórico
                </Link>
                <Link href="/dashboard/medicamentos"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-mauve font-body text-xs font-medium hover:border-petal/40 hover:text-petal transition-colors">
                  Ir a Medicamentos
                </Link>
              </div>
            </div>
          </div>
          <button onClick={() => setShowAddInfo(false)} aria-label="Fechar" className="text-mauve/40 hover:text-onyx transition-colors flex-shrink-0"><X size={15} /></button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-ivory px-4 py-3 flex items-start gap-2.5">
        <Info size={15} className="text-mauve/50 flex-shrink-0 mt-0.5" />
        <p className="font-body text-[11px] text-mauve leading-relaxed">
          Isto <strong>organiza</strong> suas despesas e comprovantes — útil, por exemplo, para juntar documentos da sua declaração.
          Não é orientação tributária; sobre o que é dedutível, consulte seu contador.
        </p>
      </div>

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-body text-xs text-red-600">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <p className="font-body text-sm text-mauve">
            Nenhuma despesa registrada ainda. Ao <strong>concluir</strong> um evento na <Link href="/dashboard/agenda" className="text-petal hover:underline">Agenda</Link> com
            o <strong>valor pago</strong> informado, ele aparece aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          {/* Seletor de ano + total */}
          <div className="card-premium p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {years.map(y => (
                <button key={y} onClick={() => setYear(y)}
                  className={`font-body text-sm rounded-full px-3.5 py-1.5 border transition-colors ${
                    y === year ? 'gradient-sintera text-white border-transparent' : 'bg-ivory text-mauve border-border hover:border-petal/40'
                  }`}>
                  {y}
                </button>
              ))}
            </div>
            <p className="font-body text-xs text-mauve uppercase tracking-wider">Total de despesas em {year}</p>
            <p className="font-display text-3xl font-semibold text-onyx mt-1">{fmtBRL(total)}</p>
            <p className="font-body text-xs text-mauve/60 mt-1">{ofYear.length} {ofYear.length === 1 ? 'registro' : 'registros'}</p>
          </div>

          {/* Lista do ano */}
          <div className="space-y-3">
            {ofYear.map(r => (
              <div key={r.id} className="card-premium p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-onyx break-words">{r.title}</p>
                  <p className="font-body text-[11px] text-mauve/60">{typeLabel(r.type)} · {formatDateBR(r.date)}</p>
                  {r.attachmentUrl ? (
                    <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline mt-1">
                      <Paperclip size={11} /> Baixar nota fiscal
                    </a>
                  ) : (
                    <span className="font-body text-[11px] text-mauve/40 mt-1 inline-block">Sem comprovante anexado</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-body text-sm font-semibold text-sage">{fmtBRL(r.amountCents ?? 0)}</span>
                  {!r.directExpense && (
                    <button aria-label="Reabrir" title="Reabrir (desfazer conclusão — volta para a Agenda)"
                      disabled={busyId === r.id} onClick={() => reopenGasto(r)}
                      className="w-7 h-7 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/60 hover:text-petal transition-colors disabled:opacity-40">
                      <RotateCcw size={13} />
                    </button>
                  )}
                  <button aria-label="Excluir" title="Excluir lançamento"
                    disabled={busyId === r.id} onClick={() => deleteGasto(r)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-400 transition-colors disabled:opacity-40">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Formulário ÚNICO de evento — mesma origem da Agenda e do Histórico */}
      <AgendarModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
