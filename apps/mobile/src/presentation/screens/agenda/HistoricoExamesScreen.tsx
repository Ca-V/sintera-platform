// Histórico de Exames (paridade Web /dashboard/saude) — visão LONGITUDINAL: por exame (fiel ao laudo) →
// biomarcadores medidos, cada um com valor mais recente, TENDÊNCIA (▲/▼/✓) e evolução (drill-down com série
// temporal + sparkline). Sumarização/tendência do @sintera/core (summarizeBiomarkers). FACTUAL (RDC 657/2022):
// organiza e apresenta a evolução dos valores impressos — nunca interpreta.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { summarizeBiomarkers, type BiomarkerSummary, type Trend } from '@sintera/core'
import { Text, Button, Input } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

function fmtDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
function trendText(tr: Trend, delta: number | null): { s: string; kind: 'up' | 'down' | 'flat' } {
  if (tr === 'up') return { s: delta !== null ? `▲ +${delta}%` : '▲', kind: 'up' }
  if (tr === 'down') return { s: delta !== null ? `▼ ${delta}%` : '▼', kind: 'down' }
  if (tr === 'stable') return { s: delta !== null ? `— ${delta > 0 ? '+' : ''}${delta}%` : '—', kind: 'flat' }
  if (tr === 'single') return { s: '1ª medição', kind: 'flat' }
  return { s: 'unidades ≠', kind: 'flat' }
}

export function HistoricoExamesScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [summaries, setSummaries] = useState<BiomarkerSummary[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const alive = useRef(true)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.exams.getAllBiomarkers()
      .then((rows) => { if (!alive.current) return; setSummaries(summarizeBiomarkers(rows)); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? summaries.filter(s => s.displayName.toLowerCase().includes(q)) : summaries
    const map = new Map<string, BiomarkerSummary[]>()
    for (const s of filtered) { const k = s.sourceExamName?.trim() || 'Exames'; const arr = map.get(k) ?? []; arr.push(s); map.set(k, arr) }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
  }, [summaries, query])

  const trendColor = (kind: 'up' | 'down' | 'flat') =>
    kind === 'up' ? t.color.badge.attention.text : kind === 'down' ? t.color.badge.info.text : t.color.text.muted

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /><Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando…</Text></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Histórico de Exames</Text>
      <Input value={query} onChangeText={setQuery} placeholder="Buscar biomarcador…" autoCapitalize="none" />

      {summaries.length === 0 ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum resultado numérico ainda. Envie exames com biomarcadores para acompanhar a evolução.</Text></View>
      ) : null}

      {groups.map(([examName, list]) => (
        <View key={examName} style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>{examName.toUpperCase()}</Text>
          {list.map(s => {
            const tr = trendText(s.trend, s.deltaPercent)
            const open = expanded === s.canonicalName
            const vals = s.measurements.map(m => m.value)
            const min = Math.min(...vals), max = Math.max(...vals)
            return (
              <Pressable key={s.canonicalName} onPress={() => setExpanded(open ? null : s.canonicalName)} style={[styles.card, card, { gap: 6 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{s.displayName}</Text>
                  <Text spec={text(t, { role: 'bodyStrong' })}>{s.latest ? `${s.latest.value}${s.unit ? ` ${s.unit}` : ''}` : '—'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.count} {s.count === 1 ? 'medição' : 'medições'}{s.latest ? ` · última em ${fmtDate(s.latest.date)}` : ''}</Text>
                  <Text spec={text(t, { role: 'caption' })} style={{ color: trendColor(tr.kind) }}>{tr.s}</Text>
                </View>
                {open ? (
                  <View style={{ gap: 6, marginTop: 4 }}>
                    {/* Sparkline simples (barras) — visualiza a evolução sem dependência de gráfico. */}
                    {s.measurements.length > 1 && max > min ? (
                      <View style={styles.spark}>
                        {s.measurements.map((m, i) => (
                          <View key={i} style={{ flex: 1, height: 40, justifyContent: 'flex-end' }}>
                            <View style={{ height: Math.max(3, ((m.value - min) / (max - min)) * 40), backgroundColor: t.color.identity.primary, borderRadius: 2 }} />
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {[...s.measurements].reverse().map((m, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmtDate(m.date)}</Text>
                        <Text spec={text(t, { role: 'caption' })}>{m.value}{m.unit ? ` ${m.unit}` : ''}</Text>
                      </View>
                    ))}
                    <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Faixas de referência, quando presentes, são as do documento. Não substitui avaliação médica.</Text>
                  </View>
                ) : null}
              </Pressable>
            )
          })}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40 },
})
