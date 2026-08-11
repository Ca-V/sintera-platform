# Motor de Insights — `src/lib/ai/insights/`

Implementação dos componentes do Sprint 2 que **não dependem de decisão clínica**.
Ver `docs/SPRINT-2-INSIGHTS.md` (arquitetura) e `docs/GOVERNANCA-CLINICA-SINTERA.md` (limites).

## O que está aqui (implementado e testado)

| Arquivo | Componente | Função |
|---|---|---|
| `types.ts` | — | Tipos centrais do motor (catálogo, resolução, contexto). |
| `resolver.ts` | **Resolver** | Resolve `(nome, unidade)` do laudo → entrada do `biomarker_catalog`. Porte 1:1 da SQL das migrações 022/022b. |
| `assembler.ts` | **Assembler** | Monta o `InsightContext` de um exame: biomarcadores resolvidos + perfil, agrupados por categoria, fora-de-faixa (aritmético) e críticos. |
| `engine.ts` | **Motor determinístico (mecanismo)** | Avalia regras clínicas FORNECIDAS e produz candidatos a insight. Sem limiares embutidos. |
| `rules.clinical.ts` | regras (template) | Conjunto de regras clínicas — **VAZIO** até aprovação clínica. É onde a clínica define os limiares. |
| `__smoke__/resolver.normalize.mjs` | teste | Valida a normalização de nomes (mapa de acentos) contra 16 casos reais. |
| `__smoke__/resolver.e2e.mjs` | teste | Valida o resolver completo contra **118 pares reais** de produção — bate 100% com o `catalog_id` que o banco já tem. |
| `__smoke__/engine.eval.mjs` | teste | Valida o mecanismo da engine com regras sintéticas (inclui a garantia: conjunto vazio → 0 candidatos). |

Rodar os testes (não precisam de banco nem de `node_modules`):

```bash
node src/lib/ai/insights/__smoke__/resolver.normalize.mjs
node src/lib/ai/insights/__smoke__/resolver.e2e.mjs
```

## Como usar

```ts
import { assembleInsightContext } from '@/lib/ai/insights/assembler'

// supabase: client de servidor (respeita RLS da usuária)
const context = await assembleInsightContext(supabase, { examId, userId })
// context.biomarkers, context.byCategory, context.outOfPrintedRange,
// context.criticalPresent, context.unresolved
```

Para resolver biomarcadores avulsos (ex.: logo após a extração, para preencher `catalog_id`):

```ts
import { resolveBiomarkers } from '@/lib/ai/insights/resolver'
const results = await resolveBiomarkers(supabase, [{ name: 'Hemoglobina', unit: 'g/dL' }])
```

## Garantias e limites

- **`rangeStatus` é aritmético**: compara o valor com o intervalo IMPRESSO no laudo (`below`/`above`/`within`/`no_reference`/`non_numeric`). **Não é** classificação de criticidade.
- Nenhuma função aqui emite `clinical_flag`, narrativa ou juízo clínico.
- O Resolver não usa conhecimento médico externo — só os apelidos cadastrados.

## O que falta (bloqueado — ver docs)

- **Regras clínicas** (`rules.clinical.ts`): o *mecanismo* do motor está pronto e testado; faltam as REGRAS (limiares valor → `clinical_flag`), que são decisão clínica humana. Sem elas, `evaluateRules` retorna `[]` por segurança.
- **Templates rule-based**, **Narrativa** e **Gate de QA**: dependem da aprovação dos prompts `narrative`/`qa` (hoje `draft`).
- **Persistência em `ai_insights`** e **ativação na UI**: vêm depois dos itens acima.

## Estado de conexão com produção

- **Resolver** — **conectado**: `analyze/route.ts` preenche `biomarkers.catalog_id` em toda extração.
- **Assembler** — conectado em leitura: `GET /api/biomarkers/organized` (organização factual).
- **Geração rule-based (orchestrator)** — disponível por dois caminhos:
  - **manual**: `POST /api/exams/[id]/insights` (chama o orquestrador direto — não passa por flag);
  - **automático (pós-ingestão)**: via o hook source-agnostic `runPostIngestion`
    (`src/lib/ingestion/`), ligado em `analyze/route.ts` mas **desligado por padrão**
    (`INSIGHTS_POST_INGESTION`). Ver **`docs/INGESTAO-PIPELINE.md`**.

Enquanto `CLINICAL_RULESET`/`TEMPLATE_LIBRARY` estiverem vazios, qualquer caminho gera **0**
insights — comportamento seguro e intencional até a aprovação clínica.
