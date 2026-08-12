import { useCallback, useState } from 'react'
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Screen, Card, Button, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, font } from '@/lib/theme'

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
  const router = useRouter()
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

  // Recarrega ao focar (ex.: após enviar um exame na tela de captura).
  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <Screen title="Exames" back scroll={false}>
      <FlatList
        data={exams}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading && exams.length > 0} onRefresh={load} tintColor={colors.petal} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm }}>
            <Button label="Enviar exame" onPress={() => router.push('/(app)/exam-capture')} />
          </View>
        }
        ListEmptyComponent={
          loading ? <Loading /> : (
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
              {error ?? 'Nenhum exame enviado ainda.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({
            pathname: '/(app)/exams/[id]',
            params: { id: item.id, title: item.type ?? 'Exame', subtitle: `${effectiveDate(item)} · ${STATUS_LABEL[item.status] ?? item.status}` },
          })}>
            <Card>
              <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>
                {item.type ?? 'Exame'}
              </Text>
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
                {effectiveDate(item)} · {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  )
}
