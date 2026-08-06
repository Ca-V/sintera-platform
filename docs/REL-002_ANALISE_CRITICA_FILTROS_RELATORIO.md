# REL-002 — Análise Crítica dos Filtros do Relatório (Camada de Comunicação)

> Origem: homologação da fundadora (2026-08-06). Complementa **REL-001** (o Relatório é compilação **factual**,
> não laudo — RDC 657). Base: leitura do código real (Web `LegacyReport`, view pública `/r/[token]`, núcleo
> `@sintera/core/assembleReport`, tela Mobile). Objetivo: **o que melhorar, quais filtros ajustar/incorporar**,
> categoria por categoria, com **paridade Web↔Mobile**.

---

## 0. Método
Análise ancorada no código (não em suposição):
- **Web (atual, em produção):** `src/app/dashboard/relatorio/page.tsx` (`LegacyReport`, ~1094 linhas) — filtra e
  renderiza **inline**.
- **Web (view pública do link):** `src/app/r/[token]/page.tsx` — **re-implementa** o filtro a partir do share.
- **Mobile:** `apps/mobile/.../relatorio/RelatorioScreen.tsx` — **único** consumidor de `assembleReport`.
- **Núcleo:** `packages/core/src/domain/report/assemble.ts` (`assembleReport`, `REPORT_GROUPS`).

---

## 1. Achado ARQUITETURAL (o mais importante) — 3 implementações paralelas do mesmo relatório
O relatório existe **três vezes**, com a mesma lógica reescrita:
1. **Web `LegacyReport`** — filtragem inline (deriva `perEventos`, `perOmics`, … antes do render).
2. **Web `/r/[token]`** — filtra de novo, à parte (e **nem renderiza** a seção Histórico de Exames).
3. **Mobile + core `assembleReport`** — a montagem canônica.

`assembleReport` **não é usado pela Web** (grep por `assembleReport` em `src/` = 0 ocorrências). Consequência: toda
regra de filtro/seleção/rótulo precisa ser mantida em 3 lugares → **divergência garantida** (é exatamente onde o
defeito abaixo se instalou nos dois). Isso **viola** [[adr_001_projecao_ssot]] (SSOT) e [[principio_paridade_total_web_mobile]].

**Recomendação estrutural:** convergir a Web para o núcleo (`assembleReport`) — o relatório passa a ter **uma** fonte
de montagem; Web e Mobile só diferem no chrome de UI. Todo filtro novo entra **uma vez** no core.

---

## 2. Achado de DEFEITO (o que você viu) — "Histórico de Exames" ignora o período
Confirmado nos **dois** códigos:
- Web `page.tsx` (L744/L758): renderiza `bioSummaries` **sem** `inPeriod`; `bioSummaries` vem de
  `current_biomarkers` **sem recorte de data** (L155-159).
- Core `assemble.ts` (L185): `histexames: data.bioSummaries.map(...)` — **sem** filtro de período.

Todas as outras seções temporais aplicam `inPeriod(...)`. Só o **Histórico de Exames** não. Por isso, ao trocar para
"últimos 7 dias", **continua aparecendo tudo**. → **É bug, não escolha de design.** (As seções de *estado atual* —
Condições, Medicamentos em uso, Recursos, Hábitos, Contraceptivo — são período-independentes **de propósito**; o
Histórico de Exames **não** é estado atual, é evolução longitudinal → deve respeitar o período.)

Além disso, o Histórico de Exames **não tem** filtro por **nome** do indicador nem por **tipo/origem** — exatamente
os que você pediu.

---

## 3. Análise categoria por categoria (seção → filtro hoje → lacuna → proposta)

