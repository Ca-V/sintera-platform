'use client'

// WEA-001 / HIP-001 — V2 Épico 3.3: comunicação DISCRETA do benefício de retorno.
// "O usuário percebe que a SINTERA trabalhou por ele sem fazer nada." Sem animações; dispensável.
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import Card from '@/components/ui/Card'

export default function HistoryGrewNotice({ count, onDismiss }: { count: number; onDismiss: () => void }) {
  if (count <= 0) return null
  return (
    <Card padding="md" className="border-petal/30 bg-blush/50">
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
        <button onClick={onDismiss} title="Dispensar"
          className="p-1 rounded-lg text-mauve hover:text-petal hover:bg-white/50 transition-colors flex-shrink-0"><X size={15} /></button>
      </div>
    </Card>
  )
}
