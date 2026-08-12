import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen } from '@/components/ui'
import { BiomarkerList } from '@/components/BiomarkerList'
import { colors, spacing, font } from '@/lib/theme'

// Detalhe do exame: os dados extraídos deste laudo (scope=exam), reutilizando o mesmo
// BiomarkerList da tela de Indicadores via /api/biomarkers/organized?examId=. Título e
// subtítulo vêm por params da lista (sem GET por-id dedicado).
export default function ExamDetailScreen() {
  const { id, title, subtitle } = useLocalSearchParams<{ id: string; title?: string; subtitle?: string }>()
  return (
    <Screen title={title || 'Exame'} back scroll={false}>
      {subtitle ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xs }}>
          <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>{subtitle}</Text>
        </View>
      ) : null}
      <BiomarkerList examId={id} emptyText="Nenhum dado extraído deste exame ainda." />
    </Screen>
  )
}