| Seção (grupo) | Fonte | Filtro HOJE | Lacuna | Proposta |
|---|---|---|---|---|
| **Agenda** (Acomp.) | eventos abertos | período + item por **tipo** | sem busca/nome | + busca por título; (opc.) filtro por profissional |
| **Histórico de Saúde** (Acomp.) | eventos fechados | período | sem busca/tipo | + item por **tipo** + busca |
| **Histórico de Exames** (Acomp.) | biomarcadores | **NENHUM (bug)** | **período, nome, tipo/origem** | **corrigir período** + item por **nome do indicador** + filtro por **categoria/painel de origem** + busca |
| **Composição Corporal** (Acomp.) | body_metrics (não-vital) | período (último valor) | não escolhe indicadores | + item por **métrica** (peso, gordura, …) |
| **Monitoramento** (Acomp.) | body_metrics (vital) | período | sem tipo/busca | + item por **tipo de sinal** + busca |
| **Exames** (Docs) | exams | período + item (`tipo__data`) + ordenação | filtro por **tipo** e **nome** só via item (confuso) | filtro **por tipo** dedicado + **busca por nome** + período (já) |
| **Exames de ômica** (Docs) | omics_panels | período | não escolhe domínio | + item por **domínio** |
| **Condições** (Minha Saúde) | health_conditions | nenhum (estado atual) | — | (opc.) item por escopo própria/familiar |
| **Medicamentos** / **Suplementos** | medications | em uso + suspenso(overlap) + item por **nome** | sem filtro por status | + filtro **em uso / suspenso** |
| **Recursos de Saúde** | health_resources | nenhum | sem tipo | + item por **tipo de recurso** |
| **Hábitos** | life_habits | nenhum | sem categoria | + item por **categoria** |
| **Ciclo e Contracepção** | contraceptivos + menstruação | atual + período | — | ok |
| **Despesas** (Organização) | eventos financeiros | período | sem categoria | + filtro por **categoria de despesa**; total (já) |

### Padrão que emerge (não é uma abstração nova — é generalizar o que já existe)
O relatório **já tem** o mecanismo certo: `sections` (liga/desliga) + `excluded[seção]=[itens]` (item a item) +
`period`. Hoje o item a item só vale para **exames, medicamentos, eventos**. **A melhoria é estender o MESMO
mecanismo** às demais seções (indicadores, sinais, domínios, categorias) + **corrigir o período no Histórico de
Exames** + **busca textual por seção**. Alinha com [[principio_estabilidade_arquitetural]] (acomodar antes de criar).

---

## 4. Modelo de filtros proposto (unificado, Web = Mobile)
1. **Período global** — já existe; passa a aplicar a **todas** as seções temporais (corrige o Histórico de Exames).
2. **Filtro por item (nome)** — generalizado a todas as seções que têm itens nomeáveis (indicadores, exames,
   medicamentos, sinais, domínios, hábitos, recursos, despesas).
3. **Filtro por tipo** — onde a seção tem "tipo" (exames, sinais, despesas, recursos, biomarcadores por origem).
4. **Busca textual por seção** — filtrar por nome sem desmarcar item a item.
5. **Persistência:** hoje o `excluded` (item a item) é salvo nos **perfis** (`report_templates`) mas **NÃO** nos
   **links públicos** (`report_shares`) → o link ignora o filtro por item. **Corrigir:** persistir `excluded` no share.

---

## 5. Bug × Evolução (separação para o ciclo/RC1)
- 🔧 **Bug (entra no ciclo/RC1):** Histórico de Exames respeitar o **período** (core + Web). Baixo risco, alto valor.
- 🔧 **Bug (entra no ciclo):** link público (`/r/[token]`) persistir/aplicar `excluded` (senão o filtro por item some no link).
- 🗺️/🔧 **Evolução (a decidir):** filtros por **tipo/nome/busca** em todas as seções (o que você pediu) + a
  **convergência Web→core**. Depende da decisão de escopo abaixo (muda a forma de implementar).

---

## 6. Paridade
Se a Web **convergir para o core**, todo filtro novo nasce **uma vez** em `assembleReport` e Web+Mobile herdam →
paridade automática (o jeito correto). Se **não** convergir agora, cada filtro precisa ser escrito **duas vezes**
(Web inline + core) e re-validado nos dois — mais trabalho e risco de divergir de novo.

## 7. Decisão pendente (a fundadora)
**Como implementar os filtros novos:**
- (A) **Convergir Web→core primeiro** e então adicionar os filtros **uma vez** no core (SSOT; mais trabalho inicial,
  elimina as 3 implementações). ← recomendado a médio prazo.
- (B) **Patch paralelo** (Web inline + core) — mais rápido agora, perpetua a duplicação.

E **escopo neste ciclo:** só o **bug do período** (RC1) × bug + **filtros completos** por data/tipo/nome.
