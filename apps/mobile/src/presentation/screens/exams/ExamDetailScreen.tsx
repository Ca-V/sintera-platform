// Detalhe do Exame (Inc.5) — COMPOSIÇÃO de primitivos DS + `useExam` (sem rede/domínio aqui). FRONTEIRA
// REG-001: exibe os campos centrais + leva ao DOCUMENTO ORIGINAL (`file_url`, fonte da verdade). NUNCA
// resultado interpretado/diagnóstico. Read-only.
import { ScrollView, View, ActivityIndicator, Linking, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { Button, FieldRow, Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { DocumentosStackParamList } from '../../navigation/types'
import { useExam } from './useExam'

type Props = NativeStackScreenProps<DocumentosStackParamList, 'ExamDetail'>

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

export function ExamDetailScreen({ route }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const p = useExam(route.params.id)

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
        <Text spec={text(t, { role: 'bodyStrong' })}>{exam.display_title ?? '—'}</Text>
      </FieldRow>
      <FieldRow label="Data">
        <Text spec={text(t, { role: 'body' })}>{formatDate(exam.exam_date)}</Text>
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
      {exam.status ? (
        <FieldRow label="Situação">
          <Text spec={text(t, { role: 'body', tone: 'muted' })}>{exam.status}</Text>
        </FieldRow>
      ) : null}

      {exam.file_url ? (
        <Button label="Abrir documento original" onPress={() => Linking.openURL(exam.file_url as string)} />
      ) : (
        <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>Documento original não disponível.</Text>
      )}

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
