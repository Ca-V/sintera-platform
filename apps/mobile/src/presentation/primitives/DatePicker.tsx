// DatePicker — PADRÃO OFICIAL de entrada de data da plataforma (C-4). Mobile: campo que mostra a data formatada e
// abre o date picker NATIVO do SO (@react-native-community/datetimepicker) ao tocar — no lugar de digitar
// "AAAA-MM-DD". Valor em ISO (YYYY-MM-DD), MESMO contrato da Web (que usa o <input type="date"> nativo). A lógica
// de datas de DOMÍNIO permanece na sua SSOT; aqui é só apresentação/entrada. Sem regra de negócio (DS-003).
import { useState } from 'react'
import { Platform, Pressable } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { text } from '@sintera/design-system'
import { Text } from './Text'
import { useTheme } from '../theme'

/** ISO (YYYY-MM-DD) → Date local (meia-noite). Data inválida/ausente → hoje. */
function isoToDate(iso: string | null | undefined): Date {
  if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date()
}
/** Date → ISO (YYYY-MM-DD) local — mesmo formato de armazenamento da Web. */
function dateToISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
/** ISO → DD/MM/AAAA para exibição (pt-BR). */
function fmtBR(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// Contrato ÚNICO da plataforma (igual na Web). `min`/`max` em ISO (YYYY-MM-DD). Reservado para evoluções
// futuras do MESMO contrato (intervalo, bloqueio de datas, seleção de período) sem que as telas mudem.
type Props = {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  'aria-label'?: string
}

export function DatePicker({ value, onChange, placeholder = 'Selecionar data…', min, max, disabled, 'aria-label': ariaLabel }: Props) {
  const t = useTheme()
  const [open, setOpen] = useState(false)

  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android fecha ao escolher/cancelar; iOS mantém o spinner até "Concluir". 'dismissed' = cancelou.
    if (Platform.OS !== 'ios') setOpen(false)
    if (event.type === 'set' && selected) onChange(dateToISO(selected))
  }

  return (
    <>
      <Pressable
        accessibilityRole="button" aria-label={ariaLabel} disabled={disabled} onPress={() => setOpen(true)}
        style={{ borderWidth: 1, borderColor: t.color.border.default, backgroundColor: t.color.surface.base, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, opacity: disabled ? 0.5 : 1 }}
      >
        <Text spec={text(t, { role: 'body', tone: value ? 'default' : 'muted' })}>{value ? fmtBR(value) : placeholder}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={isoToDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onNativeChange}
          minimumDate={min ? isoToDate(min) : undefined}
          maximumDate={max ? isoToDate(max) : undefined}
        />
      )}
      {Platform.OS === 'ios' && open && (
        <Pressable onPress={() => setOpen(false)} style={{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Concluir</Text>
        </Pressable>
      )}
    </>
  )
}
