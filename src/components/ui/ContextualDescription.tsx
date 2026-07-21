'use client'

// ============================================================
// DESCRIÇÃO CONTEXTUAL — primitivo transversal do Design System (fundadora 18/07)
// ============================================================
// CONCEITO (não é um "card de hover", nem específico da navegação): ajudar o usuário a compreender
// IMEDIATAMENTE a finalidade de QUALQUER elemento da interface — responde "quando eu uso isto?",
// orientando a AÇÃO e comunicando o BENEFÍCIO. É AGNÓSTICO de contexto: serve à barra lateral, mas
// também a menus, dashboards, assistentes, cards, páginas, atalhos e qualquer outro ponto da UI.
// O gatilho visual pode evoluir (hover, clique, popover, toque no mobile) sem mudar o conceito — por
// isso o componente é totalmente desacoplado do gatilho e do consumidor (recebe só o texto).
//
// Uso (qualquer elemento):
//   const { tip, bind } = useContextualDescription()
//   <button {...bind('Consulte seus exames e acompanhe a evolução…')}>Item</button>  // hover E foco (a11y)
//   <ContextualDescriptionCard tip={tip} />                                            // 1 card por consumidor
//
// Padrão do TEXTO (voz única da plataforma): 1 frase · começa com verbo · BENEFÍCIO antes da funcionalidade
// · exemplos só quando agregam · linguagem simples · máx. 2 linhas.
//
// Posição FIXED (via getBoundingClientRect) para NÃO ser cortada por containers com scroll/overflow.
// Só desktop por ora (hidden lg:block); mobile terá outro gatilho quando fizer sentido.

import { useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'

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

/** Card da descrição — 1 por consumidor. `fixed` + PORTAL para o body: escapa de qualquer ancestral com
 *  overflow/transform/filter (ex.: a Sidebar com `overflow-hidden` das "flores"), garantindo que apareça. */
export function ContextualDescriptionCard({ tip, gap = 10 }: { tip: ContextualTip; gap?: number }) {
  if (!tip || typeof document === 'undefined') return null
  return createPortal(
    <div className="hidden lg:block fixed z-[80] max-w-[264px] pointer-events-none"
      style={{ top: tip.top, left: tip.left + gap }}>
      <div className="rounded-xl bg-white shadow-xl border border-border px-3 py-2.5">
        <p className="font-body text-xs text-onyx leading-relaxed">{tip.text}</p>
      </div>
    </div>,
    document.body,
  )
}
