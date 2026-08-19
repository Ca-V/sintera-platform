# EXDOC-023 — Gate C: evidências (execução BLOQUEADA por ambiente/escopo — nenhum dado real acessado)

> **Gate C aberto sob regime A (100% read-only, zero escrita).** Ao verificar o ambiente (metadados apenas), a
> execução **não é possível** dentro do escopo autorizado. **Nenhum dado pessoal foi lido; nenhuma migração aplicada;
> zero escrita.** **Data:** 2026-08-19.

## 1. Reconhecimento (somente metadados — sem PII)
Ferramentas usadas: `list_projects`, `list_tables` (nomes/contagens/flags RLS). **Nenhum `SELECT` de dados**; nenhum acesso a `exams`/`biomarkers`/`profiles`.
- **Projetos Supabase:** **1** — `SINTERA` (`pxiglvrgxooawetboglb`), `ACTIVE_HEALTHY`, região us-east-2. **É a produção.** **Não há preview/staging separado.**
- **Dados reais presentes (produção):** `profiles` 3, `exams` 27, `biomarkers` 395, `extraction_versions` 23, `clinical_results` 0, etc. (dados de saúde reais).
- **Schema canônico 137→143 — AUSENTE:** não existem `service_requests`, `service_request_results`, `patients`, `practitioners`, `organizations`, `party_identifiers`, `terminology_bindings`, `procedures`, `exam_documents`. Migrações mescladas no git, **não aplicadas ao banco**.

## 2. Por que o Gate C (como autorizado) NÃO é executável
| # | Contradição | Detalhe |
|---|---|---|
| B1 | **Sem ambiente não-produção** | A única fonte de dados reais é **produção**, que o gate **exclui** explicitamente. |
| B2 | **Schema canônico ausente** | Ler as tabelas canônicas exige **aplicá-las (DDL) = escrita persistente** — proibido ("zero escrita") e em produção (excluída). |
| B3 | **Sem dados canônicos reais** | Mesmo aplicadas, as tabelas nasceriam **vazias** (backfill não autorizado) → nada real a validar nos caminhos ServiceRequest/Procedure/DocumentReference. |
| B4 | **RLS não garantível pela via disponível** | O `execute_sql` do MCP opera como **service_role** (contorna RLS) → o requisito "RLS obrigatório" **não** é satisfeito por essa ferramenta. |

## 3. Read-set efetivamente utilizado
**Nenhum.** Só metadados (catálogo de tabelas). **Zero linhas de dados reais lidas.**

## 4. Confirmação de zero escrita
✅ `list_projects` + `list_tables` são leitura de metadados. **Nenhuma** DDL/DML; **nenhuma** migração aplicada; **nenhum** `audit_events`; **nenhum** Bundle produzido/persistido; `file_url` não tocado.

## 5. Veredito
**BLOQUEAR (execução do preview) — por ambiente/escopo, não por defeito do projetor.**
- A **aptidão do projetor** já está provada em **A/B (sintético/estrutural)** — não regride.
- O **Nível C "preview com dados reais canônicos" não é realizável hoje**, porque: (i) não há ambiente não-produção; (ii) o schema canônico não está aplicado; (iii) **não existem dados canônicos reais** (o modelo 137→143 nunca foi populado — e backfill está fora do gate).
- **Decisão material necessária** (fora do escopo autorizado): definir COMO obter um alvo de validação Nível C.

## 6. Opções para decisão (nenhuma executada)
- **O1 — Preview sintético em infra separada:** provisionar projeto/branch Supabase **descartável** (não produção), aplicar 137→143, popular **dados SINTÉTICOS** e rodar o preview. ⇒ valida o **adapter+projeção em infra real**, mas com **dados sintéticos** (é reforço de A/B, **não** "dados reais").
- **O2 — Leitura read-only de PRODUÇÃO (rever exclusão):** exigiria sua autorização **explícita para produção** + escopo a um **`user_id` de teste** + via que **imponha RLS** (o MCP service_role não impõe). Ainda assim, como o schema canônico está ausente, a projeção ficaria limitada a **`DiagnosticReport`/`Observation`** derivados de `exams`/`biomarkers` legados (sem ServiceRequest/Procedure/DocumentReference). **Não recomendado** sem revisão de privacidade.
- **O3 — Aplicar 137→143 em produção (aditivo/reversível):** DDL em produção (escrita) — **fora deste gate**; e não gera dados canônicos reais (tabelas vazias). Seria um gate próprio ("Fase 0 em produção").
- **Constatação-chave:** "dados reais canônicos" só existirão **após** um **backfill legado→canônico** (gate material distinto). Portanto, o Nível C tal como imaginado depende de uma etapa anterior de **materialização de dados**, que está explicitamente fora deste gate.

## 7. Recomendação
Não ler produção nesta etapa. Caminho de menor risco e coerente com a separação A/B/C/D:
1. **Agora (sem novo gate):** eu posso implementar o **adapter `CanonicalSource` real (read-only)** e validá-lo contra um **Postgres isolado com o schema 137→143 + dados sintéticos** (equivalente ao ambiente de teps das migrações) — prova o *loader real* sem tocar produção. Isso **não é** Nível C, e será rotulado como tal.
2. **Gate material seu (quando decidir):** ou (O1) preview sintético em infra separada; ou uma etapa de **backfill legado→canônico** que crie dados canônicos reais, seguida de preview — ambos exigem sua autorização e definição de ambiente.

## 8. Estado
**Gate C: execução bloqueada por ambiente/escopo.** Nenhum dado real acessado, nenhuma escrita, produção intocada. **Parado.** Aguardo sua decisão (§6) — não leio produção nem aplico migração em infra real sem autorização explícita e específica.
