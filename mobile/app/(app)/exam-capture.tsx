import { useState } from 'react'
import { View, Text, Image, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { Screen, Card, Button, Field } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { uploadExamFile } from '@/lib/upload'
import { colors, spacing, radius, font } from '@/lib/theme'

type Picked = { uri: string; mimeType?: string | null; fileName?: string | null }

// Captura de exame: foto pela câmera ou galeria → upload ao storage (mesmo bucket/path
// da Web) → POST /api/exams { type, fileUrl, examDate }. O registro nasce 'pending' e a
// extração roda no backend (mesma pipeline da Web). Nenhuma regra reimplementada aqui.
export default function ExamCaptureScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [picked, setPicked] = useState<Picked | null>(null)
  const [type, setType] = useState('')
  const [examDate, setExamDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permissão', 'Autorize a câmera para fotografar o laudo.'); return }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    take(res)
  }
  async function fromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images })
    take(res)
  }
  function take(res: ImagePicker.ImagePickerResult) {
    if (res.canceled || !res.assets?.[0]) return
    const a = res.assets[0]
    setPicked({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName })
    setError(null)
  }

  async function submit() {
    if (!user || !picked) return
    setBusy(true)
    setError(null)
    try {
      const { signedUrl } = await uploadExamFile({
        userId: user.id, uri: picked.uri, mimeType: picked.mimeType, fileName: picked.fileName,
      })
      await api.post('/api/exams', {
        type: type.trim() || null,
        fileUrl: signedUrl,
        examDate: examDate.trim() || null,
      })
      router.back()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível enviar o exame.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen title="Enviar exame" back>
      <Card>
        {picked ? (
          <Image
            source={{ uri: picked.uri }}
            style={{ width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.blush }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ height: 220, borderRadius: radius.md, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>Nenhuma imagem selecionada</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}><Button label="Câmera" variant="ghost" onPress={fromCamera} /></View>
          <View style={{ flex: 1 }}><Button label="Galeria" variant="ghost" onPress={fromLibrary} /></View>
        </View>
      </Card>

      <Field label="Tipo do exame" value={type} onChangeText={setType} placeholder="Ex.: Hemograma" />
      <Field label="Data do exame" value={examDate} onChangeText={setExamDate} placeholder="AAAA-MM-DD" />

      {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}

      <Button label="Enviar exame" onPress={submit} loading={busy} disabled={!picked} />
      <Text style={{ color: colors.mauve, fontSize: font.size.xs, textAlign: 'center' }}>
        A extração dos dados roda automaticamente após o envio.
      </Text>
    </Screen>
  )
}
