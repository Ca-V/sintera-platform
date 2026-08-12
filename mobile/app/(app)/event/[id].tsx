import { useCallback, useState } from 'react'
import { View, Text, Image, Alert, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { Screen, Card, Button, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

// Detalhe de um evento da jornada — GET /api/agenda?id=. Mostra os campos completos +
// anexo, e concentra as ações (editar/concluir/cancelar/reabrir/excluir).
interface HealthEvent {
  id: string; type: string; title: string; status: string
  date: string; time: string | null; durationMin: number | null
  professionalName: string | null; professionalKind: string | null
  establishment: string | null; location: string | null; modality: string | null
  preparation: string | null; notes: string | null; amountCents: number | null
  attachmentUrl: string | null; reminderEnabled: boolean
}

const STATUS_LABEL: Record<string, string> = {
  planejado: 'Planejado', realizado: 'Realizado', cancelado: 'Cancelado', reagendado: 'Reagendado',
}
function dateLabel(iso: string): string {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function money(c: number | null): string | null {
  return c == null ? null : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <View style={{ marginTop: spacing.sm }}>
      <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontSize: font.size.md, color: colors.onyx, marginTop: 2 }}>{value}</Text>
    </View>
  )
}

export default function EventDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [ev, setEv] = useState<HealthEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const data = await api.get<{ event: HealthEvent | null }>(`/api/agenda?id=${encodeURIComponent(id)}`)
      setEv(data.event)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o evento.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const act = useCallback(async (run: () => Promise<unknown>, thenBack = false) => {
    setBusy(true)
    try { await run(); if (thenBack) router.back(); else await load() }
    catch (e) { Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha na ação.') }
    finally { setBusy(false) }
  }, [load, router])

  function confirmDelete() {
    Alert.alert('Excluir evento', 'Ação irreversível.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => act(() => api.del(`/api/agenda?id=${encodeURIComponent(id!)}`), true) },
    ])
  }

  if (loading) return <Screen title="Evento" back><Loading /></Screen>
  if (!ev) return <Screen title="Evento" back><Text style={{ padding: spacing.xl, color: colors.mauve }}>{error ?? 'Evento não encontrado.'}</Text></Screen>

  const planned = ev.status === 'planejado'

  return (
    <Screen title={ev.title} back scroll={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
      >
        <Card>
          <Text style={{ fontSize: font.size.sm, color: colors.mauve }}>{STATUS_LABEL[ev.status] ?? ev.status}</Text>
          <Row label="Data" value={[dateLabel(ev.date), ev.time?.slice(0, 5)].filter(Boolean).join(' · ')} />
          <Row label="Profissional" value={[ev.professionalName, ev.professionalKind].filter(Boolean).join(' · ') || null} />
          <Row label="Local" value={ev.establishment || ev.location} />
          <Row label="Modalidade" value={ev.modality} />
          <Row label="Preparo" value={ev.preparation} />
          <Row label="Valor" value={money(ev.amountCents)} />
          <Row label="Observações" value={ev.notes} />
          <Row label="Lembrete" value={ev.reminderEnabled ? 'Ativado' : 'Desativado'} />
        </Card>

        {ev.attachmentUrl ? (
          <Card>
            <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', marginBottom: spacing.sm }}>Anexo</Text>
            <Image source={{ uri: ev.attachmentUrl }} style={{ width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.blush }} resizeMode="cover" />
          </Card>
        ) : null}

        <Button
          label="Editar"
          variant="ghost"
          onPress={() => router.push({
            pathname: '/(app)/event-new',
            params: {
              id: ev.id, type: ev.type, title: ev.title, date: ev.date, time: ev.time ?? '',
              professionalName: ev.professionalName ?? '', establishment: ev.establishment ?? '', notes: ev.notes ?? '',
              attachmentUrl: ev.attachmentUrl ?? '',
            },
          })}
        />
        {planned ? (
          <>
            <Button label="Concluir" onPress={() => act(() => api.patch('/api/agenda', { id: ev.id, action: 'complete' }))} loading={busy} />
            <Button label="Cancelar evento" variant="ghost" onPress={() => act(() => api.patch('/api/agenda', { id: ev.id, action: 'cancel' }))} disabled={busy} />
          </>
        ) : (
          <Button label="Reabrir" variant="ghost" onPress={() => act(() => api.patch('/api/agenda', { id: ev.id, action: 'reopen' }))} disabled={busy} />
        )}
        <Button label="Excluir" variant="ghost" onPress={confirmDelete} disabled={busy} />
      </ScrollView>
    </Screen>
  )
}
