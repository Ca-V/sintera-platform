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
   de contrato desde o Subitem 1.

## Sequenciamento (ordem arquitetural — aprovada)
### Etapa 1 — Design Tokens (SSOT)
Estabelece toda a linguagem visual. Tokens compartilhados Web + Mobile: **cores · tipografia · espaçamento · raios ·
sombras · motion · elevação · opacidade · bordas · grid · breakpoints.** **Sub-ordem (revisão após cada item):**
1. **Tokens de cor** — *implementado* (`src/tokens/color.ts`): rampa A·E 50–900 (light+dark) · neutros quentes ·
   semânticas com variante de texto AA · papéis por tema · helper de contraste. Contrato WCAG AA.
2. Tokens tipográficos (Fraunces + Hanken; escala, pesos, line-height, `tabular-nums`; Dynamic Type).
3. Tokens de espaçamento (ritmo vertical / escala).
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

## Estado atual — Etapa 1 · Subitem 1 (cor)
Entregue em `packages/design-system/src/tokens/color.ts` (+ contrato `tests/contracts/ds-color-tokens.ARCH.test.ts`,
12 asserts verdes). **Ponto para decisão da fundadora:** a âncora `#579DA8` com **texto branco** rende **AA large/negrito**
(3,1:1); para AA **normal** com branco há o papel `primaryStrong` (mais escuro). Alternativa: texto **escuro** sobre a
âncora (5,3:1, AA pleno). Aguardando revisão para seguir ao Subitem 2 (tipografia).
