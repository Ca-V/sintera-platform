// Lista de Exames (Inc.5) — COMPOSIÇÃO de primitivos DS + `useExamsList` (sem rede/domínio aqui; tudo via
// apiClient). FRONTEIRA REG-001: exibe LISTA (título/data/emissor/status) e leva ao documento — NUNCA
// resultado interpretado/diagnóstico/risco. Paridade com a tela de Exames da Web. Agrupada por ano.
import { ScrollView, View, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ExamDTO } from '@sintera/api-client'
import { heading, text } from '@sintera/design-system'
import { Button, Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { DocumentosStackParamList } from '../../navigation/types'
import { useExamsList } from './useExamsList'
import { examStatusLabel, isExamFailed } from './examStatus'
import { formatExamDate } from './examFormat'

type Props = NativeStackScreenProps<DocumentosStackParamList, 'ExamsList'>

/** Agrupa por ano (do `exam_date`, ou `created_at`); "Sem data" por último. Anos em ordem decrescente. */
function groupByYear(exams: readonly ExamDTO[]): { year: string; items: ExamDTO[] }[] {
  const map = new Map<string, ExamDTO[]>()
  for (const e of exams) {
    const year = (e.exam_date ?? e.created_at ?? '').slice(0, 4) || 'Sem data'
    const bucket = map.get(year)
    if (bucket) bucket.push(e)
    else map.set(year, [e])
  }
  return [...map.entries()]
    .sort((a, b) => {
      if (a[0] === 'Sem data') return 1
      if (b[0] === 'Sem data') return -1
      return b[0].localeCompare(a[0])
    })
    .map(([year, items]) => ({ year, items }))
}

export function ExamsListScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const p = useExamsList()

  if (p.phase === 'idle' || p.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando seus exames…</Text>
      </View>
    )
  }

  if (p.phase === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>
          {p.error ?? 'Não foi possível carregar seus exames.'}
        </Text>
        <Button label="Tentar novamente" variant="secondary" onPress={p.retry} />
      </View>
    )
  }

  const exams = p.exams ?? []
  const groups = groupByYear(exams)

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
    >
      <Text spec={heading(t, { level: 'page' })}>Histórico de Exames</Text>
      <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>
        Seus exames ao longo do tempo. Abra um para ver o documento original.
      </Text>

      <Button label="Adicionar exame" onPress={() => navigation.navigate('ExamUpload')} />

      {exams.length === 0 ? (
        <View style={styles.empty}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })}>Nenhum exame ainda.</Text>
        </View>
      ) : (
        groups.map((g) => (
          <View key={g.year} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.year}</Text>
            {g.items.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => navigation.navigate('ExamDetail', { id: e.id })}
                accessibilityRole="button"
                style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}
              >
                <Text spec={text(t, { role: 'bodyStrong' })}>{e.display_title ?? e.type ?? 'Exame'}</Text>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                  {formatExamDate(e.exam_date)}
                  {e.issuer ? ` · ${e.issuer}` : ''}
                </Text>
                {examStatusLabel(e.status) ? (
                  <Text
                    spec={text(t, { role: 'caption', tone: 'faint' })}
                    style={isExamFailed(e.status) ? { color: t.color.badge.error.text } : undefined}
                  >
                    {examStatusLabel(e.status)}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ))
      )}

      <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={{ marginTop: 8 }}>
        A SINTERA organiza e dá acesso aos seus exames. Não interpreta resultados nem substitui a avaliação de um
        profissional de saúde (RDC 657/2022).
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  empty: { paddingVertical: 24, alignItems: 'center' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 4 },
})
