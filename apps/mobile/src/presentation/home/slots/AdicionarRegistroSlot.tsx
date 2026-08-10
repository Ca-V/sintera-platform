// Slot "Adicionar registro" — AÇÃO PRINCIPAL da Home (UX-002): card-herói que abre o hub único de captura
// (RegistrationHubSheet, taxonomia do core). Apresentação/navegação apenas — recebe o gatilho por prop. Sem dados.
import { View, Pressable, StyleSheet } from 'react-native'
import { text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'

export function AdicionarRegistroSlot({ onPress }: { onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={[styles.card, { backgroundColor: t.color.identity.soft }]}>
      <View style={{ flex: 1 }}>
        <Text spec={text(t, { role: 'bodyStrong' })}>+ Adicionar registro</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Exame, medicamento, consulta, medida e mais — num só lugar.</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
})
