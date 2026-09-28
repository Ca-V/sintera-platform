'use client'

// BOD-001 área ② — gráfico de Evolução Longitudinal.
//
// A GEOMETRIA NÃO MORA MAIS AQUI. Ela foi para `@sintera/core` (`planoDoGraficoDeEvolucao`) em 28/09/2026,
// depois da homologação em que a fundadora apontou que Composição Corporal não estava igual nas duas pontas.
//
// A medição mostrou que as REGRAS já eram compartilhadas — jornada, marcos, comparação. O que faltava era o
// desenho. E copiar o desenho para o aplicativo teria criado duas implementações da mesma decisão: onde cada
// ponto cai, quais linhas de grade existem, que forma marca cada origem. Duas implementações divergem em
// silêncio; é o que a BASE ÚNICA existe para impedir.
//
// Aqui sobrou o MECANISMO: traduzir o plano em SVG do DOM. O aplicativo traduz o mesmo plano em
// `react-native-svg`. Os dois recebem os mesmos números.
//
// Só apresenta os valores medidos no tempo (RDC 657) — não interpreta.

import {
  planoDoGraficoDeEvolucao, GRAFICO_SEM_DADOS,
  type EvoPoint, type MarkerShape, type PontoDoGrafico,
} from '@sintera/core'

function Marker({ cx, cy, shape, selected }: { cx: number; cy: number; shape: MarkerShape; selected: boolean }) {
  const s = selected ? 5.5 : 4
  const cls = 'fill-petal'
  if (shape === 'square') return <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} className={cls} rx={0.5} />
  if (shape === 'triangle') return <polygon points={`${cx},${cy - s * 1.2} ${cx - s},${cy + s * 0.8} ${cx + s},${cy + s * 0.8}`} className={cls} />
  if (shape === 'diamond') return <polygon points={`${cx},${cy - s * 1.3} ${cx + s * 1.1},${cy} ${cx},${cy + s * 1.3} ${cx - s * 1.1},${cy}`} className={cls} />
  return <circle cx={cx} cy={cy} r={s} className={cls} />
}

export default function EvolutionChart({
  points, unit, selectedKey, onSelect, milestones = [],
}: {
  points: EvoPoint[]         // já ordenados por data (asc)
  unit: string | null
  selectedKey: string | null
  onSelect: (p: EvoPoint) => void
  milestones?: { date: string; color: string }[]   // BOD-001 ⑤ — anotações (projeções de outros domínios)
}) {
  const plano = planoDoGraficoDeEvolucao({ pontos: points, unidade: unit, selecionado: selectedKey, marcos: milestones })

  if (plano.vazio) {
    return <p className="font-body text-sm text-mauve py-8 text-center">{GRAFICO_SEM_DADOS}</p>
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${plano.largura} ${plano.altura}`} className="w-full h-auto" style={{ minWidth: 320 }} role="img"
        aria-label={`Gráfico de evolução do indicador${plano.unidade ? `, em ${plano.unidade}` : ''}`}>
        {/* A UNIDADE, uma vez, no topo do eixo. Sem ela o eixo mostrava "72" e "23,4" sem dizer se era quilo,
            porcentagem ou kg/m² — e o mesmo gráfico serve peso, gordura e IMC. */}
        {plano.unidade && (
          <text x={plano.eixoX - 5} y={10} textAnchor="end" className="fill-mauve" style={{ fontSize: 9 }}>{plano.unidade}</text>
        )}

        {plano.grade.map((g, i) => (
          <g key={i}>
            <line x1={plano.eixoX} y1={g.y} x2={plano.bordaDireita} y2={g.y} className="stroke-border" strokeWidth={0.5} strokeDasharray="3 3" />
            <text x={plano.eixoX - 5} y={g.y + 3} textAnchor="end" className="fill-mauve" style={{ fontSize: 10 }}>{g.rotulo}</text>
          </g>
        ))}

        {/* Marcos (BOD-001 ⑤): linhas verticais no tempo, coloridas por categoria. */}
        {plano.marcos.map((m, i) => (
          <g key={`ms-${i}`}>
            <line x1={m.x} y1={plano.topoDoDesenho} x2={m.x} y2={plano.baseDoDesenho} stroke={m.cor} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
            <polygon points={`${m.x},${plano.topoDoDesenho - 1} ${m.x - 3},${plano.topoDoDesenho - 6} ${m.x + 3},${plano.topoDoDesenho - 6}`} fill={m.cor} opacity={0.85} />
          </g>
        ))}

        {plano.dataInicial && (
          <text x={plano.eixoX} y={plano.altura - 8} textAnchor="start" className="fill-mauve" style={{ fontSize: 10 }}>{plano.dataInicial}</text>
        )}
        {plano.dataFinal && (
          <text x={plano.bordaDireita} y={plano.altura - 8} textAnchor="end" className="fill-mauve" style={{ fontSize: 10 }}>{plano.dataFinal}</text>
        )}

        {plano.caminho && <path d={plano.caminho} className="stroke-petal" fill="none" strokeWidth={1.5} />}

        {plano.pontos.map((c: PontoDoGrafico) => (
          <g key={c.key} onClick={() => onSelect(c.ponto)} style={{ cursor: 'pointer' }}>
            {c.selecionado && <circle cx={c.x} cy={c.y} r={9} className="fill-petal/15 stroke-petal" strokeWidth={1} />}
            <Marker cx={c.x} cy={c.y} shape={c.forma} selected={c.selecionado} />
            {/* área de clique ampliada (acessível ao toque) */}
            <circle cx={c.x} cy={c.y} r={12} fill="transparent" />
          </g>
        ))}
      </svg>
    </div>
  )
}
