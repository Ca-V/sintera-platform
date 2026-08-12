import { useCallback, useState } from 'react'
import { View, Text, Pressable, Alert, FlatList, RefreshControl } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from 'expo-router'
import { Screen, Card, Button, Field, Loading } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

// Unidades por métrica para o pré-preenchimento pelo scan de bioimpedância.
const SCAN_UNIT: Record<string, string | null> = {
  peso: 'kg', gordura_corporal: '%', massa_muscular: 'kg', agua_corporal: '%',
  gordura_visceral: null, massa_ossea: 'kg', taxa_metabolica: 'kcal',
}

// Medidas corporais — GET /api/medidas { measures } · POST { rows: [...] } · DELETE ?id=.
// Sem edição (paridade com a rota): registra e remove. Origem 'exam' vem da bioimpedância.
interface MeasureEntry {
  id: string
  metric: string
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  examId: string | null
}

const METRIC_LABEL: Record<string, string> = {
  peso: 'Peso', altura: 'Altura', circunferencia_cintura: 'Cintura', imc: 'IMC',
  gordura_corporal: 'Gordura corporal', massa_muscular: 'Massa muscular', agua_corporal: 'Água corporal',
  gordura_visceral: 'Gordura visceral', massa_ossea: 'Massa óssea', taxa_metabolica: 'Taxa metabólica', outro: 'Outro',
}

function dateLabel(iso: string): string {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MedidasScreen() {
  const [measures, setMeasures] = useState<MeasureEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [metric, setMetric] = useState('peso')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [measuredOn, setMeasuredOn] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.get<{ measures: MeasureEntry[] }>('/api/medidas')
      setMeasures(data.measures ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function add() {
    setBusy(true)
    try {
      await api.post('/api/medidas', { rows: [{ metric, value: value.trim(), unit: unit.trim() || null, measuredOn: measuredOn.trim() }] })
      setShowForm(false); setValue(''); setUnit(''); setMeasuredOn(''); setMetric('peso')
      await load()
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao salvar.')
    } finally {
      setBusy(false)
    }
  }
  // Escaneia um laudo de bioimpedância por foto: a IA transcreve as medidas
  // (POST /api/vision/bioimpedance) e registramos as não-nulas (POST /api/medidas).
  // Paridade com a Web (dashboard/medidas). Transcrição factual — a pessoa revê depois.
  async function scan() {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, mediaTypes: ImagePicker.MediaTypeOptions.Images })
    if (res.canceled || !res.assets?.[0]?.base64) return
    const a = res.assets[0]
    setBusy(true)
    try {
      const { result } = await api.post<{ result: Record<string, string | null> | null }>(
        '/api/vision/bioimpedance', { imageBase64: a.base64, mediaType: a.mimeType ?? 'image/jpeg' },
      )
      if (!result) { Alert.alert('Sem leitura', 'Não consegui ler as medidas do laudo.'); return }
      const measuredOn = (result.measured_on as string | null) || new Date().toISOString().slice(0, 10)
      const rows = Object.keys(SCAN_UNIT)
        .filter((metric) => result[metric])
        .map((metric) => ({ metric, value: String(result[metric]), unit: SCAN_UNIT[metric], measuredOn }))
      if (rows.length === 0) { Alert.alert('Sem leitura', 'Nenhuma medida reconhecida no laudo.'); return }
      await api.post('/api/medidas', { rows })
      await load()
      Alert.alert('Pronto', `${rows.length} medida(s) registrada(s) do laudo.`)
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao escanear o laudo.')
    } finally {
      setBusy(false)
    }
  }
  function remove(m: MeasureEntry) {
    Alert.alert('Remover', 'Remover esta medida?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        setBusy(true)
        try { await api.del(`/api/medidas?id=${encodeURIComponent(m.id)}`); await load() }
        catch (e) { Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao remover.') }
        finally { setBusy(false) }
      } },
    ])
  }

  if (loading) return <Screen title="Medidas" back><Loading /></Screen>

  return (
    <Screen title="Medidas" back scroll={false}>
      <FlatList
        data={measures}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm, gap: spacing.md }}>
            {showForm ? (
              <Card>
                <View style={{ gap: spacing.md }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {Object.entries(METRIC_LABEL).map(([v, label]) => {
                      const active = metric === v
                      return (
                        <Pressable key={v} onPress={() => setMetric(v)}
                          style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: active ? colors.petal : colors.border, backgroundColor: active ? colors.petal : 'transparent' }}>
                          <Text style={{ color: active ? '#fff' : colors.onyx, fontSize: font.size.sm }}>{label}</Text>
                        </Pressable>
                      )
                    })}
                  </View>
                  <Field label="Valor" value={value} onChangeText={setValue} placeholder="Ex.: 68.5" keyboardType="numeric" />
                  <Field label="Unidade" value={unit} onChangeText={setUnit} placeholder="Ex.: kg" />
                  <Field label="Data" value={measuredOn} onChangeText={setMeasuredOn} placeholder="AAAA-MM-DD" />
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}><Button label="Registrar" onPress={add} loading={busy} disabled={!value.trim() || !measuredOn.trim()} /></View>
                    <View style={{ flex: 1 }}><Button label="Cancelar" variant="ghost" onPress={() => setShowForm(false)} /></View>
                  </View>
                </View>
              </Card>
            ) : (
              <>
                <Button label="Registrar medida" onPress={() => setShowForm(true)} />
                <Button label="Escanear laudo (bioimpedância)" variant="ghost" onPress={scan} loading={busy} />
              </>
            )}
          </View>
        }
        ListEmptyComponent={<Text style={{ color: colors.mauve, fontSize: font.size.sm }}>{error ?? 'Nenhuma medida registrada.'}</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>
                  {(METRIC_LABEL[item.metric] ?? item.metric)}: {item.valueText}{item.unit ? ` ${item.unit}` : ''}
                </Text>
                <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>
                  {[dateLabel(item.measuredOn), item.examId ? 'da bioimpedância' : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Pressable onPress={() => remove(item)} hitSlop={10}>
                <Text style={{ color: colors.red, fontSize: font.size.sm }}>Remover</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />
    </Screen>
  )
}
