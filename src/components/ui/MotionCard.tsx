'use client'

import { motion } from 'framer-motion'
import { type ComponentProps } from 'react'
import { cardClassName, type CardPadding } from './Card'

interface MotionCardProps extends ComponentProps<typeof motion.div> {
  /** Espaçamento interno canônico. Default 'md' (p-5). */
  padding?: CardPadding
}

// Card premium ANIMADO (Design System · TEMA B). `motion.div` + estilo canônico
// do card. Para os cards com entrada animada (framer-motion) que antes usavam
// `<motion.div className="card-premium p-X" initial=… animate=…>`. Repassa todas
// as props de motion (initial/animate/transition/…) e herda a escala do Card.
export default function MotionCard({ padding = 'md', className, children, ...props }: MotionCardProps) {
  return (
    <motion.div className={cardClassName(padding, className)} {...props}>
      {children}
    </motion.div>
  )
}
