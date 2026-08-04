// Agenda (domínio Agenda — paridade Web). Projeta as listas do domínio: PENDÊNCIAS em atraso · PRÓXIMOS ·
// HISTÓRICO (seleção/ordem do @sintera/core). Cada item leva ao formulário (editar); "Novo evento" cria.
// COMPOSIÇÃO de primitivos DS; sem regra aqui.
import { useCallback } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { type HealthEvent, typeLabel, statusLabel, formatDateLongBR, formatTimeBR } from '@sintera/core'
import { Text, Button } from '../../primitives'
import { useTheme } from '../../theme'
import type { AcompanhamentoStackParamList } from '../../navigation/types'
import { useAgenda } from './useAgenda'

type Props = NativeStackScreenProps<AcompanhamentoStackParamList, 'Agenda'>

export function AgendaScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const a = useAgenda()

  // Recarrega ao voltar o foco (após criar/editar/excluir no formulário).
  useFocusEffect(useCallback(() => { a.refresh() }, [a.refresh])) // eslint-disable-line react-hooks/exhaustive-deps

  const openEvent = (event: HealthEvent) => navigation.navigate('EventForm', { event })
  const newEvent = () => navigation.navigate('EventForm', {})

  if (a.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando a agenda…</Text>
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

  const empty = a.lists.overdue.length === 0 && a.lists.upcoming.length === 0 && a.lists.historical.length === 0

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={a.refreshing} onRefresh={a.refresh} tintColor={t.color.identity.primary} />}
    >
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Agenda</Text>
        <Button label="Novo evento" onPress={newEvent} />
      </View>

      {empty ? (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>
            Nenhum evento ainda. Toque em “Novo evento” para agendar uma consulta, exame, vacina ou lembrete.
          </Text>
        </View>
      ) : null}

      <Section title="Pendências" hint="Vencidas e ainda abertas" events={a.lists.overdue} onOpen={openEvent} tone="attention" />
      <Section title="Próximos" events={a.lists.upcoming} onOpen={openEvent} />
      <Section title="Histórico" events={a.lists.historical} onOpen={openEvent} tone="muted" />
    </ScrollView>
  )
}

function Section({ title, hint, events, onOpen, tone }: {
  title: string; hint?: string; events: HealthEvent[]; onOpen: (e: HealthEvent) => void; tone?: 'attention' | 'muted'
}) {
  const t = useTheme()
  if (events.length === 0) return null
  const accent = tone === 'attention' ? t.color.badge.attention.text : t.color.text.muted
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text spec={text(t, { role: 'label' })} style={{ color: accent }}>{title.toUpperCase()}</Text>
        {hint ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{hint}</Text> : null}
      </View>
      {events.map(e => (
        <Pressable key={e.id} onPress={() => onOpen(e)}
          style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text spec={text(t, { role: 'body' })}>{e.title}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
              {typeLabel(e.type)} · {formatDateLongBR(e.date)}{formatTimeBR(e.time) ? ` · ${formatTimeBR(e.time)}` : ''}
            </Text>
          </View>
          <Text spec={text(t, { role: 'caption' })} style={{ color: accent }}>{statusLabel(e.status)}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 14 },
})
