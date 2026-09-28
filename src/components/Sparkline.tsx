'use client'

// ============================================================
// Sparkline — mini-gráfico de linha, factual (sem eixos nem juízo clínico)
// ============================================================
// A GEOMETRIA FOI PARA O CORE em 28/09/2026 (`planoDaSparkline`), junto com a do gráfico de evolução, para
// que o aplicativo desenhe a MESMA miniatura. Aqui sobrou o mecanismo: SVG do DOM.
//
// Apenas organiza visualmente o que a pessoa registrou. Não interpreta.
// ============================================================

import { planoDaSparkline, numeroDoTexto } from '@sintera/core'

/**
 * Mantido como reexportação: dezenas de telas importam `parseNum` daqui. Trocar o nome em todas elas seria
 * um rewrite grande para nenhum ganho, e o princípio que importa — a lógica viver uma vez só — já está
 * cumprido pelo `numeroDoTexto` do core.
 */
export const parseNum = numeroDoTexto

export default function Sparkline({
  values, width = 88, height = 24, className = 'text-petal',
}: { values: number[]; width?: number; height?: number; className?: string }) {
  const plano = planoDaSparkline(values, width, height)
  // `null` com menos de dois valores: um ponto só não tem evolução, e uma bolinha sozinha sugeriria série.
  if (!plano) return null

  return (
    <svg width={plano.largura} height={plano.altura} className={className} aria-hidden="true">
      <polyline points={plano.pontos} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={plano.ultimoX} cy={plano.ultimoY} r="2.2" fill="currentColor" />
    </svg>
  )
}
