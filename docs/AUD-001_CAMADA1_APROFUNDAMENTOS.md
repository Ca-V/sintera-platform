# AUD-001 · Camada 1 — Aprofundamentos (5 pontos)

> Contra a baseline `sintera-v1-baseline`. **Nada implementado** — só medição/registro.
> Complementa [[AUD-001_CAMADA1_TECNICA]]. Reprioridade da fundadora aplicada (estrutural > CreateRecordMenu).

## 1. Fragmentação do Design System — quantificada + sistema canônico

**Conclusão (mais precisa que "dois DS competindo"):** existe **um DS de-facto** (estilo "premium":
tokens `card-premium`/`petal`/`mauve` + componentes de topo `ListCard`/`PageHeader`/`EmptyState`/
`ConfirmDialog`/`ViewModeSwitcher`) **parcialmente adotado**, **+ 6 primitivos órfãos** em `src/components/ui/`
que **criam a ilusão de um segundo DS**:

| Primitivo `ui/` (órfão) | Uso em `src/app` | Equivalente de-facto usado |
|---|---|---|
| `ui/Button` | **0** | botão `gradient-sintera` copiado inline (10+ lugares) |
| `ui/Card` | **0** | `ListCard` (14×) + `card-premium` inline (21 páginas) |
| `ui/ItemCard` | **0** | `ListCard` |
| `ui/StateView` | **0** | `EmptyState` (2×) + inline |
| `ui/Badge` | **0** | `CardChip`/chips inline |
| `ui/Input` | **0** (único com `htmlFor` correto) | `<input>` inline `bg-ivory` |

*Obs.: a pasta `ui/` **não** é toda morta — abriga componentes novos **usados** (CreateRecordMenu,
ProvenanceLine, PeriodSelector, SelectionToolbar, ReportSection…). O problema são os **6 primitivos
antigos com 0 uso**.*

**Canônico recomendado:** o estilo **premium**. Ação de backlog: **remover os 6 primitivos órfãos**
(código morto) **ou** reconstruí-los no estilo premium e adotar — e criar de fato um `Button`/`Input`
premium compartilhado (hoje inexistente como componente). Esse item sozinho explica boa parte das
diferenças visuais.

## 2. Métricas objetivas de reutilização (de ~19 páginas de módulo)

| Componente | Existe | Usado | Cobertura |
|---|:--:|:--:|:--:|
| `ListCard` | ✅ | 14/19 | **74%** |
| `ViewModeSwitcher` | ✅ | 6/19 | 32% |
| `PageHeader` | ✅ | 2/19 | **11%** |
| `EmptyState` | ✅ | 2/19 | **11%** |
| `ConfirmDialog` | ✅ | ~2 (dos que excluem) | ~15% |
| `CreateRecordMenu` | ✅ | 2/19 | **11%** |
| `ui/Button` · `ui/Card` · `ui/Badge` · `ui/ItemCard` · `ui/StateView` · `ui/Input` | ✅ | **0** | **0%** |
| *(sombra)* `card-premium` inline | — | **21 páginas** | — |

Leitura: só `ListCard` tem adoção saudável. Header/EmptyState/CreateRecordMenu/ConfirmDialog são o
**alvo de padronização de maior retorno**. `card-premium` cru em 21 páginas é o "card fantasma".

## 3. SSOT da altura — investigação completa

- **Origem:** duas migrations — `profiles.height_cm` (054) e `body_metrics` aceitando `metric='altura'` (048/062).
- **Escreve:** `profiles.height_cm` ← `api/profile/route.ts:51` (edição de perfil). `body_metrics.altura` ←
  `medidas/page.tsx:340` (opção "Altura" no seletor de métrica).
- **Lê:** **todas** as leituras usam `profiles.height_cm` — `medidas:208` (exibe), `relatorio:343`,
  `r/[token]:96`. **Nada lê `body_metrics.altura`.**
- **Fonte canônica = `profiles.height_cm`.** O caminho `body_metrics.altura` é **órfão de escrita**
  (grava dado que ninguém lê) → risco de divergência.
- **Real × potencial em produção:** **apenas potencial.** Query em produção: **0 usuários com altura em
  `body_metrics`**, **0 divergências reais** (1 perfil com `height_cm`). O código permite, mas o caminho
  nunca foi usado.
- **Ação (backlog, baixo esforço):** remover "Altura" das opções de Medidas (ou redirecionar a escrita
  para `profiles.height_cm`). **Sem migração de dados** (0 linhas). Elimina a duplicidade na raiz.

## 4. Acessibilidade — métricas objetivas (axe-core, WCAG 2 A/AA)

Violações automáticas por página (produção):

| Página | Violações | Regra dominante |
|---|:--:|---|
| Home | 3 | color-contrast |
| Medicamentos | 6 | **label · select-name** (formulário sem rótulo) + contrast |
| Exames | **16** | color-contrast (maior) |
| Relatório | 7 | color-contrast (7, "serious") |
| Medidas | 6 | color-contrast |

- **Dominante: `color-contrast` (impacto "serious")** em todas — **confirma A4** (petal/mauve-60/gold +
  fontes 10-11px < WCAG AA).
- **Formulários sem `<label>` associado** (`label`/`select-name`) — **confirma A5**.
- *Nota:* axe cobre ~30-40% dos critérios WCAG; teclado/leitor de tela/ordem de foco (A1/A3) exigem
  verificação manual — já registrados qualitativamente na Camada 1.

## 5. Performance — visão runtime (produção)

*(Bundle estático não disponível: o build Next 16/turbopack não imprime tabela de tamanhos.)*

| Página | JS transferido | Requisições | **Supabase** | load |
|---|:--:|:--:|:--:|:--:|
| Home | ~140 kB (1º load) | 107 | 12 | 84 ms |
| Medicamentos | ~0 kB (cache) | 99 | 4 | 103 ms |
| Exames | ~5 kB | 104 | 4 | 73 ms |
| **Relatório** | ~0 kB | 117 | **22** | 88 ms |
| Medidas | ~6 kB | 104 | 4 | 106 ms |

- **Sem inchaço de JS:** chunks bem compartilhados — navegações seguintes transferem ~0 kB. Code-splitting saudável.
- **Loads rápidos** (73-106 ms de navigation timing).
- **Achado (P2):** **Relatório dispara 22 requisições Supabase** (mais alto; Home 12) — agrega todos os
  módulos; oportunidade de **consolidar leituras** (reduzir waterfall/N+1). Sem P1 de performance.

## Reprioridade (aplicada — fundadora)

- **P1 (máxima):** ① SSOT altura (arquitetural; 0 impacto real hoje, mas caminho órfão) · ② dois DS / 6
  primitivos órfãos + adoção parcial · ③ captura/upload inconsistente (constantes 10×50 MB + inputs
  duplicados em 8 lugares).
- **P1 também:** acessibilidade (contraste + labels + foco/Escape em modais).
- **P2:** CreateRecordMenu ainda não aplicado a todos os módulos (**consequência**, não causa) · dívida
  técnica (`any`, data-fetching, erro) · cosméticos · Relatório 22 queries.
- **Decisão da fundadora:** Prevenção proativa (RDC 657).

**Camada 1 (com aprofundamentos) encerrada.** Nada implementado. Segue para a Camada 2 (produto/UX).
