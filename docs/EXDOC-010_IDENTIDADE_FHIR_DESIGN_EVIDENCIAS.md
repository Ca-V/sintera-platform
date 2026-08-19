# EXDOC-010 — Identidade estruturada (FHIR Patient/Practitioner/Organization + Identifier): design + evidências

> **Componente estrutural P0 (identidade)** — determinado objetivamente pela matriz de conformidade e pelo
> Protocolo v1.0 §13 ("P0 — identidade"), na sequência do C-2. Migração **139**, aditiva/reversível, validada em
> **PostgreSQL isolado** (dados sintéticos). **NÃO** produção, backfill real, wiring/UI, FHIR-serialização ou RNDS.
> **NÃO** toca `profiles`/`exams`/`service_requests` nem o baseline do Ciclo 1. **Fonte governante:** Protocolo v1.0.
> **Data:** 2026-08-19.

## 1. Por que este componente agora (derivação objetiva)
- Protocolo §13 e matriz §2 listam **identidade como P0**; P0-semântica e P0-vínculo já entregues (C-2).
- O modelo canônico §7 exige `Patient`/`Practitioner`/`Organization` estruturados, com **identidade local separada dos identificadores nacionais** (nunca substituir o id interno por CPF/CNS).
- A C-2 deixou os atores **interinos** (`subject_user_id`, `requester_text`, `performer_text`) apontando explicitamente para "a migração de IDENTIDADE". Este é o próximo passo natural e **independente** de 137/138.
- **Retrofit de enum em `document_type`/`order_status`** (também P0-reconciliação) **NÃO** foi feito autonomamente: adicionar CHECK a coluna legada com dados existentes pode rejeitar linhas e arrisca o baseline → exige auditoria de dados (gate material).

## 2. Modelo (aditivo; sem tocar `profiles`)
- **`patients`** (FHIR Patient): `user_id` (identidade LOCAL), `name`, `birth_date`, `gender` (nullable, check FHIR administrative-gender). Distinta de `profiles` (não tocada).
- **`practitioners`** / **`organizations`** (FHIR Practitioner/Organization): `user_id`, `name`.
- **`party_identifiers`** (FHIR Identifier 0..*): **exclusive-arc** com FKs reais (`patient_id`/`practitioner_id`/`organization_id`, exatamente um via `chk_one_party = num_nonnulls(...) = 1`), `kind` (classificação INTERNA: cpf/cns/cnes/cnpj/crm/local/outro), `value`, `system` (URI oficial — **NULL até confirmação, `[NC]`**), `use`, `period_start/end`, `assigner_text`, `verification_status`.
- **RLS user-scoped** nas 4 tabelas; índices por owner.

## 3. Regras respeitadas
- **Identidade local ≠ identificador nacional:** `patients.user_id` permanece a âncora; CPF/CNS entram como `party_identifiers`, **não** substituem o id interno.
- **Nada inventado:** `system` (URI oficial FHIR/BR-Core) nasce **NULL** (`[NC]`); `kind` é fato estrutural (tipos de identificador brasileiros), não um system FHIR; `value` só recebe dado real/curado (sintético em teste).
- **Integridade referencial:** FKs reais + `chk_one_party` + cascade owner→identifiers.
- **Reversível/aditivo:** novas tabelas/tipos; rollback = DROP; não muta nada existente.

## 4. Mapeamento FHIR R4 (conceitual)
| Tabela 139 | FHIR | Nota |
|---|---|---|
| `patients` | `Patient` | `gender`/`birthDate` estruturais; id local |
| `practitioners` | `Practitioner` | — |
| `organizations` | `Organization` | — |
| `party_identifiers` | `Identifier` (0..* em qualquer parte) | `system` NULL até confirmar; `kind`→tipo; `use`→Identifier.use |

## 5. Evidências (validação isolada — todos ✅)
Ambiente: PostgreSQL 16 efêmero, dados sintéticos, `auth.uid()` stub (o schema `auth` existe no Supabase real).
| Seção | Verificação | Resultado |
|---|---|---|
| A | 4 tabelas; RLS habilitada; **4 policies/tabela**; **3 FKs**; `chk_one_party` | ✅ |
| B | patient/practitioner/organization + **CPF/CNS/CRM/CNES** sintéticos; **`system` NULL** (não inventado); identidade local preservada | ✅ |
| C1/C2 | `chk_one_party` barra identificador **órfão** e de **proprietário duplo** | ✅ |
| D | **Cascade** patient→identifiers (integridade referencial) | ✅ |
| E | **RLS dois sentidos**: A vê só os próprios; B não vê os de A | ✅ |
| — | **Idempotência**: 2ª aplicação sem erro (10 objetos `already exists`) | ✅ |
| — | **Rollback**: 139 removida por completo (tabelas + tipos) | ✅ |

Resultado da suíte: `VALIDATION_139_OK`.

## 6. Divergências / decisões técnicas derivadas (documentadas)
- **Dependência do schema `auth`:** as policies usam `auth.uid()` (padrão Supabase). Em teste isolado, exige-se o **stub `auth.uid()`** aplicado **antes** da migração (`docs/c2/harness_139.sql`). Não é alteração da migração — é requisito do harness. Descoberto e corrigido durante os testes.
- **Modelo de Identifier:** optou-se por **uma** tabela `party_identifiers` com **exclusive-arc** (FKs reais + `chk_one_party`) em vez de 3 tabelas por-entidade — preserva integridade referencial com menos superfície. Decisão técnica reversível, dentro do escopo.
- Nenhuma divergência semântica em relação ao modelo canônico/Protocolo.

## 7. Gaps / `[NC]`
- `[NC]` **URIs oficiais de `system`** (CPF/CNS/CNES/CNPJ/CRM em FHIR/BR-Core) — não confirmados por fonte oficial (proxy bloqueia hosts) → `system` NULL; a preencher quando confirmado.
- **Wiring** de `service_requests`/`exams` para estas entidades (FK dos atores) **não** feito aqui — é o próximo componente (aditivo), evita acoplar à 138 ainda não mesclada.
- Sem populamento de dados reais (backfill) — gate material.

## 8. Estado
Componente **concluído** em ambiente isolado. Aditivo/reversível; Ciclo 1 intocado. **Próximo componente** (determinado pela matriz): **wiring dos atores** — adicionar FKs nullable de `service_requests` (`subject_patient_id`/`requester_practitioner_id`/`performer_organization_id`) para as entidades da 139, mantendo os campos interinos como fallback; aditivo/reversível, isolado. Prossigo sob o regime autônomo (sem produção/backfill/RNDS).
