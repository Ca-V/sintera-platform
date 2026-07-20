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
3. A **paleta atual da web é provisória**; a futura web adota a identidade do app.
4. **Nenhuma cor definitiva aprovada** — só a **direção** (primária azul-esverdeada do fundo; neutros quentes das flores,
   evitando branco puro; secundária verde-acinzentada dos galhos). Tokens (50–900) definidos no Design System (Passo 3B).
Sequência: **Sistema de Identidade ([[BRAND-001]], Passo 3A) → Design System (Passo 3B)**.

## Alternativas consideradas
- **Basear o DS na paleta atual da web:** rejeitada — é provisória, não representa a marca.
- **Design Systems separados web/mobile:** rejeitada — divergem; quebram a consistência da identidade.
- **Extrair cores diretamente da pintura:** rejeitada — queremos linguagem contemporânea inspirada, não reprodução.

## Consequências
Identidade consistente em todos os pontos de contato; o DS implementa o BRAND-001; a web será atualizada para a mesma
identidade no futuro. Governa [[BRAND-001]] e o Design System.
