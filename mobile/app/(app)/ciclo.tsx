import { useCallback, useState } from 'react'
import { View, Text, Pressable, Alert, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Screen, Card, Button, Field, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

// Ciclo & contracepção — consome GET /api/ciclo { methods, periods } e escreve nas rotas
// /api/ciclo/methods e /api/ciclo/periods (Bearer). A lógica (lembrete de troca, upsert do
// dia) é do domínio; aqui só o formulário. Sem juízo clínico.
interface Method {
  id: string
  kind: string
  brand: string | null
  startedOn: string | null
  replaceOn: string | null
  status: 'ativo' | 'encerrado'
  notes: string | null
}
interface Period { id: string; startedOn: string; notes: string | null }

const KINDS = [
  { value: 'diu_cobre', label: 'DIU de cobre' },
  { value: 'diu_hormonal', label: 'DIU hormonal' },
  { value: 'implante', label: 'Implante' },
  { value: 'injecao', label: 'Injeção' },
  { value: 'anel', label: 'Anel vaginal' },
  { value: 'adesivo', label: 'Adesivo' },
  { value: 'pilula', label: 'Pílula' },
  { value: 'outro', label: 'Outro' },
]
const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? 'Método'

function dateLabel(iso: string | null): string {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CicloScreen() {
  const [methods, setMethods] = useState<Method[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [kind, setKind] = useState('pilula')
  const [brand, setBrand] = useState('')
  const [startedOn, setStartedOn] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.get<{ methods: Method[]; periods: Period[] }>('/api/ciclo')
      setMethods(data.methods ?? [])
      setPeriods(data.periods ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try { await fn(); await load() }
    catch (e) { Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha na operação.') }
    finally { setBusy(false) }
  }, [load])

  async function addMethod() {
    await run(async () => {
      await api.post('/api/ciclo/methods', { kind, brand: brand.trim() || null, startedOn: startedOn.trim() || null, reminder: true })
      setShowForm(false); setBrand(''); setStartedOn(''); setKind('pilula')
    })
  }
  function toggleStatus(m: Method) {
    run(() => api.patch('/api/ciclo/methods', { id: m.id, status: m.status === 'ativo' ? 'encerrado' : 'ativo' }))
  }
  function removeMethod(m: Method) {
    Alert.alert('Remover', `Remover "${kindLabel(m.kind)}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => run(() => api.del(`/api/ciclo/methods?id=${encodeURIComponent(m.id)}`)) },
    ])
  }
  function registerPeriodToday() {
    run(() => api.post('/api/ciclo/periods', {}))
  }
  function removePeriod(p: Period) {
    run(() => api.del(`/api/ciclo/periods?id=${encodeURIComponent(p.id)}`))
  }

  if (loading) return <Screen title="Ciclo" back><Loading /></Screen>

  return (
    <Screen title="Ciclo" back scroll={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
      >
        {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}

        {/* Menstruação */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1 }}>Menstruação</Text>
          <Button label="Registrar menstruação (hoje)" onPress={registerPeriodToday} loading={busy} />
          {periods.slice(0, 6).map((p) => (
            <Card key={p.id} style={{ paddingVertical: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, fontSize: font.size.md, color: colors.onyx }}>{dateLabel(p.startedOn)}</Text>
                <Pressable onPress={() => removePeriod(p)} hitSlop={10}>
                  <Text style={{ color: colors.red, fontSize: font.size.sm }}>Remover</Text>
                </Pressable>
              </View>
            </Card>
          ))}
          {periods.length === 0 && <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>Nenhum registro ainda.</Text>}
        </View>

        {/* Contracepção */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1 }}>Contracepção</Text>
          {showForm ? (
            <Card>
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {KINDS.map((k) => {
                    const active = kind === k.value
                    return (
                      <Pressable key={k.value} onPress={() => setKind(k.value)}
                        style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: active ? colors.petal : colors.border, backgroundColor: active ? colors.petal : 'transparent' }}>
                        <Text style={{ color: active ? '#fff' : colors.onyx, fontSize: font.size.sm }}>{k.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                <Field label="Marca" value={brand} onChangeText={setBrand} placeholder="Opcional" />
                <Field label="Início" value={startedOn} onChangeText={setStartedOn} placeholder="AAAA-MM-DD" />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}><Button label="Adicionar" onPress={addMethod} loading={busy} /></View>
                  <View style={{ flex: 1 }}><Button label="Cancelar" variant="ghost" onPress={() => setShowForm(false)} /></View>
                </View>
              </View>
            </Card>
          ) : (
            <Button label="Adicionar método" onPress={() => setShowForm(true)} />
          )}
          {methods.map((m) => (
            <Pressable key={m.id} onPress={() => toggleStatus(m)} onLongPress={() => removeMethod(m)}>
              <Card style={{ opacity: m.status === 'encerrado' ? 0.5 : 1 }}>
                <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>
                  {kindLabel(m.kind)}{m.brand ? ` · ${m.brand}` : ''}
                </Text>
                <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
                  {[m.status === 'ativo' ? 'Ativo' : 'Encerrado', m.replaceOn && `troca ${dateLabel(m.replaceOn)}`].filter(Boolean).join(' · ')}
                </Text>
              </Card>
            </Pressable>
          ))}
          {methods.length === 0 && <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>Nenhum método registrado.</Text>}
        </View>

        <Text style={{ color: colors.mauve, fontSize: font.size.xs, textAlign: 'center' }}>
          Toque num método para ativar/encerrar · segure para remover.
        </Text>
      </ScrollView>
    </Screen>
  )
}
