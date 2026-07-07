'use client'

// Seletor de visualização REUTILIZÁVEL — mesmo estilo, posição e comportamento em
// todas as listas (Agenda, Histórico, Despesas, Medicamentos). Só mudam as opções.
// Ex.: modes={[{value:'data',label:'Por data'},{value:'tipo',label:'Por tipo'}]}.

export interface ViewMode<T extends string> {
  value: T
  label: string
}

export default function ViewModeSwitcher<T extends string>({ modes, active, onChange, className = '' }: {
  modes: ViewMode<T>[]
  active: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {modes.map(m => (
        <button key={m.value} type="button" onClick={() => onChange(m.value)}
          className={`font-body text-xs rounded-full px-3 py-1 border transition-colors ${
            active === m.value ? 'gradient-sintera text-white border-transparent' : 'bg-ivory text-mauve border-border hover:border-petal/40'
          }`}>
          {m.label}
        </button>
      ))}
    </div>
  )
}
