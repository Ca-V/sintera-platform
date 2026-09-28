// BOD-001 área ② — gráfico de Evolução Longitudinal, no aplicativo.
//
// PARIDADE com a Web (`src/components/body/EvolutionChart.tsx`). A GEOMETRIA não está aqui: ela vem de
// `planoDoGraficoDeEvolucao`, no core. Este arquivo só traduz o plano em `react-native-svg`.
//
// É o que garante que os dois gráficos sejam O MESMO gráfico. Se a aritmética vivesse nas duas pontas, elas
// divergiriam no dia em que uma mudasse — em silêncio, porque ninguém compara pixel a pixel duas telas que
// "funcionam".
//
// O QUE ESTE ARQUIVO DECIDE: nada. Cor vem do tema, posição vem do core, e o toque devolve o ponto de origem
// para a tela abrir o exame. Não interpreta valor (RDC 657).
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg'
import { View, StyleSheet } from 'react-native'
import { text } from '@sintera/design-system'
import {
  planoDoGraficoDeEvolucao, GRAFICO_SEM_DADOS,
  type EvoPoint, type MarkerShape, type PontoDoGrafico,
} from '@sintera/core'
import { Text } from './Text'
import { useTheme } from '../theme'

interface Props {
  /** Já ordenados por data (asc) — a ordenação é de quem consulta. */
  points: EvoPoint[]
  unit: string | null
  selectedKey: string | null
  onSelect: (p: EvoPoint) => void
  milestones?: { date: string; color: string }[]
  /** Altura em pontos. A largura é a do contêiner; o SVG escala a moldura fixa do core. */
  height?: number
}

function Marcador({ c, cor }: { c: PontoDoGrafico; cor: string }) {
  const s = c.selecionado ? 5.5 : 4
  const forma: MarkerShape = c.forma
  if (forma === 'square') return <Rect x={c.x - s} y={c.y - s} width={s * 2} height={s * 2} fill={cor} rx={0.5} />
  if (forma === 'triangle') {
    return <Polygon points={`${c.x},${c.y - s * 1.2} ${c.x - s},${c.y + s * 0.8} ${c.x + s},${c.y + s * 0.8}`} fill={cor} />
  }
  if (forma === 'diamond') {
    return <Polygon points={`${c.x},${c.y - s * 1.3} ${c.x + s * 1.1},${c.y} ${c.x},${c.y + s * 1.3} ${c.x - s * 1.1},${c.y}`} fill={cor} />
  }
  return <Circle cx={c.x} cy={c.y} r={s} fill={cor} />
}

export function EvolutionChart({ points, unit, selectedKey, onSelect, milestones = [], height = 220 }: Props) {
  const t = useTheme()
  const plano = planoDoGraficoDeEvolucao({ pontos: points, unidade: unit, selecionado: selectedKey, marcos: milestones })

  if (plano.vazio) {
    return (
      <View style={styles.vazio}>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{GRAFICO_SEM_DADOS}</Text>
      </View>
    )
  }

  const traco = t.color.text.default
  const suave = t.color.text.muted
  const borda = t.color.border.default

  return (
    <View style={{ width: '100%' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${plano.largura} ${plano.altura}`}>
        {/* A unidade, uma vez, no topo do eixo — sem ela "72" e "23,4" não dizem se é quilo, % ou kg/m². */}
        {plano.unidade ? (
          <SvgText x={plano.eixoX - 5} y={10} textAnchor="end" fontSize={9} fill={suave}>{plano.unidade}</SvgText>
        ) : null}

        {plano.grade.map((g, i) => (
          <G key={`g${i}`}>
            <Line x1={plano.eixoX} y1={g.y} x2={plano.bordaDireita} y2={g.y} stroke={borda} strokeWidth={0.5} strokeDasharray="3,3" />
            <SvgText x={plano.eixoX - 5} y={g.y + 3} textAnchor="end" fontSize={10} fill={suave}>{g.rotulo}</SvgText>
          </G>
        ))}

        {plano.marcos.map((m, i) => (
          <G key={`m${i}`}>
            <Line x1={m.x} y1={plano.topoDoDesenho} x2={m.x} y2={plano.baseDoDesenho} stroke={m.cor} strokeWidth={1} strokeDasharray="2,3" opacity={0.55} />
            <Polygon
              points={`${m.x},${plano.topoDoDesenho - 1} ${m.x - 3},${plano.topoDoDesenho - 6} ${m.x + 3},${plano.topoDoDesenho - 6}`}
              fill={m.cor} opacity={0.85}
            />
          </G>
        ))}

        {plano.dataInicial ? (
          <SvgText x={plano.eixoX} y={plano.altura - 8} textAnchor="start" fontSize={10} fill={suave}>{plano.dataInicial}</SvgText>
        ) : null}
        {plano.dataFinal ? (
          <SvgText x={plano.bordaDireita} y={plano.altura - 8} textAnchor="end" fontSize={10} fill={suave}>{plano.dataFinal}</SvgText>
        ) : null}

        {plano.caminho ? <Path d={plano.caminho} stroke={traco} strokeWidth={1.5} fill="none" /> : null}

        {plano.pontos.map((c) => (
          <G key={c.key} onPress={() => onSelect(c.ponto)}>
            {c.selecionado ? (
              <Circle cx={c.x} cy={c.y} r={9} fill={traco} fillOpacity={0.15} stroke={traco} strokeWidth={1} />
            ) : null}
            <Marcador c={c} cor={traco} />
            {/* Área de toque ampliada. No dedo, 4 pontos de raio não se acerta — e um ponto que não responde
                ao toque parece defeito, não alvo pequeno. */}
            <Circle cx={c.x} cy={c.y} r={16} fill="transparent" onPress={() => onSelect(c.ponto)} />
          </G>
        ))}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  vazio: { paddingVertical: 32, alignItems: 'center' },
})
