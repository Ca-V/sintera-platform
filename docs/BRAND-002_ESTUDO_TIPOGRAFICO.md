# BRAND-002 — Estudo Tipográfico

**Objetivo:** comparar pares tipográficos adequados ao posicionamento da SINTERA e **recomendar** — **sem escolher ainda**.
**Escopo:** análise (título + interface) por critérios; a decisão é da fundadora. Aprovada, integra o [[BRAND-001]] e o
Design System (3B) nasce com a tipografia definitiva.
**Status:** Draft — aguardando decisão da fundadora · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20).
**Dependências:** [[BRAND-001]] (identidade) · [[tema_g_acessibilidade]]. **Impacto:** define um dos elementos mais
presentes na experiência diária.

## Critérios de avaliação (da fundadora)
Legibilidade · personalidade da marca · acessibilidade · **leitura prolongada** · desempenho **mobile** · desempenho
**web** · **licenciamento/disponibilidade**. Princípios do [[BRAND-001]]: sofisticação sem parecer artística; saúde premium
(não hospitalar, não corporativa); tecnologia invisível; calma.

## Restrições técnicas (por serem mobile-first + web)
- **Licença:** priorizar **open-source (SIL OFL)** → custo zero, **auto-hospedável** (bundling no app RN + self-host na
  web, sem depender de CDN).
- **Fontes variáveis:** preferidas — um arquivo, vários pesos (performance) + peso fluido (sensação orgânica, [[BRAND-001]] §9).
- **Português-BR:** cobertura completa de acentuação. **Algarismos tabulares** para os dados observacionais (colunas alinhadas).
- **Pesos mínimos:** display 1–2; interface Regular/Medium/SemiBold (+ Light opcional).

## Specimen visual (decidir olhando, não pela descrição)
Artifact com as combinações aplicadas a **telas reais da SINTERA** (Início, Timeline, Exames, valores laboratoriais,
indicadores, cartões, botões, alerta, formulário, navegação), com toggle e avaliação por combinação, claro/escuro:
**→ https://claude.ai/code/artifact/d331cd4d-5ab8-4f41-bfaf-d5678da283dd** (fontes reais embutidas; cores só ilustrativas).

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
  *(Nota: a versão "Next" (2024) é a evolução da família; o specimen usa a Atkinson Hyperlegible disponível em OFL.)*

## Comparativo
| Critério | A · Fraunces+Hanken | D · Fraunces+Atkinson | B · Source Serif+Sans | C · Figtree |
|---|---|---|---|---|
| Legibilidade | 🟢 | 🟢 **máx.** | 🟢 | 🟢 |
| Personalidade (premium/natureza) | 🟢 forte | 🟢 (título) | 🟡 sóbria | 🟡 discreta |
| Acessibilidade | 🟢 | 🟢 **máx.** | 🟢 | 🟢 |
| Leitura prolongada / dados | 🟢 | 🟢 **excelente** | 🟢 | 🟢 |
| Mobile / Web | 🟢 | 🟢 | 🟢 | 🟢 |
| "Tecnologia invisível" | 🟡 | 🟢 | 🟢 | 🟢 forte |
| Licença/variável | OFL, variável | OFL (Atkinson estática) | OFL, variável | OFL, variável |

## Recomendação (decisão da fundadora)
Ranking conceitual (a confirmar no specimen):
1. **A — Fraunces + Hanken Grotesk:** mais alinhada ao posicionamento **premium** e à inspiração _Almond Blossom_.
2. **D — Fraunces + Atkinson Hyperlegible:** se a **prioridade máxima for legibilidade** num sistema de saúde de uso
   diário (dados/exames) — une sofisticação (título) e usabilidade máxima (corpo).
3. **B — Source Serif 4 + Source Sans 3:** muito sólida, porém personalidade mais tradicional/institucional.
4. **C — Figtree:** ótima para simplicidade, mas não expressa a identidade sofisticada/atemporal da SINTERA.
Decisão **pendente** (ver o specimen). Ao escolher, integro ao [[BRAND-001]] (§5) e o Design System (3B) nasce com a
tipografia definitiva.

## Próximo
Após a escolha: atualizar BRAND-001 §5 com a tipografia oficial + gerar PDFs; então **Passo 3B — Design System**.

## Próximo
Após a escolha: atualizar BRAND-001 §5 com a tipografia oficial + gerar PDFs; então **Passo 3B — Design System**.
