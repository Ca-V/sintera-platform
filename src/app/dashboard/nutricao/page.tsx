'use client'

import { Apple, Droplets, Flame, Leaf } from 'lucide-react'
import RingCard from '@/components/dashboard/RingCard'

const phaseTips = [
  { phase: 'Menstrual',  color: '#C2849A', foods: ['Alimentos ricos em ferro', 'Chocolate amargo', 'Legumes verde-escuros', 'Gengibre e cúrcuma'],   avoid: ['Álcool', 'Cafeína em excesso', 'Alimentos inflamatórios'] },
  { phase: 'Folicular',  color: '#A89CBD', foods: ['Proteínas magras', 'Vegetais fermentados', 'Sementes de linhaça', 'Frutas vermelhas'],           avoid: ['Açúcar refinado', 'Processados'], active: true },
  { phase: 'Ovulatória', color: '#7DAF9E', foods: ['Vegetais crucíferos', 'Fibras solúveis', 'Frutas frescas', 'Sementes de abóbora'],               avoid: ['Sódio em excesso'] },
  { phase: 'Lútea',      color: '#C9A97A', foods: ['Magnésio (banana, abacate)', 'Carboidratos complexos', 'Cálcio', 'Vitamina B6'],                avoid: ['Sal', 'Cafeína', 'Açúcar'] },
]

export default function NutricaoPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Nutrição por Fase</h1>
        <p className="font-body text-sm text-mauve">Alimentos e nutrientes ideais para cada fase do seu ciclo</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <RingCard title="Hidratação" value="1.8" unit="L" sub="Meta: 2.5L · 72%"
          pct={72} icon={Droplets} gradient="#7DAF9E, #9ECFBF" gradientId="gHy3" accentColor="#7DAF9E" delay={0.1} />
        <RingCard title="Proteína" value="68" unit="g" sub="Meta: 80g · 85%"
          pct={85} icon={Flame} gradient="#C2849A, #D4A0B5" gradientId="gPr3" accentColor="#C2849A" delay={0.15} />
        <RingCard title="Fibras" value="22" unit="g" sub="Meta: 25g · 88%"
          pct={88} icon={Leaf} gradient="#C9A97A, #E2C49A" gradientId="gFi3" accentColor="#C9A97A" delay={0.2} />
      </div>

      <div>
        <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">Guia nutricional por fase</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {phaseTips.map((p, i) => (
            <div key={p.phase} className={`card-premium p-5 ${p.active ? 'ring-1 ring-petal/30' : ''}`}>
              {p.active && (
                <span className="inline-flex items-center gap-1 text-[10px] font-body font-semibold text-petal-dark bg-blush border border-petal-light px-2.5 py-0.5 rounded-full mb-3">
                  <span className="w-1 h-1 rounded-full bg-petal inline-block" /> Fase atual
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <h3 className="font-body text-sm font-semibold text-onyx">{p.phase}</h3>
              </div>
              <div className="mb-3">
                <p className="text-[10px] font-body text-mauve uppercase tracking-wider mb-2">✓ Priorize</p>
                <ul className="flex flex-col gap-1">
                  {p.foods.map(f => (
                    <li key={f} className="text-xs font-body text-onyx/75 flex items-center gap-1.5">
                      <Apple size={10} style={{ color: p.color, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-body text-mauve uppercase tracking-wider mb-2">✕ Evite</p>
                <ul className="flex flex-col gap-1">
                  {p.avoid.map(f => (
                    <li key={f} className="text-xs font-body text-mauve/70 flex items-center gap-1.5">
                      <span className="text-red-300 text-[10px]">—</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
