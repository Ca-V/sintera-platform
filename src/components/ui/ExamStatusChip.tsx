'use client'

// Chip de STATUS de exame — renderização única do vocabulário `lib/exams/presentation`.
// Elimina o markup + o mapa de ícone que estavam duplicados em dashboard/page e
// exams/page. A UI (aqui) resolve a CHAVE de ícone → componente lucide; o vocabulário
// (rótulo/cores) vem do dono de domínio.

import { CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react'
import { examStatusMeta, type ExamStatusIcon } from '@/lib/exams/presentation'

const ICONS: Record<ExamStatusIcon, React.ComponentType<{ size?: number; className?: string }>> = {
  check: CheckCircle,
  clock: Clock,
  spinner: Loader2,
  alert: AlertCircle,
}

export default function ExamStatusChip({
  status,
  size = 9,
  spinning = false,
}: {
  status: string
  size?: number
  /** anima o ícone (ex.: extração em andamento). */
  spinning?: boolean
}) {
  const meta = examStatusMeta(status)
  const Icon = ICONS[meta.icon]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-body font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
      <Icon size={size} className={spinning ? 'animate-spin' : ''} />
      {meta.label}
    </span>
  )
}
