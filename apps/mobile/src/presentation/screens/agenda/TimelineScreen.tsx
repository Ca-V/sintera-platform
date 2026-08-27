// Histórico de Saúde (Timeline — paridade Web /dashboard/timeline): projeção CRONOLÓGICA UNIFICADA de vários
// domínios (eventos assistenciais + exames; ômicas/ciclo entram depois via novo mapper no core, sem mudar esta
// tela). Agrupa por mês (groupByPeriod). Cada entrada navega para o DOMÍNIO DONO (evento→formulário; exame→detalhe).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { mergeTimeline, selectHistory, groupByPeriod, formatDateLongBR, timelineCategoryLabel, typeGroupRank, type TimelineEntry, type TimelineMeta, SCREEN_COPY } from '@sintera/core'
import { Text, Button, Input, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import type { MinhaSaudeStackParamList } from '../../navigation/types'
import { apiClient } from '../../../infrastructure/apiClient'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'Timeline'>

function fmtCents(c: number | null | undefined): string { return c == null ? '' : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
/** Chips de densidade do fato (prioridade/retorno/modalidade/valor/anexo) — só os presentes. */
type ChipKind = 'info' | 'attention' | 'success' | 'neutral'
function metaChips(m: TimelineMeta | undefined, status: string | null): { label: string; kind: ChipKind }[] {
  if (!m) return []
  const chips: { label: string; kind: ChipKind }[] = []
  if (m.priorityLabel) chips.push({ label: m.priorityLabel, kind: 'attention' })
  if (m.isReturn) chips.push({ label: 'Retorno', kind: 'info' })
  if (m.modalityText) chips.push({ label: m.modalityText, kind: 'neutral' })
  if (status === 'cancelado') chips.push({ label: 'Cancelado', kind: 'neutral' })
  if ((m.amountCents ?? 0) > 0) chips.push({ label: fmtCents(m.amountCents), kind: 'success' })
  if (m.attachmentUrl) chips.push({ label: 'Anexo', kind: 'neutral' })
  return chips
}

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
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'date' | 'type'>('date')
  const alive = useRef(true)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    // Histórico de Saúde = 4 fontes. PRIMÁRIAS (eventos + exames) definem sucesso/erro da tela; AUXILIARES (ômicas +
    // contracepção) são NÃO‑FATAIS — se falharem (ex.: ponte /api/omics ainda sem Bearer em produção → 401), a tela
    // carrega mesmo assim com eventos+exames (degradação controlada, sem blank). SÓ fatos fechados (selectHistory).
    Promise.all([
      apiClient.agenda.listEvents(),
      apiClient.exams.listExams(),
      apiClient.omics.listPanels().catch(() => []),          // auxiliar — não derruba a tela
      apiClient.cycle.listContraceptives().catch(() => []),  // auxiliar — não derruba a tela
    ])
      .then(([events, exams, omics, ctc]) => {
        if (!alive.current) return
        setEntries(selectHistory(mergeTimeline(events, exams, omics, ctc)))
        setPhase('ready'); setError(null)
      })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : SCREEN_COPY.comum.historyFailed); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])
  useFocusEffect(useCallback(() => { load(true) }, [load])) // eslint-disable-line react-hooks/exhaustive-deps

  const parentNav = () => navigation.getParent() as { navigate: (n: string, p?: unknown) => void } | undefined
  const open = (e: TimelineEntry) => {
    if (e.domain === 'exam') {
      navigation.navigate('ExamDetail', { id: e.refId }) // Timeline e Exames vivem no mesmo stack (Minha Saúde)
    } else if (e.domain === 'omics') {
      navigation.navigate('OmicsPanel', { id: e.refId })
    } else if (e.domain === 'contraceptive') {
      navigation.navigate('Ciclo') // Timeline vive no stack de Minha Saúde — navega no próprio stack
    } else {
      // Evento: reabre no formulário (EventForm vive no stack de Agenda — navegação entre abas).
      apiClient.agenda.listEvents().then(evs => {
        const ev = evs.find(x => x.id === e.refId)
        if (ev) parentNav()?.navigate('Agenda', { screen: 'EventForm', params: { event: ev } })
      }).catch(() => {})
    }
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /><Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando o histórico…</Text></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  // A8: busca + agrupamento por data/tipo — "Por tipo" usa a CATEGORIA CLÍNICA (paridade Web), não o domínio
  // técnico. Nada mais colapsa em "Consultas e eventos"; a ordem dos grupos vem do core (typeGroupRank).
  const q = query.trim().toLowerCase()
  const filtered = q ? entries.filter(e => `${e.title} ${e.subtitle ?? ''}`.toLowerCase().includes(q)) : entries
  const typeGroups = Object.values(filtered.reduce<Record<string, { label: string; items: TimelineEntry[]; rank: number }>>((acc, e) => {
    const label = timelineCategoryLabel(e.category)
    ;(acc[label] ??= { label: label.toUpperCase(), items: [], rank: typeGroupRank(label) }).items.push(e)
    return acc
  }, {})).sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label))
  const groups: { label: string; items: TimelineEntry[] }[] = view === 'date'
    ? groupByPeriod(filtered, 'month', 'desc').map(g => ({ label: periodLabel(g.key).toUpperCase(), items: g.items }))
    : typeGroups

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Histórico de Saúde</Text>
      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Sua linha do tempo reúne exames e eventos (consultas, vacinas, procedimentos…) em um só lugar.</Text>

      {entries.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Input value={query} onChangeText={setQuery} placeholder="Buscar por nome…" clearButtonMode="while-editing" />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {(['date', 'type'] as const).map(v => (
              <Pressable key={v} onPress={() => setView(v)}>
                <Text spec={text(t, { role: 'caption', tone: view === v ? 'default' : 'faint' })} style={view === v ? { color: t.color.identity.primary } : undefined}>{v === 'date' ? 'Por data' : 'Por tipo'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {groups.length === 0 ? (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>{q ? 'Nenhum resultado para a busca.' : 'Seu histórico aparecerá aqui conforme você registrar exames e eventos.'}</Text>
        </View>
      ) : null}

      {groups.map(g => (
        <View key={g.label} style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.label}</Text>
          {g.items.map(e => {
            const chips = metaChips(e.meta, e.status)
            const prof = e.meta?.professionalLabel
            // Rótulo à direita = CATEGORIA CLÍNICA real do fato (Consulta/Vacina/Medicamento/Exame…), nunca "Evento".
            const rightLabel = timelineCategoryLabel(e.category)
            const showPrep = e.meta?.preparation?.trim() && e.status !== 'realizado' && e.status !== 'cancelado'
            const showOutcome = e.meta?.hasOutcome && e.meta?.outcomeText && e.status === 'realizado'
            return (
              <Pressable key={e.id} onPress={() => open(e)}
                style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
                <View style={{ flex: 1, paddingRight: 8, gap: 4 }}>
                  <Text spec={text(t, { role: 'body' })}>{e.title}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{[formatDateLongBR(e.date), prof, e.subtitle].filter(Boolean).join(' · ')}</Text>
                  {chips.length > 0 ? (
                    <View style={styles.chips}>
                      {chips.map((c, i) => <View key={i} style={[styles.chip, { backgroundColor: t.color.badge[c.kind].soft }]}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge[c.kind].text }}>{c.label}</Text></View>)}
                    </View>
                  ) : null}
                  {showPrep ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Preparo: {e.meta!.preparation}</Text> : null}
                  {showOutcome ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Desfecho: {e.meta!.outcomeText}</Text> : null}
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{rightLabel}</Text>
              </Pressable>
            )
          })}
        </View>
      ))}
      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
})
