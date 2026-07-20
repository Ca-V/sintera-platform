# COLOR-001 — Estudo Cromático da SINTERA

**Objetivo:** definir a **direção da cor primária** (não os tokens finais) por avaliação visual — 5 direções inspiradas
em _Almond Blossom_. **Escopo:** só a **primária**; neutros quentes e verde-acinzentado (secundária) vêm do [[BRAND-001]].
**Status:** Approved (DIREÇÃO) · **Architectural Baseline** · **Versão:** 1.2 · **Histórico:** v1.0 estudo 5 direções;
v1.1 direção **A·E aprovada** + comparativo + teste denso + 7 princípios; v1.2 (2026-07-20) Baseline + tom predominante
**claro (entre a 3ª e a 4ª etapa da rampa, ~p-250)** + web migra para A·E (paleta atual descontinuada).
**Dependências:** [[BRAND-001]] · [[adr_010_identidade_visual_unica|ADR-010]]. **Impacto:** a direção A·E gera os tokens
50–900 do Design System (Passo 3B).

## Decisão (aprovada pela fundadora)
> **A direção cromática oficial da SINTERA será baseada na variante intermediária (A·E)**, preservando o equilíbrio entre
> a profundidade cromática da direção Almond Original (A) e a leveza da direção Luminosa (E). Os valores finais dos tokens
> poderão sofrer **pequenos ajustes** durante a implementação do Design System para otimização de **contraste,
> acessibilidade e consistência Web/Mobile (e modo escuro)**. Congela-se a **direção**, não os HEX absolutos.

## Princípios cromáticos permanentes (fundadora)
1. **Congela-se a direção, não os valores** — refinamentos técnicos de token são permitidos sem reabrir o branding.
2. **A primária NÃO domina a interface** — usada em **ações principais · gráficos · elementos ativos · destaques ·
   navegação ativa**; evitar grandes áreas preenchidas com a cor institucional. A identidade nasce do **equilíbrio**
   (espaço · tipografia · neutros · contraste · cor).
   - **Tom predominante CLARO:** quando a primária aparece (nós da Timeline, gráficos, elementos decorativos), o tom
     predominante é **claro — entre a 3ª e a 4ª etapa da rampa (entre p-200 e p-300, ~p-250)**, um turquesa sereno, não
     os escuros. Os tons escuros (p-600+) ficam **só** onde há necessidade de contraste: **texto e ações** (ex.: botão/CTA
     com texto branco). Isso mantém a leveza sem perder legibilidade.
3. **Neutros em primeiro lugar** — inspirados nas flores (off-white · ivory · warm white · cinzas quentes muito suaves);
   **evitar branco puro predominante**. Os neutros impactam a percepção premium **mais** que a primária.
4. **Semântica clara** (não reusar a institucional para tudo): **Informação → primária Almond · Sucesso → verde sálvia
   suave · Atenção → âmbar discreto · Erro → terracota suave.**
5. **Identidade única Web + Mobile** — a web evolui para esta mesma direção; sem duas identidades; só adaptações de
   plataforma quando necessário.
6. **Tipografia + cor aprovadas EM CONJUNTO** ([[BRAND-002]]) antes de construir os tokens/componentes (Passo 3B).

## Teste em telas densas (A·E)
A Home é sempre a tela mais favorável; o teste real é a densidade. Specimen com A·E aplicada a **Timeline (muitos
eventos) · laboratório completo · histórico longitudinal · Agenda · Perfil · Login**, com toggle de tipografia (Hanken ×
Atkinson) e claro/escuro: **→ https://claude.ai/code/artifact/e4b6b834-3367-4a04-98da-4c206beedc8f**

## Contexto
A cor usada no primeiro specimen (BRAND-002) estava **errada** — um teal escuro puxado para verde-petróleo, próximo do
**verde escuro provisório** da web, transmitindo robustez/corporativo. A direção aprovada é outra: o **azul-esverdeado
suave, dessaturado e luminoso** do fundo da obra — entre **azul-céu suave, turquesa, verde-água e ciano dessaturado** —
**nunca** verde escuro nem azul corporativo. Baixa saturação = elegância.

## Specimen visual (decidir olhando)
Mesma tela da SINTERA (botão · cards · Timeline · navegação · gráfico · indicadores), mudando **apenas a paleta primária**;
cada direção mostra a rampa **50–900**; claro/escuro:
**→ https://claude.ai/code/artifact/b7aa2581-a108-45f2-b9ab-2f5366656133**

## As 5 direções (todas inspiradas em _Almond Blossom_, dessaturadas)
| Dir | Caráter | Matiz aprox. |
|---|---|---|
| **A** | Almond original — o azul-esverdeado refinado do fundo | ~188° |
| **B** | Mais azul — inclina ao azul-céu/ciano | ~200° |
| **C** | Mais Tiffany — turquesa dessaturado | ~176° |
| **D** | Sofisticada — menos saturação, mais elegância | ~190°, baixa sat. |
| **E** | Luminosa — mais clara e arejada | ~186°, mais clara |

Cada direção é uma rampa completa (50 claro → 900 escuro) com saturação baixa nas tints (leveza) e uma primária-600 com
contraste suficiente para ação/texto. Neutros quentes e verde-acinzentado permanecem fixos.

## Recomendação
A direção deve ficar **no centro** do espectro (azul-esverdeado suave), nunca puxando para verde escuro. Entre as cinco,
**D (sofisticada/dessaturada)** e **A (Almond original)** tendem a ser as mais elegantes e alinhadas ao posicionamento
premium; **C** se quiser mais Tiffany; **B** mais azul; **E** se a prioridade for leveza/luminosidade. Decisão **pendente**.

## Próximo
Escolhida a direção → construo os **tokens 50–900** definitivos (primária + neutros quentes + secundária + semânticos) no
**Design System (Passo 3B)** e atualizo o [[BRAND-001]] §4 com a linguagem cromática oficial.
