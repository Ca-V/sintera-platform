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
import { expenseDocLabel } from '@/lib/finance/expense'
import AgendarModal, { type AgendaEventInput } from '@/components/AgendarModal'
import { useEventForm } from '@/components/eventForm'
import { useStickyView } from '@/lib/ui/useStickyView'
import ViewModeSwitcher from '@/components/ViewModeSwitcher'
import ListCard, { CardChip } from '@/components/ListCard'
import PageHeader from '@/components/PageHeader'
import ErrorBanner from '@/components/ErrorBanner'
import EmptyState from '@/components/EmptyState'
import { Card } from "@/lib/ui/ds"
import ConfirmDialog from '@/components/ConfirmDialog'

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// FB-008: projeta um EXAME-com-valor como lançamento de despesa (o financeiro é atributo do exame, não Evento).
// id prefixado 'exam:' distingue do evento — a exclusão limpa as colunas do exame (não apaga o exame).
function examExpenseToEntry(e: Record<string, unknown>): HealthEvent {
  return {
    id: `exam:${e.id as string}`, type: 'exame', title: (e.type as string) || 'Exame', isReturn: false,
    status: 'realizado', source: 'system', priority: null,
    date: (e.exam_date as string) || String(e.created_at ?? '').slice(0, 10),
    time: null, durationMin: null, reminderEnabled: false, reminderSentAt: null,
    professionalKind: null, professionalName: null, establishment: (e.issuer as string) ?? null, location: null,
    modality: null, preparation: null, notes: null, amountCents: (e.expense_amount_cents as number) ?? null,
    directExpense: true, attachmentUrl: (e.expense_doc_url as string) ?? null, expenseDocType: (e.expense_doc_type as string) ?? null,
    links: [{ type: 'exam', id: e.id as string }], outcome: null, recurrenceRule: null, seriesId: null,
    parentEventId: null, rootEventId: null, completedAt: null,
  }
}

