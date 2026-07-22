# MOBILE-002 — Adaptador DS → React Native (contrato técnico)

> **Status:** fundação do adaptador **concluída e verificável** (Onda 0, base compartilhada).
> **Escopo:** documenta o adaptador `apps/mobile/src/design-system` — o único lugar onde o RN traduz o
> Design System. A **decisão** visual vive no token/recipe (`packages/design-system`, SSOT única web+mobile);
> aqui só há **tradução de formato**. Todo módulo é **PURO** (não importa `react-native`/`expo-*`) → passa por
> `tsc` + contratos ARCH no sandbox web, sem toolchain nativo.
> **Referências:** [MOBILE-001] (plano por ondas) · [DS-002_AUDITORIA_FINAL] · ADR-011 (recipes headless).

## 1. Princípio

A Web é a **implementação de referência**, não a proprietária. Web e Mobile têm, cada um, **um adaptador fino**
sobre a mesma fonte da verdade:

```
packages/design-system  ──▶  tokens (cor, tipografia, gradiente, sombra) + recipes (VisualSpec headless)
        │                                   │
        ▼ (adaptador Web)                   ▼ (adaptador Mobile)
 src/lib/ui/ds  ──▶ CSSProperties     apps/mobile/src/design-system ──▶ estilo/props do RN
```

**Meta-prova (garantida por contrato):** mudar a identidade = editar **só** o DS; os dois adaptadores derivam do
mesmo token/recipe. Os contratos ARCH de **paridade** falham se uma cor/gradiente/sombra do RN divergir da Web.

## 2. Superfície do adaptador (o que já existe e é verificável)

| Módulo | Função | Traduz | Espelha na Web |
|---|---|---|---|
| `typography.ts` | `toRNTextStyle`, `resolveRNFontFamily`, `emToPx`, `fontVariantFromFeatures`, `rnNumeric` | `TextStyle` → `RNTextStyle` | `style.ts` `textStyle` |
| `elevation.ts` | `toRNShadow`, `rnElevation` | `Shadow`/`ElevationLevel` → `RNShadowStyle` | `elevation` base |
| `elevation.ts` | `toRNShadowStack`, `rnShadow` | `ShadowStack`/`ShadowRole` (multi-camada) → `RNShadowStyle` | `css.ts` `toCSSBoxShadow` |
| `gradient.ts` | `toRNGradient`, `rnGradient`, `angleToStartEnd` | `Gradient`/`GradientToken` → props do `expo-linear-gradient` | `css.ts` `toCSSGradient` |
| `box.ts` | `toRNBox`, `toRNText` | **`BoxSpec`/`TextSpec` (saída de qualquer recipe)** → `RNBox`/`RNText` | `style.ts` `boxStyle`/`textStyle` |

Com `toRNBox`, **qualquer recipe** (`button`, `card`, `badge`, `chip`, …) já produz um `RNBox` completo. A
implementação nativa é **adaptação**, não redesenho.

## 3. Regras de tradução (diferenças reais RN × Web, todas cobertas por contrato)

**Tipografia**
- `lineHeight`: multiplicador no DS (1.5) → **px absoluto** no RN (`× fontSize`).
- `letterSpacing`: `em` no DS (`-0.012em`) → **px numérico** no RN (`em × fontSize`).
- `fontWeight`: número no DS → **string** no RN.
- `fontFamily`: pilha CSS no DS → **uma família por peso** no RN (convenção `@expo-google-fonts`, ex.: `Fraunces_600SemiBold`).
- algarismos tabulares/lining: `font-feature-settings` → `fontVariant`.

**Sombra**
- `blur` do CSS ≈ **2×** o `shadowRadius` do iOS → `shadowRadius = blur / 2`.
- `spread` **não existe** no RN → descartado (documentado).
- Papel **multi-camada** (`shadowRole`): o CSS empilha N camadas; o RN aplica **uma** → aproxima pela **camada
  dominante** (maior `blur + spread`). `androidElevation` derivado da geometria na escala do token `elevation`
  (`≈ (y + blur) / 3`); anel de foco (opacidade 0) → elevação 0.

**Gradiente**
- Ângulo CSS → `start`/`end` **unitários** (0..1, origem topo-esquerda), reta pelo centro. Ex.: `135deg` → topo-esq → base-dir.
- Paradas: `at` % → `locations` em fração (só emitido quando **todas** têm posição; senão distribuição uniforme).
- `<LinearGradient>` renderiza **uma** camada linear. Multi-camada/radial (ex.: `hero`) é riqueza da Web
  (composição de vários elementos no nativo); o adaptador aproxima pela **1ª camada linear** (nunca quebra).

**Caixa (`toRNBox`)**
- O RN **não** coloca gradiente num `style` (exige `<LinearGradient>`): `toRNBox` devolve `{ style, gradient?, shadow }`
  **separados**. `backgroundColor` permanece como **fallback sólido** (sem gradiente ou enquanto carrega).
- `opacity 1` é omitido; `borderWidth 0` não emite borda.

## 4. Como a Onda 1 consome (o trabalho nativo restante)

Os componentes nativos são **finos** e idênticos em estrutura ao Web — só o alvo de estilo muda:

```tsx
// Pseudo-RN (materializar no ambiente Expo): o recipe decide; o adaptador traduz; o primitivo só monta.
function Button({ variant, children }) {
  const spec = button(useTheme(), { variant })
  const { style, gradient, shadow } = toRNBox(mode, spec.container)
  const label = toRNText(spec.label)
  const inner = <Text style={label}>{children}</Text>
  return gradient
    ? <LinearGradient colors={gradient.colors} locations={gradient.locations}
        start={gradient.start} end={gradient.end} style={[style, shadow]}>{inner}</LinearGradient>
    : <View style={[style, shadow]}>{inner}</View>
}
```

Nenhuma cor, sombra, gradiente ou métrica tipográfica é escrita no componente — tudo vem do adaptador.

## 5. Pendências exclusivamente do ambiente Expo/EAS (não verificáveis no sandbox)

Estas materializam a arquitetura já consolidada; **não** a definem:

1. **Primitivos RN** (`View`/`Text`/`Pressable`) que montam `RNBox`/`RNText` em `StyleSheet.create()`.
2. **Fontes** via `@expo-google-fonts` (Fraunces · Hanken Grotesk · IBM Plex Mono, mesmos pesos) + `expo-font`.
3. **`expo-linear-gradient`** consumindo `RNGradient`.
4. **Navegação** (bottom tabs + stacks), **EAS Build**/dev client, **EAS Update**.

Até lá, toda evolução que beneficie Web **e** Mobile acontece **primeiro no núcleo compartilhado** (como o botão),
e cada uma nasce com seu **contrato ARCH de paridade**.

## 6. Contratos ARCH (garantia contínua de paridade)

- `ds-mobile-typography.ARCH` · `ds-mobile-elevation.ARCH` (inclui `shadowRole` + paridade de cor)
- `ds-mobile-gradient.ARCH` (paridade: toda cor do RN existe na tradução Web do mesmo token)
- `ds-mobile-box.ARCH` (recipe → RN preserva o que a recipe decidiu)

Rodam no sandbox web (`vitest run tests/contracts/ds-mobile-*`) e no CI. Qualquer divergência de identidade
entre plataformas quebra o build.

---

[MOBILE-001]: ./MOBILE-001_PLANO_EXECUTIVO_RN.md
[DS-002_AUDITORIA_FINAL]: ./DS-002_AUDITORIA_FINAL.md
