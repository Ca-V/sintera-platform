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
  detail: string    // marrom quente de estrutura/detalhe (discreto; nunca texto de corpo)
}
export const neutral: Record<Theme, NeutralRoles> = {
  light: {
    bg: '#F4EFE6', surface: '#FBF8F2', surfaceAlt: '#F0E9DC',
    ink: '#241F1A', muted: '#6B6154', faint: '#938775', line: '#E4DBCB', detail: '#6F4E3D',
  },
  dark: {
    bg: '#141009', surface: '#1E1710', surfaceAlt: '#271F16',
    ink: '#F0E9DC', muted: '#A99C88', faint: '#7C7061', line: '#332920', detail: '#B79A86',
  },
}

// ---------------------------------------------------------------------------
// Papéis semânticos (o que os componentes consomem). Cada família tem:
//  • fill — a cor de identidade (ícones, pontos, preenchimentos pequenos, barras)
//  • text — variante para TEXTO sobre a superfície (garante AA ≥ 4.5)
//  • soft — tint claro para fundo de destaque (badge/realce)
// ---------------------------------------------------------------------------
export interface SemanticColor { fill: string; text: string; soft: string }

// Camada 2 — FEEDBACK (base semântica de estados). Referenciada pelos papéis; não consumir direto.
export const feedback: Record<Theme, { success: SemanticColor; attention: SemanticColor; error: SemanticColor }> = {
  light: {
    // `text` garante AA (≥4.5) tanto sobre a superfície quanto sobre o próprio `soft` (fundo de badge).
    success: { fill: '#7E9B6E', text: '#587444', soft: '#ECF2E9' },
    attention: { fill: '#B98A46', text: '#866432', soft: '#F5EFE5' },
    error: { fill: '#B15C4C', text: '#98503E', soft: '#F5E9E6' },
  },
  dark: {
    success: { fill: '#A6BE99', text: '#A6BE99', soft: '#26362A' },
    attention: { fill: '#D4A96A', text: '#D4A96A', soft: '#3A2F1C' },
    error: { fill: '#D68A7E', text: '#D68A7E', soft: '#3A241F' },
  },
}

// ---------------------------------------------------------------------------
// Camada 3 — PAPÉIS (roles): a ÚNICA camada que os COMPONENTES consomem.
// Distinção arquitetural (fundadora): IDENTIDADE × USO.
//   • IDENTIDADE (marca) → `identity.primary` (500): gráficos, Timeline, badges, indicadores, destaques.
//     NÃO carrega regra de cor de texto.
//   • AÇÃO → `button.primary` (fill 700 + texto branco): SEMPRE AA. Button/CTA/FAB/clicáveis.
// REGRA DURA: nenhum componente referencia primary[500]/primary[700] (nem hexes) diretamente — só papéis.
// ---------------------------------------------------------------------------
export interface ColorRoles {
  surface: { app: string; base: string; raised: string; accent: string }
  text: { default: string; muted: string; faint: string; onAction: string; onAccent: string; link: string }
  border: { default: string; focus: string }
  identity: { primary: string; soft: string }                       // MARCA — sem regra de texto
  button: { primary: { background: string; text: string; hover: string } } // AÇÃO — sempre AA
  chart: { primary: string; grid: string; positive: string; alert: string }
  timeline: { event: string; node: string; medication: string }
  badge: { info: SemanticColor; success: SemanticColor; attention: SemanticColor; error: SemanticColor }
  link: { default: string }
}

export const roles: Record<Theme, ColorRoles> = {
  light: {
    surface: { app: neutral.light.bg, base: neutral.light.surface, raised: neutral.light.surface, accent: primary.light[100] },
    text: { default: neutral.light.ink, muted: neutral.light.muted, faint: neutral.light.faint, onAction: '#FFFFFF', onAccent: primary.light[800], link: primary.light[700] },
    border: { default: neutral.light.line, focus: primary.light[600] },
    identity: { primary: primary.light[500], soft: primary.light[100] },
    button: { primary: { background: primary.light[700], text: '#FFFFFF', hover: primary.light[800] } },
    chart: { primary: primary.light[500], grid: neutral.light.line, positive: feedback.light.success.fill, alert: feedback.light.attention.fill },
    timeline: { event: primary.light[500], node: primary.light[400], medication: feedback.light.attention.fill },
    badge: { info: { fill: primary.light[500], text: primary.light[700], soft: primary.light[100] }, success: feedback.light.success, attention: feedback.light.attention, error: feedback.light.error },
    link: { default: primary.light[700] },
  },
  dark: {
    surface: { app: neutral.dark.bg, base: neutral.dark.surface, raised: neutral.dark.surfaceAlt, accent: primary.dark[100] },
    text: { default: neutral.dark.ink, muted: neutral.dark.muted, faint: neutral.dark.faint, onAction: '#10201C', onAccent: primary.dark[800], link: primary.dark[700] },
    border: { default: neutral.dark.line, focus: primary.dark[500] },
    identity: { primary: primary.dark[500], soft: primary.dark[100] },
    button: { primary: { background: primary.dark[600], text: '#10201C', hover: primary.dark[700] } },
    chart: { primary: primary.dark[500], grid: neutral.dark.line, positive: feedback.dark.success.fill, alert: feedback.dark.attention.fill },
    timeline: { event: primary.dark[500], node: primary.dark[400], medication: feedback.dark.attention.fill },
    badge: { info: { fill: primary.dark[500], text: primary.dark[700], soft: primary.dark[100] }, success: feedback.dark.success, attention: feedback.dark.attention, error: feedback.dark.error },
    link: { default: primary.dark[700] },
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
