// Histórico de Saúde (Timeline — paridade Web /dashboard/timeline): projeção CRONOLÓGICA de TODOS os eventos,
// agrupada por mês (groupByPeriod do @sintera/core), com as mesmas ações (tocar → editar no mesmo formulário).
// Reutiliza o hook/domínio da Agenda — é outra PROJEÇÃO dos mesmos eventos, não um novo modelo.
import { useCallback } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { type HealthEvent, groupByPeriod, typeLabel, statusLabel, formatDateLongBR } from '@sintera/core'
import { Text, Button } from '../../primitives'
import { useTheme } from '../../theme'
import type { AcompanhamentoStackParamList } from '../../navigation/types'
import { useAgenda } from './useAgenda'

type Props = NativeStackScreenProps<AcompanhamentoStackParamList, 'Timeline'>

/** '2026-07' → 'julho de 2026'; '2026' → '2026'; 'sem-data' → 'Sem data'. Seguro (date-only). */
function periodLabel(key: string): string {
  if (key === 'sem-data') return 'Sem data'
  const [y, m] = key.split('-')
  if (!m) return y
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function TimelineScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const a = useAgenda()
  useFocusEffect(useCallback(() => { a.refresh() }, [a.refresh])) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (event: HealthEvent) => navigation.navigate('EventForm', { event })

  if (a.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando o histórico…</Text>
      </View>
    )
  }
  if (a.phase === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{a.error}</Text>
        <Button label="Tentar novamente" variant="secondary" onPress={a.retry} />
      </View>
    )
  }

  const groups = groupByPeriod(a.events, 'month', 'desc')

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={a.refreshing} onRefresh={a.refresh} tintColor={t.color.identity.primary} />}>
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Histórico de Saúde</Text>

      {groups.length === 0 ? (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>
            Sua linha do tempo aparecerá aqui conforme você registrar consultas, exames, vacinas e outros eventos.
          </Text>
        </View>
      ) : null}

      {groups.map(g => (
        <View key={g.key} style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>{periodLabel(g.key).toUpperCase()}</Text>
          {g.items.map(e => (
            <Pressable key={e.id} onPress={() => open(e)}
              style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text spec={text(t, { role: 'body' })}>{e.title}</Text>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{typeLabel(e.type)} · {formatDateLongBR(e.date)}</Text>
              </View>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{statusLabel(e.status)}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 14 },
})
