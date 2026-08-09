'use client'

// Select universal (PS-1) — paridade com o primitivo Mobile (D-16). Em vez do <select> nativo (aparência
// inconsistente entre navegadores/SO) ou de paredes de opções abertas, mostra um campo COMPACTO que abre um
// popover ROLÁVEL com BUSCA quando a lista é grande. Aceita lista PLANA (`options`) ou AGRUPADA (`groups`,
// equivalente a <optgroup>). Sem regra de negócio (DS-003): reutilizável em qualquer campo com mais de uma
// opção. Mesmo contrato de comportamento da Web e do Mobile — só a apresentação é adaptada por plataforma.
import { useEffect, useMemo, useRef, useState } from 'react'

export type SelectOption = { value: string; label: string }
export type SelectGroup = { label: string; options: readonly SelectOption[] }

type Props = {
  /** Lista plana. Use OU `options` OU `groups`. */
  options?: readonly SelectOption[]
  /** Lista agrupada (cabeçalhos por grupo — equivale a <optgroup>). */
  groups?: readonly SelectGroup[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Título do popover (ex.: "Filtrar por tipo"). */
  title?: string
  /** Força a busca; por padrão aparece quando há mais de 8 opções. */
  searchable?: boolean
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export default function Select({
  options, groups, value, onChange, placeholder = 'Selecionar…', title, searchable, disabled,
  'aria-label': ariaLabel, className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  // Normaliza para grupos (lista plana = um grupo sem rótulo). `flat` serve à busca de rótulo atual e à contagem.
  const allGroups: readonly SelectGroup[] = useMemo(
    () => groups ?? (options ? [{ label: '', options }] : []),
    [groups, options],
  )
  const flat = useMemo(() => allGroups.flatMap(g => g.options), [allGroups])
  const current = flat.find(o => o.value === value)
  const canSearch = searchable ?? flat.length > 8

  const filteredGroups = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return allGroups
    return allGroups
      .map(g => ({ label: g.label, options: g.options.filter(o => o.label.toLowerCase().includes(s)) }))
      .filter(g => g.options.length > 0)
  }, [allGroups, q])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const toggle = () => { if (disabled) return; setQ(''); setOpen(o => !o) }
  const hasResults = filteredGroups.some(g => g.options.length > 0)

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
        disabled={disabled} onClick={toggle}
        className="w-full flex items-center gap-2 py-2 px-3 bg-ivory border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40 disabled:opacity-50"
      >
        <span className={`flex-1 text-left truncate ${current ? 'text-onyx' : 'text-mauve'}`}>{current?.label ?? placeholder}</span>
        <span className="text-mauve text-xs" aria-hidden>▾</span>
      </button>
      {open && (
        <div role="listbox" className="absolute z-50 mt-1 w-full max-h-72 overflow-auto bg-ivory border border-border rounded-xl shadow-lg py-1">
          {title && <div className="px-3 py-1.5 font-body text-[11px] uppercase tracking-wide text-mauve">{title}</div>}
          {canSearch && (
            <div className="px-2 pb-1.5 pt-1 sticky top-0 bg-ivory">
              <input
                autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar…"
                className="w-full py-1.5 px-2 bg-white border border-border rounded-lg font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40"
              />
            </div>
          )}
          {!hasResults ? (
            <div className="px-3 py-2 font-body text-sm text-mauve">Nada encontrado</div>
          ) : filteredGroups.map((g, gi) => (
            <div key={g.label || `g${gi}`}>
              {g.label && <div className="px-3 pt-2 pb-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-mauve/70">{g.label}</div>}
              {g.options.map(o => {
                const active = o.value === value
                return (
                  <button
                    key={o.value} type="button" role="option" aria-selected={active}
                    onClick={() => { onChange(o.value); setOpen(false) }}
                    className={`w-full text-left px-3 py-2 font-body text-sm hover:bg-petal/10 ${active ? 'text-petal font-medium' : 'text-onyx'}`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
