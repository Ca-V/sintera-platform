// Revisão em LOTE da captura assistida — componente GENÉRICO e REUTILIZÁVEL. Quando um documento gera MÚLTIPLOS
// registros estruturados (ex.: laudo de bioimpedância → várias medidas), mostra os campos LIDOS para o usuário
// revisar e confirmar antes de salvar. Regra de plataforma: a IA PROPÕE, o usuário CONFIRMA. Agnóstico de domínio:
// o consumidor fornece os itens, a data e a ação de salvar. A Bioimpedância é o 1º consumidor; outros exames/
// documentos multi-registro reusam este MESMO fluxo (sem reimplementar). Sem regra de negócio (DS-003).
import { Modal, View, ScrollView, StyleSheet } from 'react-native'
import { text } from '@sintera/design-system'
import { Text, Button, DatePicker } from '../../primitives'
import { useTheme } from '../../theme'

export type ReviewItem = { key: string; label: string; value: string; unit?: string }

type Props = {
  visible: boolean
  title?: string
  items: ReviewItem[]
  date: string
  onDateChange: (d: string) => void
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  busy?: boolean
}

export function AssistedBatchReview({
  visible, title = 'Confira o que foi lido', items, date, onDateChange, onConfirm, onCancel, confirmLabel, busy,
}: Props) {
  const t = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: t.color.surface.app }]}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 18 }}>{title}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>A leitura é uma proposta — revise e confirme antes de salvar.</Text>
          <DatePicker value={date} onChange={onDateChange} placeholder="Data" />
          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
            {items.map(it => (
              <View key={it.key} style={[styles.row, { borderColor: t.color.border.default, backgroundColor: t.color.surface.base }]}>
                <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{it.label}</Text>
                <Text spec={text(t, { role: 'bodyStrong' })}>{it.value}{it.unit ? ` ${it.unit}` : ''}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button label="Descartar" variant="secondary" onPress={onCancel} /></View>
            <View style={{ flex: 1 }}><Button label={confirmLabel ?? `Salvar (${items.length})`} onPress={onConfirm} loading={busy} loadingLabel="Salvando…" /></View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
})
