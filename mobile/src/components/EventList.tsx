// Lista de eventos da Jornada de Saúde (somente leitura). Consome GET /api/agenda?view=…
// — a projeção mora no domínio Agenda (servidor); aqui só renderizamos HealthEvent[].
import { useCallback, useState } from 'react'
import { Text, FlatList, RefreshControl } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Screen, Card, Loading } from './ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, font } from '@/lib/theme'

export interface HealthEvent {
  id: string
  type: string
  title: string
  status: string
  date: string
  time: string | null
  amountCents: number | null
}

const TYPE_EMOJI: Record<string, string> = {
  consulta: '🩺', retorno: '📋', exame: '🧪', procedimento: '🩹', cirurgia: '⚕️',
  vacina: '💉', medicamento: '💊', suplemento: '🌿', plano: '🏥', outro: '📌',
}
const STATUS_LABEL: Record<string, string> = {
  planejado: 'Planejado', realizado: 'Realizado', cancelado: 'Cancelado', adiado: 'Adiado',
}

function dateLabel(iso: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function money(cents: number | null): string {
  if (cents == null) return ''
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function EventList({ title, view, showAmount, emptyText }: {
  title: string
  view: 'upcoming' | 'historical' | 'financial' | 'all'
  showAmount?: boolean
  emptyText?: string
}) {
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.get<{ events: HealthEvent[] }>(`/api/agenda?view=${view}`)
      setEvents(data.events ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }, [view])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <Screen title={title} back scroll={false}>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading && events.length > 0} onRefresh={load} tintColor={colors.petal} />}
        ListEmptyComponent={
          loading ? <Loading /> : (
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
              {error ?? emptyText ?? 'Nada por aqui ainda.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>
              {(TYPE_EMOJI[item.type] ?? '📌')} {item.title}
            </Text>
            <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
              {[dateLabel(item.date), item.time, STATUS_LABEL[item.status] ?? item.status,
                showAmount ? money(item.amountCents) : null].filter(Boolean).join(' · ')}
            </Text>
          </Card>
        )}
      />
    </Screen>
  )
}
