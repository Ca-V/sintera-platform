# Migração de Identidade — Web (A·E + Almond Blossom + Fraunces/Hanken)

**Objetivo:** dar à plataforma web **imediatamente** a identidade definitiva da SINTERA, separando **identidade visual**
(cores, tipografia, atmosfera) da **arquitetura de componentes** (DS-001 → DS-002, que segue incremental). Opção C da
fundadora: identidade primeiro (global), componentes depois (incremental).
**Status:** Approved · 2026-07-21 · **Ref:** [[COLOR-001]] · [[BRAND-001]] · [[BRAND-002]] · [[adr_010_identidade_visual_unica|ADR-010]].
**Natureza:** entrega própria (migração de identidade), **não** parte da migração do Design System.

## O que mudou (camada global)
- **Tokens globais** (`src/app/globals.css` `@theme`): toda a paleta remapeada para **A·E** (âncora `#579DA8`, ação
  `#3D6C7B` AA) + **neutros quentes Almond** (bg `#F4EFE6`, surface `#FBF8F2`, ink `#241F1A`, muted `#6B6154`, line
  `#E4DBCB`). Nomes dos tokens preservados (`petal`, `onyx`, `mauve`, `cream`…) → **nenhum componente quebrou**; só o valor mudou.
- **Tipografia** (`layout.tsx` + `@theme inline`): Cormorant/DM Sans → **Fraunces + Hanken Grotesk** (self-host via next/font).
- **Elementos institucionais fixos** remapeados: scrollbar, seleção, `input[range]`, `.glass`, **todos os gradientes**
  (`gradient-sintera`, `-aqua`, `-dark`, `-hero`, `-energy`, `-sleep`, `-cycle`, `-hydration`…), sombras dos cards, **glow
  do sidebar** (`nav-active-glow`), borda de impressão. Gradiente de matiz A·E (verde nos claros → azul nos escuros).
- **Cores fixas nos componentes**: 20 arquivos (onboarding, login, opengraph-image, relatório público `r/[token]`,
  como-funciona, etc.) tiveram hexes/rgba antigos trocados 1:1 pelos equivalentes A·E.

## Revisão de contraste (AA)
Pares institucionais principais **passam AA**: ação `#3D6C7B` + branco = **5,8:1**; texto `onyx` = 14,3:1; secundário
`mauve` = 5,3–5,7:1; primária-texto/link = 5,0:1.
**Caveat (disciplina pré-existente, mantida):** os acentos **decorativos** — sálvia (sucesso), âmbar (atenção), terracota
(erro) — quando usados **como texto** ficam abaixo de AA (2,7–4,1:1). Por design, são **preenchimentos/superfície**, não
texto de corpo (só `petal`/`onyx` carregam AA). Onde precisarem virar texto legível, usar a variante de texto AA do DS-002
(`badge.*.text`) — tratado na migração incremental dos componentes.

## Estados
- **hover/focus/active**: herdados dos tokens (ex.: `hover:text-petal`, foco com `petal`) → já em A·E. Revisão visual final
  no ambiente da fundadora.
- **Dark mode**: a web **não tem** dark mode hoje (tema único claro). O DS-002 já suporta dark; quando o dark entrar na web,
  nasce direto em A·E. Nada a migrar aqui.
- **Gráficos/destaques**: elementos que consumiam a paleta antiga (gradientes de destaque, glows) remapeados.

## Resultado
Toda a plataforma passa a exibir a **identidade definitiva** (sidebar, topbar, fundos, superfícies, tipografia) —
o usuário deixa de ver "duas plataformas". Os **componentes** continuam migrando incrementalmente para o DS-002.
`tsc` + `next build` + suíte verdes. **Validação visual pixel a pixel** fica para o ambiente da fundadora.

## Referência oficial de harmonia = página de **Login** (fundadora, 2026-07-21)
A tela de **Login** é a referência de melhor harmonia cromática; **todas as demais páginas aplicam as cores do mesmo modo**:
- **Painel teal (assinatura):** `linear-gradient(150–160deg, #9BD8E0 0%, #6FC1CF 58%, #57B0BF 100%)` — aqua claro; **texto
  ESCURO** por cima (onyx / `#123A40`), nunca bege. Usado em painéis de destaque e na **Sidebar** (mesmo gradiente + texto escuro).
- **Área de conteúdo:** neutros quentes claros — `gradient-subtle` (`#FBF8F2 → #EEF7F4 → #D9EDE8`) / `bg-cream`.
- **Ação (botões/CTA):** `gradient-sintera` (`#3D6C7B → #74B8B9`) + texto branco.
- **Tipografia:** Fraunces (títulos) + Hanken (corpo). **Chips/labels de grupo:** neutros quentes (pedra/creme/areia).
Regra: ao migrar qualquer página, **espelhar exatamente** esse tratamento (mesmo teal, texto escuro sobre teal, mesmos neutros
e mesmo botão de ação) — sem variações locais.

## Ordem (revisada)
1. **Migração global da identidade** ✅ (este documento).
2. Continuação da migração incremental para o DS-002.
3. Eliminação gradual do DS-001.
4. Auditoria arquitetural final do DS.
