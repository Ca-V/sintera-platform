// ============================================================
// SINTERA — Design System: SUPERFÍCIE DO CAMPO DE FORMULÁRIO
// ============================================================
// Conceito permanente ÚNICO: "Campo de Formulário" é uma SUPERFÍCIE visual/
// comportamental (borda, fundo, raio, tipografia, foco, estado de erro) —
// element-agnostic. NÃO é um componente por controle: `<input>`, `<select>`,
// `<textarea>` e `<input type="date">` são VARIAÇÕES sobre esta mesma superfície.
//
// Antes desta fundação, a string de estilo do campo estava copiada 60+ vezes em
// ~10 páginas, com 3 aparências divergentes do MESMO campo — a divergência visual
// Web×Mobile que a estabilização elimina. O `Input` (DS) reusa esta superfície; os
// controles nativos das páginas também. `cn`/twMerge resolve overrides por instância
// (largura, `bg-white`, padding), sem reintroduzir duplicação.
//
// Largura/layout (w-full/flex-1/min-w-0) NÃO fazem parte da superfície: o default é
// `w-full` (caso dominante) e o consumidor sobrepõe quando o layout exigir.
// ============================================================

import { cn } from '@/lib/utils'

/** Classe da superfície canônica do campo. `error` ativa o estado inválido; `className`
 *  sobrepõe por instância (largura, bg, padding) via twMerge. */
export function fieldClass(opts?: { error?: boolean; className?: string }): string {
  return cn(
    // superfície: borda · fundo · raio · tipografia
    'w-full rounded-xl border border-border bg-ivory px-3 py-2 font-body text-sm text-onyx',
    // estado FOCO
    'focus:outline-none focus:ring-1 focus:ring-petal/30',
    // estado DESABILITADO (todos os controles suportam `disabled`; parte do conceito)
    'disabled:cursor-not-allowed disabled:opacity-60',
    // estado ERRO
    opts?.error && 'border-red-300 focus:ring-red-200 focus:border-red-400',
    opts?.className,
  )
}
