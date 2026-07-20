# ADR-010 — Identidade visual única + referência _Almond Blossom_ + Design System único

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[BRAND-001]] · [[HIP-011]]

## Contexto
A identidade visual atual da web é **provisória** e não representa a linguagem definitiva. O app móvel (produto
principal) inicia sua fundação visual e não pode herdar uma referência temporária. Múltiplos Design Systems (web e mobile
separados) divergiriam com o tempo.

## Decisão
1. **Referência estética principal = _Almond Blossom_ (Van Gogh)** — como **atmosfera/linguagem**, não cópia nem extração
   literal de cores. Atributos: serenidade, confiança, leveza, sofisticação, natureza, continuidade, longevidade, acolhimento.
2. **Design System ÚNICO** para web e mobile (uma só identidade); adaptações de plataforma **só quando necessário**.
3. A **paleta atual da web é PROVISÓRIA e DESCONTINUADA**; a web **migra gradualmente** para a mesma identidade — **em
   paralelo** ao mobile, sem esperar o app ficar pronto (tarefa no [[IMPLEMENTATION_ROADMAP]]), evitando retrabalho.
4. **Direção cromática oficial = A·E** ([[COLOR-001]]) — inspirada na **atmosfera** de _Almond Blossom_ (não reprodução):
   traduz serenidade, continuidade, sofisticação, natureza e leveza. **Tom-âncora fechado = `#4D8C9D`** (azulado, ~193°,
   entre a 5ª e a 6ª etapa da rampa) — é o **piso escuro** dos preenchimentos (botões/CTA, item ativo, nós, gráficos),
   com **texto branco**; nada institucional mais escuro que ele. Os **tints claros puxam para o VERDE** (~165–180°),
   compondo uma rampa com **gradiente de matiz verde (claros) → azul (âncora)**. Detalhes em [[COLOR-001]]. **Congela-se a direção**; tokens 50–900 (com pequenos ajustes técnicos de contraste/acessibilidade/dark)
   no Design System (Passo 3B).
Sequência: **Sistema de Identidade ([[BRAND-001]], Passo 3A) → Design System (Passo 3B)**.

## Alternativas consideradas
- **Basear o DS na paleta atual da web:** rejeitada — é provisória, não representa a marca.
- **Design Systems separados web/mobile:** rejeitada — divergem; quebram a consistência da identidade.
- **Extrair cores diretamente da pintura:** rejeitada — queremos linguagem contemporânea inspirada, não reprodução.

## Consequências
Identidade consistente em todos os pontos de contato; o DS implementa o BRAND-001; a web será atualizada para a mesma
identidade no futuro. Governa [[BRAND-001]] e o Design System.
