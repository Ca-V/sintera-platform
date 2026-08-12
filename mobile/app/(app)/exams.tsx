import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

interface Exam {
  id: string
  type: string | null
  status: string
  exam_date: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  processed: 'Dados extraídos',
  pending: 'Aguardando',
  processing: 'Processando',
  error: 'Erro',
}

function effectiveDate(e: Exam): string {
  const iso = e.exam_date ?? e.created_at ?? ''
  if (!iso) return ''
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Lista de exames — consome GET /api/exams (mesma rota da Web) com Bearer.
export default function ExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.get<{ exams: Exam[] }>('/api/exams')
      setExams(data.exams ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar os exames.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
        <Text style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.onyx }}>Exames</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.petal} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
          ListEmptyComponent={
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
              {error ?? 'Nenhum exame enviado ainda.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: colors.cream, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}>
              <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>
                {item.type ?? 'Exame'}
              </Text>
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
                {effectiveDate(item)} · {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}
