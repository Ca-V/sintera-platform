import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen, Card, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

// Evolução de um biomarcador — GET /api/biomarkers/history?name= (mesma série da Web,
// via seriesForName no servidor). Mostra tendência, medições ao longo dos exames e um
// mini-gráfico de barras. Sem juízo clínico: só a série numérica e a faixa aritmética.
type Trend = 'up' | 'down' | 'stable' | 'single' | 'unit_mismatch'
interface Measurement {
  examId: string
  date: string
  value: number
  unit: string
  referenceMin: number | null
  referenceMax: number | null
}
interface Series {
  displayName: string
  unit: string
  count: number
  trend: Trend
  totalDeltaPercent: number | null
  latest: Measurement | null
  measurements: Measurement[]
}

const TREND_LABEL: Record<Trend, string> = {
  up: 'Em alta', down: 'Em queda', stable: 'Estável', single: 'Medição única', unit_mismatch: 'Unidades diferentes',
}
function dateLabel(iso: string): string {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function BiomarkerHistoryScreen() {
  const { name, title } = useLocalSearchParams<{ name: string; title?: string }>()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!name) return
    setError(null)
    try {
      const data = await api.get<{ series: Series | null }>(`/api/biomarkers/history?name=${encodeURIComponent(name)}`)
      setSeries(data.series)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a evolução.')
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => { load() }, [load])

  const values = series?.measurements.map((m) => m.value) ?? []
  const max = values.length ? Math.max(...values) : 0
  const min = values.length ? Math.min(...values) : 0
  const span = max - min || 1

  return (
    <Screen title={title || 'Biomarcador'} back scroll={false}>
      {loading ? <Loading /> : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
        >
          {!series ? (
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
              {error ?? 'Sem histórico para este biomarcador.'}
            </Text>
          ) : (
            <>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
                  <Text style={{ fontSize: font.size.xxl, fontWeight: font.weight.semibold, color: colors.onyx }}>
                    {series.latest ? series.latest.value : '—'}
                  </Text>
                  <Text style={{ fontSize: font.size.md, color: colors.mauve, marginBottom: 4 }}>{series.unit}</Text>
                </View>
                <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
                  {TREND_LABEL[series.trend]}
                  {series.totalDeltaPercent != null ? ` · ${series.totalDeltaPercent > 0 ? '+' : ''}${series.totalDeltaPercent.toFixed(0)}% no período` : ''}
                  {` · ${series.count} ${series.count === 1 ? 'medição' : 'medições'}`}
                </Text>
              </Card>

              {/* Mini-gráfico de barras (altura ∝ valor normalizado no intervalo da série). */}
              {values.length > 1 && (
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 100 }}>
                    {series.measurements.map((m) => {
                      const h = 12 + ((m.value - min) / span) * 76
                      const outOfRange = (m.referenceMax != null && m.value > m.referenceMax) || (m.referenceMin != null && m.value < m.referenceMin)
                      return (
                        <View key={m.examId} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                          <View style={{ width: '70%', height: h, borderRadius: radius.sm, backgroundColor: outOfRange ? colors.red : colors.petal }} />
                        </View>
                      )
                    })}
                  </View>
                </Card>
              )}

              {/* Medições */}
              <View style={{ gap: spacing.xs }}>
                <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1 }}>Medições</Text>
                {[...series.measurements].reverse().map((m) => {
                  const outOfRange = (m.referenceMax != null && m.value > m.referenceMax) || (m.referenceMin != null && m.value < m.referenceMin)
                  return (
                    <Card key={m.examId} style={{ paddingVertical: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <Text style={{ flex: 1, fontSize: font.size.sm, color: colors.mauve }}>{dateLabel(m.date)}</Text>
                        <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: outOfRange ? colors.red : colors.onyx }}>
                          {m.value} {m.unit}
                        </Text>
                      </View>
                      {(m.referenceMin != null || m.referenceMax != null) && (
                        <Text style={{ fontSize: font.size.xs, color: colors.mauve, marginTop: 2 }}>
                          ref {m.referenceMin ?? '−∞'}–{m.referenceMax ?? '+∞'}
                        </Text>
                      )}
                    </Card>
                  )
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  )
}
