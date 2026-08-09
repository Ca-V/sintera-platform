'use client'

// DatePicker — PADRÃO OFICIAL de entrada de data da plataforma (C-4). Web: envolve o <input type="date"> NATIVO
// (calendário do navegador — localizado, acessível, zero dependência), com o estilo do DS. Valor em ISO
// (YYYY-MM-DD), MESMO contrato do Mobile (que usa o date picker nativo do SO). A REGRA de data continua em
// @/lib/date; aqui é só apresentação. Sem regra de negócio (DS-003): reutilizável em qualquer campo de data.

type Props = {
  value: string
  onChange: (v: string) => void
  min?: string
  max?: string
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export default function DatePicker({
  value, onChange, min, max, disabled, 'aria-label': ariaLabel, className = '',
}: Props) {
  return (
    <input
      type="date"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30 disabled:opacity-50 ${className}`}
    />
  )
}
