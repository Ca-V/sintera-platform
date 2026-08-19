# EXDOC-006 — C-2: Especificação técnica da 1ª migração aditiva (modelo de Solicitação · `ServiceRequest`)

> **Passo C-2 — ESPECIFICAÇÃO TÉCNICA READ-ONLY.** Proposta de DDL. **NÃO** executa migração, **NÃO** altera
> schema/banco/código/UI/wiring/infra, **NÃO** faz merge. Objetivo: especificar a **primeira migração aditiva e
> reversível** que fecha a pré-condição P0 do EXDOC-005 §9 — a **solicitação de 1ª classe** alinhada a `ServiceRequest`
> e o **vínculo pedido→resultado com proveniência**.
> **Fontes governantes (nesta ordem):** Protocolo SINTERA v1.0 → `SINTERA-FHIR-CANONICAL-MODEL.md` → `INTEROPERABILITY-COMPLIANCE-MATRIX.md` → documentação oficial FHIR/BR-Core/RNDS (distinguindo confirmado × hipótese × `[NC]`).
> **Data:** 2026-08-19 · **Gate C-2 (revisão da spec): FECHADO** — implementação só após aprovação explícita.

## 1. Modelo conceitual
```
Requisição (pedido autorizado)  ──1:N──►  ServiceRequest (1 por procedimento / por lado)
        (requisition_id)                         │  code(system/code/display+text), bodySite, laterality,
        origem: documento do pedido              │  subject, requester, performer, authoredOn, status, intent
        (exams.document_type='medical_order')    │
                                                  ├──basedOn──►  Resultado (DiagnosticReport)  ──result──►  Observation
                                                  │              (exams-resultado)               (biomarkers/clinical_results)
                                                  └──(futuro)──►  Procedure (execução)  ·  DocumentReference (documento)
```
- **Requisição** = o pedido como autorizado (um documento) → agrupa **N `ServiceRequest`** por `requisition_id` (FHIR `ServiceRequest.requisition`). O **bilateral** aprovado (§4.1 do modelo canônico) = **dois `ServiceRequest`** (esquerdo/direito) com o **mesmo `requisition_id`**.
- **`ServiceRequest`** = solicitação de **um** procedimento (grão por procedimento/lado). É a **entidade de 1ª classe** — não mais apenas a linha `medical_order` em `exams`, que permanece como o **documento de origem** (preserva o Ciclo 1).
- **Vínculo** resultado→solicitação por **`basedOn`**, **por procedimento/lado**, com **proveniência obrigatória** (sem vínculo silencioso).
- **Separação semântica inequívoca:** solicitação → `ServiceRequest`; execução → `Procedure` (diferido); resultado/laudo → `DiagnosticReport`/`Observation`; documento original → `DocumentReference` (via `exam_documents`, #117).

## 2. Entidades/tabelas propostas
1. **`service_requests`** — a solicitação de 1ª classe (1 linha por procedimento/lado).
2. **`service_request_results`** — vínculo `ServiceRequest ↔ resultado` (basedOn) com proveniência obrigatória.
2 tipos enum de apoio: `service_request_status`, `service_request_intent`, `order_link_method`.
> **`requisition`** é modelado como **coluna `requisition_id uuid` compartilhada** (não uma tabela) nesta 1ª migração; uma tabela `requisitions` para metadados de grupo é **refinamento opcional diferido**.

## 3. Relacionamentos e cardinalidades
| Relação | Cardinalidade | Observação |
|---|---|---|
| Requisição (`requisition_id`) → `service_requests` | **1 : N** | N procedimentos/lados por pedido |
| `exams`(pedido, `medical_order`) → `service_requests` (`source_exam_id`) | **1 : N** | documento de origem; `on delete set null` |
| `service_requests` → `service_request_results` | **1 : N** | resultados parciais por procedimento |
| `exams`(resultado) → `service_request_results` (`result_exam_id`) | **1 : N** | um resultado pode cumprir mais de uma solicitação |
| `service_requests` ↔ `exams`(resultado) | **N : N** (via tabela de vínculo) | resolve pedido↔resultado por lado |

## 4. DDL PROPOSTA (NÃO EXECUTAR — aditiva, idempotente, reversível; não muta linhas existentes)
```sql
-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PROPOSTA — não aplicar. Alinhada a FHIR R4 ServiceRequest / DiagnosticReport. │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Enums (subconjuntos alinhados aos ValueSets FHIR request-status / request-intent).
-- [NC-perfil]: o subconjunto EXATO exigido por BR-Core/RNDS não está confirmado — usar superset FHIR.
do $$ begin
  if not exists (select 1 from pg_type where typname='service_request_status') then
    create type service_request_status as enum
      ('draft','active','on-hold','revoked','completed','entered-in-error','unknown');
  end if;
  if not exists (select 1 from pg_type where typname='service_request_intent') then
    create type service_request_intent as enum
      ('proposal','plan','order','original-order','reflex-order','filler-order','instance-order');
  end if;
  if not exists (select 1 from pg_type where typname='order_link_method') then
    create type order_link_method as enum
      ('user_confirmed','auto_suggested','imported','legacy_migration');
  end if;
end $$;

-- 1) SOLICITAÇÃO DE 1ª CLASSE (FHIR ServiceRequest). 1 linha = 1 procedimento/lado.
create table if not exists public.service_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  -- FHIR ServiceRequest.requisition — identificador COMUM dos lados/procedimentos do mesmo pedido
  requisition_id    uuid not null,
  -- documento de origem (o "pedido" físico) → projeta p/ DocumentReference; mantém Ciclo 1 (exams medical_order)
  source_exam_id    uuid references public.exams(id) on delete set null,
  -- FHIR ServiceRequest.status / intent
  status            service_request_status not null default 'active',
  intent            service_request_intent not null default 'order',
  -- FHIR ServiceRequest.code (CodeableConcept): coding(system/code/display, version) + text (SEMPRE preservado)
  code_text         text not null,                 -- representação textual original — nunca nula
  code_system       text,                          -- ex.: http://loinc.org — NULL até curadoria (NÃO inventar)
  code_value        text,                          -- code no sistema — NULL até curadoria
  code_display      text,                          -- display oficial — NULL até curadoria
  code_version      text,                          -- versão da terminologia
  -- FHIR ServiceRequest.bodySite (CodeableConcept) + lateralidade
  body_site_text    text,
  body_site_system  text,                          -- ex.: SNOMED CT — NULL até confirmação [NC-artefato]
  body_site_code    text,
  laterality        text check (laterality is null or laterality in ('esquerdo','direito','bilateral','nao_aplicavel')),
  -- atores (interim texto; FKs estruturadas entram na migração de IDENTIDADE — P1, fora daqui)
  subject_user_id   uuid not null,                 -- interim = dono; futuro Patient
  requester_text    text,                          -- futuro Practitioner
  performer_text    text,                          -- futuro Organization/Practitioner
  -- FHIR ServiceRequest.authoredOn / reason
  authored_on       date,
  reason_text       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_service_requests_requisition  on public.service_requests(requisition_id);
create index if not exists idx_service_requests_source_exam  on public.service_requests(source_exam_id);
create index if not exists idx_service_requests_user         on public.service_requests(user_id);

alter table public.service_requests enable row level security;
drop policy if exists service_requests_select on public.service_requests;
create policy service_requests_select on public.service_requests for select using (auth.uid() = user_id);
drop policy if exists service_requests_insert on public.service_requests;
create policy service_requests_insert on public.service_requests for insert with check (auth.uid() = user_id);
drop policy if exists service_requests_update on public.service_requests;
create policy service_requests_update on public.service_requests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists service_requests_delete on public.service_requests;
create policy service_requests_delete on public.service_requests for delete using (auth.uid() = user_id);

-- 2) VÍNCULO ServiceRequest → resultado (FHIR DiagnosticReport.basedOn), por procedimento/lado, COM PROVENIÊNCIA.
create table if not exists public.service_request_results (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null,
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  result_exam_id     uuid references public.exams(id) on delete cascade,   -- nullable = parcial/pendente
  -- PROVENIÊNCIA OBRIGATÓRIA (Protocolo §6) — sem vínculo silencioso
  linked_by          uuid not null,                    -- quem confirmou/criou
  linked_at          timestamptz not null default now(),
  link_method        order_link_method not null,       -- origem/método do vínculo
  match_confidence   numeric check (match_confidence is null or (match_confidence >= 0 and match_confidence <= 1)),
  confirmed          boolean not null default false,   -- auto_suggested só vira efetivo com confirmação da usuária
  evidence           text,                             -- sinais usados (paciente/código/lateralidade/data/estab.)
  created_at         timestamptz not null default now(),
  unique (service_request_id, result_exam_id)          -- não duplicar o mesmo par
);
-- Invariante anti-vínculo-silencioso: sugestão automática nasce NÃO confirmada.
alter table public.service_request_results
  add constraint chk_no_silent_autolink
  check (not (link_method = 'auto_suggested' and confirmed = true and linked_by is null));
create index if not exists idx_srr_service_request on public.service_request_results(service_request_id);
create index if not exists idx_srr_result_exam     on public.service_request_results(result_exam_id);

alter table public.service_request_results enable row level security;
drop policy if exists srr_select on public.service_request_results;
create policy srr_select on public.service_request_results for select using (auth.uid() = user_id);
drop policy if exists srr_insert on public.service_request_results;
create policy srr_insert on public.service_request_results for insert with check (auth.uid() = user_id);
drop policy if exists srr_update on public.service_request_results;
create policy srr_update on public.service_request_results for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists srr_delete on public.service_request_results;
create policy srr_delete on public.service_request_results for delete using (auth.uid() = user_id);
```

## 5. FKs e constraints (resumo)
- `service_requests.source_exam_id → exams(id) on delete set null` (documento pode sumir sem apagar a solicitação).
- `service_request_results.service_request_id → service_requests(id) on delete cascade`.
- `service_request_results.result_exam_id → exams(id) on delete cascade`, **nullable** (resultados parciais/pendentes).
- `unique(service_request_id, result_exam_id)` — sem vínculo duplicado.
- CHECKs: `laterality` ∈ conjunto; `match_confidence` ∈ [0,1]; `chk_no_silent_autolink` (proveniência obrigatória).
- **`linked_by` NOT NULL** + **`link_method` NOT NULL** ⇒ **nenhum vínculo sem origem/autor** (regra §6).
- **Não** se adiciona CHECK/enum a `exams.document_type`/`order_status` nesta migração (colunas com dados legados; retrofit exige auditoria de dados — diferido).

## 6. Estratégia de migração / backfill (SEPARADA e GATED — não nesta DDL)
DDL puramente estrutural (não muta linhas). O **backfill** é passo à parte, aplicado só após validação em preview:
1. **Solicitações a partir de pedidos existentes:** para cada `exams` com `document_type='medical_order'`, gerar `requisition_id` (novo uuid por pedido) e **uma `service_requests` por procedimento distinto** derivado dos `biomarkers` do pedido (via a regra já existente de agrupamento/lateralidade): `code_text` = procedimento (sem coding), `laterality` do agrupamento (esquerdo/direito/bilateral), `source_exam_id` = o exame-pedido, `status` mapeado de `order_status` (pendente→`active`; realizado/finalizado→`completed`). **Coding fica NULL** (não inventar).
2. **Vínculos a partir de `fulfills_order_id` legado:** para cada `exams`-resultado com `fulfills_order_id`, inserir `service_request_results` ligando ao(s) `service_requests` daquele pedido com `link_method='legacy_migration'`, `confirmed=false`, `evidence='fulfills_order_id legado (grão de pedido, requer revisão por lado)'`. **Não** inferir lado silenciosamente — legado entra como **sugestão a revisar**.
3. Idempotência do backfill por chave natural (source_exam_id + code_text normalizado + laterality).

## 7. Estratégia de rollback
Puramente estrutural e reversível:
```sql
drop table if exists public.service_request_results;
drop table if exists public.service_requests;
drop type  if exists order_link_method;
drop type  if exists service_request_status;
drop type  if exists service_request_intent;
```
Nenhuma coluna de tabela existente é alterada ⇒ rollback **não** perde dados pré-existentes. Se o backfill tiver rodado, os registros novos são removidos junto com as tabelas (não tocam `exams`/`biomarkers`).

## 8. Impacto sobre os dados existentes
- **DDL:** **zero** — aditiva; não altera `exams`, `biomarkers`, `clinical_results`, `exam_documents` nem linhas.
- **Backfill (gated):** insere **apenas** linhas novas em `service_requests`/`service_request_results`; **não** muta linhas existentes; `fulfills_order_id` legado é **preservado** (fonte do backfill).
- **Ciclo 1:** **intocado** — a UI/rotas/nomenclatura continuam lendo `exams` como hoje; `service_requests` é estrutura de suporte **não** ligada à interface nesta migração. O display consolidado "Pedido de … — bilateral" **permanece** (display ≠ semântica).

## 9. Mapeamento para FHIR R4
| Coluna proposta | FHIR R4 | Nota |
|---|---|---|
| `service_requests.id` | `ServiceRequest.id` | id local |
| `requisition_id` | `ServiceRequest.requisition` (Identifier) | agrupa lados/procedimentos |
| `status` / `intent` | `ServiceRequest.status` / `.intent` | ValueSet exato BR-Core `[NC-perfil]` |
| `code_text`+`code_system`/`code_value`/`code_display`/`code_version` | `ServiceRequest.code` (CodeableConcept: `text` + `coding`) | coding NULL até curadoria |
| `body_site_*`/`laterality` | `ServiceRequest.bodySite` (CodeableConcept) | SNOMED CT `[NC-artefato]` |
| `subject_user_id` | `ServiceRequest.subject` → `Patient` | interim; Patient estruturado P1 |
| `requester_text`/`performer_text` | `.requester`/`.performer` | interim; Practitioner/Organization P1 |
| `authored_on` | `ServiceRequest.authoredOn` | |
| `source_exam_id` | documento → `DocumentReference` (`supportingInfo`) | via `exam_documents` (#117) |
| `service_request_results` | `DiagnosticReport.basedOn → ServiceRequest` | vínculo por procedimento/lado |
| `result_exam_id` | `DiagnosticReport` (evento-resultado) | `Observation` via `biomarkers`/`clinical_results` |

## 10. Riscos e pontos `[NC]`
- **`[NC-perfil]`** subconjunto exato de `status`/`intent` exigido por BR-Core/RNDS — usa-se o superset FHIR; a restringir contra o StructureDefinition vigente.
- **`[NC-artefato]`** ValueSet/coding de `code` (LOINC/GAL) e `bodySite` (SNOMED CT) — **não inventar**; colunas nascem NULL, `code_text` sempre preservado.
- **`[NC]`** perfil/fluxo federal RNDS para imagem/Doppler e para pedido — não pressuposto; modelo é FHIR-first, independe da RNDS.
- **Risco de duplicidade semântica** pedido-como-`exams` × `service_requests`: mitigado por `source_exam_id` (origem única) e por não ligar a UI agora.
- **Risco de backfill** derivar procedimento de texto livre: mitigado marcando coding NULL e vínculos legados como **sugestão a revisar** (não confirmados).
- **Dependência:** independe de #117 (referencia `exams`); complementar. A tabela `requisitions` (metadados de grupo) e `Procedure`/identidade/terminologia ficam para migrações seguintes.

## 11. Critérios de aceite
- Um `medical_order` pode ser projetado para **≥1 `ServiceRequest`** **sem depender do nome do arquivo**.
- Pedido **bilateral** → **2 `service_requests`** com o **mesmo `requisition_id`** e `laterality` distinta.
- **Nenhum vínculo** existe sem `linked_by`+`linked_at`+`link_method` (NOT NULL); `auto_suggested` nasce **não confirmado**.
- **Resultados parciais** representáveis (`result_exam_id` nullable; vínculo por `service_request`).
- `code_text` sempre preservado; `code_system`/`code_value` **NULL** quando não houver código válido (nada inventado).
- Migração **aditiva** e **reversível** (rollback restaura o schema anterior; sem perda de dados existentes).
- **Baseline do Ciclo 1 inalterado** (navegação/nomenclatura/comportamento homologado).
- Separação semântica preservada: solicitação (`ServiceRequest`) × resultado (`DiagnosticReport`/`Observation`) × documento (`DocumentReference`); `Procedure` **não** confundido (diferido, não bloqueado).

## 12. Recomendação — o que ENTRA e o que NÃO entra nesta 1ª migração
**ENTRA (P0, aditivo/reversível):**
- `service_requests` (+ enums `service_request_status`/`intent`) com `requisition_id`, `code` (coding+text), `bodySite`/`laterality`, atores interinos, `status`/`intent`, `source_exam_id`; RLS; índices.
- `service_request_results` (+ enum `order_link_method`) com **proveniência obrigatória** e invariante anti-vínculo-silencioso; RLS; índices.

**NÃO ENTRA (diferido — próximas migrações/gates):**
- Entidades `Patient`/`Practitioner`/`Organization` + identificadores nacionais (P1) — atores ficam interinos.
- `Procedure` (P2).
- Camada de terminologia populada / curadoria LOINC/SNOMED/UCUM (P1).
- Retrofit de enum em `exams.document_type`/`order_status` (exige auditoria de dados legados).
- Ajustes menores de #117 (`content_type`, papel 'solicitacao', `issuer`→`Organization`) — migração pequena à parte.
- **Backfill** (passo gated separado, pós-preview) e **qualquer wiring de app/UI**.
- Tabela `requisitions` de metadados de grupo (refinamento opcional).

**Ordenação sugerida:** esta migração é **independente** da #117; podem entrar em qualquer ordem. Recomenda-se: (1) esta (solicitação+vínculo) → (2) ajustes menores da #117 → (3) identidade/terminologia → (4) Procedure. Sempre **spec → aprovação → implementação → testes → validação → próximo gate**.

## 13. Próximo gate
**Gate C-2 FECHADO.** Esta é **especificação**, não implementação. Só após sua **aprovação explícita** desta spec é que se implementa a migração (com testes de reversibilidade em Postgres isolado antes de qualquer preview), sob a **regra de mudança (Protocolo §17)** e sem tocar o baseline homologado do Ciclo 1.
