// Agenda (domínio Agenda — paridade Web). Projeta as listas do domínio: PENDÊNCIAS em atraso · PRÓXIMOS ·
// HISTÓRICO (seleção/ordem do @sintera/core). Cada item leva ao formulário (editar); "Novo evento" cria.
// COMPOSIÇÃO de primitivos DS; sem regra aqui.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import {
  type HealthEvent, typeLabel, statusLabel, formatDateLongBR, formatTimeBR,
  priorityBadge, modalityLabel, isReturnVisit, outcomeSummary, isClosedStatus,
  buildExamRecencySuggestion, type ExamLite,
} from '@sintera/core'
import { Text, Button, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import type { AgendaStackParamList } from '../../navigation/types'
import { useAgenda } from './useAgenda'
import { apiClient } from '../../../infrastructure/apiClient'

type Props = NativeStackScreenProps<AgendaStackParamList, 'Agenda'>
type UpcomingView = 'date' | 'type'

export function AgendaScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const a = useAgenda()
  const [exams, setExams] = useState<ExamLite[]>([])
  const [upcomingView, setUpcomingView] = useState<UpcomingView>('date')
  const examsAlive = useRef(true)

  // Recarrega ao voltar o foco (após criar/editar/excluir no formulário).
  useFocusEffect(useCallback(() => {
    a.refresh()
    apiClient.exams.listExams().then(xs => { if (examsAlive.current) setExams(xs.map(e => ({ type: e.type, date: (e.exam_date ?? e.created_at ?? '').slice(0, 10), status: e.status }))) }).catch(() => {})
  }, [a.refresh])) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { examsAlive.current = false }, [])

  // Sugestão de recência de exame (temporal, sem juízo clínico) — some se já há exame futuro na agenda.
  const hasPendingExamEvent = useMemo(() => a.events.some(e => e.type === 'exame' && !isClosedStatus(e.status)), [a.events])
  const suggestion = useMemo(() => buildExamRecencySuggestion(exams, hasPendingExamEvent), [exams, hasPendingExamEvent])

  const openEvent = (event: HealthEvent) => navigation.navigate('EventForm', { event })
  const newEvent = () => navigation.navigate('EventForm', {})

  // Concluir/Cancelar têm consequência — reportam erro (não silenciam a falha).
  const onComplete = (ev: HealthEvent) => Alert.alert('Concluir evento',
    'Concluir este evento? Ele sai da Agenda e passa para o Histórico — e para as Despesas, se tiver valor. Você pode reabri-lo depois.',
    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Concluir', onPress: async () => { const { error } = await a.complete(ev); if (error) Alert.alert('Não foi possível concluir', error.message || 'Tente novamente.') } }])
  const onCancel = (ev: HealthEvent) => Alert.alert('Cancelar evento', `Cancelar "${ev.title}"?`,
    [{ text: 'Voltar', style: 'cancel' }, { text: 'Cancelar evento', style: 'destructive', onPress: async () => { const { error } = await a.cancel(ev); if (error) Alert.alert('Não foi possível cancelar', error.message || 'Tente novamente.') } }])

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
      {/* Histórico de Saúde/Exames, Composição e Monitoramento migraram para as abas Minha Saúde e Exames
          (arquitetura de 5 abas — MOBILE-036). A Agenda foca em calendário + próximos/pendências. */}

      {/* Sugestão temporal de recência de exame (opcional, factual — confirme com seu médico). */}
      {suggestion ? (
        <View style={[styles.card, { backgroundColor: t.color.badge.info.soft, borderColor: t.color.badge.info.soft, gap: 8 }]}>
          <Text spec={text(t, { role: 'body' })}>{suggestion.message}</Text>
          <Pressable onPress={() => navigation.navigate('EventForm', { prefill: { type: 'exame', title: suggestion.suggestedTitle } })} style={{ alignSelf: 'flex-start' }}>
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Registrar lembrete →</Text>
          </Pressable>
        </View>
      ) : null}

      {empty ? (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, gap: 10 }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>
            Nenhum evento ainda. Toque em “Novo evento” para agendar uma consulta, exame, vacina ou lembrete.
          </Text>
          <Button label="Adicionar primeiro evento" onPress={newEvent} />
        </View>
      ) : null}

      <Section title="Pendências" hint="Vencidas e ainda abertas" events={a.lists.overdue} onOpen={openEvent} onComplete={onComplete} onCancel={onCancel} tone="attention" />

      {a.lists.upcoming.length > 0 ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>PRÓXIMOS</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['date', 'type'] as UpcomingView[]).map(v => (
                <Pressable key={v} onPress={() => setUpcomingView(v)}><Text spec={text(t, { role: 'caption', tone: upcomingView === v ? 'default' : 'faint' })} style={upcomingView === v ? { color: t.color.identity.primary } : undefined}>{v === 'date' ? 'Por data' : 'Por tipo'}</Text></Pressable>
              ))}
            </View>
          </View>
          {upcomingView === 'date'
            ? a.lists.upcoming.map(e => <EventRow key={e.id} e={e} onOpen={openEvent} onComplete={onComplete} onCancel={onCancel} />)
            : groupByType(a.lists.upcoming).map(g => (
                <View key={g.type} style={{ gap: 8 }}>
                  <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{g.label}</Text>
                  {g.items.map(e => <EventRow key={e.id} e={e} onOpen={openEvent} onComplete={onComplete} onCancel={onCancel} />)}
                </View>
              ))}
        </View>
      ) : null}
      {/* Histórico (consolidado: exames + eventos) vive na TimelineScreen — a Agenda mostra só futuro/pendências. */}
      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

