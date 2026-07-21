# DS-002 — Design System Unificado da SINTERA (Passo 3B)

**Objetivo:** construir o **Design System único (Web + Mobile)** que **materializa** a identidade já consolidada
([[BRAND-001]] marca · [[COLOR-001]] cor · [[BRAND-002]] tipografia). **Fundamentos primeiro, componentes depois.**
**Escopo:** tokens → princípios de composição → componentes → templates. **Fora de escopo:** funcionalidades de negócio
(retomadas só após o DS).
**Relação com [[DS-001]]:** o DS-001 documenta o Design System **provisório da web atual** (Tailwind, paleta descontinuada);
o **DS-002 é o definitivo**, unificado, e a web **migra** para ele (trilha paralela no [[IMPLEMENTATION_ROADMAP]]).
**Status:** Approved · **Architectural Baseline** · **Versão:** 1.3 · **Histórico:** v1.0 (2026-07-21) sequenciamento
arquitetural aprovado + Subitem 1 (cor); v1.1 (2026-07-21) **Etapa 1 (Design Tokens) COMPLETA** (7 subitens: cor ·
tipografia · espaçamento · superfície/elevação · motion · layout + `getTheme`) + novo fluxo de entrega por etapa;
v1.2 (2026-07-21) **Etapas 2 (composição) e 3 (componentes fundamentais) concluídas** — recipes headless ([[adr_011_arquitetura_componentes_crossplatform|ADR-011]]);
v1.3 (2026-07-21) **Etapas 4 (componentes de domínio) e 5 (templates) concluídas** — camada headless completa.
**Dependências:** [[BRAND-001]] · [[COLOR-001]] · [[BRAND-002]] · [[adr_007_monorepo|ADR-007]] · [[adr_011_arquitetura_componentes_crossplatform|ADR-011]] · [[HIP-012]] §4.
**Local (SSOT):** `packages/design-system` (compartilhado RN + Web). **Regra dura:** nenhum componente com valor
**hardcoded** — tudo vem dos tokens.

## Princípios permanentes do Design System (fundadora)
1. **Orientado a dados — menos decoração, mais informação.** A SINTERA é intensiva em dados; os componentes priorizam
   **legibilidade · estabilidade visual · previsibilidade**. Componentes **não chamam atenção para si** — valorizam o
   conteúdo. (Reforça [[COLOR-001]] §2: cor com intenção.)
2. **Motion com função — nunca efeito.** A animação existe para **orientar · conectar estados · reduzir carga cognitiva**;
   nunca decorativa. *A melhor animação quase não é percebida.* Respeitar `prefers-reduced-motion`.
3. **Acessibilidade ESTRUTURAL (nasce nos tokens, não é etapa posterior):** **WCAG AA como mínimo, AAA quando possível**;
   **Dynamic Type**; **alto contraste**; **foco por teclado** (Web); **VoiceOver/TalkBack** (Mobile). Verificada por testes
   de contrato desde o Subitem 1. **Backlog de ampliação dos contratos** (fundadora): validar também **foco · contraste em
   Dark Mode · Hover · Disabled · Pressed · High Contrast** — automatizar à medida que os estados existirem nos componentes.
   **Regra do Dynamic Type:** a ampliação da fonte **nunca** deve quebrar **tabelas · Timeline · exames laboratoriais**;
   quando comprometer a estrutura, o **componente** adota estratégia de layout (reorganizar · quebrar linha · expandir),
   **jamais** reduzir ou ignorar a acessibilidade.
4. **Hierarquia por TIPOGRAFIA + ESPAÇO (cor secundária).** A hierarquia visual da SINTERA é construída **prioritariamente**
   por tipografia e espaço, e **apenas secundariamente** por cor. (Resume a filosofia do produto; reforça [[COLOR-001]] §2.)
5. **Componentes consomem INTENÇÃO, não medidas.** Papéis por intenção em todas as dimensões: cor (`roles`), tipografia
   (`typeRole.sectionTitle`), espaçamento (`spacing.section`, `density.compact`), largura de leitura (`measure.reading`).
   Se a escala mudar, o papel permanece — sem tocar nos componentes.

## Sequenciamento (ordem arquitetural — aprovada)
### Etapa 1 — Design Tokens (SSOT)
Estabelece toda a linguagem visual. Tokens compartilhados Web + Mobile: **cores · tipografia · espaçamento · raios ·
sombras · motion · elevação · opacidade · bordas · grid · breakpoints.** **Sub-ordem (revisão após cada item):**
1. **Tokens de cor** — ✅ *implementado* (`src/tokens/color.ts`): 3 camadas — **primitivos** (rampa A·E 50–900 light+dark,
   neutros quentes, feedback) → **papéis (roles)** consumidos pelos componentes. **Separação IDENTIDADE × USO** (fundadora):
   `identity.primary` (500, marca — sem regra de texto) × `button.primary` (700 + branco, ação — SEMPRE AA). Helper de
   contraste; contrato WCAG AA.
2. **Tokens tipográficos** — ✅ *implementado* (`src/tokens/typography.ts`): primitivos (Fraunces + Hanken; escala, pesos,
   line-height, letter-spacing, `tabular-nums`) → papéis por **intenção** `typeRole` (display · pageTitle · sectionTitle ·
   cardTitle · body · bodyStrong · bodySmall · label · caption · **reading** · família **numeric**{primary/secondary/
   reference/large}). Largura de leitura `measure`{reading/form/table}. Dynamic Type (`scaleTextStyle` com clamp). Contrato ARCH.
3. **Tokens de espaçamento** — ✅ *implementado* (`src/tokens/spacing.ts`): primitivos de **ritmo** → papéis por intenção
   `spacing`{inline/stack/group/section/page} · `padding`{tight/cozy/default/relaxed} · `density`{compact/default/comfortable}
   (para tabelas/Timeline). Contrato ARCH.
