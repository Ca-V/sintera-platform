'use client'

// AttachmentLink (R-ATTACH) — afordância ÚNICA para ABRIR um documento anexado (laudo/PDF/nota fiscal), com
// abertura segura em nova aba (rel noopener) e cópia consistente. Paridade com o primitivo Mobile (AttachmentLink →
// Linking.openURL): mesmo comportamento e rótulos; só a apresentação adapta. Se não houver URL, não renderiza nada
// (o chamador decide o estado vazio). Sem regra de negócio (DS-003).
import type { ReactNode } from 'react'

type Props = {
  url: string | null | undefined
  label: string
  icon?: ReactNode
  /** 'pill' = botão com borda (padrão); 'inline' = link de texto discreto. */
  variant?: 'pill' | 'inline'
  className?: string
}

export default function AttachmentLink({ url, label, icon, variant = 'pill', className = '' }: Props) {
  if (!url) return null
  if (variant === 'inline') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline ${className}`}>
        {icon}{label} →
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 border border-border text-mauve font-body text-sm font-medium px-3 py-2.5 rounded-full hover:border-petal/40 hover:text-petal transition-colors ${className}`}>
      {icon}{label}
    </a>
  )
}
