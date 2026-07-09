'use client'

// Seletor de PERÍODO reutilizável (DS-001), consumidor de `@/lib/communication/period`.
// Presets + intervalo personalizado. Usado pelo Relatório e, futuramente, por PDF/
// compartilhamento/impressão/exportações/Timeline/Dashboards.

import { type Period, PERIOD_PRESETS } from '@/lib/communication/period'

const inputCls = 'px-2 py-1 border border-border rounded-lg font-body text-xs text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30'

export default function PeriodSelector({ period, onChange, className = '' }: {
  period: Period
  onChange: (p: Period) => void
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_PRESETS.map(opt => {
          const active = period.preset === opt.value
          return (
            <button key={opt.value} type="button"
              onClick={() => onChange({ preset: opt.value, from: period.from, to: period.to })}
              className={`font-body text-xs rounded-full px-3 py-1 border transition-colors ${
                active ? 'gradient-sintera text-white border-transparent' : 'bg-ivory text-mauve border-border hover:border-petal/40'}`}>
              {opt.label}
            </button>
          )
        })}
      </div>
      {period.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <label className="font-body text-[11px] text-mauve">De
            <input type="date" value={period.from ?? ''} onChange={e => onChange({ ...period, preset: 'custom', from: e.target.value })} className={`${inputCls} ml-1.5`} />
          </label>
          <label className="font-body text-[11px] text-mauve">até
            <input type="date" value={period.to ?? ''} onChange={e => onChange({ ...period, preset: 'custom', to: e.target.value })} className={`${inputCls} ml-1.5`} />
          </label>
        </div>
      )}
    </div>
  )
}
