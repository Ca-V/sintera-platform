# Pipeline de Ingestão — Infraestrutura Permanente

**Status:** implementado, **desabilitado por padrão em produção**.
**Escopo:** infraestrutura permanente da plataforma — **não** pertence ao Sprint 2.
**Código:** `src/lib/ingestion/` · **Testes:** `src/lib/ingestion/__smoke__/pipeline.mjs`

---

## 1. O que é

Um contrato único que representa o evento:

> *"uma nova informação clínica estruturada foi incorporada à SINTERA"*

— **independente de quem a produziu.** A origem muda; o pipeline permanece o mesmo.
Serve hoje exames laboratoriais e, sem reescrita, servirá wearables (Oura, Garmin,
Strava), Apple Health, Google Health Connect, WHOOP, dispositivos médicos e
integrações futuras.

```
Exame ─────────┐
Wearable ──────┤
Apple Health ──┼──►  runPostIngestion(IngestionEvent)  ──►  geração de insights
Google Health ─┤          (source-agnostic)
Dispositivo ───┘
```

## 2. Contrato

```ts
type IngestionSource =
  | { kind: 'exam'; examId: string }
  | { kind: 'wearable'; provider: string; readingBatchId?: string }  // Fase 2

interface IngestionEvent { userId: string; source: IngestionSource }

runPostIngestion(supabase, event, deps?) → Promise<PostIngestionResult>  // NUNCA lança
```

- **O produtor não conhece o consumidor.** Quem dispara só monta o `IngestionEvent`.
  Nenhum produtor muda quando outra origem é adicionada.
- **Estado atual (honesto):** o dispatch por origem vive **dentro do pipeline** (`if kind === 'exam'`).
  Logo, adicionar uma origem hoje toca `types.ts` (novo membro da união) **e** `pipeline.ts`
  (novo ramo). Ver **§8 — limitação conhecida e evolução para registry de adaptadores**, onde o
  núcleo passa a ser cego à origem e cada fonte vira um adaptador (pipeline intocado).

## 3. Garantias de infraestrutura

| Garantia | Como |
|---|---|
| **Best-effort** | `runPostIngestion` **nunca lança**. Todo erro é capturado e devolvido em `outcome:'error'`. A ingestão do chamador jamais quebra por causa daqui. |
| **Idempotência** | Garantida na **persistência**: dedup por `(exam_id, content_hash)` via `upsert(..., ignoreDuplicates)` + índice único `ai_insights_exam_hash_uidx` sobre um `content_hash` **determinístico** (`persistence.contentHashFor`). Disparar N vezes para o mesmo recurso **não** cria insights duplicados nem inconsistências. *Nota:* o recomputo (assembler+engine) não é deduplicado — é seguro e barato; um guard de "já processado" pode ser adicionado depois se o custo justificar. |
| **Footprint zero com a flag off** | Flag desligada → retorna na hora, **sem banco, sem resposta alterada e sem log** (o sink default silencia o estado estacionário `flag_off`). |
| **Fronteira regulatória** | Nenhum juízo clínico aqui. Com regras/templates clínicos vazios (estado atual), mesmo ligado gera **0** — `outcome:'no_active_rules'`. |

## 4. Feature flag — `INSIGHTS_POST_INGESTION`

Desliga **apenas a geração automática** (o disparo pós-ingestão). Default: **OFF**
(qualquer valor fora de `on`/`1`/`true` = desligado).

**Não** bloqueia:
- **execução manual** — `POST /api/exams/[id]/insights` chama o orquestrador **direto**, sem passar pelo hook;
- **testes / smoke tests** — injetam `isEnabled: () => true` via `deps`;
- **desenvolvimento/homologação** — basta `INSIGHTS_POST_INGESTION=on`.

Assim toda a infraestrutura é validável **antes** da ativação em produção.

> **Evolução:** quando a ativação for aprovada, este env flag pode dar lugar ao mesmo
> padrão de **rollout controlado** já usado na escrita canônica (`canonical_route` →
> `allowlist`/`percent`), sem alterar o contrato do hook.

## 5. Observabilidade (telemetria)

Cada execução emite um `PostIngestionResult` completo — **não apenas erros**:

| Campo | Responde |
|---|---|
| `userId` | quem disparou (dona dos dados) |
| `source` + `sourceRef` | qual a origem (exam/wearable + examId/provider) |
| `durationMs` | tempo de execução |
| `insightsGenerated` | quantos insights saíram |
| `outcome` | **por que (não) gerou**: `generated` · `no_active_rules` · `flag_off` · `unsupported_source` · `error` |
| `rulesActive` / `candidates` | contexto do zero (ex.: 0 regras ativas) |
| `error` | mensagem, quando `outcome:'error'` |

Sink default: log estruturado `[ingestion:telemetry] {…}` (greppável). Um sink
injetável (`deps.telemetry`) permite plugar observabilidade externa ou persistência
(ex.: `usage_events`) sem tocar o pipeline.

