import { useState } from 'react'
import { View, Text, Pressable, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen, Card, Button, Field } from '@/components/ui'
import { BiomarkerList } from '@/components/BiomarkerList'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, font } from '@/lib/theme'

// Detalhe do exame: dados extraídos (BiomarkerList, scope=exam) + ciclo de vida —
// editar tipo/data (PATCH /api/exams) e excluir (DELETE /api/exams/[id]).
export default function ExamDetailScreen() {
  const router = useRouter()
  const { id, title, subtitle } = useLocalSearchParams<{ id: string; title?: string; subtitle?: string }>()
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState(title && title !== 'Exame' ? String(title) : '')
  const [examDate, setExamDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Dispara a extração de dados (mesma rota da Web: POST /api/exams/[id]/analyze).
  // Síncrona — baixa o arquivo, extrai por IA e marca 'processed'. Ao concluir, remonta
  // a lista de biomarcadores. Fecha a jornada: upload → extração → visualização.
  async function analyze() {
    setAnalyzing(true)
    try {
      await api.post(`/api/exams/${id}/analyze`)
      setReloadKey((k) => k + 1)
      Alert.alert('Pronto', 'Dados extraídos do exame.')
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível extrair os dados.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function saveEdit() {
    setBusy(true)
    try {
      await api.patch('/api/exams', {
        id,
        type: type.trim() || undefined,
        examDate: examDate.trim() || undefined,
      })
      setEditing(false)
      router.setParams({ title: type.trim() || 'Exame' })
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir exame',
      'Isto remove o exame, seus biomarcadores e o arquivo. Ação irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setBusy(true)
            try { await api.del(`/api/exams/${id}`); router.back() }
            catch (e) { Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao excluir.'); setBusy(false) }
          },
        },
      ],
    )
  }

  return (
    <Screen title={title || 'Exame'} back scroll={false}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xs, gap: spacing.sm }}>
        {subtitle ? <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>{subtitle}</Text> : null}
        {editing ? (
          <Card>
            <View style={{ gap: spacing.md }}>
              <Field label="Tipo" value={type} onChangeText={setType} placeholder="Ex.: Hemograma" />
              <Field label="Data do exame" value={examDate} onChangeText={setExamDate} placeholder="AAAA-MM-DD" />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}><Button label="Salvar" onPress={saveEdit} loading={busy} /></View>
                <View style={{ flex: 1 }}><Button label="Cancelar" variant="ghost" onPress={() => setEditing(false)} /></View>
              </View>
            </View>
          </Card>
        ) : (
          <>
            <Button label={analyzing ? 'Extraindo…' : 'Extrair dados'} onPress={analyze} loading={analyzing} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Pressable onPress={() => setEditing(true)} hitSlop={8}><Text style={{ color: colors.petal, fontSize: font.size.sm }}>Editar</Text></Pressable>
              <Pressable onPress={confirmDelete} hitSlop={8} disabled={busy}><Text style={{ color: colors.red, fontSize: font.size.sm }}>Excluir</Text></Pressable>
            </View>
          </>
        )}
      </View>
      <BiomarkerList key={reloadKey} examId={id} emptyText="Nenhum dado extraído ainda. Toque em “Extrair dados”." />
    </Screen>
  )
}
