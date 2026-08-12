import { useCallback, useState } from 'react'
import { View, Text, Pressable, Alert, Share, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Screen, Card, Button, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { API_URL } from '@/lib/config'
import { colors, spacing, radius, font } from '@/lib/theme'

// Relatório — gera links somente-leitura (/r/[token]) para compartilhar com profissionais.
// Consome /api/report/shares (Bearer). O token e a validade nascem no servidor; aqui o
// usuário escolhe as seções e compartilha o link pelo share nativo.
interface ReportShare { id: string; token: string; expiresAt: string }

const SECTIONS: { key: string; label: string }[] = [
  { key: 'exames', label: 'Exames' },
  { key: 'omica', label: 'Ômica' },
  { key: 'medicamentos', label: 'Medicamentos' },
  { key: 'condicoes', label: 'Condições' },
  { key: 'sinais', label: 'Sinais vitais' },
  { key: 'medidas', label: 'Medidas' },
  { key: 'habitos', label: 'Hábitos' },
  { key: 'ciclo', label: 'Ciclo' },
  { key: 'visao', label: 'Visão' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'gastos', label: 'Gastos' },
]

function shareUrl(token: string): string {
  return `${API_URL}/r/${token}`
}
function expiryLabel(iso: string): string {
  if (!iso) return ''
  return `expira ${new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export default function RelatorioScreen() {
  const [shares, setShares] = useState<ReportShare[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.key, true])),
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.get<{ shares: ReportShare[] }>('/api/report/shares')
      setShares(data.shares ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function createShare() {
    setBusy(true)
    try {
      const sections = SECTIONS.map((s) => s.key).filter((k) => selected[k])
      await api.post('/api/report/shares', { sections, period: null })
      await load()
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível criar o link.')
    } finally {
      setBusy(false)
    }
  }
  function shareLink(s: ReportShare) {
    Share.share({ message: `Meu relatório de saúde (link temporário): ${shareUrl(s.token)}` })
  }
  function revoke(s: ReportShare) {
    Alert.alert('Revogar link', 'O link deixará de funcionar imediatamente.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revogar', style: 'destructive',
        onPress: async () => {
          setBusy(true)
          try { await api.del(`/api/report/shares?id=${encodeURIComponent(s.id)}`); await load() }
          catch (e) { Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao revogar.') }
          finally { setBusy(false) }
        },
      },
    ])
  }

  if (loading) return <Screen title="Relatório" back><Loading /></Screen>

  return (
    <Screen title="Relatório" back scroll={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
      >
        {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}

        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1 }}>
            Seções do relatório
          </Text>
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {SECTIONS.map((s) => {
                const on = selected[s.key]
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSelected((sel) => ({ ...sel, [s.key]: !sel[s.key] }))}
                    style={{
                      paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
                      borderWidth: 1, borderColor: on ? colors.petal : colors.border,
                      backgroundColor: on ? colors.petal : 'transparent',
                    }}
                  >
                    <Text style={{ color: on ? '#fff' : colors.onyx, fontSize: font.size.sm }}>{s.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </Card>
          <Button label="Gerar link de compartilhamento" onPress={createShare} loading={busy} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1 }}>
            Links ativos
          </Text>
          {shares.length === 0 && <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>Nenhum link ativo.</Text>}
          {shares.map((s) => (
            <Card key={s.id}>
              <Text numberOfLines={1} style={{ fontSize: font.size.sm, color: colors.onyx }}>{shareUrl(s.token)}</Text>
              <Text style={{ fontSize: font.size.xs, color: colors.mauve, marginTop: 2 }}>{expiryLabel(s.expiresAt)}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <View style={{ flex: 1 }}><Button label="Compartilhar" onPress={() => shareLink(s)} /></View>
                <View style={{ flex: 1 }}><Button label="Revogar" variant="ghost" onPress={() => revoke(s)} /></View>
              </View>
            </Card>
          ))}
        </View>

        <Text style={{ color: colors.mauve, fontSize: font.size.xs, textAlign: 'center' }}>
          O link é somente leitura, temporário e revogável a qualquer momento.
        </Text>
      </ScrollView>
    </Screen>
  )
}
