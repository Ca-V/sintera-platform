'use client'

// Cabeçalho de abas do módulo Histórico de Saúde — duas visões da MESMA jornada
// longitudinal: Linha do Tempo (eventos no tempo) e Evolução (números no tempo).
// Compartilhado pelas rotas /dashboard/timeline e /dashboard/saude para que se
// apresentem como um único módulo. Sem lógica de dados — só navegação.

import Link from 'next/link'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'linha',    href: '/dashboard/timeline', label: 'Linha do Tempo' },
  { key: 'evolucao', href: '/dashboard/saude',    label: 'Evolução' },
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
