# BRAND-002 — Estudo Tipográfico

**Objetivo:** comparar pares tipográficos adequados ao posicionamento da SINTERA e **recomendar** — **sem escolher ainda**.
**Escopo:** análise (título + interface) por critérios; a decisão é da fundadora. Aprovada, integra o [[BRAND-001]] e o
Design System (3B) nasce com a tipografia definitiva.
**Status:** **Approved (DECIDIDO)** · **Architectural Baseline** · **Versão:** 2.0 · **Decisão:** **Par 1 — Fraunces + Hanken
Grotesk** (fundadora, 2026-07-21, por experiência de uso) → integrado ao [[BRAND-001]] §5. · **Histórico:** v1.0 (2026-07-20); v1.1 (2026-07-20)
estudo ampliado: par **E — Fraunces + Atkinson Hyperlegible Next** (a pedido da fundadora) + specimen com **cores A·E reais**
(âncora `#4D8C9D`) + critério **harmonia com _Almond Blossom_**; v1.2 (2026-07-20) **decisão por experiência de uso** — specimen
com a tela crítica **histórico laboratorial completo** (32 biomarcadores · unidades · referências · tendências · observações),
**toggle Desktop/Mobile** (~390px) e painel de avaliação BRAND-001; **v2.0 (2026-07-21) DECISÃO: Par 1 — Fraunces + Hanken
Grotesk** (por experiência de uso; validado em Mobile) → integrado ao [[BRAND-001]] §5; Baseline.
**Dependências:** [[BRAND-001]] (identidade) · [[tema_g_acessibilidade]]. **Impacto:** define um dos elementos mais
presentes na experiência diária.

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