> **Nota:** o desfecho de **QA** (reprovação da narrativa) pertence ao caminho
> `ai_generated` (narrativa + gate `qa`), **ainda não implementado**. Quando existir,
> entra como novo `outcome` — o contrato é extensível.

## 6. Onde toca produção

Um único ponto: `src/app/api/exams/[id]/analyze/route.ts`, **após** a persistência dos
biomarcadores, uma chamada best-effort com resultado descartado:

```ts
await runPostIngestion(supabase, { userId, source: { kind: 'exam', examId } })
```

Com a flag off (produção), é no-op: **não altera** os biomarcadores, o status do exame,
a resposta da API nem o banco. O Resolver (preenchimento de `catalog_id`) **já** fazia
parte desta rota e permanece inalterado.

## 7. Extensão para wearables (Fase 2)

Quando `wearable_readings` existir (ver `docs/FASE-2-WEARABLES.md`), o sync do provedor
emitirá `{ kind: 'wearable', provider, readingBatchId }` para o **mesmo** hook. Falta
apenas mapear essa origem à geração (hoje retorna `unsupported_source`) — o contrato,
a flag, a telemetria e a idempotência já valem para ela.

## 8. Limitação conhecida e evolução → registry de adaptadores

**Limitação (auditada):** o núcleo do pipeline ainda **conhece "exam"**. Em `pipeline.ts`:
`sourceRefOf` tem `case 'exam'`; o dispatch tem `if (event.source.kind === 'exam')` e importa
`generateRuleBasedInsights` (camada de insights); `PostIngestionDeps.generateForExam` é nomeado
por exame. **Consequência:** adicionar uma origem hoje exige editar `pipeline.ts`, não só um
adaptador. As garantias (best-effort, idempotência, telemetria, flag) já são source-agnostic; o
**dispatch** não é.

**Alvo real (mais profundo que o registry): o Evento Clínico Canônico.** O registry resolve o
*dispatch*; mas o contrato compartilhado deveria ser **anterior** a ele. No desenho-alvo:

```
ClinicalDataProducer  →  Normalizer  →  CanonicalClinicalEvent  →  Pipeline
     (Exam, Wearable,     (por produtor,   (observações clínicas       (source-blind:
      Vision, Omics,       fora do núcleo)  normalizadas: sujeito,       um único caminho,
      FHIR, IoT…)                           conceito/LOINC, valor,       sem dispatch)
                                            unidade, tempo, proveniência)
```

O pipeline **sequer sabe que adaptadores existem** — recebe só o evento canônico e roda um único
caminho (normalização já feita → organização → geração → persistência). O adaptador/normalizador
**sobe** para a camada do produtor. Isso reduz o acoplamento **mais** que o registry: o registry
esconde os *nomes* das origens atrás de um mapa; o evento canônico remove o *conceito de origem* do
núcleo. **Pré-condição honesta:** o "zero alteração por origem" só se realiza se a camada de insights
também operar por **conceito canônico (LOINC-like)** em vez de `biomarker_catalog`/`current_biomarkers`
— hoje ela é modelada por biomarcador de exame. Alinha com o rumo já previsto nos docs de
Knowledge Graph V2 / Scientific Catalog (e o `loincCode` já presente em `RuleProvenance`).

**Registry (subordinado):** se ainda houver necessidade de dispatch (ex.: geração difere por
modalidade), ele vira detalhe *interno* da normalização, não o contrato central. Núcleo conhece só:

```ts
type SourceHandler = (supabase, event) => Promise<GenerationOutput>
// registry: Map<IngestionSource['kind'], SourceHandler>
```

O pipeline: resolve o handler por `source.kind`; sem handler → `unsupported_source`; com handler →
executa (timing + telemetria + best-effort). Cada origem vira um **adaptador** que registra seu
handler **fora** do núcleo. Efeitos:

- `pipeline.ts` passa a ter **zero** referências a "exam" e **deixa de importar** a camada de insights.
- **Adicionar Apple Health / Google Health Connect / Garmin / WHOOP / Oura / lab parceiro / HL7-FHIR /
  IoT = criar um adaptador + registrá-lo.** Pipeline e produtores intocados. (O membro da união em
  `types.ts` é a única adição de tipo — ou `kind: string` no registry, trocando type-safety por
  abertura total.)

> Enquanto o registry não existe, esta é a **única** dívida estrutural aberta desta infraestrutura.

## 9. Princípio permanente: infraestrutura ≠ conhecimento clínico

A camada de ingestão **transporta eventos**; ela **nunca** conhece:
biomarcadores específicos · doenças · especialidades · regras clínicas · interpretação médica.

Toda inteligência clínica fica encapsulada na camada de insights (`src/lib/ai/insights/`), atrás de
**uma** chamada opaca (`generateRuleBasedInsights`), cujo resultado o pipeline lê apenas como
contadores (`rulesActive`, `candidates`, `upserted`) para telemetria. Auditoria: não há nome de
biomarcador, doença, especialidade ou limiar clínico em `src/lib/ingestion/`. No estado-alvo (§8),
o núcleo deixa até de importar a camada de insights — a separação passa a ser também de dependência.
