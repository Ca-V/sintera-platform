# Camada de Comunicação — Dataset do Relatório (read-model canônico)

**Status:** fundação consolidada. Espelho de LEITURA da consolidação de escrita (rotas/serviços).

## Causa estrutural eliminada
A projeção factual de **11 tabelas** (medications, health_events, exams, body_metrics,
health_conditions, life_habits, health_resources, omics_panels, contraceptive_methods,
menstrual_periods, profiles) estava **clonada** entre a página privada
`dashboard/relatorio/page.tsx` (cliente, RLS) e o link público `r/[token]/page.tsx`
(servidor, service-role). Cada mudança de coluna exigia editar dois lugares e os dois
relatórios **divergiam em silêncio** — incluindo uma superfície pública.

## Conceito permanente
O **"dataset de comunicação"** — o conjunto factual completo da pessoa reunido para
comunicar com um profissional — é uma **projeção de leitura cross-domínio** com dono
único: a **Camada de Comunicação** (`src/lib/communication/`, ao lado de `period.ts`
e `profiles.ts`).

```ts
loadReportDataset(supabase: SupabaseClient, userId: string): Promise<ReportDataset>
```

- **Neutro quanto à origem do cliente:** recebe o cliente RLS (usuário logado) OU o
  service-role (link público) e projeta o MESMO dataset. Impossível divergirem.
- **Normalização única:** os achatamentos antes duplicados (óculos `attributes`→plano,
  data do exame = `exam_date || created_at`, defaults de kind/status) vivem numa só
  camada, testados uma vez (`tests/communication/reportDataset.func.test.ts`).

## Fronteira (mantida)
- **Eventos** voltam como `HealthEvent[]` (domínio Agenda, via `rowToHealthEvent`);
  **Despesas** continuam `selectFinancial(dataset.events)` — a regra financeira permanece
  no domínio Agenda (SSOT), não no dataset.
- **Recorte temporal** (`period.ts`) é responsabilidade do consumidor, não do dataset.
- Nenhuma regra de negócio de outro domínio vive no read-model — ele só REÚNE e NORMALIZA.

## Preparação para as próximas fases
Novas fontes factuais (laboratórios, wearables, Apple Health, Health Connect) entram
**uma vez** no `loadReportDataset`; a página privada e o link público herdam
automaticamente, sem reabrir esta fundação.

## Critérios de encerramento (7/7)
1. Único dono: `src/lib/communication/reportDataset.ts`.
2. Única implementação: um loader + um conjunto de normalizadores.
3. Todos os consumidores a usam: `relatorio` (privado) e `r/[token]` (público).
4. Sem adaptações locais: achatamentos/normalizações removidos das páginas.
5. Reauditoria: **0** projeções multi-tabela remanescentes nas superfícies de relatório.
6. Consistente para próximas fases (labs/wearables reusam o dataset).
7. Reduz dívida: ~200 linhas de clone eliminadas; divergência público×privado impossível.
