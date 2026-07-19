'use client'

import { useEffect, useRef, type RefObject } from 'react'

// Acessibilidade de MODAL/diálogo (TEMA G · G3), reutilizável — nenhuma tela
// reimplementa foco/Escape. Enquanto `active`:
//   • foco inicial vai para o primeiro elemento focável do diálogo (ou o container);
//   • Escape chama `onClose`;
//   • Tab fica APRISIONADO dentro do diálogo (não vaza para o fundo);
//   • ao fechar, o foco RETORNA para quem abriu o modal.
// O container deve ter `tabIndex={-1}` (fallback de foco) + role="dialog"/aria-modal.
export function useModalA11y(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  active = true,
): void {
  // `onClose` costuma ser recriado a cada render (arrow inline / função no componente). Guardamos a
  // versão mais recente num ref para que o efeito de foco NÃO dependa dela — senão ele re-executaria a
  // cada tecla e devolveria o foco ao 1º elemento do diálogo (foco "pulando" ao digitar). Deps = [active].
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!active) return
    const node = ref.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = (): HTMLElement[] =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
            ),
          ).filter(el => el.offsetParent !== null)
        : []

    // Foco inicial dentro do diálogo.
    const first = focusables()[0]
    ;(first ?? node)?.focus?.()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current(); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) { e.preventDefault(); node?.focus?.(); return }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
    // Só re-executa ao ABRIR/FECHAR (active) — nunca a cada render/tecla. `onClose` vem do ref acima.
  }, [ref, active])
}
