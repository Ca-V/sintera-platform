'use client'

// Cross-link entre dois módulos RELACIONADOS mas distintos (FB-010): Registros de Saúde
// (eventos no tempo, /dashboard/timeline) e Histórico de Exames (biomarcadores no tempo,
// /dashboard/saude). São jornadas diferentes — não uma fusão de dados; este cabeçalho só
// facilita transitar entre elas. Sem lógica de dados — só navegação.

import Link from 'next/link'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'linha',    href: '/dashboard/timeline', label: 'Registros de Saúde' },
  { key: 'evolucao', href: '/dashboard/saude',    label: 'Histórico de Exames' },
] as const

export default function HistoricoTabs({ active }: { active: 'linha' | 'evolucao' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map(t => (
        <Link key={t.key} href={t.href}
          className={cn(
            'px-3.5 py-1.5 rounded-full font-body text-sm font-medium transition-colors',
            t.key === active
              ? 'gradient-sintera text-white'
              : 'bg-ivory border border-border text-mauve hover:border-petal/40',
          )}>
          {t.label}
        </Link>
      ))}
    </div>
  )
}
