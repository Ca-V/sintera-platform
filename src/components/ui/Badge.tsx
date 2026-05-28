import { cn } from '@/lib/utils'

type BadgeVariant = 'rose' | 'lavender' | 'sage' | 'gold' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  rose: 'bg-blush text-petal-dark border border-petal-light',
  lavender: 'bg-lavender-light text-lavender border border-lavender/30',
  sage: 'bg-sage-light text-sage border border-sage/30',
  gold: 'bg-warm text-gold border border-gold/40',
  neutral: 'bg-ivory text-mauve border border-border',
}

export default function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-body',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