/** Agrupa eventos por TIPO (rótulo canônico), em ordem alfabética do rótulo. */
function groupByType(events: HealthEvent[]): { type: string; label: string; items: HealthEvent[] }[] {
  const map = new Map<string, HealthEvent[]>()
  for (const e of events) { const arr = map.get(e.type) ?? []; arr.push(e); map.set(e.type, arr) }
  return [...map.entries()].map(([type, items]) => ({ type, label: typeLabel(type), items })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
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
      {events.map(e => <EventRow key={e.id} e={e} onOpen={onOpen} onComplete={onComplete} onCancel={onCancel} accent={accent} />)}
    </View>
  )
}

function EventRow({ e, onOpen, onComplete, onCancel, accent }: {
  e: HealthEvent; onOpen: (e: HealthEvent) => void; onComplete?: (e: HealthEvent) => void; onCancel?: (e: HealthEvent) => void; accent?: string
}) {
  const t = useTheme()
  const acc = accent ?? t.color.text.muted
  const bits = [
    isReturnVisit(e) ? 'Retorno' : null,
    modalityLabel(e.modality),
    e.recurrenceRule ? '🔁 recorrente' : null,
    priorityBadge(e.priority) ? `${priorityBadge(e.priority)!.icon} ${priorityBadge(e.priority)!.label}` : null,
    (e.amountCents ?? 0) > 0 ? ((e.amountCents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null,
  ].filter(Boolean)
  return (
    <View style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
      <Pressable onPress={() => onOpen(e)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text spec={text(t, { role: 'body' })}>{e.title}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{typeLabel(e.type)} · {formatDateLongBR(e.date)}{formatTimeBR(e.time) ? ` · ${formatTimeBR(e.time)}` : ''}</Text>
          {bits.length > 0 ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{bits.join(' · ')}</Text> : null}
          {e.preparation ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Preparo: {e.preparation}</Text> : null}
          {outcomeSummary(e.outcome) ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Desfecho: {outcomeSummary(e.outcome)}</Text> : null}
        </View>
        <Text spec={text(t, { role: 'caption' })} style={{ color: acc }}>{statusLabel(e.status)}</Text>
      </Pressable>
      {onComplete && onCancel ? (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={() => onComplete(e)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.success.text }}>Concluir</Text></Pressable>
          <Pressable onPress={() => onCancel(e)}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>Cancelar</Text></Pressable>
          <Pressable onPress={() => onOpen(e)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
        </View>
      ) : null}
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
