// Página do INDICADOR (longitudinal) — paridade Web /dashboard/saude/[slug]. Acompanhamento no tempo de UM
// biomarcador: gráfico + TODAS as medições + comparativo (primeira→última). CONSOME a lógica ÚNICA do core
// (`seriesForName`/`BiomarkerSummary`) — mesma que a Web usa; nada de reimplementar. FACTUAL (RDC 657): organiza os
// valores impressos nos laudos, não interpreta. R-EXAME: aqui é o nível do INDICADOR (o exame é o outro nível).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { seriesForName, type BiomarkerSummary, type Trend } from '@sintera/core'
import { Text, Button } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

function fmtDate(iso: string): string { if (!iso) return '—'; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}` }
function trendLabel(tr: Trend, delta: number | null): string {
  if (tr === 'up') return delta != null ? `▲ +${delta}%` : '▲'
  if (tr === 'down') return delta != null ? `▼ ${delta}%` : '▼'
  if (tr === 'stable') return delta != null ? `estável (${delta > 0 ? '+' : ''}${delta}%)` : 'estável'
  if (tr === 'single') return '1ª medição'
  return 'unidades diferentes'
}
type Nav = { navigate: (n: string, p?: unknown) => void }

export function IndicadorDetailScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation() as unknown as Nav
  const route = useRoute() as { params?: { name?: string } }
  const name = route.params?.name ?? ''
  const [summary, setSummary] = useState<BiomarkerSummary | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const alive = useRef(true)

  const load = useCallback(() => {
    setPhase('loading')
    apiClient.exams.getAllBiomarkers()
      .then((rows) => { if (!alive.current) return; setSummary(seriesForName(rows, name)); setPhase('ready') })
      .catch(() => { if (alive.current) setPhase('error') })
  }, [name])
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false } }, [load])

  const openExam = (id: string | null | undefined) => { if (id) navigation.navigate('ExamDetail', { id }) }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  if (phase === 'error' || !summary) {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Não foi possível carregar este indicador.</Text>
        <Button label="Tentar novamente" variant="secondary" onPress={load} />
      </View>
    )
  }

  const s = summary
  const measurements = s.measurements
  const vals = measurements.map((m) => m.value)
  const min = vals.length ? Math.min(...vals) : 0
  const max = vals.length ? Math.max(...vals) : 0
  const rm = s.latest
    ? (s.latest.referenceMin != null && s.latest.value < s.latest.referenceMin) ? '▼ abaixo da faixa'
      : (s.latest.referenceMax != null && s.latest.value > s.latest.referenceMax) ? '▲ acima da faixa'
      : (s.latest.referenceMin != null || s.latest.referenceMax != null) ? '✓ dentro da faixa' : null
    : null
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingBottom: styles.content.padding + insets.bottom }]}>
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>{s.displayName}</Text>
      {s.sourceExamName ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{s.sourceExamName}</Text> : null}

      {/* Último valor + tendência + faixa */}
      <View style={[styles.card, card, { gap: 4 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Último resultado</Text>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 20 }}>{s.latest ? `${s.latest.value}${s.unit ? ` ${s.unit}` : ''}` : '—'}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.latest ? fmtDate(s.latest.date) : ''} · {s.count} {s.count === 1 ? 'medição' : 'medições'}</Text>
          <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{trendLabel(s.trend, s.deltaPercent)}{rm ? ` · ${rm}` : ''}</Text>
        </View>
      </View>

      {/* Gráfico (evolução) */}
      {measurements.length > 1 && max > min ? (
        <View style={[styles.card, card, { gap: 8 }]}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>EVOLUÇÃO</Text>
          <View style={styles.chart}>
            {measurements.map((m, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                <View style={{ width: '70%', height: Math.max(4, ((m.value - min) / (max - min)) * 120), backgroundColor: t.color.identity.primary, borderRadius: 3 }} />
                <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={{ fontSize: 9 }}>{m.date.slice(5, 10).replace('-', '/')}</Text>
              </View>
            ))}
          </View>
          {s.totalDeltaPercent != null ? (
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Da 1ª à última: {s.first?.value} → {s.latest?.value}{s.unit ? ` ${s.unit}` : ''} ({s.totalDeltaPercent > 0 ? '+' : ''}{s.totalDeltaPercent}%)</Text>
          ) : null}
        </View>
      ) : null}

      {/* Todas as medições (comparativo cronológico) — toque abre o exame de origem */}
      <View style={[styles.card, card, { gap: 8 }]}>
        <Text spec={text(t, { role: 'label', tone: 'muted' })}>TODAS AS MEDIÇÕES</Text>
        {[...measurements].reverse().map((m, i) => (
          <Pressable key={i} onPress={() => openExam(m.examId)} disabled={!m.examId}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmtDate(m.date)}{m.examId ? ' · abrir laudo ›' : ''}</Text>
            <Text spec={text(t, { role: 'body' })} style={{ color: m.examId ? t.color.identity.primary : t.color.text.default }}>{m.value}{m.unit ? ` ${m.unit}` : ''}</Text>
          </Pressable>
        ))}
      </View>

      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Faixas de referência, quando presentes, são as do documento. Compilação factual — não substitui avaliação médica.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 140 },
})
