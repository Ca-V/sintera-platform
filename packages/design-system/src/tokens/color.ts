// @sintera/design-system — TOKENS DE COR (Passo 3B · Etapa 1 — Design Tokens · Subitem 1)
// SSOT da linguagem cromática, compartilhada Web + Mobile. NENHUM componente deve ter cor "hardcoded":
// componentes consomem os PAPÉIS de `colorTheme[tema]`, nunca hexes soltos.
//
// Direção A·E (ver docs/COLOR-001 v1.6, Architectural Baseline):
//  • Âncora = #579DA8 (primary.500) — piso escuro dos preenchimentos; texto branco nos controles.
//  • Gradiente de matiz: claros puxam para o VERDE (~165–180°), escurecendo em direção ao AZUL (~188–198°).
//  • Neutros quentes (Almond Blossom): off-white / ivory / warm — sem branco puro nem cinza frio.
//  • Semântica com família própria: Informação=Almond · Sucesso=sálvia · Atenção=âmbar · Erro=terracota.
//
// Acessibilidade estrutural (WCAG): AA como mínimo, AAA quando possível. Os testes de contrato
// (tests/contracts/ds-color-tokens.ARCH.test.ts) garantem os contrastes abaixo.

export type Scale = {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string;
}
export type Theme = 'light' | 'dark'

// ---------------------------------------------------------------------------
// Rampa primária A·E (referência 50–900). 500 = âncora #579DA8.
// Light: 50 (verde-água claro) → 900 (azul-petróleo profundo). Dark: invertida em luminância.
// ---------------------------------------------------------------------------
export const primary: Record<Theme, Scale> = {
  light: {
    50: '#EEF7F4', 100: '#D9EDE8', 200: '#B8DBD4', 300: '#97C9C3', 400: '#74B8B9',
    500: '#579DA8', 600: '#488593', 700: '#3D6C7B', 800: '#325562', 900: '#26404A',
  },
  dark: {
    50: '#1D2E35', 100: '#274049', 200: '#365963', 300: '#467581', 400: '#5796A2',
    500: '#5FA7B2', 600: '#7EBABE', 700: '#9ACBC9', 800: '#BBDDD7', 900: '#DDEEEA',
  },
}

// ---------------------------------------------------------------------------
// Neutros quentes (inspirados nas flores de Almond Blossom). Impactam a percepção premium
// MAIS que a primária. Evitar branco puro predominante e cinzas frios.
// ---------------------------------------------------------------------------
export interface NeutralRoles {
  bg: string        // fundo da aplicação
  surface: string   // superfície de cartões/painéis
  surfaceAlt: string// superfície alternativa (cabeçalhos de grupo, faixas)
  ink: string       // texto principal
  muted: string     // texto secundário
  faint: string     // texto terciário / rótulos discretos
  line: string      // divisores / bordas
}
export const neutral: Record<Theme, NeutralRoles> = {
  light: {
    bg: '#F4EFE6', surface: '#FBF8F2', surfaceAlt: '#F0E9DC',
    ink: '#241F1A', muted: '#6B6154', faint: '#938775', line: '#E4DBCB',
  },
  dark: {
    bg: '#141009', surface: '#1E1710', surfaceAlt: '#271F16',
    ink: '#F0E9DC', muted: '#A99C88', faint: '#7C7061', line: '#332920',
  },
}

// ---------------------------------------------------------------------------
// Papéis semânticos (o que os componentes consomem). Cada família tem:
//  • fill — a cor de identidade (ícones, pontos, preenchimentos pequenos, barras)
//  • text — variante para TEXTO sobre a superfície (garante AA ≥ 4.5)
//  • soft — tint claro para fundo de destaque (badge/realce)
// ---------------------------------------------------------------------------
export interface SemanticColor { fill: string; text: string; soft: string }

export interface ColorTheme extends NeutralRoles {
  // Marca / ação
  primary: string       // âncora (fill de botões/CTA, item ativo) — 500
  primaryStrong: string // fill mais escuro (700 no light): usar quando o texto branco precisa de AA normal (≥4.5)
  onPrimary: string     // texto sobre `primary`/`primaryStrong`
  primaryText: string   // primária como TEXTO/links sobre a superfície (700) — AA
  primarySoft: string   // tint claro da primária (100): fundo de estados ativos/realces
  focusRing: string     // anel de foco (teclado/acessibilidade)
  // Estados semânticos (família própria — NÃO reutilizar a institucional para tudo)
  info: SemanticColor
  success: SemanticColor
  attention: SemanticColor
  error: SemanticColor
}

export const colorTheme: Record<Theme, ColorTheme> = {
  light: {
    ...neutral.light,
    primary: primary.light[500],       // #579DA8 — âncora (texto branco = AA large / negrito)
    primaryStrong: primary.light[700], // #3D6C7B — ação com texto branco em AA normal (≥4.5)
    onPrimary: '#FFFFFF',
    primaryText: primary.light[700],   // #3D6C7B
    primarySoft: primary.light[100],   // #D9EDE8
    focusRing: primary.light[600],
    info: { fill: primary.light[500], text: primary.light[700], soft: primary.light[100] },
    success: { fill: '#7E9B6E', text: '#5D7A48', soft: '#ECF2E9' },
    attention: { fill: '#B98A46', text: '#8D6A34', soft: '#F5EFE5' },
    error: { fill: '#B15C4C', text: '#A35643', soft: '#F5E9E6' },
  },
  dark: {
    ...neutral.dark,
    primary: primary.dark[500],        // #5FA7B2
    primaryStrong: primary.dark[600],  // #7EBABE
    onPrimary: '#10201C',              // texto escuro sobre o teal claro do dark
    primaryText: primary.dark[700],    // #9ACBC9
    primarySoft: primary.dark[100],    // #274049
    focusRing: primary.dark[500],
    info: { fill: primary.dark[500], text: primary.dark[700], soft: primary.dark[100] },
    success: { fill: '#A6BE99', text: '#A6BE99', soft: '#26362A' },
    attention: { fill: '#D4A96A', text: '#D4A96A', soft: '#3A2F1C' },
    error: { fill: '#D68A7E', text: '#D68A7E', soft: '#3A241F' },
  },
}

// ---------------------------------------------------------------------------
// Utilitários WCAG (usados pelos testes de contrato e disponíveis para checagens em runtime).
// ---------------------------------------------------------------------------
export const WCAG = { AA_NORMAL: 4.5, AA_LARGE: 3, AAA_NORMAL: 7, AAA_LARGE: 4.5 } as const

/** Luminância relativa (WCAG 2.x) de um hex #RRGGBB. */
export function relativeLuminance(hex: string): number {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) throw new Error(`hex inválido: ${hex}`)
  const [r, g, b] = m.map((h) => {
    const v = parseInt(h, 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste (1–21) entre duas cores hex. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
