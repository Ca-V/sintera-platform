// Primitivo RN — Select (D-16). Em vez de listar TODAS as opções abertas na tela (parede de chips), mostra um
// campo compacto que abre um bottom-sheet ROLÁVEL onde a pessoa escolhe — com BUSCA quando a lista é grande.
// Sem regra de negócio (DS-003): reutilizável em filtros, tipo de exame, recorrência de lembrete, etc.
import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, View, StyleSheet, type ViewStyle } from 'react-native'
import { text } from '@sintera/design-system'
import { useTheme } from '../theme'
import { Text } from './Text'
import { Input } from './Input'

export type SelectOption = { id: string; label: string }
type Props = {
  options: readonly SelectOption[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Título do bottom-sheet (ex.: "Filtrar por tipo"). */
  title?: string
  /** Força busca; por padrão aparece quando há mais de 8 opções. */
  searchable?: boolean
  style?: ViewStyle
}

export function Select({ options, value, onChange, placeholder = 'Selecionar…', title, searchable, style }: Props) {
  const t = useTheme()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const current = options.find(o => o.id === value)
  const canSearch = searchable ?? options.length > 8
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? options.filter(o => o.label.toLowerCase().includes(s)) : options
  }, [options, q])

  return (
    <>
      <Pressable onPress={() => { setQ(''); setOpen(true) }}
        style={[styles.field, { borderColor: t.color.border.default, backgroundColor: t.color.surface.base }, style]}>
        <Text spec={text(t, { role: 'body', tone: current ? 'default' : 'muted' })} style={{ flex: 1 }} numberOfLines={1}>{current?.label ?? placeholder}</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: t.color.surface.base }]} onPress={() => { /* consome o toque (não fecha) */ }}>
            <View style={[styles.grabber, { backgroundColor: t.color.border.default }]} />
            {title ? <Text spec={text(t, { role: 'bodyStrong' })} style={{ marginBottom: 8 }}>{title}</Text> : null}
            {canSearch ? <Input value={q} onChangeText={setQ} placeholder="Buscar…" autoCapitalize="none" style={{ marginBottom: 8 }} /> : null}
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center', paddingVertical: 16 }}>Nada encontrado.</Text>
              ) : filtered.map(o => {
                const on = o.id === value
                return (
                  <Pressable key={o.id} onPress={() => { onChange(o.id); setOpen(false) }}
                    style={[styles.option, { borderBottomColor: t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
                    <Text spec={text(t, { role: 'body' })} style={{ flex: 1 }}>{o.label}</Text>
                    {on ? <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>✓</Text> : null}
                  </Pressable>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
})
