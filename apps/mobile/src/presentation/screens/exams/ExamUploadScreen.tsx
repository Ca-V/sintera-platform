// Tela de UPLOAD de exame (Inc.6) — COMPOSIÇÃO de primitivos DS + `useExamUpload`. FRONTEIRA REG-001: envia e
// organiza o DOCUMENTO (não interpreta resultado). Consome os estados de UX já definidos (`uploadPhaseLabel`/
// `isUploadBusy`) e a lista de formatos aceitos (`acceptedFormatsHint`). Sucesso → volta ao Histórico ('pending').
import { useEffect } from 'react'
import { View, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { acceptedFormatsHint, DEFAULT_UPLOAD_CONSTRAINTS } from '@sintera/api-client'
import { heading, text } from '@sintera/design-system'
import { Button, Text, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import type { MinhaSaudeStackParamList } from '../../navigation/types'
import { useExamUpload } from './useExamUpload'
import { uploadPhaseLabel, isUploadBusy } from './uploadPresentation'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'ExamUpload'>

export function ExamUploadScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { state, pick, retry, reset, bundle } = useExamUpload()

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
        <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>Envie o documento do seu exame.</Text>
        <Disclaimer variant="laudo" />

        {bundle.combining ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.color.identity.primary} />
            <Text spec={text(t, { role: 'body', tone: 'muted' })}>Montando documento…</Text>
          </View>
        ) : busy ? (
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
        ) : bundle.pages.length > 0 ? (
          /* Montagem do documento (várias páginas) — reordenar/remover antes de concluir (paridade Web). */
          <View style={styles.actions}>
            <Text spec={text(t, { role: 'bodyStrong' })}>Documento — {bundle.pages.length} página{bundle.pages.length !== 1 ? 's' : ''}</Text>
            {bundle.pages.length > 1 ? (
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Use ‹ › para reordenar as páginas antes de concluir.</Text>
            ) : null}
            <View style={styles.thumbs}>
              {bundle.pages.map((pg, i) => (
                <View key={`${pg.uri}-${i}`} style={[styles.thumb, { borderColor: t.color.border.default }]}>
                  <Image source={{ uri: pg.uri }} style={styles.thumbImg} />
                  <View style={styles.thumbBar}>
                    <Pressable onPress={() => bundle.movePage(i, -1)} disabled={i === 0} hitSlop={6}><Text spec={text(t, { role: 'caption' })} style={{ color: i === 0 ? t.color.text.faint : t.color.identity.primary }}>‹</Text></Pressable>
                    <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{i + 1}</Text>
                    <Pressable onPress={() => bundle.movePage(i, 1)} disabled={i === bundle.pages.length - 1} hitSlop={6}><Text spec={text(t, { role: 'caption' })} style={{ color: i === bundle.pages.length - 1 ? t.color.text.faint : t.color.identity.primary }}>›</Text></Pressable>
                  </View>
                  <Pressable onPress={() => bundle.removePage(i)} style={styles.thumbX} hitSlop={6}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>✕</Text></Pressable>
                </View>
              ))}
            </View>
            <Button label="Adicionar página (foto)" variant="secondary" onPress={bundle.addFromCamera} />
            <Button label="Adicionar da galeria" variant="secondary" onPress={bundle.addFromGallery} />
            <Button label={`Concluir (${bundle.pages.length} pág.)`} onPress={bundle.submitBundle} />
            <Pressable onPress={bundle.resetBundle} style={{ alignSelf: 'center' }}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>Cancelar</Text></Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button label="Selecionar arquivo (PDF ou foto)" onPress={() => pick('document')} />
            <Button label="Tirar foto" variant="secondary" onPress={() => pick('camera')} />
            <Button label="Montar documento (várias páginas)" variant="secondary" onPress={bundle.addFromGallery} />
            <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={styles.centerText}>
              Aceitos: {acceptedFormatsHint(DEFAULT_UPLOAD_CONSTRAINTS)} · até{' '}
              {Math.round(DEFAULT_UPLOAD_CONSTRAINTS.maxBytes / (1024 * 1024))} MB. Para várias páginas, monte um documento.
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
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 72, borderWidth: 1, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: '100%', height: 64 },
  thumbBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 2 },
  thumbX: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: 'rgba(0,0,0,0.35)', borderBottomLeftRadius: 8 },
})

