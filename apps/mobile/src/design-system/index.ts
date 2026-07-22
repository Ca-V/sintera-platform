// design-system — DESIGN SYSTEM MOBILE: consome os tokens/papéis de @sintera/design-system (SSOT única
// web+mobile) e os traduz para o React Native. Adaptador FINO (BRAND-002 / DS-002): a decisão vive no
// token; aqui só há tradução de formato. Camada tipográfica pronta (Passo 3 · fundação verificável);
// primitivos RN (Text/View) entram no ambiente com toolchain Expo.
export {
  toRNTextStyle,
  resolveRNFontFamily,
  emToPx,
  fontVariantFromFeatures,
  rnNumeric,
  type RNTextStyle,
  type RNFontWeight,
  type RNFontVariant,
} from './typography'
export {
  toRNShadow,
  rnElevation,
  toRNShadowStack,
  rnShadow,
  type RNShadowStyle,
} from './elevation'
export {
  toRNGradient,
  rnGradient,
  angleToStartEnd,
  type RNGradient,
} from './gradient'
export {
  toRNBox,
  toRNText,
  type RNBox,
  type RNText,
  type RNViewStyle,
} from './box'
