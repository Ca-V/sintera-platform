// design-system (mobile) — ADAPTADOR DE GRADIENTE DS→React Native.
// Espelha o adaptador Web (src/lib/ui/ds/css.ts `toCSSGradient`): o MESMO token de gradiente do DS
// (@sintera/design-system, descrito de forma NEUTRA: ângulo + paradas) vira `linear-gradient` na Web e as
// props do `expo-linear-gradient` (colors/locations/start/end) no mobile. Identidade cromática ÚNICA web+mobile
// (DS-002): a decisão de cor mora no token; aqui só há tradução de formato. Módulo PURO (não importa
// 'react-native' nem 'expo-linear-gradient') → verificável por tsc/testes no sandbox web.
//
// Diferenças RN × Web tratadas aqui:
//   • RN não tem "ângulo": a direção vira `start`/`end` em coordenadas unitárias (0..1, origem no topo-esquerda).
//   • `<LinearGradient>` renderiza UMA camada linear. Gradientes multi-camada/radiais (ex.: `hero`) são riqueza
//     da Web (composição de vários elementos no nativo, se necessário); aqui aproximamos pela 1ª camada LINEAR.
import { gradient, type Gradient, type GradientToken, type LinearLayer } from '@sintera/design-system'

/** Props de gradiente do `expo-linear-gradient` (subconjunto). Declarado à mão para não depender do pacote nativo. */
export interface RNGradient {
  colors: string[]
  locations?: number[]
  start: { x: number; y: number }
  end: { x: number; y: number }
}

const r4 = (n: number): number => Math.round(n * 1e4) / 1e4

/**
 * Converte um ângulo CSS (graus; 0 = para o topo, cresce no sentido horário) para os pontos `start`/`end`
 * unitários do RN (origem no topo-esquerda). A reta do gradiente passa pelo centro (0.5, 0.5).
 * Equivale ao comportamento de `linear-gradient(<angle>deg, …)` da Web.
 */
export function angleToStartEnd(angle: number): Pick<RNGradient, 'start' | 'end'> {
  const rad = (angle * Math.PI) / 180
  const sx = Math.sin(rad) / 2
  const cy = Math.cos(rad) / 2
  return {
    start: { x: r4(0.5 - sx), y: r4(0.5 + cy) },
    end: { x: r4(0.5 + sx), y: r4(0.5 - cy) },
  }
}

/** A 1ª camada LINEAR de um gradiente (a que o RN sabe renderizar). `undefined` se não houver nenhuma. */
function firstLinear(g: Gradient): LinearLayer | undefined {
  return g.layers.find((l): l is LinearLayer => l.type === 'linear')
}

/**
 * Traduz um token de gradiente do DS para as props do `expo-linear-gradient`.
 * `locations` só é emitido quando TODAS as paradas têm posição (`at`); senão, distribuição uniforme (padrão do RN).
 */
export function toRNGradient(g: Gradient): RNGradient {
  const layer = firstLinear(g)
  // Sem camada linear (só radiais): aproxima por um gradiente vertical com as cores da 1ª camada (nunca quebra).
  const stops = layer?.stops ?? g.layers[0]?.stops ?? []
  const angle = layer?.angle ?? 180
  const colors = stops.map((s) => s.color)
  const allPositioned = stops.length > 0 && stops.every((s) => s.at !== undefined)
  return {
    colors,
    ...(allPositioned ? { locations: stops.map((s) => r4((s.at as number) / 100)) } : {}),
    ...angleToStartEnd(angle),
  }
}

/** Traduz um TOKEN de gradiente por nome (ex.: 'action' do botão primário) para as props do RN. */
export function rnGradient(token: GradientToken): RNGradient {
  return toRNGradient(gradient[token])
}
