// Tela de UPLOAD de exame (Inc.6) — COMPOSIÇÃO de primitivos DS + `useExamUpload`. FRONTEIRA REG-001: envia e
// organiza o DOCUMENTO (não interpreta resultado). Consome os estados de UX já definidos (`uploadPhaseLabel`/
// `isUploadBusy`) e a lista de formatos aceitos (`acceptedFormatsHint`). Sucesso → volta ao Histórico ('pending').
import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { acceptedFormatsHint, DEFAULT_UPLOAD_CONSTRAINTS } from '@sintera/api-client'
import { heading, text } from '@sintera/design-system'
import { Button, Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { ExamesStackParamList } from '../../navigation/types'
import { useExamUpload } from './useExamUpload'
import { uploadPhaseLabel, isUploadBusy } from './uploadPresentation'

type Props = NativeStackScreenProps<ExamesStackParamList, 'ExamUpload'>

export function ExamUploadScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { state, pick, retry, reset } = useExamUpload()

  // Sucesso: vai direto ao DETALHE do exame (paridade Web) — lá a extração já foi disparada (useExamUpload) e o
  // usuário vê o estado de processamento/polling imediatamente, em vez de voltar à lista sem feedback.
  useEffect(() => {
    if (state.phase !== 'done') return
    const id = setTimeout(() => {
      if (state.examId) navigation.replace('ExamDetail', { id: state.examId })
      else navigation.navigate('ExamsList')
    }, 900)
    return () => clearTimeout(id)
  }, [state.phase, state.examId, navigation])

  const busy = isUploadBusy(state.phase)

  return (
    <View style={[styles.root, { backgroundColor: t.color.surface.app, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.body}>
        <Text spec={heading(t, { level: 'page' })}>Adicionar exame</Text>
        <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>
          Envie o documento do seu exame. A SINTERA organiza e dá acesso — não interpreta resultados (RDC 657/2022).
        </Text>

        {busy ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.color.identity.primary} />
            <Text spec={text(t, { role: 'body', tone: 'muted' })}>{uploadPhaseLabel(state.phase)}</Text>
          </View>
        ) : state.phase === 'done' ? (
          <View style={styles.center}>
            <Text spec={text(t, { role: 'bodyStrong' })}>Concluído ✓</Text>
            <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })} style={styles.centerText}>
              Enviado — o exame já aparece no seu histórico.
            </Text>
          </View>
        ) : state.phase === 'error' ? (
          <View style={styles.center}>
            <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>
              {state.error ?? 'Não foi possível enviar o exame.'}
            </Text>
            <Button label="Tentar novamente" onPress={retry} />
            <Button label="Escolher outro" variant="secondary" onPress={reset} />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button label="Escolher documento" onPress={() => pick('document')} />
            <Button label="Usar a câmera" variant="secondary" onPress={() => pick('camera')} />
            <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={styles.centerText}>
              Aceitos: {acceptedFormatsHint(DEFAULT_UPLOAD_CONSTRAINTS)} · até{' '}
              {Math.round(DEFAULT_UPLOAD_CONSTRAINTS.maxBytes / (1024 * 1024))} MB.
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  body: { gap: 16 },
  actions: { gap: 12, marginTop: 8 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 },
  centerText: { textAlign: 'center' },
})
