# BRAND-002 — Estudo Tipográfico

**Objetivo:** comparar pares tipográficos adequados ao posicionamento da SINTERA e **recomendar** — **sem escolher ainda**.
**Escopo:** análise (título + interface) por critérios; a decisão é da fundadora. Aprovada, integra o [[BRAND-001]] e o
Design System (3B) nasce com a tipografia definitiva.
**Status:** **Approved (DECIDIDO)** · **Architectural Baseline** · **Versão:** 2.1 · **Decisão:** **sistema de TRÊS camadas —
Fraunces (títulos) + Hanken Grotesk (interface/leitura) + IBM Plex Mono (dados científicos)** (fundadora, 2026-07-21) →
integrado ao [[BRAND-001]] §5. · **Histórico:** v2.1 (2026-07-21) adiciona a 3ª camada (mono para dados); v2.0 (2026-07-21) Par 1; v1.0 (2026-07-20); v1.1 (2026-07-20)
estudo ampliado: par **E — Fraunces + Atkinson Hyperlegible Next** (a pedido da fundadora) + specimen com **cores A·E reais**
(âncora `#4D8C9D`) + critério **harmonia com _Almond Blossom_**; v1.2 (2026-07-20) **decisão por experiência de uso** — specimen
com a tela crítica **histórico laboratorial completo** (32 biomarcadores · unidades · referências · tendências · observações),
**toggle Desktop/Mobile** (~390px) e painel de avaliação BRAND-001; **v2.0 (2026-07-21) DECISÃO: Par 1 — Fraunces + Hanken
Grotesk** (por experiência de uso; validado em Mobile) → integrado ao [[BRAND-001]] §5; Baseline.
**Dependências:** [[BRAND-001]] (identidade) · [[tema_g_acessibilidade]]. **Impacto:** define um dos elementos mais
presentes na experiência diária.

## DECISÃO v2.1 — Sistema tipográfico oficial de TRÊS camadas (fundadora, 2026-07-21)

A tipografia principal **não muda** — Fraunces + Hanken Grotesk permanecem. A SINTERA **não é software de laboratório/LIS
nem ERP hospitalar**; é uma **plataforma de governança da saúde**, e sua identidade transmite (nesta ordem) **confiança,
organização, elegância, cuidado e ciência**. Migrar a interface para uma sans "técnica" (ex.: IBM Plex Sans) faria a
plataforma soar clínica/fria e **destruiria a personalidade acolhedora e editorial** — por isso foi **descartado**.

**Princípio-chave:** o que transmite ciência **não é a fonte** — é o **rigor visual**: alinhamento rigoroso, espaçamento
consistente, tabelas bem construídas, **números alinhados**, hierarquia, precisão, ausência de ruído.

**A mudança aprovada é cirúrgica — uma 3ª camada tipográfica restrita a DADOS:**

| Camada | Fonte | Uso |
|---|---|---|
| **Títulos** | **Fraunces** (serifa editorial) | display, títulos de página/seção/cartão |
| **Interface / leitura** | **Hanken Grotesk** | corpo, formulários, navegação, leitura prolongada |
| **Dados científicos** | **IBM Plex Mono** | **valores laboratoriais, índices, percentuais, biomarcadores, IDs, protocolos, hashes, códigos** |

**Regras da camada de dados (mono):**
- **Somente dados.** IBM Plex Mono **nunca** em texto corrido, rótulos comuns, botões ou navegação — só onde há **valor/código**.
- **Algarismos tabulares + lining** (`font-feature-settings: 'tnum' 1, 'lnum' 1`) → colunas de valores perfeitamente alinhadas.
- **Pesos enxutos** (Regular/Medium) — mono em peso alto fica pesado; os valores usam Medium, referências/unidades Regular.
- **OFL / self-host** (next/font na web; bundling no app RN) — sem CDN, coerente com as restrições técnicas abaixo.

**Onde vive no DS-002 (SSOT):** `fontFamily.mono` (token) → papel `typeRole.numeric.{primary,secondary,reference,large}`
(única camada consumida pelos componentes) → adaptador web `src/lib/ui/ds/fonts.ts` carrega a fonte. Componentes de dado
(`Numeric`, `LaboratoryTable`, `BiomarkerCard`, `Indicator`) **já** consomem `numeric.*`, então herdam o mono sem alteração de tela.
Contrato: `tests/contracts/ds-type-tokens.ARCH.test.ts` (três camadas + tnum/lnum).

