# DS-002 — Auditoria Arquitetural Final

**Data:** 2026-07-21 · **Status:** Baseline · **Ref:** [[DS-002_FREEZE]] · [[DS-002_ARTEFATOS_GERADOS]] · [[COLOR-001]] · [[BRAND-002]].
Fecha a fase de consolidação e a migração da plataforma Web para o DS-002, com o DS-001 extinto.

## 1. Estado final
- **Fonte única de verdade:** `packages/design-system` (tokens → papéis → theme → recipes headless). Web e Mobile CONSOMEM.
- **DS-001 extinto:** kit primitivo (`Card`, `Button`, `Badge`, `Input`) removido; classe `.card-premium` substituída pela
  `.ds-card` gerada; `Section`/`MotionCard`/`ActionCard` re-baseados no DS-002; **nenhuma compatibilidade transitória** remanescente.
- **Identidade só no DS:** cores, gradientes, sombras, tipografia, radius/spacing/z/durations/easings vivem no DS; o
  `globals.css` contém apenas plataforma (reset/scrollbar/seleção/impressão/animações) + `@import` do artefato gerado.
- **Tradução na camada Web:** comportamento de cascata (hover/foco/override/especificidade) resolvido no adaptador Web
  (ex.: `.ds-card` em `@layer components`, `Button` de classe), **sem** replicar cascata dentro do DS.

## 2. Artefatos Gerados
Ver [[DS-002_ARTEFATOS_GERADOS]] (cadeia · tabela quem-gera/quando/consome · contratos). Resumo: `generateThemeCss()`
→ `src/app/theme.generated.css` (não editar; regenerar via `WRITE_GENERATED=1 vitest run …`). Drift-guard automatizado.

## 3. Governança (contratos automatizados)
`identity-color-parity.ARCH` · `theme-generated-css.ARCH` · `ds-gradient-tokens.ARCH` · `ds-shadow-tokens.ARCH` ·
`ds-type-tokens.ARCH` · `ds-recipes.ARCH` (inclui tom `neutral`) · `ds-mobile-typography/elevation.ARCH`.

## 4. Evoluções adiadas deliberadamente
1. **Button — primário na recipe (RN).** O Web usa o gradiente de ação (identidade validada). A `recipe.button` ainda
   descreve o primário como cor sólida (`primary[700]`). Reconciliar quando o **RN** for construído — adicionar
   `backgroundGradient` ao `BoxSpec` (referenciando `gradient.action`), para Web e Mobile derivarem do mesmo token.
   A migração do RN revelará a lacuna; o Web permanece correto.
2. **Paddings 24/32/40 px (antigos lg/xl/2xl).** Hoje expressos por classe utilitária no call site (`padding="none"` +
   `p-6/p-8/p-10`), pois não estão na escala de intenção do DS. Se se mostrarem recorrentes, promover a papéis de
   espaçamento; enquanto forem layout pontual, permanecem na tela.
3. **Dark mode na Web.** O DS já define o tema escuro (tokens/recipes); a Web é light-only. Quando o dark entrar, nasce do DS.

## 5. Base compartilhada estável
- **Web:** migração concluída; identidade e componentes consomem o DS-002.
- **Mobile:** fundação pura (adaptadores DS→RN de tipografia e elevação) pronta e verificável; primitivos RN aguardam o
  ambiente Expo, consumindo esta base sem redefinição de identidade (ver [[mobile_app_status_sandbox]]).
- **Verificação:** `tsc` + suíte (795) + `next build` verdes; contratos ARCH cobrindo identidade, artefato gerado e recipes.

Conclusão: a arquitetura sustenta Web e Mobile sem divergência de identidade. As evoluções futuras são incrementais e
motivadas pelo produto ([[DS-002_FREEZE]]).
