// Agenda (domínio Agenda — paridade Web). Projeta as listas do domínio: PENDÊNCIAS em atraso · PRÓXIMOS ·
// HISTÓRICO (seleção/ordem do @sintera/core). Cada item leva ao formulário (editar); "Novo evento" cria.
// COMPOSIÇÃO de primitivos DS; sem regra aqui.
import { useCallback } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import {
  type HealthEvent, typeLabel, statusLabel, formatDateLongBR, formatTimeBR,
  priorityBadge, modalityLabel, isReturnVisit, outcomeSummary,
} from '@sintera/core'
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

  // Concluir tem consequência (sai da Agenda → Histórico, e Despesas se tiver valor) — mesma copy da Web.
  const onComplete = (ev: HealthEvent) => Alert.alert('Concluir evento',
    'Concluir este evento? Ele sai da Agenda e passa para o Histórico — e para as Despesas, se tiver valor. Você pode reabri-lo depois.',
    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Concluir', onPress: () => a.complete(ev) }])
  const onCancel = (ev: HealthEvent) => Alert.alert('Cancelar evento', `Cancelar "${ev.title}"?`,
    [{ text: 'Voltar', style: 'cancel' }, { text: 'Cancelar evento', style: 'destructive', onPress: () => a.cancel(ev) }])

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

  const empty = a.lists.overdue.length === 0 && a.lists.upcoming.length === 0

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <Pressable onPress={() => navigation.navigate('Timeline')}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Ver Histórico de Saúde →</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('HistoricoExames')}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Ver Histórico de Exames →</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Composicao')}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Composição Corporal →</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Monitoramento')}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Monitoramento →</Text>
        </Pressable>
      </View>

      {empty ? (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>
            Nenhum evento ainda. Toque em “Novo evento” para agendar uma consulta, exame, vacina ou lembrete.
          </Text>
        </View>
      ) : null}

      <Section title="Pendências" hint="Vencidas e ainda abertas" events={a.lists.overdue} onOpen={openEvent} onComplete={onComplete} onCancel={onCancel} tone="attention" />
      <Section title="Próximos" events={a.lists.upcoming} onOpen={openEvent} onComplete={onComplete} onCancel={onCancel} />
      {/* Histórico (consolidado: exames + eventos) vive na TimelineScreen — a Agenda mostra só futuro/pendências. */}
    </ScrollView>
  )
}

function Section({ title, hint, events, onOpen, onComplete, onCancel, tone }: {
  title: string; hint?: string; events: HealthEvent[]; onOpen: (e: HealthEvent) => void
  onComplete?: (e: HealthEvent) => void; onCancel?: (e: HealthEvent) => void; tone?: 'attention' | 'muted'
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
        <View key={e.id} style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
          <Pressable onPress={() => onOpen(e)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text spec={text(t, { role: 'body' })}>{e.title}</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                {typeLabel(e.type)} · {formatDateLongBR(e.date)}{formatTimeBR(e.time) ? ` · ${formatTimeBR(e.time)}` : ''}
              </Text>
              {(() => {
                const bits = [
                  isReturnVisit(e) ? 'Retorno' : null,
                  modalityLabel(e.modality),
                  e.recurrenceRule ? '🔁 recorrente' : null,
                  priorityBadge(e.priority) ? `${priorityBadge(e.priority)!.icon} ${priorityBadge(e.priority)!.label}` : null,
                  (e.amountCents ?? 0) > 0 ? ((e.amountCents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null,
                ].filter(Boolean)
                if (bits.length === 0) return null
                return <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{bits.join(' · ')}</Text>
              })()}
              {e.preparation ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Preparo: {e.preparation}</Text> : null}
              {outcomeSummary(e.outcome) ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Desfecho: {outcomeSummary(e.outcome)}</Text> : null}
            </View>
            <Text spec={text(t, { role: 'caption' })} style={{ color: accent }}>{statusLabel(e.status)}</Text>
          </Pressable>
          {onComplete && onCancel ? (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable onPress={() => onComplete(e)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.success.text }}>Concluir</Text></Pressable>
              <Pressable onPress={() => onCancel(e)}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>Cancelar</Text></Pressable>
              <Pressable onPress={() => onOpen(e)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
            </View>
          ) : null}
        </View>
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
