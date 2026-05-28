import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react'

const reports = [
  { month: 'Maio 2025',  status: 'available', highlights: ['Fase Folicular estável', 'Energia +15% vs. abril', 'Sono médio: 7.4h'] },
  { month: 'Abril 2025', status: 'available', highlights: ['Ciclo de 27 dias', 'Cortisol elevado na lútea', 'Hidratação abaixo da meta'] },
  { month: 'Março 2025', status: 'available', highlights: ['Ciclo de 29 dias', 'Energia consistente', '3 insights gerados pela IA'] },
]

export default function RelatoriosPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Relatórios</h1>
        <p className="font-body text-sm text-mauve">Resumos mensais com tendências, padrões e insights da IA</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Calendar,    label: 'Ciclos monitorados', value: '3', color: 'text-petal',   bg: 'bg-blush' },
          { icon: TrendingUp,  label: 'Tendência geral',    value: '↑ Ótima', color: 'text-sage', bg: 'bg-sage-light' },
          { icon: BarChart3,   label: 'Insights gerados',   value: '14',  color: 'text-lavender', bg: 'bg-lavender-light' },
        ].map(s => (
          <div key={s.label} className="card-premium p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xs font-body text-mauve">{s.label}</p>
              <p className={`font-display text-xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly reports */}
      <div className="flex flex-col gap-4">
        {reports.map((r, i) => (
          <div key={r.month} className="card-premium p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-onyx">{r.month}</h3>
                <span className="text-xs font-body text-sage font-medium bg-sage-light px-2.5 py-0.5 rounded-full">
                  Disponível
                </span>
              </div>
              <button className="flex items-center gap-2 text-xs font-body font-medium text-petal hover:underline">
                <Download size={13} /> Baixar PDF
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              {r.highlights.map(h => (
                <div key={h} className="flex items-start gap-2 p-3 bg-ivory rounded-xl">
                  <span className="text-petal text-[10px] mt-0.5 flex-shrink-0">✦</span>
                  <span className="text-xs font-body text-onyx/75">{h}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card-dark p-5 text-center">
        <p className="font-body text-sm font-semibold text-white mb-1">Relatórios com IA — Em breve</p>
        <p className="font-body text-xs text-white/50">
          Análise automática de biomarcadores, tendências longitudinais e recomendações personalizadas geradas pela IA da SINTERA.
        </p>
      </div>
    </div>
  )
}
