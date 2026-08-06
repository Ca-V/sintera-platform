// Primitivo RN — MetricRow. Hierarquia de MÉTRICA (ADR-021/A6): o VALOR é o herói (destaque), o rótulo do
// indicador o acompanha, e os metadados (origem · data · confiabilidade) ficam SUBORDINADOS em linha própria.
// Consome os papéis do DS (recipe `text` + token `spacing`) — nada de tamanho/cor/medida hardcoded. Sem regra de
// negócio (DS-003): a tela injeta os textos já formatados. Reutilizável (Composição, Histórico, Monitoramento…).
import { View, type TextStyle } from 'react-native'
import { text, spacing } from '@sintera/design-system'
import { useTheme } from '../theme'
import { Text } from './Text'

type Props = {
  /** Rótulo do indicador (ex.: "Peso", "IMC"). */
  label: string
  /** Valor em destaque, já formatado (ex.: "64 kg (+2,8)"). */
  value: string
  /** Cor opcional do valor (ex.: tendência) — vem do tema, injetada pela tela. */
  valueColor?: string
  /** Metadados subordinados (ex.: "Registro manual · 22/06/2026 · Autorrelatado"). */
  meta?: string
}

export function MetricRow({ label, value, valueColor, meta }: Props) {
  const t = useTheme()
  const valueStyle: TextStyle | undefined = valueColor ? { color: valueColor } : undefined
  return (
    <View style={{ gap: spacing.inline }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.inline }}>
        <Text spec={text(t, { role: 'body' })} style={{ flex: 1 }}>{label}</Text>
        <Text spec={text(t, { role: 'bodyStrong' })} style={valueStyle}>{value}</Text>
      </View>
      {meta ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{meta}</Text> : null}
    </View>
  )
}
