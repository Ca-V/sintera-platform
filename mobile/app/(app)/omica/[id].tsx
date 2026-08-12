import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, SectionList, RefreshControl } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen, Card, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { DOMAIN_LABEL, fmtOmicsDate } from '@/lib/omics'
import { colors, spacing, font } from '@/lib/theme'

// Detalhe de um painel ômico: resumo + categorias (GET /api/omics/panels/:id) e
// resultados por categoria (GET .../results?category_id=). Somente leitura, sem interpretação.
interface Panel {
  id: string; domain: string; technology: string | null; platform: string | null
  total_features: number | null; laboratory: string | null; collected_on: string | null; created_at: string
}
interface Category { category_id: string | null; name: string; count: number }
interface Result {
  id: string; feature_name: string | null; value: number | null; unit: string | null
  raw_value: string | null; detection_status: string | null; measured_on: string | null
}

function resultLabel(r: Result): string {
  const v = r.raw_value ?? (r.value != null ? String(r.value) : (r.detection_status ?? '—'))
  return r.unit ? `${v} ${r.unit}` : v
}

export default function OmicaPanelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [panel, setPanel] = useState<Panel | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [resultsByCat, setResultsByCat] = useState<Record<string, Result[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      const meta = await api.get<{ panel: Panel; categories: Category[] }>(`/api/omics/panels/${id}`)
      setPanel(meta.panel)
      setCategories(meta.categories ?? [])
      // Carrega os resultados de cada categoria (lazy por categoria, como a Web).
      const entries = await Promise.all(
        (meta.categories ?? []).map(async (c) => {
          const key = c.category_id ?? 'none'
          const data = await api.get<{ results: Result[] }>(`/api/omics/panels/${id}/results?category_id=${key}`)
          return [key, data.results ?? []] as const
        }),
      )
      setResultsByCat(Object.fromEntries(entries))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o painel.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const sections = categories.map((c) => ({
    title: c.name,
    count: c.count,
    data: resultsByCat[c.category_id ?? 'none'] ?? [],
  }))

  const title = panel ? (DOMAIN_LABEL[panel.domain] ?? panel.domain) : 'Painel'

  return (
    <Screen title={title} back scroll={false}>
      {loading ? <Loading /> : (
        <SectionList
          sections={sections}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
          ListHeaderComponent={
            panel ? (
              <Text style={{ color: colors.mauve, fontSize: font.size.sm, marginBottom: spacing.md }}>
                {[panel.laboratory, panel.technology, fmtOmicsDate(panel.collected_on ?? panel.created_at)].filter(Boolean).join(' · ')}
              </Text>
            ) : null
          }
          ListEmptyComponent={<Text style={{ color: colors.mauve, fontSize: font.size.sm }}>{error ?? 'Sem resultados neste painel.'}</Text>}
          renderSectionHeader={({ section }) => (
            <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.xs }}>
              {section.title} · {section.count}
            </Text>
          )}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.xs, paddingVertical: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Text style={{ flex: 1, fontSize: font.size.md, color: colors.onyx }}>{item.feature_name ?? '—'}</Text>
                <Text style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.onyx }}>{resultLabel(item)}</Text>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  )
}
