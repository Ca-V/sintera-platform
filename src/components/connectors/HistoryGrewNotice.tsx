'use client'

// NOV-001 — banner de AVISO (Painel Inicial): comunicação DISCRETA de que a SINTERA incorporou conteúdo novo
// sozinha. É uma superfície de AVISO: apenas REFLETE a novidade (fonte única = useNovelty). NÃO marca visto e NÃO
// tem botão de "dispensar" — o aviso some naturalmente quando o usuário vê o conteúdo no módulo (Composição).
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Card } from "@/lib/ui/ds"

export default function HistoryGrewNotice({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Card padding="relaxed" className="border-petal/30 bg-blush/50">
      <div className="flex items-start gap-3">
        <Sparkles size={18} className="text-petal flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-body text-sm font-medium text-onyx">Sua história cresceu.</p>
          <p className="font-body text-sm text-mauve">
            {count === 1 ? '1 nova medição foi incorporada' : `${count} novas medições foram incorporadas`} automaticamente,
            sem você fazer nada. Veja na <Link href="/dashboard/medidas" className="text-petal underline">Composição Corporal</Link>
            {' '}e no <Link href="/dashboard/sinais-vitais" className="text-petal underline">Monitoramento</Link>.
          </p>
        </div>
      </div>
    </Card>
  )
}
