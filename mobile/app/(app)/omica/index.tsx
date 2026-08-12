import { useCallback, useState } from 'react'
import { Text, FlatList, Pressable, RefreshControl } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Screen, Card, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { DOMAIN_LABEL, fmtOmicsDate } from '@/lib/omics'
import { colors, spacing, font } from '@/lib/theme'

// Ômica — lista de painéis (GET /api/omics/panels, Bearer). Somente leitura: dados
// objetivos (metaboloma, proteoma, microbioma…), sem interpretação clínica.
interface Panel {
  id: string
  domain: string
  technology: string | null
  platform: string | null
  total_features: number | null
  laboratory: string | null
  collected_on: string | null
  created_at: string
}

export default function OmicaScreen() {
  const router = useRouter()
  const [panels, setPanels] = useState<Panel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.get<{ panels: Panel[] }>('/api/omics/panels')
      setPanels(data.panels ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar os painéis.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <Screen title="Ômica" back scroll={false}>
      <FlatList
        data={panels}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading && panels.length > 0} onRefresh={load} tintColor={colors.petal} />}
        ListEmptyComponent={
          loading ? <Loading /> : (
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
              {error ?? 'Nenhum painel ômico registrado.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/omica/${item.id}`)}>
            <Card>
              <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>
                {DOMAIN_LABEL[item.domain] ?? item.domain}
              </Text>
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
                {[
                  item.total_features != null ? `${item.total_features} marcadores` : null,
                  item.laboratory,
                  fmtOmicsDate(item.collected_on ?? item.created_at),
                ].filter(Boolean).join(' · ')}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  )
}
