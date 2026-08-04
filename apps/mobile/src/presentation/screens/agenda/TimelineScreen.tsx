// Histórico de Saúde (Timeline — paridade Web /dashboard/timeline): projeção CRONOLÓGICA UNIFICADA de vários
// domínios (eventos assistenciais + exames; ômicas/ciclo entram depois via novo mapper no core, sem mudar esta
// tela). Agrupa por mês (groupByPeriod). Cada entrada navega para o DOMÍNIO DONO (evento→formulário; exame→detalhe).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { mergeTimeline, groupByPeriod, statusLabel, formatDateLongBR, type TimelineEntry } from '@sintera/core'
import { Text, Button } from '../../primitives'
import { useTheme } from '../../theme'
import type { AcompanhamentoStackParamList } from '../../navigation/types'
import { apiClient } from '../../../infrastructure/apiClient'

type Props = NativeStackScreenProps<AcompanhamentoStackParamList, 'Timeline'>

/** '2026-07' → 'julho de 2026'; 'sem-data' → 'Sem data'. */
function periodLabel(key: string): string {
  if (key === 'sem-data') return 'Sem data'
  const [y, m] = key.split('-')
  if (!m) return y
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function TimelineScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([apiClient.agenda.listEvents(), apiClient.exams.listExams()])
      .then(([events, exams]) => { if (!alive.current) return; setEntries(mergeTimeline(events, exams)); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])
  useFocusEffect(useCallback(() => { load(true) }, [load])) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (e: TimelineEntry) => {
    if (e.domain === 'exam') {
      ;(navigation.getParent() as { navigate: (n: string, p: unknown) => void } | undefined)
        ?.navigate('Documentos', { screen: 'ExamDetail', params: { id: e.refId } })
    } else {
      // Evento: reabre no formulário — buscamos o evento cru na lista de eventos.
      apiClient.agenda.listEvents().then(evs => {
        const ev = evs.find(x => x.id === e.refId)
        if (ev) navigation.navigate('EventForm', { event: ev })
      }).catch(() => {})
    }
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /><Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando o histórico…</Text></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const groups = groupByPeriod(entries, 'month', 'desc')

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Histórico de Saúde</Text>
      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Sua linha do tempo reúne exames e eventos (consultas, vacinas, procedimentos…) em um só lugar.</Text>

      {groups.length === 0 ? (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Seu histórico aparecerá aqui conforme você registrar exames e eventos.</Text>
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
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{e.subtitle} · {formatDateLongBR(e.date)}</Text>
              </View>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{e.domain === 'exam' ? 'Exame' : (e.status ? statusLabel(e.status as never) : '')}</Text>
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
