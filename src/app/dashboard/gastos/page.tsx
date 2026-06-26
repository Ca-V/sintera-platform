'use client'

// Gastos com saúde — PROJEÇÃO dos eventos da jornada REALIZADOS com valor.
// Não cria registros próprios: lê o contrato @/lib/agenda (query.listFinancial),
// nunca o banco. Agrupa por ano, com comprovantes para download. Não é orientação
// tributária — apenas organiza.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Paperclip, Receipt, ArrowLeft, Info } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { eventServicesFor, typeLabel, formatDateBR, type HealthEvent } from '@/lib/agenda'

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function GastosPage() {
  const { user, loading: authLoading } = useUser()
  const [supabase] = useState(() => createClient() as unknown as SupabaseClient)
  const services = useMemo(() => eventServicesFor(supabase), [supabase])
  const [items, setItems] = useState<HealthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<number | null>(null)

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
  }, [authLoading, user, services])

  const years = [...new Set(items.map(r => Number(r.date.slice(0, 4))))].sort((a, b) => b - a)
  const ofYear = items.filter(r => Number(r.date.slice(0, 4)) === year)
  const total = ofYear.reduce((s, r) => s + (r.amountCents ?? 0), 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <div>
        <div className="inline-flex items-center gap-1.5 text-petal mb-2">
          <Receipt size={16} />
          <span className="font-body text-xs font-medium uppercase tracking-wider">Gastos com Saúde</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-onyx">Gastos com Saúde</h1>
        <p className="font-body text-sm text-mauve mt-1 leading-relaxed">
          Os valores dos eventos que você <strong>concluiu</strong> na Agenda, com os comprovantes para baixar.
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
            Nenhum gasto registrado ainda. Ao <strong>concluir</strong> um evento na <Link href="/dashboard/agenda" className="text-petal hover:underline">Agenda</Link> com
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
                <span className="font-body text-sm font-semibold text-sage flex-shrink-0">{fmtBRL(r.amountCents ?? 0)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
