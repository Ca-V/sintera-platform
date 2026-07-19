'use client'

// ============================================================
// DESCRIÇÃO CONTEXTUAL — infraestrutura reutilizável da plataforma (fundadora 18/07)
// ============================================================
// CONCEITO (não é um "card de hover"): ajudar o usuário a compreender IMEDIATAMENTE a finalidade de uma
// área — responde "quando eu uso isto?", orientando a AÇÃO. O gatilho visual pode evoluir (hover, clique,
// popover, toque no mobile); o conceito permanece. Por isso o componente é desacoplado do gatilho.
//
// Uso genérico (qualquer menu/assistente/ponto da interface):
//   const { tip, bind } = useContextualDescription()
//   <button {...bind('Registre e acompanhe…')}>Item</button>   // hover E foco por teclado (acessível)
//   <ContextualDescriptionCard tip={tip} />                     // 1 card fixo por consumidor
//
// Posição FIXED (via getBoundingClientRect) para NÃO ser cortada por containers com scroll/overflow.
// Só desktop por ora (hidden lg:block); mobile terá outro gatilho quando fizer sentido.

import { useState, type SyntheticEvent } from 'react'

export type ContextualTip = { text: string; top: number; left: number } | null

/** Estado + binder de eventos. `bind(text)` devolve handlers de hover/foco; texto vazio = sem descrição. */
export function useContextualDescription() {
  const [tip, setTip] = useState<ContextualTip>(null)
  const show = (text: string | undefined) => (e: SyntheticEvent<HTMLElement>) => {
    if (!text) return
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ text, top: r.top, left: r.right })
  }
  const hide = () => setTip(null)
  const bind = (text?: string) => ({
    onMouseEnter: show(text), onFocus: show(text), onMouseLeave: hide, onBlur: hide,
  })
  return { tip, bind }
}

/** Card da descrição — 1 por consumidor. Posicionado ao lado do elemento (fixed, escapa o clip do scroll). */
export function ContextualDescriptionCard({ tip, gap = 10 }: { tip: ContextualTip; gap?: number }) {
  if (!tip) return null
  return (
    <div className="hidden lg:block fixed z-[80] max-w-[264px] pointer-events-none"
      style={{ top: tip.top, left: tip.left + gap }}>
      <div className="rounded-xl bg-white shadow-xl border border-border px-3 py-2.5">
        <p className="font-body text-xs text-onyx leading-relaxed">{tip.text}</p>
      </div>
    </div>
  )
}
