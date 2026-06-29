'use client'

// Barra de filtro por categoria (chips com ícone, ligáveis). SÓ apresentação:
// recebe as categorias e o conjunto selecionado, devolve toggles — não conhece
// dados nem persistência. Reutilizável (Histórico/Linha do Tempo, Relatório…),
// para não duplicar a UI de seleção de categorias.

import type React from 'react'

export interface FilterCategory {
  key: string
  label: string
  Icon: React.ElementType
}

interface Props {
  categories: FilterCategory[]
  selected: Set<string>
  onToggle: (key: string) => void
  /** Frase-guia opcional acima dos chips (deixa claro que são clicáveis). */
  label?: string
}

export default function CategoryFilterBar({ categories, selected, onToggle, label }: Props) {
  if (categories.length <= 1) return null // 0/1 categoria → filtro não agrega
  return (
    <div className="space-y-2">
      {label && <p className="font-body text-xs text-mauve">{label}</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label={label ?? 'Filtrar por categoria'}>
        {categories.map(({ key, label: catLabel, Icon }) => {
        const on = selected.has(key)
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-body text-xs font-medium transition-colors ${
              on
                ? 'gradient-sintera text-white border-transparent'
                : 'bg-ivory text-mauve/60 border-border hover:border-petal/40'
            }`}
          >
            <Icon size={13} className={on ? 'text-white' : 'text-mauve/40'} />
            {catLabel}
          </button>
        )
        })}
      </div>
    </div>
  )
}