export default function GastosPage() {
  const { user, loading: authLoading, } = useUser()
  const { services, saveEvent, supabase } = useEventForm()
  const [items, setItems] = useState<HealthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<number | null>(null)
  const [view, setView] = useStickyView<'data' | 'tipo'>('sintera:view:despesas', 'data')
  const [reloadKey, setReloadKey] = useState(0)
  const [showAddInfo, setShowAddInfo] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  useEffect(() => {
    if (authLoading) return
    let active = true
    ;(async () => {
      if (!user) { if (active) setLoading(false); return }
      const fin = await services.query.listFinancial(user.id)
      // FB-008: Despesas = PROJEÇÃO sobre TODOS os fatos com valor. O financeiro do exame é atributo do
      // próprio exame (não Evento) → projeta exames-com-valor; e exclui eventos legados vinculados a exame
      // (evita duplicar o mesmo fato). Cada fato aparece UMA vez.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: exData } = await (supabase as any).from('exams')
        .select('id,type,exam_date,created_at,issuer,expense_amount_cents,expense_doc_type,expense_doc_url')
        .eq('user_id', user.id).gt('expense_amount_cents', 0)
      if (!active) return
      const examEntries: HealthEvent[] = ((exData ?? []) as Array<Record<string, unknown>>).map(e => examExpenseToEntry(e))
      const finNoExamLinked = fin.filter(e => !e.links?.some(l => l.type === 'exam'))
      const merged = [...finNoExamLinked, ...examEntries]
      const sorted = [...merged].sort((a, b) => (a.date < b.date ? 1 : -1))
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
  function deleteGasto(r: HealthEvent) {
    if (busyId || !user) return
    const isExam = r.id.startsWith('exam:')
    const examId = isExam ? r.id.slice('exam:'.length) : null
    setConfirm({
      message: isExam
        ? `Remover o valor pago de "${r.title}"? O exame é mantido; apenas o registro financeiro sai das Despesas.`
        : `Excluir "${r.title}" das suas despesas? O evento é removido.`,
      confirmLabel: isExam ? 'Remover valor' : 'Excluir', onYes: async () => {
        setBusyId(r.id); setActionError(null)
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q = isExam
            ? (supabase as any).from('exams').update({ expense_amount_cents: null, expense_doc_type: null, expense_doc_url: null }).eq('id', examId)
            : (supabase as any).from('health_events').delete().eq('id', r.id)
          const { error } = await q
          if (error) { setActionError(`Não foi possível: ${error.message}`); return }
          setReloadKey(k => k + 1)
        } finally { setBusyId(null) }
      },
    })
  }

  const years = [...new Set(items.map(r => Number(r.date.slice(0, 4))))].sort((a, b) => b - a)
  const ofYear = items.filter(r => Number(r.date.slice(0, 4)) === year)
  const total = ofYear.reduce((s, r) => s + (r.amountCents ?? 0), 0)
  // Agrupamento por tipo (com subtotais) para a visão "Por tipo".
  const typeGroups = Object.values(
    ofYear.reduce<Record<string, { label: string; rows: HealthEvent[]; subtotal: number }>>((acc, r) => {
      const label = typeLabel(r.type)
      const g = (acc[label] ??= { label, rows: [], subtotal: 0 })
      g.rows.push(r); g.subtotal += r.amountCents ?? 0
      return acc
    }, {})
  ).sort((a, b) => b.subtotal - a.subtotal)

  function expenseRow(r: HealthEvent) {
    // FB-008: o lançamento de exame liga ao próprio exame (o fato). Eventos avulsos não têm destino.
    const examId = r.id.startsWith('exam:') ? r.id.slice('exam:'.length) : null
    return (
      <ListCard key={r.id}
        title={r.title}
        titleHref={examId ? `/dashboard/exams/${examId}` : undefined}
        meta={`${typeLabel(r.type)} · ${formatDateBR(r.date)}`}
        chips={
          <>
            <CardChip tone="sage">{fmtBRL(r.amountCents ?? 0)}</CardChip>
            {r.attachmentUrl && (
              <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline">
                <Paperclip size={10} /> {expenseDocLabel(r.expenseDocType) ?? 'Documento'}
              </a>
            )}
          </>
        }
        actions={
          <>
            {!r.directExpense && (
              <button aria-label="Reabrir" title="Reabrir (desfazer conclusão — volta para a Agenda)"
                disabled={busyId === r.id} onClick={() => reopenGasto(r)}
                className="w-6 h-6 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/40 hover:text-petal transition-colors disabled:opacity-40"><RotateCcw size={12} /></button>
            )}
            <button aria-label="Excluir" title="Excluir lançamento"
              disabled={busyId === r.id} onClick={() => deleteGasto(r)}
              className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/40 hover:text-red-400 transition-colors disabled:opacity-40"><Trash2 size={12} /></button>
          </>
        }
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <PageHeader
        icon={<Receipt size={16} />}
        eyebrow="Despesas"
        title="Despesas"
        subtitle={<>Os valores dos eventos que você <strong>concluiu</strong> na Agenda, com os comprovantes para baixar.</>}
        action={
          <button onClick={() => setShowAddInfo(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={15} /> Adicionar despesa
          </button>
        }
      />

      {showAddInfo && (
        <Card padding="md" className="flex items-start gap-3 border border-petal/20 bg-blush/15">
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
                  Novo medicamento ou produto
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
        </Card>
      )}

      <div className="rounded-2xl border border-border bg-ivory px-4 py-3 flex items-start gap-2.5">
        <Info size={15} className="text-mauve flex-shrink-0 mt-0.5" />
        <p className="font-body text-[11px] text-mauve leading-relaxed">
          Isto <strong>organiza</strong> suas despesas e comprovantes — útil, por exemplo, para juntar documentos da sua declaração.
          Não é orientação tributária; sobre o que é dedutível, consulte seu contador.
        </p>
      </div>

      <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} className="text-petal" />}
          title="Nenhuma despesa ainda"
          message={<>Ao <strong>concluir</strong> um evento na <Link href="/dashboard/agenda" className="text-petal hover:underline">Agenda</Link> com o <strong>valor pago</strong> informado, ele aparece aqui automaticamente.</>}
        />
      ) : (
        <>
          {/* Seletor de ano + total */}
          <Card padding="lg">
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
            <p className="font-body text-xs text-mauve mt-1">{ofYear.length} {ofYear.length === 1 ? 'registro' : 'registros'}</p>
          </Card>

          {/* Visualização: por data × por tipo */}
          <ViewModeSwitcher active={view} onChange={setView} modes={[{ value: 'data', label: 'Por data' }, { value: 'tipo', label: 'Por tipo' }]} />

          {view === 'data' ? (
            <div className="space-y-3">
              {[...ofYear].sort((a, b) => (a.date < b.date ? 1 : -1)).map(expenseRow)}
            </div>
          ) : (
            <div className="space-y-5">
              {typeGroups.map(g => (
                <div key={g.label}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="font-body text-xs font-semibold text-onyx uppercase tracking-wider">{g.label}</p>
                    <p className="font-body text-xs font-semibold text-petal">{fmtBRL(g.subtotal)}</p>
                  </div>
                  <div className="space-y-3">{g.rows.map(expenseRow)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Formulário ÚNICO de evento — mesma origem da Agenda e do Histórico */}
      <AgendarModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

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
