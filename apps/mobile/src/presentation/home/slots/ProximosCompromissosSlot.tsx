// "Agenda · próximo" — mostra APENAS o próximo compromisso (paridade com a Web); não lista (a tela do celular é
// menor que a do notebook). Cartão de orientação para abrir a Agenda. PURO (INV-HOME-001): recebe os itens por
// PROP (injeção pelo HomeContainer, fora de home/) — não importa api-client nem acessa dados.
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
  const next = items[0]
  const eyebrow = (
    <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Agenda · próximo</Text>
  )
  if (!next) {
    return (
      <Pressable onPress={goAgenda} accessibilityRole="button" style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
        {eyebrow}
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Sem compromissos próximos.</Text>
        <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Ir para a Agenda →</Text>
      </Pressable>
    )
  }
  return (
    <Pressable onPress={goAgenda} accessibilityRole="button" style={[styles.card, { backgroundColor: t.color.identity.soft, borderColor: 'transparent' }]}>
      {eyebrow}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <Text spec={text(t, { role: 'body' })} style={{ flex: 1 }}>{next.title}</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{next.dateLabel}</Text>
      </View>
      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{next.typeLabel}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 4 },
})