> **Nota da fundadora (foco real):** a diferença de acabamento entre Login (~95%) e dashboard (~85–88%) **não é tipografia** —
> é **densidade/ruído visual**: excesso de azul na sidebar, cartões demais, pouco respiro, contornos e sombras ainda fortes.
> Prioridade após esta camada: **(1)** polir layout e densidade; **(2)** reduzir ruído dos componentes; **(3)** _Almond Blossom_
> como protagonista; **(4)** o mono já introduzido para dados. **BRAND-002 (Hanken) não será reaberto.**

## Critérios de avaliação (da fundadora)
Legibilidade · **leitura prolongada** · acessibilidade · **personalidade da marca** · comportamento em **Web e Mobile** ·
**harmonia com a identidade inspirada em _Almond Blossom_** · licenciamento/disponibilidade. Princípios do [[BRAND-001]]:
sofisticação sem parecer artística; saúde premium (não hospitalar, não corporativa); tecnologia invisível; calma.

## Como a decisão será tomada (fundadora)
A tipografia **não é escolhida pela beleza**, e sim pela **experiência de uso ao longo de anos** — o usuário passará horas
lendo exames, Timeline, documentos, indicadores e histórico. **Conforto de leitura antes de personalidade.** Cenários de
comparação, por prioridade: **(1) Timeline longitudinal** (escaneabilidade · separação data/evento · ritmo); **(2) Tabela de
exames — o teste mais importante** (alinhamento e leitura dos números · contraste · localização); **(3) Leitura prolongada**
(fadiga · velocidade · conforto após vários parágrafos); **(4) Mobile** — todas as comparações também em largura de
smartphone (a maioria usará o app). **Tela crítica adicional:** o **histórico laboratorial completo** (dezenas de
biomarcadores, valores, unidades, referências, tendências, observações) — se a fonte funcionar aqui, funciona em quase todo
o sistema. Para cada par, responder às perguntas do [[BRAND-001]]: transmite **serenidade · confiança · sofisticação ·
continuidade**? **Desaparece** na leitura ou chama atenção para si? É apropriada para **acompanhamento de saúde de longo
prazo**? *A melhor tipografia é a que quase deixa de ser percebida.*

## Restrições técnicas (por serem mobile-first + web)
- **Licença:** priorizar **open-source (SIL OFL)** → custo zero, **auto-hospedável** (bundling no app RN + self-host na
  web, sem depender de CDN).
- **Fontes variáveis:** preferidas — um arquivo, vários pesos (performance) + peso fluido (sensação orgânica, [[BRAND-001]] §9).
- **Português-BR:** cobertura completa de acentuação. **Algarismos tabulares** para os dados observacionais (colunas alinhadas).
- **Pesos mínimos:** display 1–2; interface Regular/Medium/SemiBold (+ Light opcional).

## Specimen visual (decidir olhando, não pela descrição)
Artifact com os **5 pares** aplicados a **telas densas reais da SINTERA** (Timeline longitudinal, tabela de exames
laboratoriais com algarismos tabulares, detalhe de exame, Agenda/Perfil e **bloco de leitura prolongada**), com toggle de
par e claro/escuro, **já com as cores A·E reais** (âncora `#4D8C9D` · gradiente verde→azul):
**→ https://claude.ai/code/artifact/e40b6842-1a17-462a-b8e4-f4dcd4f5da8a** (fontes reais OFL embutidas).
Specimen anterior (cores ilustrativas): https://claude.ai/code/artifact/d331cd4d-5ab8-4f41-bfaf-d5678da283dd.

> **Alerta de contexto (fundadora):** a SINTERA não é uma landing — são centenas de telas, milhares de exames, tabelas,
> Timeline, valores laboratoriais, **leitura diária por anos**. Uma fonte linda numa landing pode cansar num app diário.
> Por isso o peso de **legibilidade + conforto de leitura prolongada** é alto, sobretudo no **corpo/dados**.

## Pares candidatos (todos OFL / gratuitos)
> Evitei deliberadamente os "defaults" (Inter/Space Grotesk) para não diluir a identidade.

