// Detalhe do Exame (Inc.5) — COMPOSIÇÃO de primitivos DS + `useExam` (sem rede/domínio aqui). FRONTEIRA
// REG-001: exibe os campos centrais + leva ao DOCUMENTO ORIGINAL (`file_url`, fonte da verdade). NUNCA
// resultado interpretado/diagnóstico. Read-only.
import { ScrollView, View, ActivityIndicator, Linking, Alert, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { Button, FieldRow, Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { DocumentosStackParamList } from '../../navigation/types'
import { useExam } from './useExam'
import { examStatusLabel, isExamFailed } from './examStatus'
import { formatExamDate } from './examFormat'

type Props = NativeStackScreenProps<DocumentosStackParamList, 'ExamDetail'>

export function ExamDetailScreen({ route, navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const p = useExam(route.params.id)

  // Exclusão pelo dono (gated — MOBILE-030): confirmação irreversível; sucesso volta à lista (que re-busca ao focar).
  const onDelete = () => {
    Alert.alert('Excluir exame', 'Esta ação é irreversível. O documento e os dados extraídos serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await p.remove()
          if (error) {
            Alert.alert('Não foi possível excluir', 'Tente novamente mais tarde.')
            return
          }
          navigation.goBack()
        },
      },
    ])
  }

  if (p.phase === 'idle' || p.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando o exame…</Text>
      </View>
    )
  }

  if (p.phase === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>
          {p.error ?? 'Não foi possível carregar o exame.'}
        </Text>
        <Button label="Tentar novamente" variant="secondary" onPress={p.retry} />
      </View>
    )
  }

  const exam = p.exam
  if (!exam) {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Exame não encontrado.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
    >
      <FieldRow label="Exame">
        <Text spec={text(t, { role: 'bodyStrong' })}>{exam.display_title ?? exam.type ?? '—'}</Text>
      </FieldRow>
      <FieldRow label="Data">
        <Text spec={text(t, { role: 'body' })}>{formatExamDate(exam.exam_date)}</Text>
      </FieldRow>
      {exam.issuer ? (
        <FieldRow label="Emissor">
          <Text spec={text(t, { role: 'body' })}>{exam.issuer}</Text>
        </FieldRow>
      ) : null}
      {exam.requesting_physician ? (
        <FieldRow label="Solicitante">
          <Text spec={text(t, { role: 'body' })}>{exam.requesting_physician}</Text>
        </FieldRow>
      ) : null}
      {exam.clinical_family ? (
        <FieldRow label="Família clínica">
          <Text spec={text(t, { role: 'body' })}>{exam.clinical_family}</Text>
        </FieldRow>
      ) : null}
      {examStatusLabel(exam.status) ? (
        <FieldRow label="Situação">
          <Text
            spec={text(t, { role: 'body', tone: 'muted' })}
            style={isExamFailed(exam.status) ? { color: t.color.badge.error.text } : undefined}
          >
            {examStatusLabel(exam.status)}
          </Text>
        </FieldRow>
      ) : null}

      {/* Reprocessar (paridade Web: "Extrair novamente"). SEMPRE disponível com documento — atualiza a
          extração (ex.: emissor de exames antigos). Rótulo de recuperação quando falhou/sem nome. */}
      {exam.file_url ? (
        <Button
          label={isExamFailed(exam.status) || !exam.display_title ? 'Tentar processar novamente' : 'Extrair novamente'}
          variant="secondary"
          onPress={p.reanalyze}
        />
      ) : null}

      {exam.file_url ? (
        <Button label="Abrir documento original" onPress={() => Linking.openURL(exam.file_url as string)} />
      ) : (
        <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>Documento original não disponível.</Text>
      )}

      <Button label="Excluir exame" variant="secondary" onPress={onDelete} />

      <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={{ marginTop: 8 }}>
        O documento original é a fonte da verdade. A SINTERA organiza e dá acesso — não interpreta resultados
        (RDC 657/2022).
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
})
