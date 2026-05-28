'use client'

import RingCard from '@/components/dashboard/RingCard'
import { BedDouble, Moon, Star, TrendingUp } from 'lucide-react'

const sleepDays = [
  { day: 'Seg', hours: 7.5, quality: 85 },
  { day: 'Ter', hours: 6.8, quality: 70 },
  { day: 'Qua', hours: 8.0, quality: 92 },
  { day: 'Qui', hours: 7.2, quality: 78 },
  { day: 'Sex', hours: 7.5, quality: 83 },
  { day: 'Sáb', hours: 8.5, quality: 95 },
  { day: 'Dom', hours: 7.0, quality: 75 },
]

export default function SonoPage() {
  const avg = (sleepDays.reduce((s, d) => s + d.hours, 0) / sleepDays.length).toFixed(1)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Sono & Recuperação</h1>
        <p className="font-body text-sm text-mauve">Qualidade do sono correlacionada com fases hormonais</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <RingCard title="Ontem" value="7.5" unit="h" sub="Qualidade: ótima"
          pct={94} icon={BedDouble} gradient="#A89CBD, #C5B8D8" gradientId="gSl2"
          accentColor="#A89CBD" delay={0.1} />
        <RingCard title="Média semanal" value={avg} unit="h" sub="Meta: 8h por noite"
          pct={Number(avg) / 8 * 100} icon={Moon} gradient="#C2849A, #D4A0B5" gradientId="gAv2"
          accentColor="#C2849A" delay={0.15} />
        <RingCard title="Qualidade" value="83" unit="%" sub="Acima da sua média"
          pct={83} icon={Star} gradient="#7DAF9E, #9ECFBF" gradientId="gQl2"
          accentColor="#7DAF9E" delay={0.2} />
      </div>

      {/* Bar chart */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-body text-sm font-semibold text-onyx">Esta semana</h2>
          <span className="text-xs font-body text-mauve">Média: <strong className="text-onyx">{avg}h</strong></span>
        </div>
        <div className="flex items-end gap-3 h-32">
          {sleepDays.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-body text-mauve">{d.hours}h</span>
              <div className="w-full rounded-t-lg transition-all duration-700 relative overflow-hidden"
                style={{ height: `${(d.hours / 10) * 100}%`, backgroundColor: '#E2D9EE' }}>
                <div className="absolute bottom-0 left-0 right-0 rounded-t-lg"
                  style={{ height: `${d.quality}%`, background: 'linear-gradient(180deg, #A89CBD, #C5B8D8)' }} />
              </div>
              <span className="text-[10px] font-body text-mauve">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-lavender-light" />
            <span className="text-[10px] font-body text-mauve">Duração</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-lavender" />
            <span className="text-[10px] font-body text-mauve">Qualidade</span>
          </div>
        </div>
      </div>

      <div className="card-premium p-6">
        <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">Correlação com ciclo</h2>
        <div className="flex flex-col gap-2.5">
          {[
            { phase: 'Menstrual',  avg: '7.1h', note: 'Sono mais leve, mais interrompido' },
            { phase: 'Folicular',  avg: '7.5h', note: 'Melhora progressiva da qualidade', active: true },
            { phase: 'Ovulatória', avg: '7.3h', note: 'Estável, recuperação rápida' },
            { phase: 'Lútea',      avg: '8.0h', note: 'Sono mais longo, progesterona alta' },
          ].map(p => (
            <div key={p.phase}
              className={`flex items-center gap-4 p-3 rounded-xl ${p.active ? 'bg-lavender-light/40' : ''}`}>
              <span className="w-24 text-xs font-body font-medium text-onyx flex-shrink-0">{p.phase}</span>
              <span className="font-display text-base font-semibold text-lavender w-12 flex-shrink-0">{p.avg}</span>
              <span className="text-xs font-body text-mauve">{p.note}</span>
              {p.active && <span className="w-1.5 h-1.5 rounded-full bg-petal animate-pulse-soft ml-auto flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
