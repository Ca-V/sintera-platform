// Sparkline — mini-gráfico de linha, factual (sem eixos nem juízo clínico).
//
// PARIDADE com a Web (`src/components/Sparkline.tsx`). A geometria vem de `planoDaSparkline`, no core; aqui
// só há o mecanismo `react-native-svg`.
//
// Apenas organiza visualmente o que a pessoa registrou. Não interpreta.
import Svg, { Circle, Polyline } from 'react-native-svg'
import { planoDaSparkline } from '@sintera/core'
import { useTheme } from '../theme'

interface Props {
  values: number[]
  width?: number
  height?: number
  /** Cor do traço. Por padrão a do texto — a miniatura acompanha o indicador, não compete com ele. */
  color?: string
}

export function Sparkline({ values, width = 88, height = 24, color }: Props) {
  const t = useTheme()
  const plano = planoDaSparkline(values, width, height)
  // `null` com menos de dois valores: um ponto só não tem evolução, e uma bolinha sozinha sugeriria série.
  if (!plano) return null

  const cor = color ?? t.color.text.default

  return (
    <Svg width={plano.largura} height={plano.altura}>
      <Polyline
        points={plano.pontos}
        fill="none"
        stroke={cor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      <Circle cx={plano.ultimoX} cy={plano.ultimoY} r={2.2} fill={cor} />
    </Svg>
  )
}
