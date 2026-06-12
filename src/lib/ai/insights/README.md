# Motor de Insights — `src/lib/ai/insights/`

Implementação dos componentes do Sprint 2 que **não dependem de decisão clínica**.
Ver `docs/SPRINT-2-INSIGHTS.md` (arquitetura) e `docs/GOVERNANCA-CLINICA-SINTERA.md` (limites).

## O que está aqui (implementado e testado)

| Arquivo | Componente | Função |
|---|---|---|
| `types.ts` | — | Tipos centrais do motor (catálogo, resolução, contexto). |
| `resolver.ts` | **Resolver** | Resolve `(nome, unidade)` do laudo → entrada do `biomarker_catalog`. Porte 1:1 da SQL das migrações 022/022b. |
| `assembler.ts` | **Assembler** | Monta o `InsightContext` de um exame: biomarcadores resolvidos + perfil, agrupados por categoria, fora-de-faixa (aritmético) e críticos. |
| `__smoke__/resolver.normalize.mjs` | teste | Valida a normalização de nomes (mapa de acentos) contra 16 casos reais. |
| `__smoke__/resolver.e2e.mjs` | teste | Valida o resolver completo contra **118 pares reais** de produção — bate 100% com o `catalog_id` que o banco já tem. |

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

- **Motor determinístico** (valor → `clinical_flag`): depende dos limiares clínicos aprovados.
- **Templates rule-based**, **Narrativa** e **Gate de QA**: dependem da aprovação dos prompts `narrative`/`qa` (hoje `draft`).
- **Persistência em `ai_insights`** e **ativação na UI**: vêm depois dos itens acima.

## Ainda não conectado em produção

Estes módulos são a fundação testada, mas **ainda não são chamados** por nenhuma rota.
A integração (ex.: rodar o Resolver após a extração para preencher `biomarkers.catalog_id`
em exames novos) é um passo seguinte, a ser revisado antes de tocar a rota de produção
`src/app/api/exams/[id]/analyze/route.ts`.
