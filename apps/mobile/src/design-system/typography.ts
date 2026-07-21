// design-system (mobile) — ADAPTADOR TIPOGRÁFICO DS→React Native.
// Espelha o papel do adaptador web (src/lib/ui/ds/style.ts), mas para RN. A DECISÃO tipográfica vive
// no token compartilhado (@sintera/design-system, BRAND-002 v2.1: Fraunces · Hanken · IBM Plex Mono);
// aqui só TRADUZIMOS os papéis (typeRole) para o formato que o React Native consome.
//
// Este módulo é PURO (não importa 'react-native'): recebe um TextStyle do DS e devolve um descritor com
// as chaves/tipos que o RN espera. Os componentes RN (Text/View) espalham esse descritor num StyleSheet.
// Ser puro o mantém verificável (tsc + testes) sem o toolchain nativo.
//
// Diferenças reais RN × Web tratadas aqui:
//   • lineHeight: no DS é MULTIPLICADOR (1.5); no RN é ABSOLUTO em px  → multiplicador × fontSize.
//   • letterSpacing: no DS é em `em` ('-0.012em'); no RN é px numérico → em × fontSize.
//   • fontWeight: número no DS → string no RN.
//   • fontFamily: no DS é uma pilha CSS; no RN cada PESO é uma família própria (convenção @expo-google-fonts).
//   • algarismos tabulares/lining: no DS via font-feature-settings; no RN via `fontVariant`.
import { typeRole, type TextStyle } from '@sintera/design-system'

export type RNFontWeight = '300' | '400' | '500' | '600' | '700'
export type RNFontVariant =
  | 'tabular-nums' | 'lining-nums' | 'oldstyle-nums' | 'proportional-nums' | 'small-caps'

/** Formato de estilo de texto do React Native (subconjunto usado pelo DS). Declarado à mão para NÃO
 *  depender de 'react-native' — o pacote RN atribui esse objeto a um StyleSheet.create(). */
export interface RNTextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: RNFontWeight
  lineHeight: number
  letterSpacing?: number
  fontVariant?: RNFontVariant[]
  textTransform?: 'none' | 'uppercase'
}

// Peso numérico → sufixo da família (convenção @expo-google-fonts, ex.: `Fraunces_600SemiBold`).
const WEIGHT_SUFFIX: Record<number, string> = {
  300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold',
}

// Família CSS (pilha) → base do nome RN. Cada peso vira uma família própria no RN.
function fontBase(cssFamily: string): string {
  if (cssFamily.includes('Fraunces')) return 'Fraunces'
  if (cssFamily.includes('Hanken')) return 'HankenGrotesk'
  if (cssFamily.includes('IBM Plex Mono')) return 'IBMPlexMono'
  return 'System'
}

/** Nome de família RN por (pilha CSS do DS, peso). Ex.: ("'IBM Plex Mono', …", 500) → "IBMPlexMono_500Medium". */
export function resolveRNFontFamily(cssFamily: string, weight: number): string {
  const base = fontBase(cssFamily)
  if (base === 'System') return 'System'
  const suffix = WEIGHT_SUFFIX[weight] ?? 'Regular'
  return `${base}_${weight}${suffix}`
}

/** Converte um valor `em` do DS ('-0.012em', '0em') para px do RN, relativo ao fontSize. Arredonda a 2 casas. */
export function emToPx(em: string, fontSize: number): number {
  const n = parseFloat(em) // parseFloat ignora o sufixo 'em'
  if (!Number.isFinite(n) || n === 0) return 0
  return Math.round(n * fontSize * 100) / 100
}

/** Deriva `fontVariant` do RN a partir do font-feature-settings do DS ("'tnum' 1, 'lnum' 1"). */
export function fontVariantFromFeatures(features?: string): RNFontVariant[] | undefined {
  if (!features) return undefined
  const variants: RNFontVariant[] = []
  if (features.includes('tnum')) variants.push('tabular-nums')
  if (features.includes('lnum')) variants.push('lining-nums')
  return variants.length ? variants : undefined
}

/** Traduz um TextStyle do DS para o descritor de texto do React Native. */
export function toRNTextStyle(style: TextStyle): RNTextStyle {
  const letterSpacing = emToPx(style.letterSpacing, style.fontSize)
  const fontVariant = fontVariantFromFeatures(style.fontFeatureSettings)
  const out: RNTextStyle = {
    fontFamily: resolveRNFontFamily(style.fontFamily, style.fontWeight),
    fontSize: style.fontSize,
    fontWeight: String(style.fontWeight) as RNFontWeight,
    // lineHeight ABSOLUTO (px) = multiplicador do DS × fontSize.
    lineHeight: Math.round(style.lineHeight * style.fontSize),
  }
  if (letterSpacing !== 0) out.letterSpacing = letterSpacing
  if (fontVariant) out.fontVariant = fontVariant
  if (style.textTransform && style.textTransform !== 'none') out.textTransform = style.textTransform
  return out
}

/** Papéis numéricos (dados científicos, IBM Plex Mono) já traduzidos para RN — o consumo mais comum no app. */
export const rnNumeric = {
  primary: toRNTextStyle(typeRole.numeric.primary),
  secondary: toRNTextStyle(typeRole.numeric.secondary),
  reference: toRNTextStyle(typeRole.numeric.reference),
  large: toRNTextStyle(typeRole.numeric.large),
} as const
