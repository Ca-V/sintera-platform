'use client'

// ============================================================
// Gastos com saúde — organização financeira (não é orientação tributária)
// ============================================================
// Soma os valores que a usuária registrou nos eventos da jornada (particular)
// e agrupa por ANO, com os comprovantes/notas fiscais anexados para download.
// Útil, por exemplo, para juntar documentos da declaração de imposto de renda.
// NÃO calcula dedução nem dá orientação tributária — apenas organiza.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Paperclip, Receipt, ArrowLeft, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', vacina: 'Vacina', procedimento: 'Procedimento',
  estetico: 'Procedimento estético', medicamento: 'Medicamento', exame: 'Exame', outro: 'Evento',
}

interface PaidEvent {
  id: string
  title: string
  eventType: string
  date: string
  amountCents: number
  attachmentUrl: string | null
}

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtDate(date: string): string {
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function GastosPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<PaidEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('health_events')
      .select('id, title, event_type, event_date, amount_cents, attachment_url')
      .eq('user_id', user.id)
      .eq('synthetic', false)
      .not('amount_cents', 'is', null)
    const rows: PaidEvent[] = ((data ?? []) as Array<Record<string, unknown>>).map(r => ({
      id: r.id as string,
      title: (r.title as string) ?? 'Evento',
      eventType: (r.event_type as string) ?? 'outro',
      date: r.event_date as string,
      amountCents: (r.amount_cents as number) ?? 0,
      attachmentUrl: (r.attachment_url as string) ?? null,
    }))
    rows.sort((a, b) => (a.date < b.date ? 1 : -1))
    setItems(rows)
    const years = [...new Set(rows.map(r => Number(r.date.slice(0, 4))))].sort((a, b) => b - a)
    setYear(years[0] ?? new Date().getFullYear())
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  const years = [...new Set(items.map(r => Number(r.date.slice(0, 4))))].sort((a, b) => b - a)
  const ofYear = items.filter(r => Number(r.date.slice(0, 4)) === year)
  const total = ofYear.reduce((s, r) => s + r.amountCents, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/timeline" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Minha Jornada
      </Link>

      <div>
        <div className="inline-flex items-center gap-1.5 text-petal mb-2">
          <Receipt size={16} />
          <span className="font-body text-xs font-medium uppercase tracking-wider">Gastos com saúde</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-onyx">Seus gastos com saúde</h1>
        <p className="font-body text-sm text-mauve mt-1 leading-relaxed">
          Soma dos valores que você registrou na sua jornada, com os comprovantes para baixar.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-ivory px-4 py-3 flex items-start gap-2.5">
        <Info size={15} className="text-mauve/50 flex-shrink-0 mt-0.5" />
        <p className="font-body text-[11px] text-mauve leading-relaxed">
          Isto <strong>organiza</strong> seus gastos e comprovantes — útil, por exemplo, para juntar documentos da sua declaração.
          Não é orientação tributária; sobre o que é dedutível, consulte seu contador.
        </p>
      </div>

      {loading ? (
        <div className="card-premium p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <p className="font-body text-sm text-mauve">
            Nenhum gasto registrado ainda. Ao adicionar um evento em <Link href="/dashboard/timeline" className="text-petal hover:underline">Minha Jornada</Link>,
            informe o <strong>valor pago</strong> e anexe a <strong>nota fiscal</strong> — eles aparecem aqui.
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
            <p className="font-body text-xs text-mauve uppercase tracking-wider">Total gasto em {year}</p>
            <p className="font-display text-3xl font-semibold text-onyx mt-1">{fmtBRL(total)}</p>
            <p className="font-body text-xs text-mauve/60 mt-1">{ofYear.length} {ofYear.length === 1 ? 'registro' : 'registros'}</p>
          </div>

          {/* Lista do ano */}
          <div className="space-y-3">
            {ofYear.map(r => (
              <div key={r.id} className="card-premium p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-onyx truncate">{r.title}</p>
                  <p className="font-body text-[11px] text-mauve/60">{TYPE_LABEL[r.eventType] ?? 'Evento'} · {fmtDate(r.date)}</p>
                  {r.attachmentUrl ? (
                    <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline mt-1">
                      <Paperclip size={11} /> Baixar nota fiscal
                    </a>
                  ) : (
                    <span className="font-body text-[11px] text-mauve/40 mt-1 inline-block">Sem comprovante anexado</span>
                  )}
                </div>
                <span className="font-body text-sm font-semibold text-sage flex-shrink-0">{fmtBRL(r.amountCents)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
