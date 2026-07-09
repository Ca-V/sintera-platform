import { cn } from '@/lib/utils'
import { DISCLAIMERS, type DisclaimerVariant } from '@/lib/ui/copy'

// Aviso regulatório (RDC 657) — componente único do Design System (TEMA A).
// O texto vem SEMPRE de copy.ts (DISCLAIMERS); as telas param de redigir o
// próprio aviso à mão. Uma variante por contexto factual.
export default function Disclaimer({
  variant = 'geral',
  className,
}: {
  variant?: DisclaimerVariant
  className?: string
}) {
  return (
    <p className={cn('font-body text-[11px] text-mauve leading-relaxed', className)}>
      {DISCLAIMERS[variant]}
    </p>
  )
}
