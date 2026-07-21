'use client'

import { motion } from 'framer-motion'
import { type ComponentProps } from 'react'
import { cardClassName, type CardPadding } from '@/lib/ui/ds'

interface MotionCardProps extends ComponentProps<typeof motion.div> {
  /** Espaçamento interno. Default 'md' (p-5). */
  padding?: CardPadding
}

// Card ANIMADO (DS-002). `motion.div` + a classe do cartão DS-002 (`.ds-card`). Repassa todas as props de
// motion (initial/animate/transition/…) e herda a escala de padding. Substitui o antigo MotionCard (DS-001).
export default function MotionCard({ padding = 'md', className, children, ...props }: MotionCardProps) {
  return (
    <motion.div className={cardClassName(padding, className)} {...props}>
      {children}
    </motion.div>
  )
}
