# EXDOC-024 — Fase C (B+): adapter CanonicalSource read-only validado em Postgres isolado + sintético

> **Nível B+ (NÃO é Nível C).** Valida o adapter `CanonicalSource` real (read-only) contra o **schema canônico
> 137→143** em **PostgreSQL isolado** com **dados sintéticos**. **Nenhum acesso a produção/dados reais**, nenhum
> backfill, nenhuma alteração de infra real, nenhum RNDS/OpenCare. **Data:** 2026-08-19.

## 1. O que entra
- `src/lib/fhir/canonical/sqlSource.ts` — `createSqlCanonicalSource(exec)`: implementa `CanonicalSource` via porta `SqlExecutor` (`(sql, params) → rows`). **Só SELECT**, escopado por `user_id = $1` (minimização). Queries exportadas em `Q` (inspecionáveis).
- `tests/fhir/canonical-sqlsource.test.ts` — 8 casos com executor **fake**.
- `docs/c2/sqlsource_it.sql` — integração **psql** contra o DDL real 137→143 (existência de colunas + RLS).

## 2. Validações solicitadas — resultado
| # | Requisito | Evidência | Resultado |
|---|---|---|---|
| 1 | Mapeamento 137→143 → CanonicalSource | teste fake: campos mapeados por tabela | ✅ |
| 2 | Leitura de Patient/Practitioner/Organization/Identifier/ServiceRequest/service_request_results/DiagnosticReport(resultEvents)/DocumentReference/Procedure/**Consent**/**AuditEvent** | fake + integração (13 read-sets contam) | ✅ (Consent/AuditEvent lidos; **projeção FHIR deles ainda não** — §5) |
| 3 | RLS com stub `auth.uid()` | `sqlsource_it.sql`: role não-owner + `set local test.uid` | ✅ |
| 4 | Isolamento entre usuários | fake (B vê só B) + integração (B consultando `user_id=A` → **0**) | ✅ |
| 5 | **Ausência absoluta de escrita** | teste: toda SQL emitida começa com `select`, tem `$1`, sem `insert/update/delete/drop/alter/...`; `Q.*` só SELECT | ✅ |
| 6 | Dados ausentes / vínculo ambíguo / referência inválida | fake: null→omitido; 2 sugestões não confirmadas→sem `basedOn`; `derivedFrom` órfão→`unresolvedReferences` flagra e `validateStructural.ok=false` | ✅ |
| 7 | Compatível com o projetor FHIR canônico | fake: `loadCanonicalModel → projectCanonicalToFhir → validateStructural.ok`; ServiceRequest×2, Provenance×1, coding de binding confirmado | ✅ |
| 8 | Regressão + evidência objetiva | `tsc 0` · `eslint 0` · sqlSource **8/8** · integração `SQLSOURCE_IT_OK` · **suíte 1304 passed** | ✅ |

## 3. Integração contra o DDL real (existência de colunas)
Aplicadas 137→143 em Postgres isolado + dados sintéticos; cada SELECT do adapter executou **sem erro** (colunas presentes): patients, practitioners, organizations, party_identifiers, service_requests, service_request_results, resultEvents(exams), observations(biomarkers⋈exams), procedures, exam_documents, terminology_bindings, consents, audit_events → **13/13**. RLS: **A vê os próprios; B não vê os de A** (mesmo consultando `user_id=A`).

## 4. Divergência corrigida durante a validação
- **`content_type` em `exam_documents`:** o adapter selecionava `content_type`, que **não existe na 137** (é a migração **144**, diferida). A validação contra o DDL real **pegou** o descasamento → **removido do SELECT** (`contentType` fica `null` até a 144). Sem essa correção, o adapter falharia contra o schema real. (Exatamente o tipo de erro que B+ deve capturar antes de C.)
- Ajustes de **stub de teste** (não migração): `exams.exam_date`, `biomarkers.value/unit` adicionados ao harness mínimo para espelhar colunas reais que o adapter lê.

## 5. O que permanece `[NC]` / pendente
- **Projeção FHIR de `Consent`/`AuditEvent`:** o adapter os **lê**, mas o projetor **ainda não** os emite como recursos FHIR (gap — próximo incremento de código, sintético).
- **Coding/identificadores oficiais:** só entram por binding confirmado / `system` presente (curadoria) — permanecem omitidos.
- **`content_type`/papel 'solicitacao'/issuer→Organization:** migração **144** diferida.

## 6. O QUE AINDA FALTA PARA ABRIR O VERDADEIRO GATE C
1. **Ambiente não-produção** (preview/staging) — **inexistente hoje** (só há o projeto de produção). Provisionar branch/projeto Supabase descartável **OU** decisão explícita sobre produção.
2. **Aplicar 137→143 nesse ambiente** (Fase 0 no preview) — é **escrita/DDL**, gate próprio.
3. **Dados canônicos reais**: as tabelas 137→143 nasceriam **vazias** — sem **backfill legado→canônico** (gate material distinto) **não há dados canônicos reais** para validar ServiceRequest/Procedure/etc.
4. **Fonte real com RLS efetiva**: ligar `SqlExecutor` a um cliente Supabase **autenticado** (não `service_role`), para que RLS seja imposta de fato (o MCP `execute_sql` = `service_role` **não** serve).
5. **Regime de escrita**: Cond-C = **Opção A** já fixada (zero escrita; sem `audit_events`).

**Conclusão:** o **adapter está pronto e correto** (B+ provado contra o DDL real, sintético). O Gate C **verdadeiro** depende de itens de **ambiente/dados** (1–4), todos **gates materiais** que exigem sua autorização — e o item 3 (backfill) é pré-requisito para que "dados reais canônicos" sequer existam.

## 7. Estado
Adapter validado (B+). **Nenhum dado real acessado; zero escrita; produção intocada.** Parado. Os próximos passos são **gates materiais de ambiente/dados** (§6), não código do adapter.
