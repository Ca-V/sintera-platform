'use client'

import { useEffect, useRef, type RefObject } from 'react'

// Acessibilidade de MODAL/diálogo — IMPLEMENTAÇÃO OFICIAL da plataforma (fundadora 18/07). TODO modal
// da SINTERA usa este hook; nenhuma tela reimplementa foco/Escape/trap. Infraestrutura reutilizável.
//
// PRINCÍPIO PERMANENTE (inviolável): o **foco inicial acontece SOMENTE quando o modal ABRE**. Nenhuma
// atualização de estado, renderização, validação ou digitação pode mover o foco do usuário. Por isso o
// efeito depende apenas de `[ref, active]` e lê `onClose` de um ref — nunca das deps (senão re-focaria a
// cada tecla). Qualquer evolução deste hook deve preservar esse invariante.
//
// Enquanto `active`, garante (auditado nos 4 modais consumidores — AgendarModal, Hub de Registro,
// ConfirmDialog, Reportar problema):
//   • foco inicial no primeiro elemento focável do diálogo (ou o container) — só na abertura;
//   • Escape chama `onClose`;
//   • Tab fica APRISIONADO dentro do diálogo (não vaza para o fundo) — navegação completa por teclado;
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
