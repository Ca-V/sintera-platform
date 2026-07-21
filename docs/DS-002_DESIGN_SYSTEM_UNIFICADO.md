# DS-002 — Design System Unificado da SINTERA (Passo 3B)

**Objetivo:** construir o **Design System único (Web + Mobile)** que **materializa** a identidade já consolidada
([[BRAND-001]] marca · [[COLOR-001]] cor · [[BRAND-002]] tipografia). **Fundamentos primeiro, componentes depois.**
**Escopo:** tokens → princípios de composição → componentes → templates. **Fora de escopo:** funcionalidades de negócio
(retomadas só após o DS).
**Relação com [[DS-001]]:** o DS-001 documenta o Design System **provisório da web atual** (Tailwind, paleta descontinuada);
o **DS-002 é o definitivo**, unificado, e a web **migra** para ele (trilha paralela no [[IMPLEMENTATION_ROADMAP]]).
**Status:** Approved (plano) · **Architectural Baseline** · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-21) sequenciamento
arquitetural aprovado pela fundadora; Etapa 1 · Subitem 1 (cor) implementado.
**Dependências:** [[BRAND-001]] · [[COLOR-001]] · [[BRAND-002]] · [[adr_007_monorepo|ADR-007]] · [[HIP-012]] §4.
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
4. Tokens de superfície e elevação (sombras, bordas, opacidade, raios).
5. Tokens de motion (durações, curvas; `prefers-reduced-motion`).
6. Tokens semânticos (papéis de alto nível; grid/breakpoints).
7. Validação (contrato + revisão consolidada).

### Etapa 2 — Princípios de composição
Definir **explicitamente**, antes dos componentes: hierarquia visual · densidade · ritmo vertical · uso de espaços · uso da
cor · contraste · alinhamentos · comportamento responsivo. Os componentes apenas **materializam** estes princípios.

### Etapa 3 — Componentes fundamentais
Button · Text · Heading · Card · Surface · Badge · Chip · Divider · Icon · Avatar. Base de todos os demais.

### Etapa 4 — Componentes de domínio (identidade funcional da SINTERA)
Timeline · Laboratory Table · Biomarker Card · Indicator · Health Event · Longitudinal Chart · Clinical Document Card ·
Observation Card.

### Etapa 5 — Templates (páginas completas)
Dashboard · Timeline · Resultado de exame · Histórico longitudinal · Agenda · Perfil · Configurações.

## Validação (por item)
Cada subitem entrega: **tsc verde** (`tsc -p packages/design-system/tsconfig.json`) + **testes de contrato verdes**
(`tests/contracts/*.ARCH.test.ts`, na suíte `npm test`) + **revisão da fundadora** antes de avançar. O app RN roda no
ambiente de desenvolvimento (o sandbox valida tsc/testes/contraste, não executa o app).

## Estado atual — Etapa 1 (Subitens 1–3 concluídos)
- **Subitem 1 — cor** ✅ aprovado. **IDENTIDADE × USO** distintos: `identity.primary` (500, marca) × `button.primary`
  (700 + branco, **sempre AA**). Componentes consomem **apenas papéis**.
- **Subitem 2 — tipografia** ✅ aprovado (com refinamentos): papéis por **intenção** (não heading1/2/3), família **numeric**
  própria, papel **reading** (leitura prolongada + `measure`), Dynamic Type com regra anti-quebra.
- **Subitem 3 — espaçamento** ✅ implementado (aguardando revisão): ritmo por intenção (`spacing`/`padding`/`density`).
- **Próximo:** Subitem 4 — superfície e elevação (sombras, bordas, opacidade, raios), após revisão.
- Contratos: **23 asserts** verdes (cor 11 · tipografia 8 · espaçamento 4). Futuro (fundadora): papéis `measure.form`/
  `measure.table` conforme os componentes de formulário/tabela forem construídos.