4. **Superfície e elevação** — ✅ (`src/tokens/elevation.ts`): raios/bordas/opacidade + `elevation` (por tema, sombra
   NEUTRA de plataforma: y/blur/spread/color/opacity + androidElevation) — profundidade **sutil** (orientado a dados).
5. **Motion** — ✅ (`src/tokens/motion.ts`): `duration`/`easing` → papéis `motion`{tap/enter/exit/emphasis}; `motionDuration`
   respeita `prefers-reduced-motion` (zera a animação, preserva a troca de estado).
6. **Layout + semântica de alto nível** — ✅ (`src/tokens/layout.ts` + `src/theme.ts`): breakpoints mobile-first, grid,
   z-index por intenção; **`getTheme(mode)`** compõe TODAS as camadas em um tema único (Web = Mobile).
7. **Validação** — ✅ contratos ARCH consolidados (6 arquivos, 31 asserts) + autoauditoria.

### Etapa 2 — Princípios de composição ✅
Regras **explícitas** que os componentes apenas materializam (parte executável em `src/composition.ts`):
1. **Hierarquia por tipografia + espaço; cor secundária.** Diferenciar por papel tipográfico e ritmo antes de recorrer à cor.
2. **Ritmo vertical.** Espaçamentos verticais são múltiplos da baseline (`rhythmBase` = 4; `verticalRhythm(n)`).
3. **Densidade explícita.** Componentes ricos em dados escolhem `density`{compact/default/comfortable} — a densidade é decisão
   do componente, não improviso.
4. **Uso do espaço por intenção.** `spacing`{inline<stack<group<section<page} e `padding`; nunca medidas cruas.
5. **Uso da cor com intenção.** Identidade × Ação separados; a primária orienta o olhar, não preenche áreas grandes.
6. **Contraste estrutural.** AA como piso em texto e ação (garantido por contrato desde os tokens).
7. **Alinhamento e leitura.** Números tabulares alinhados à direita; largura de coluna via `measure`{reading/form/table}.
8. **Responsivo mobile-first.** `breakpoint`{sm/md/lg}; o mesmo componente adapta densidade/quebra sob Dynamic Type sem
   sacrificar acessibilidade.

### Etapa 3 — Componentes fundamentais ✅
Implementados como **recipes headless** ([[adr_011_arquitetura_componentes_crossplatform|ADR-011]]): `recipe(theme, props) →
VisualSpec`, 100% derivado dos papéis do tema, sem hex cru e sem dependência de plataforma; adaptadores finos por plataforma.
Cobertos: **Button** (primary/secondary/ghost · sm/md/lg · estados · alvo de toque ≥44) · **Text** · **Heading** · **Card** ·
**Surface** · **Badge** (tons semânticos, texto AA sobre o soft) · **Chip** · **Divider** · **Icon** · **Avatar**.

### Etapa 4 — Componentes de domínio ✅
Componentes de **produto** (recipes headless, mesma arquitetura da Etapa 3): **Timeline · Laboratory Table · Biomarker Card ·
Indicator · Health Event · Longitudinal Chart · Clinical Document Card · Observation Card**. Carregam o comportamento do
domínio (números tabulares, referências, tendências, **destaque de alterações**, acessibilidade) sempre de forma **factual**
(RDC 657 — sem interpretação clínica): `classifyValue(valor, refLow, refHigh)` compara com a referência fornecida e
`statusTreatment` dá o tratamento visual por papéis (dentro→sem destaque; abaixo/acima→flag AA).

### Etapa 5 — Templates ✅
**Dashboard · Timeline · Resultado de exame · Histórico longitudinal · Agenda · Perfil · Configurações** como **composição
headless**: `template(tema, tipo)` define fundo, largura de conteúdo, respiro, ritmo entre seções e a ordem semântica das
regiões. O arranjo concreto e a fiação das recipes ficam no adaptador de plataforma — **sem decisões de design no adaptador**.

## Validação (por item)
Cada subitem entrega: **tsc verde** (`tsc -p packages/design-system/tsconfig.json`) + **testes de contrato verdes**
(`tests/contracts/*.ARCH.test.ts`, na suíte `npm test`) + **revisão da fundadora** antes de avançar. O app RN roda no
ambiente de desenvolvimento (o sandbox valida tsc/testes/contraste, não executa o app).

## Estado atual — Etapa 1 (Design Tokens) **COMPLETA** ✅
Todos os 7 subitens implementados em `packages/design-system` sobre o modelo **primitivos → papéis**, com a separação
**IDENTIDADE × USO** e **consumo por intenção** em todas as dimensões (cor · tipografia · espaçamento · superfície ·
motion · layout). Ponto único de consumo: **`getTheme(mode)`** (Web = Mobile).
- Contratos ARCH: **31 asserts** verdes (6 arquivos) — WCAG AA, Dynamic Type, reduced-motion, elevação sutil, ordenação de
  escalas, montagem de tema.
- **Fluxo de trabalho:** a partir daqui, entrega por **ETAPA** (não subitem), com autoauditoria; fundadora valida só
  decisões estruturais.
- **Etapas 2–5 concluídas** ✅ — composição, componentes fundamentais, componentes de domínio (produto, factual/RDC 657) e
  templates, todos como recipes/composição headless ([[adr_011_arquitetura_componentes_crossplatform|ADR-011]]), com contratos
  de acessibilidade por tema.
- **DS-002 completo na camada headless.** Pendências planejadas (roadmap, não bloqueiam): **adaptadores de plataforma**
  (React Web · React Native) e **migração da web** provisória para o DS-002.
