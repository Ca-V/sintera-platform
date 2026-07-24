// Visual compartilhado dos slots RESERVADOS da Home (MOBILE-014 §3.4). Região estável, vazia de domínio,
// que um incremento futuro preencherá com seu widget — sem redesenhar a Home. NÃO contém lógica de domínio.
import { View, StyleSheet } from 'react-native'
import { text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'

export function ReservedRegion({ title }: { title: string }) {
  const t = useTheme()
  return (
    <View style={[styles.card, { borderColor: t.color.border.default, backgroundColor: t.color.surface.base }]}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>{title}</Text>
      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Reservado — em breve</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 4 },
})
