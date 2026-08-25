// TimePicker — PADRÃO OFICIAL de entrada de HORA da plataforma (HIP-014 §2). Mesmo desenho do DatePicker: campo
// que mostra a hora formatada e abre o picker NATIVO do SO ao tocar. Valor em "HH:MM" 24h, MESMO contrato da Web
// (que usa o <input type="time"> nativo) — para que a tela dos dois lados fale a mesma língua.
//
// POR QUE EXISTE: duas medições de pressão no mesmo dia só se distinguem pela hora. Sem esta primitiva o Mobile
// não teria como oferecer o que a Web oferece, e a paridade quebraria na entrada — que é justamente onde ela mais
// importa. O DS ganha a capacidade ANTES da tela consumi-la (princípio de DS promovido antes da aplicação).
//
// Vazio é estado LEGÍTIMO: hora é opcional, e quem não informa não deve ser obstruído. Sem regra de negócio (DS-003).
import { useState } from 'react'
import { Platform, Pressable, type ViewStyle } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { text } from '@sintera/design-system'
import { Text } from './Text'
import { useTheme } from '../theme'

/** "HH:MM" → Date local de hoje nessa hora. Ausente/inválida → agora (ponto de partida do picker). */
function hhmmToDate(hhmm: string | null | undefined): Date {
  const d = new Date()
  if (hhmm && /^\d{2}:\d{2}$/.test(hhmm)) {
    const [h, m] = hhmm.split(':').map(Number)
    d.setHours(h, m, 0, 0)
  }
  return d
}

/** Date → "HH:MM" 24h — mesmo formato de armazenamento da Web. */
function dateToHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Contrato ÚNICO da plataforma (igual na Web). Reservado para evoluções do MESMO contrato (minuto mínimo,
// intervalos) sem que as telas mudem.
type Props = {
  value: string
  onChange: (hhmm: string) => void
  placeholder?: string
  disabled?: boolean
  'aria-label'?: string
  style?: ViewStyle
}

export function TimePicker({ value, onChange, placeholder = 'Selecionar hora…', disabled, 'aria-label': ariaLabel, style }: Props) {
  const t = useTheme()
  const [open, setOpen] = useState(false)

  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android fecha ao escolher/cancelar; iOS mantém o spinner até "Concluir". 'dismissed' = cancelou.
    if (Platform.OS !== 'ios') setOpen(false)
    if (event.type === 'set' && selected) onChange(dateToHHMM(selected))
  }

  return (
    <>
      <Pressable
        accessibilityRole="button" aria-label={ariaLabel} disabled={disabled} onPress={() => setOpen(true)}
        style={[{ borderWidth: 1, borderColor: t.color.border.default, backgroundColor: t.color.surface.base, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, opacity: disabled ? 0.5 : 1 }, style]}
      >
        <Text spec={text(t, { role: 'body', tone: value ? 'default' : 'muted' })}>{value || placeholder}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={hhmmToDate(value)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onNativeChange}
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