### A — "Editorial sereno" (serifa suave + humanista) · *mais caráter*
- **Título:** **Fraunces** (serifa variável, suave e quente, eixo óptico) — sofisticação humana; a delicadeza remete à
  natureza/serenidade de _Almond Blossom_ sem parecer artística.
- **Interface:** **Hanken Grotesk** (grotesca humanista, ótima legibilidade em tela, muitos pesos).
- **Personalidade:** cálida, editorial, premium, humana. **Risco:** serifa expressiva exige uso comedido no display.

### B — "Superfamília coesa" (harmonia por design) · *mais seguro*
- **Título + Interface:** **Source Serif 4** + **Source Sans 3** (mesma origem; harmonizam por construção; enorme faixa
  de pesos; tabulares; PT-BR completo).
- **Personalidade:** coesa, confiável, discreta, científica-serena. **Baixo risco**; leitura prolongada excelente.

### D — "Sofisticação + usabilidade máxima" (serifa + fonte de acessibilidade) · *sugestão da fundadora*
- **Título:** **Fraunces** (identidade/sofisticação) · **Interface/dados:** **Atkinson Hyperlegible** — desenhada
  (Braille Institute) para **maximizar legibilidade e diferenciação de caracteres**; excelente em interfaces com muitos
  dados e valores laboratoriais.
- **Personalidade:** título elegante + corpo funcional e altamente legível. **Risco:** Atkinson tem personalidade mais
  utilitária (menos "premium" que Hanken) e pesos mais discretos (não variável).

### E — "Fraunces + Atkinson Hyperlegible **Next**" (2024) · *pedido da fundadora, comparação direta*
- **Título:** **Fraunces** · **Interface/dados:** **Atkinson Hyperlegible Next** — a evolução (2024, Braille Institute) da
  família de acessibilidade: mais pesos, formas refinadas e melhor ritmo em texto corrido, mantendo a **máxima
  diferenciação de caracteres**. Compara-se diretamente com o par A (Hanken) e o D (Atkinson original).
- **Personalidade:** título elegante + corpo de **acessibilidade de última geração**; um pouco mais "premium" que o
  Atkinson original, preservando a legibilidade máxima. **Disponível em OFL** no Google Fonts.

## Comparativo
| Critério | A · Fraunces+Hanken | E · Fraunces+Atkinson **Next** | D · Fraunces+Atkinson | B · Source Serif+Sans | C · Figtree |
|---|---|---|---|---|---|
| Legibilidade | 🟢 | 🟢 **máx.** | 🟢 **máx.** | 🟢 | 🟢 |
| Personalidade (premium/natureza) | 🟢 forte | 🟢 (título) + corpo neutro | 🟢 (título) | 🟡 sóbria | 🟡 discreta |
| Acessibilidade | 🟢 | 🟢 **máx.** | 🟢 **máx.** | 🟢 | 🟢 |
| Leitura prolongada / dados | 🟢 | 🟢 **excelente** | 🟢 **excelente** | 🟢 | 🟢 |
| Mobile / Web | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| "Tecnologia invisível" | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 forte |
| Licença | OFL, variável | OFL (estática 400/700) | OFL (estática) | OFL, variável | OFL, variável |

## Recomendação (decisão da fundadora)
Ranking conceitual (a confirmar no specimen — a decisão é da fundadora):
1. **A — Fraunces + Hanken Grotesk:** mais alinhada ao posicionamento **premium** e à inspiração _Almond Blossom_ (corpo
   com personalidade humanista).
2. **E — Fraunces + Atkinson Hyperlegible Next:** se a **prioridade for legibilidade/acessibilidade máxima** com um corpo
   um pouco mais "premium" que o Atkinson original — o meio-termo entre A (personalidade) e D (usabilidade).
3. **D — Fraunces + Atkinson Hyperlegible (original):** usabilidade máxima; personalidade de corpo mais utilitária.
4. **B — Source Serif 4 + Source Sans 3:** muito sólida, porém personalidade mais tradicional/institucional.
5. **C — Figtree:** ótima para simplicidade, mas não expressa a identidade sofisticada/atemporal da SINTERA.
Decisão **pendente** (ver o specimen). Ao escolher, integro ao [[BRAND-001]] (§5) e o Design System (3B) nasce com a
tipografia definitiva.

## Próximo
Após a escolha: atualizar BRAND-001 §5 com a tipografia oficial + gerar PDFs; então **Passo 3B — Design System**.
