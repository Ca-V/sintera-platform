# DS-002 — Artefatos Gerados

**Status:** Baseline · 2026-07-21 · **Ref:** [[COLOR-001]] · [[BRAND-002]] · consolidação final DS-002.
**Natureza:** referência de manutenção. Esta seção integra a **Auditoria Arquitetural** final do DS-002.

Princípio (fundadora, 2026-07-21): a identidade visual (cores, gradientes, sombras, radius, spacing, tipografia,
z-index, durations, easings) existe **exclusivamente no Design System**. A Web **não define** identidade — apenas
**consome**. Qualquer mudança de identidade ocorre **só no DS**; o gerador reproduz o CSS; Web e Mobile consomem.

## Cadeia de geração

```
packages/design-system (tokens)
        ↓  tokens/*.ts  (color · gradient · elevation · spacing · typography · motion · layout)
        ↓  theme.ts     (getTheme(mode) — camada semântica única)
        ↓  CODE GENERATOR  src/lib/ui/ds/generateThemeCss.ts   (função pura, determinística)
        ↓
src/app/theme.generated.css   (ARTEFATO DE BUILD — não editar à mão)
        ↓  @import
src/app/globals.css   (só plataforma Web + @import do artefato)
```

O **Mobile** NÃO passa por este CSS: consome os **mesmos tokens** diretamente via `getTheme()` + adaptadores RN
(`apps/mobile/src/design-system/*`). Fonte única, dois consumidores.

## Tabela de artefatos

| Artefato | Quem gera | Quando é regenerado | Plataformas que consomem |
|---|---|---|---|
| **`src/app/theme.generated.css`** | `generateThemeCss()` em `src/lib/ui/ds/generateThemeCss.ts` (a partir dos tokens do DS) | Sempre que um token do DS mudar. Comando: `WRITE_GENERATED=1 vitest run tests/contracts/theme-generated-css.ARCH.test.ts` | **Web** (`globals.css` faz `@import`); o Tailwind lê `@theme` e gera as utilitárias `bg-*/text-*/border-*` |

Conteúdo do artefato: bloco `@theme` (cores → utilitárias Tailwind) + `:root` com **todos** os demais tokens como
custom properties (`--gradient-*`, `--shadow-*`, `--radius-*`, `--space-*`, `--font-*`, `--z-*`, `--duration-*`,
`--ease-*`) + utilitárias históricas de gradiente (`.gradient-*`).

## Garantias (contratos ARCH)

- **`theme-generated-css.ARCH`** — drift-guard: falha se o arquivo commitado divergir de `generateThemeCss()`
  (edição manual ou token alterado sem regenerar).
- **`identity-color-parity.ARCH`** — confere o mapa `--color-*` (Web) → token do DS (papéis/rampa/neutros/semânticas).
- **`ds-gradient-tokens.ARCH` · `ds-shadow-tokens.ARCH`** — a tradução Web (`toCSSGradient`/`toCSSBoxShadow`)
  reproduz exatamente a identidade.

## Regra de manutenção

1. Mudou a identidade? Edite **só** `packages/design-system` (tokens).
2. Regenere: `WRITE_GENERATED=1 vitest run tests/contracts/theme-generated-css.ARCH.test.ts`.
3. `vitest run` (drift-guard verde) + `next build`. Commit do token **e** do artefato juntos.
4. **Nunca** edite `theme.generated.css` nem coloque identidade no `globals.css`. Se precisar, a arquitetura está errada.

> Prova de consolidação: hoje o `globals.css` não contém nenhum hex/gradiente/sombra de marca — apenas plataforma
> (reset, scrollbar, seleção, range, animações, glass, impressão) + `@import` do artefato. A identidade poderia ser
> inteiramente reconstruída a partir do DS.
