// Slot "Próximos compromissos" — mostra os próximos eventos da Agenda para ORIENTAR uma ação (abrir a Agenda),
// não como relatório. PURO (INV-HOME-001): recebe os itens já prontos por PROP (injeção pelo HomeContainer, fora
// de home/) — não importa api-client nem acessa dados. Só apresentação + navegação.
import { View, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'

export type UpcomingItem = { id: string; title: string; dateLabel: string; typeLabel: string }

export function ProximosCompromissosSlot({ items }: { items: UpcomingItem[] }) {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()
  const goAgenda = () => navigation.navigate('Agenda')
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Próximos compromissos</Text>
      {items.length === 0 ? (
        <Pressable onPress={goAgenda} accessibilityRole="button" style={[styles.card, card, { gap: 4 }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })}>Sem compromissos próximos.</Text>
          <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Ir para a Agenda →</Text>
        </Pressable>
      ) : items.map((it) => (
        <Pressable key={it.id} onPress={goAgenda} accessibilityRole="button" style={[styles.card, card, { gap: 4 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <Text spec={text(t, { role: 'body' })} style={{ flex: 1 }}>{it.title}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{it.dateLabel}</Text>
          </View>
          <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{it.typeLabel}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
})
