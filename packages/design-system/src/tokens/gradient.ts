// @sintera/design-system — TOKENS DE GRADIENTE (Passo 3B · consolidação final DS-002).
// A identidade cromática vive SÓ no DS (diretriz da fundadora 2026-07-21): gradientes NÃO existem mais como
// hex/linear-gradient soltos no globals.css — são TOKENS por INTENÇÃO. Descritos de forma NEUTRA de plataforma
// (ângulo + paradas, ou camadas radiais): o adaptador Web traduz para `linear/radial-gradient`; o adaptador RN,
// para `expo-linear-gradient` (colors/locations). Referenciam os tokens de cor onde existem na rampa; aquas de
// ASSINATURA e acentos de domínio fora da rampa ficam como hex AQUI (o DS é o lugar do hex — nunca a Web).
import { primary, neutral, feedback } from './color'

/** Uma parada de cor. `at` em % (0–100); ausente = sem posição explícita. */
export interface GradientStop { color: string; at?: number }
/** Camada linear (ângulo em graus CSS). */
export interface LinearLayer { type: 'linear'; angle: number; stops: GradientStop[] }
/** Camada radial (forma/posição no vocabulário CSS, ex.: 'ellipse 80% 60% at 70% 50%'). */
export interface RadialLayer { type: 'radial'; shape: string; stops: GradientStop[] }
export type GradientLayer = LinearLayer | RadialLayer
/** Gradiente = uma ou mais camadas (empilhadas; no CSS, separadas por vírgula). */
export interface Gradient { layers: GradientLayer[] }

const p = primary.light
const n = neutral.light

// Aquas de ASSINATURA (painel do Login/Sidebar/landing) — mais claros/brilhantes que a rampa; identidade de marca.
const AQUA_HI = '#9BD8E0'
const AQUA_MID = '#6FC1CF'
const AQUA_LO = '#57B0BF'

const linear = (angle: number, stops: GradientStop[]): Gradient => ({ layers: [{ type: 'linear', angle, stops }] })

export const gradient = {
  // ── Núcleo institucional ──────────────────────────────────────────────
  action:      linear(135, [{ color: p[700], at: 0 }, { color: p[400], at: 100 }]),                          // CTA/botões
  brand:       linear(135, [{ color: p[600], at: 0 }, { color: p[400], at: 100 }]),                          // logo/avatar (aqua)
  surface:     linear(160, [{ color: n.surface, at: 0 }, { color: p[50], at: 45 }, { color: p[100], at: 100 }]), // fundo de conteúdo
  surfaceSoft: linear(135, [{ color: p[100], at: 0 }, { color: p[50], at: 100 }]),                            // realce suave
  dark:        linear(135, [{ color: p[900], at: 0 }, { color: p[800], at: 60 }, { color: p[700], at: 100 }]),  // seções escuras premium
  cardDark:    linear(145, [{ color: p[800], at: 0 }, { color: p[700], at: 100 }]),                           // cartão escuro
  // ASSINATURA aqua — Login/Sidebar/landing (mesmo gradiente em toda a plataforma).
  signature:   linear(150, [{ color: AQUA_HI, at: 0 }, { color: AQUA_MID, at: 58 }, { color: AQUA_LO, at: 100 }]),
  // Barra-glow do item ativo da Sidebar (âncora → ação).
  activeGlow:  linear(180, [{ color: p[500], at: 0 }, { color: p[700], at: 100 }]),
  // HERO — brilhos radiais sobre superfície clara.
  hero: {
    layers: [
      { type: 'radial', shape: 'ellipse 80% 60% at 70% 50%', stops: [{ color: 'rgba(151,201,195,0.18)', at: 0 }, { color: 'transparent', at: 70 }] },
      { type: 'radial', shape: 'ellipse 60% 80% at 30% 80%', stops: [{ color: 'rgba(87,157,168,0.08)', at: 0 }, { color: 'transparent', at: 60 }] },
      { type: 'linear', angle: 160, stops: [{ color: n.surface, at: 0 }, { color: p[50], at: 100 }] },
    ],
  } as Gradient,
  // ── Acentos de domínio (identidade das flores/estados) ─────────────────
  energy:    linear(135, [{ color: feedback.light.attention.fill, at: 0 }, { color: '#D4B37A', at: 100 }]),
  sleep:     linear(135, [{ color: p[500], at: 0 }, { color: p[300], at: 100 }]),
  cycle:     linear(135, [{ color: feedback.light.error.fill, at: 0 }, { color: '#CE8570', at: 100 }]),
  hydration: linear(135, [{ color: feedback.light.success.fill, at: 0 }, { color: '#A6BE99', at: 100 }]),
  // ── Texto (clip em texto; a ANIMAÇÃO do shimmer é comportamento da plataforma Web) ──
  textBrand:   linear(135, [{ color: p[700], at: 0 }, { color: p[500], at: 100 }]),
  textGold:    linear(135, [{ color: feedback.light.attention.fill, at: 0 }, { color: '#D4B37A', at: 100 }]),
  textShimmer: linear(90, [{ color: p[700], at: 0 }, { color: p[300], at: 30 }, { color: p[500], at: 60 }, { color: p[300], at: 80 }, { color: p[700], at: 100 }]),
} as const

export type GradientToken = keyof typeof gradient
