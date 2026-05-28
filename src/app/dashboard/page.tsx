'use client'

import { Zap, BedDouble, Droplets } from 'lucide-react'
import DailyScoreCard from '@/components/dashboard/DailyScoreCard'
import RingCard from '@/components/dashboard/RingCard'
import CycleArc from '@/components/dashboard/CycleArc'
import WeeklyChart from '@/components/dashboard/WeeklyChart'
import InsightsPanel from '@/components/dashboard/InsightsPanel'
import QuickLogCard from '@/components/dashboard/QuickLogCard'

const rings = [
  {
    title: 'Energia',
    value: '84',
    unit: '%',
    sub: '+12% vs. média da fase',
    pct: 84,
    icon: Zap,
    gradient: '#C9A97A, #E2C49A',
    gradientId: 'gEn',
    accentColor: '#C9A97A',
    delay: 0.15,
  },
  {
    title: 'Sono',
    value: '7.5',
    unit: 'h',
    sub: 'Meta: 8h · Qualidade ótima',
    pct: 94,
    icon: BedDouble,
    gradient: '#A89CBD, #C5B8D8',
    gradientId: 'gSl',
    accentColor: '#A89CBD',
    delay: 0.22,
  },
  {
    title: 'Hidratação',
    value: '1.8',
    unit: 'L',
    sub: 'Meta: 2.5L · 72% atingida',
    pct: 72,
    icon: Droplets,
    gradient: '#7DAF9E, #9ECFBF',
    gradientId: 'gHy',
    accentColor: '#7DAF9E',
    delay: 0.29,
  },
]

export default function DashboardPage() {
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-5">

      {/* ── Row 1: Score (dark) + Ring metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <DailyScoreCard/>
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rings.map(r => <RingCard key={r.title} {...r}/>)}
        </div>
      </div>

      {/* ── Row 2: Cycle Arc + Weekly Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <CycleArc/>
        </div>
        <div className="lg:col-span-2">
          <WeeklyChart/>
        </div>
      </div>

      {/* ── Row 3: Insights + Quick Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <InsightsPanel/>
        </div>
        <div className="lg:col-span-2">
          <QuickLogCard/>
        </div>
      </div>

    </div>
  )
}
