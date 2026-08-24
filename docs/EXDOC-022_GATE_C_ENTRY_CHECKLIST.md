# EXDOC-022 — Checklist de entrada do Gate C (revisão read-only, antes de qualquer dado real)

> **Revisão documental READ-ONLY.** Não executa código contra infra, não acessa dados reais, não altera
> código/EXDOC-021/runbook/Ciclo 1. Produz o checklist de entrada do Gate C e lista condições pendentes.
> **Fonte governante:** Protocolo v1.0. **Data:** 2026-08-19.

## 1. Revisão dos 6 pontos solicitados
| # | Verificação | Achado |
|---|---|---|
| 1 | EXDOC-021 documenta entrada/sucesso/falha/**rollback** do preview? | **Parcial.** Entrada/sucesso/falha: sim (EXDOC-020 §9 + runbook). **Rollback do preview: implícito** (scripts `rollback_137..143` + rollback reverso provado em EXDOC-015), mas **não referenciado explicitamente** no runbook. → **Cond-A**. |
| 2 | Runbook identifica **exatamente** tabelas/campos lidos e PII/sensível exposto? | **Não (genérico).** Diz "só colunas de projeção", sem enumerar. Inventário produzido na §2 abaixo. → **Cond-B**. |
| 3 | Existe operação no roteiro que **escreva/materialize/persista**? | **No código: NÃO** (runner é puro/leitura). **No runbook:** a sugestão "registrar leituras em `audit_events`" **é escrita**. → **Cond-C (marcar PROIBIDA antes do gate salvo autorização)**. |
| 4 | Preview será **estritamente read-only** e resultados armazenados conforme segurança/auditoria? | **Sim, com ressalva:** `runCanonicalPreview` só lê; `PreviewReport` é **agregado (counts + flags), sem PII**. **O Bundle projetado CONTÉM PII real** e **não** pode ser persistido/exportado. → **Cond-D**. |
| 5 | Separação A/B/C/D | **Confirmada** (§5). |
| 6 | Condições pendentes antes de C | §6. |

## 2. Read-set exato + inventário de PII/sensível (a ler no preview)
Tabelas/campos que o projetor **precisa** (minimização — ler **só** isto):
| Tabela | Campos de projeção | Contém PII/sensível? |
|---|---|---|
| `patients` | id, user_id, name, birth_date, gender | **PII** (name, birth_date) · **sensível** (gender) |
| `party_identifiers` | (só se `system` presente) kind, value, system | **PII sensível** (CPF/CNS/CNES/CRM em `value`) — hoje `system` NULL ⇒ **NÃO projetar ⇒ NÃO ler** (minimização) |
| `practitioners` | id, name | **PII** (profissional) |
| `organizations` | id, name | institucional |
| `service_requests` | id, requisition_id, code_text, body_site_*, laterality, status, intent, authored_on, FKs | **sensível** (procedimento solicitado) |
| `service_request_results` | service_request_id, result_exam_id, confirmed | vínculo |
| `exams` (result events) | id, display_title/code, exam_date, issuer, requesting_physician | **PII** (requesting_physician, issuer) · **sensível** |
| `biomarkers` / `clinical_results` | id, exam_id, exam_document_id, name, value*, unit | **dado de saúde sensível (LGPD art. 11)** |
| `exam_documents` | id, exam_id, file_url, sha256, document_role, uploaded_at, source, current_extraction_version_id | **sensível** (file_url → documento clínico) |
| `terminology_bindings` | (só `confirmed`) target*, system, code, display, status | terminologia |

**Inventário de dados pessoais/sensíveis potencialmente lidos:** nome do paciente e do profissional; data de nascimento; sexo; identificadores oficiais (se lidos); nomes/valores de exames e biomarcadores (**saúde**, LGPD art. 11); solicitante/emissor; referência ao documento clínico. **`file_url` NÃO deve ser resolvido/baixado** no preview (só a referência).

## 3. Operações de escrita — PROIBIDAS antes do Gate C
- **Código (`runCanonicalPreview`/`loadCanonicalModel`/projetor/validador): 0 escritas** — estritamente leitura + memória. ✅
- **`audit_events` (runbook):** persistir log de auditoria **é escrita** → **PROIBIDA por padrão antes do gate**. Opções para o gate (decisão sua): (a) durante o preview read-only, **não** persistir — log efêmero/stdout; (b) autorizar explicitamente **`audit_events` como ÚNICA escrita permitida** (governança), registrando finalidade/escopo. Até decisão: **nenhuma escrita**.
- **Proibido no preview:** qualquer `insert/update/delete/materialized view/copy`; backfill; gravação do Bundle; resolução/download de `file_url`; export de PII.

## 4. Read-only e armazenamento de resultados
- Execução prevista: **somente leitura** sobre dados reais.
- **Armazenar apenas o `PreviewReport` agregado** (contagens por recurso, `structural.ok`, `unresolved`, nº de grupos) — **sem PII**.
- **NÃO** persistir/exportar o **Bundle projetado** (contém PII real) — usar apenas em memória, descartado ao fim.
- Compatível com o Protocolo v1.0 §10 (minimização, sem export de PII).

## 5. Separação A/B/C/D
| Nível | Estado |
|---|---|
| **A — sintético** | ✅ concluído |
| **B — modelo FHIR** | ✅ concluído (estrutural) · **validator oficial FHIR + perfis BR-Core/RNDS = pendentes** |
| **C — preview com dados reais** | ⛔ **fechado** (não executado) |
| **D — RNDS/OpenCare** | ⛔ **fechado** (gate posterior) |
> A/B **não** são evidência de C nem de D.

## 6. Condições a satisfazer antes de abrir C (nada implementado aqui)
- **Cond-1 (fonte real):** implementar `CanonicalSource` sobre Supabase **read-only**, com **RLS** e **minimização** (só o read-set §2). Inexistente hoje (gated).
- **Cond-A (rollback):** referenciar no runbook o **rollback reverso 143→137** (scripts existentes) para o ambiente de preview.
- **Cond-B (read-set/PII):** anexar o inventário §2 ao runbook como escopo de leitura oficial.
- **Cond-C (auditoria×escrita):** decidir (a) log efêmero × (b) `audit_events` como única escrita autorizada — até lá, **zero escrita**.
- **Cond-D (não-persistência do Bundle):** garantir que o Bundle (PII) não é gravado/exportado; só o relatório agregado.
- **Cond-E (ambiente):** preview isolado de produção; contas **de teste/sintéticas ou consentidas**; sem PII para fora.
- **Cond-F (B pendente, não bloqueia C):** validator FHIR oficial + perfis BR-Core/RNDS permanecem para depois (Nível B-perfil / D).

Nenhuma dessas condições foi implementada ou alterada — são **pré-requisitos do gate**, listados para sua decisão.

## 7. Checklist final de ENTRADA do Gate C (a confirmar no momento da abertura)
```
[ ] Autorização explícita do Gate C (fundadora)
[ ] Ambiente de preview/staging isolado de produção
[ ] Migrações 137→143 aplicadas no preview (Fase 0) — com rollback reverso 143→137 pronto
[ ] Adaptador CanonicalSource real: read-only + RLS + minimização (read-set §2)
[ ] Escopo de contas: teste/sintéticas ou consentidas
[ ] ZERO escrita (ou decisão explícita sobre audit_events como única escrita)
[ ] Bundle projetado NÃO persistido/exportado; só PreviewReport agregado
[ ] file_url não resolvido/baixado
[ ] Critérios de aprovação/reprovação (EXDOC-020 §9 / runbook) prontos para conferência
[ ] Registro de finalidade/escopo da leitura (auditoria) conforme decisão da Cond-C
```

## 8. Estado
Revisão concluída — **nenhum bloqueador técnico novo no código** (runner é read-only e puro). As pendências são **condições de gate** (§6), não defeitos. **Gate C permanece FECHADO.** Permaneço parado; o próximo comando será sua autorização explícita do Gate C, se decidir abrir o preview.

## 9. DECISÃO FIXADA — Cond-C = Opção A (regime de escrita do preview)
**Decisão da fundadora (2026-08-19):** **preview 100% read-only, logging efêmero, ZERO escrita persistente.** `audit_events` fica para gate posterior (política de auditoria operacional). Regime do Gate C:
| Aspecto | Decisão |
|---|---|
| Leitura do Supabase | Permitida, **somente read-only** |
| RLS | **Obrigatório** |
| Read-set | **Estritamente** o inventário §2 |
| Dados reais | Só no preview autorizado |
| Escrita em tabelas | **Zero** |
| `audit_events` | **Não escrever** |
| Logs técnicos | **Efêmeros, sem PII** |
| Bundle FHIR (dados reais) | **Não persistir nem exportar** |
| `file_url` | **Não baixar** |
| `PreviewReport` | Permitido, **agregado e sem PII** |
| RNDS/OpenCare · Backfill · Produção | **Zero** |

**Invariante fail-safe (fixado):** ao encontrar inconsistência (ex.: vínculo ServiceRequest↔resultado inconsistente; lateralidade ausente; Identifier sem `system`; terminologia não curada; preliminar/final incompatível; referência FHIR não resolvida) → **registrar no relatório efêmero e REPROVAR o caso; NUNCA corrigir automaticamente**. Fluxo obrigatório: `dados reais → leitura → projeção → validação → evidência → descarte` (nunca `leitura → alteração/auditoria → projeção`).

> Esta decisão **não** requer alteração do código da Fase C (o runner já é 0-escrita). O único item que exige implementação no momento da abertura é o **adaptador `CanonicalSource` real (read-only + RLS + minimização)** — e só após sua **autorização explícita do Gate C**. Até lá: **nenhum acesso a dados reais**.
