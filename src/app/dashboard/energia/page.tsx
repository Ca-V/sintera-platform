'use client'

import RingCard from '@/components/dashboard/RingCard'
import WeeklyChart from '@/components/dashboard/WeeklyChart'
import { Zap, TrendingUp, Clock, Battery } from 'lucide-react'

export default function EnergiaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Energia & Performance</h1>
        <p className="font-body text-sm text-mauve">Acompanhe seus níveis de energia ao longo do ciclo</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <RingCard title="Energia hoje" value="84" unit="%" sub="+12% vs. média da fase"
          pct={84} icon={Zap} gradient="#C9A97A, #E2C49A" gradientId="gEn2"
          accentColor="#C9A97A" delay={0.1} />
        <RingCard title="Pico esperado" value="3" unit="dias" sub="Fase ovulatória chegando"
          pct={70} icon={TrendingUp} gradient="#C2849A, #D4A0B5" gradientId="gPe2"
          accentColor="#C2849A" delay={0.15} />
        <RingCard title="Recuperação" value="8.5" unit="h" sub="Sono reparador ontem"
          pct={85} icon={Battery} gradient="#7DAF9E, #9ECFBF" gradientId="gRe2"
          accentColor="#7DAF9E" delay={0.2} />
      </div>

      <WeeklyChart />

      <div className="card-premium p-6">
        <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">Padrão por fase</h2>
        <div className="flex flex-col gap-3">
          {[
            { phase: 'Menstrual',  avg: 55, color: '#C2849A' },
            { phase: 'Folicular',  avg: 82, color: '#A89CBD', active: true },
            { phase: 'Ovulatória', avg: 91, color: '#7DAF9E' },
            { phase: 'Lútea',      avg: 67, color: '#C9A97A' },
          ].map(p => (
            <div key={p.phase} className={`flex items-center gap-4 p-3 rounded-xl ${p.active ? 'bg-blush' : ''}`}>
              <span className="w-20 text-xs font-body text-mauve flex-shrink-0">{p.phase}</span>
              <div className="flex-1 h-2 bg-ivory rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${p.avg}%`, backgroundColor: p.color }} />
              </div>
              <span className="w-10 text-right text-xs font-body font-medium" style={{ color: p.color }}>
                {p.avg}%
              </span>
              {p.active && <span className="w-1.5 h-1.5 rounded-full bg-petal animate-pulse-soft flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
