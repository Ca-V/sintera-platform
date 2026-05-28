import InsightsPanel from '@/components/dashboard/InsightsPanel'
import { Sparkles } from 'lucide-react'

export default function InsightsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Insights & IA</h1>
        <p className="font-body text-sm text-mauve">Recomendações personalizadas baseadas no seu ciclo e dados biológicos</p>
      </div>

      {/* Score banner */}
      <div className="card-dark p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl gradient-sintera flex items-center justify-center flex-shrink-0 shadow-lg">
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <p className="font-body text-xs text-white/40 uppercase tracking-widest mb-1">Esta semana</p>
          <p className="font-display text-xl font-semibold text-white mb-0.5">5 novos insights gerados</p>
          <p className="font-body text-xs text-white/50">Com base no seu ciclo, energia e padrões de sono</p>
        </div>
        <div className="ml-auto hidden sm:block text-right">
          <p className="font-display text-3xl font-semibold text-gradient">87</p>
          <p className="font-body text-xs text-white/40">score geral</p>
        </div>
      </div>

      <InsightsPanel />
    </div>
  )
}
