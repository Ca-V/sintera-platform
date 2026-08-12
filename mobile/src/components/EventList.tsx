// Lista de eventos da Jornada de Saúde. Consome GET /api/agenda?view=… (a projeção mora
// no domínio Agenda, no servidor). Escrita (criar/concluir/cancelar/excluir) delega às
// rotas POST/PATCH/DELETE /api/agenda — a máquina de estados é do domínio, não daqui.
import { useCallback, useState } from 'react'
import { View, Text, Pressable, Alert, FlatList, RefreshControl } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Screen, Card, Button, Loading } from './ui'
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
  planejado: 'Planejado', realizado: 'Realizado', cancelado: 'Cancelado', reagendado: 'Reagendado',
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

export function EventList({ title, view, showAmount, canCreate, canAct, emptyText }: {
  title: string
  view: 'upcoming' | 'historical' | 'financial' | 'all'
  showAmount?: boolean
  /** Mostra botão "Novo evento" (Agenda). */
  canCreate?: boolean
  /** Habilita menu de ações no toque (concluir/cancelar/excluir). */
  canAct?: boolean
  emptyText?: string
}) {
  const router = useRouter()
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
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

  const act = useCallback(async (id: string, run: () => Promise<unknown>) => {
    setBusyId(id)
    try {
      await run()
      await load()
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível concluir a ação.')
    } finally {
      setBusyId(null)
    }
  }, [load])

  function openActions(ev: HealthEvent) {
    if (!canAct) return
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = []
    if (ev.status === 'planejado') {
      buttons.push({ text: 'Concluir', onPress: () => act(ev.id, () => api.patch('/api/agenda', { id: ev.id, action: 'complete' })) })
      buttons.push({ text: 'Cancelar evento', onPress: () => act(ev.id, () => api.patch('/api/agenda', { id: ev.id, action: 'cancel' })) })
    } else {
      buttons.push({ text: 'Reabrir', onPress: () => act(ev.id, () => api.patch('/api/agenda', { id: ev.id, action: 'reopen' })) })
    }
    buttons.push({ text: 'Excluir', style: 'destructive', onPress: () => act(ev.id, () => api.del(`/api/agenda?id=${encodeURIComponent(ev.id)}`)) })
    buttons.push({ text: 'Fechar', style: 'cancel' })
    Alert.alert(ev.title, undefined, buttons)
  }

  return (
    <Screen title={title} back scroll={false}>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading && events.length > 0} onRefresh={load} tintColor={colors.petal} />}
        ListHeaderComponent={
          canCreate ? (
            <View style={{ marginBottom: spacing.sm }}>
              <Button label="Novo evento" onPress={() => router.push('/(app)/event-new')} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? <Loading /> : (
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
              {error ?? emptyText ?? 'Nada por aqui ainda.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openActions(item)} disabled={!canAct || busyId === item.id}>
            <Card style={{ opacity: busyId === item.id ? 0.5 : 1 }}>
              <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>
                {(TYPE_EMOJI[item.type] ?? '📌')} {item.title}
              </Text>
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
                {[dateLabel(item.date), item.time, STATUS_LABEL[item.status] ?? item.status,
                  showAmount ? money(item.amountCents) : null].filter(Boolean).join(' · ')}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  )
}
