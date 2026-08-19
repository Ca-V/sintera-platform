# EXDOC-020 — Pré-preview da camada FHIR: consolidação read-only (antes de qualquer dado real)

> **READ-ONLY.** Consolida o que a projeção FHIR produz hoje, o que permanece `[NC]`/interino, e o que o **preview
> com dados reais** exigiria. **NÃO** acessa dados reais, **NÃO** aplica Fase 0 em preview, **NÃO** toca produção/RNDS.
> **Fontes governantes:** Protocolo v1.0 → modelo canônico → matriz. **Data:** 2026-08-19.

## 0. Correção de precisão (duas implementações distintas)
| Camada | Onde | Base de dados | Vínculo pedido→resultado | Estado |
|---|---|---|---|---|
| **#119 (predecessor)** | branch `feat/fhir-projector` (draft, **não mesclado**) | fixture da Fase 0 | `fulfills_order_id` (legado) | congelado; **superado** |
| **Fase C canônico (#147)** | `src/lib/fhir/canonical/` (draft) | schema mesclado **137→143** | **`service_request_results` (canônico)** | **atual** |
> Este documento consolida a **projeção CANÔNICA (#147)** como a vigente. Itens que existiam no #119 mas **ainda não** foram portados ao canônico estão marcados **[a portar]**. Não tratar a suíte do #119 como evidência da projeção canônica.

## 1. O que a projeção canônica (#147) projeta hoje
Função pura `projectCanonicalToFhir(input) → Bundle(collection)`. A partir do schema 137→143:
- `patients`→**Patient**, `practitioners`→**Practitioner**, `organizations`→**Organization**
- `service_requests`→**ServiceRequest** (com `requisition` agrupando o bilateral)
- `resultEvents`(exames-resultado)→**DiagnosticReport**; `biomarkers`/`clinical_results`→**Observation**
- `procedures`→**Procedure**; `exam_documents`→**DocumentReference**

## 2. Recursos FHIR efetivamente produzidos
| Recurso | Produzido? | Observação |
|---|---|---|
| `Patient` | ✅ | id local + identificador oficial **só se `system`** |
| `Practitioner` | ✅ | idem |
| `Organization` | ✅ | idem |
| `ServiceRequest` | ✅ | `requisition` (bilateral), `code` (text; coding só se real), `bodySite`/laterality, subject/requester/performer |
| `DiagnosticReport` | ✅ | `basedOn` **só** de vínculos confirmados; `result`→Observation |
| `Observation` | ✅ | `derivedFrom`→DocumentReference (via `exam_document_id`) |
| `Procedure` | ✅ | `basedOn`→ServiceRequest; `report`→DiagnosticReport |
| `DocumentReference` | ✅ | url/hash/type/date; `context.related`→DiagnosticReport |
| **`Provenance`** | ❌ **[a portar]** | existia no #119 (por documento); **não** emitido pelo canônico ainda |
| status preliminar/final (preserv.) | ❌ **[a portar]** | mapeamento `document_role`→`DiagnosticReport.status` do #119 não portado |
| `Consent`/`AuditEvent` → FHIR | ❌ | tabelas existem (142); projeção FHIR **não** implementada (fora do escopo atual) |

## 3. Campos `[NC]` / NULL / interinos / dependentes de curadoria
- **Coding clínico** (`ServiceRequest.code`, `Observation.code`, `bodySite`): `coding` **omitido** até haver `system`+`code` reais → **`[NC]`/curadoria** (terminologia). Só `text` hoje.
- **Terminologia (`terminology_bindings`, 141):** o projetor **ainda não** consome a tabela de bindings; coding vem só do input direto → **[a portar]** (ligar bindings confirmados ao coding).
- **Identificadores oficiais** (CPF/CNS/CNES/CRM): `party_identifiers.system` NULL → **omitidos**; só id local `urn:sintera:local` → **`[NC]`/curadoria**.
- **Atores interinos:** `requester_text`/`performer_text` são fallback textual; FKs estruturadas (140) preferidas quando presentes.
- **Datas:** só as presentes no schema; sem enriquecimento.

## 4. Referências: verificadas estruturalmente × contratuais
- **Verificadas estruturalmente** (`unresolvedReferences`): **todas** as `reference` do Bundle resolvem para recursos **presentes** no próprio Bundle (Patient/Practitioner/Organization/ServiceRequest/DiagnosticReport/Observation/Procedure/DocumentReference). Evidência sintética: **0 não resolvidas**.
- **Contratuais (não verificadas por validador de perfil):** conformidade a **perfis BR-Core/RNDS**, cardinalidades *must-support*, ValueSets — **fora** desta camada (`[NC]`, gate D). Não há, hoje, referência a recurso **externo** ao Bundle.

## 5. Dependência da Fase 0 / #117
- **`DocumentReference`** e **`Observation.derivedFrom`** dependem de **`exam_documents`/`exam_document_id`** (137/#117).
- **`ServiceRequest`/`basedOn`/`Procedure`/identidade** dependem de **138/139/140/143**.
- Todo o conjunto está **mesclado em preview-branch (`feat/mobile-inc4-perfil`)**, porém **não aplicado em banco** — a aplicação em preview é justamente o **gate C**.

## 6. Cobertura do Protocolo v1.0 / matriz (pelo projetor canônico)
**JÁ COBERTO (estrutural, sintético):**
- Pedido = `ServiceRequest`; resultado = `DiagnosticReport`/`Observation`; execução = `Procedure`; documento = `DocumentReference`.
- Vínculo canônico `basedOn` só de `service_request_results` confirmados (`fulfills_order_id` **não** usado).
- Bilateral (2 SR + `requisition` + basedOn por lado). Separação solicitação≠resultado≠execução≠documento.
- `[NC]` omitido, **nunca inventado**. Sem acoplamento RNDS.

**AINDA NÃO COBERTO:**
- `Provenance` por documento e status preliminar/final **[a portar]** do #119.
- Terminologia (LOINC/SNOMED/UCUM) — coding **não populado** (`[NC]`/curadoria).
- Identificadores oficiais (CPF/CNS/CNES/CRM) — `[NC]`/curadoria.
- `Consent`/`AuditEvent` como recursos FHIR.
- Perfis BR-Core/RNDS, Bundle-document/Composition, transporte — **gate D**.
- **Validação contra dados reais** — **gate C** (este documento).

## 7. O que o PREVIEW com dados reais acessaria e com qual finalidade
- **Finalidade (Nível C):** provar que o projetor/loader funciona quando alimentado pelo **modelo de dados real do SINTERA** (não só fixtures) — responder "o que foi construído funciona sobre os dados efetivamente existentes?".
- **Dados acessados (somente leitura):** colunas de projeção de `exams`, `biomarkers`, `clinical_results`, `exam_documents` (137), e as novas `service_requests`/`service_request_results`/identidade/`procedures` (que **nasceriam vazias** — sem backfill). Ou seja, o preview leria **dados reais legados** (exames/biomarcadores) + estruturas novas **vazias**.
- **Amostragem:** contas de teste/sintéticas ou consentidas; volume mínimo para cobertura de casos (lab, imagem, pedido, bilateral se houver).

## 8. Controles de segurança / RLS / auditoria / minimização (preview)
- **RLS:** `auth.uid()` ativo nas 11 entidades; leitura escopada ao dono.
- **Somente leitura:** nenhuma escrita/mutação/backfill; queries `select` das colunas **estritamente** necessárias à projeção (minimização).
- **Sem export/PII para fora:** nenhum bundle real sai do ambiente de preview; evidências agregadas/anonimizadas.
- **Auditoria:** registrar as leituras de preview (finalidade, escopo) — `audit_events` disponível.
- **Isolamento de ambiente:** preview separado de produção; certificados/segredos fora do app.

## 9. Critérios objetivos de aprovação/reprovação do PREVIEW (Nível C)
**APROVA se, sobre N amostras reais:**
1. Migrações 137→143 aplicam em preview **sem erro**.
2. Loader lê o modelo real **sem erro**; projeção produz Bundle com **`validateStructural.ok`** (0 referências não resolvidas; ids únicos; sem RNDS; coding honesto).
3. **Nenhum** coding/identificador inventado (mantém `[NC]` onde o dado real não traz código).
4. Separação canônica preservada; bilateral (se presente) agrupado por `requisition`.
5. **Zero** escrita/mutação; RLS isola por usuário; nenhuma violação.
**REPROVA se:** erro de migração/leitura; referência não resolvida; coding inventado; qualquer escrita/mutação; violação de RLS; divergência semântica vs. modelo canônico.

## 10. SEPARAÇÃO DE NÍVEIS DE EVIDÊNCIA (A/B/C/D) — não confundir
| Nível | Prova | Estado | Evidência |
|---|---|---|---|
| **A. Código × dados sintéticos** | correção interna do projetor/validador | ✅ **CONCLUÍDO** | Fase C #147: tsc 0, lint 0, 7/7; suíte 1288 |
| **B. Modelo FHIR (estrutural)** | invariantes internos do grafo (refs, 1 evento, sem RNDS, coding honesto) | ✅ **CONCLUÍDO (estrutural)** · ❌ perfil BR-Core/RNDS e FHIR validator oficial **não** feitos | `validateStructural` |
| **C. Dados reais em preview** | compatibilidade com o SINTERA real | ⛔ **NÃO AUTORIZADO** (gate) | — |
| **D. RNDS/OpenCare** | interoperabilidade externa | ⛔ **GATE POSTERIOR** | — |
> **A e B NÃO são evidência de C nem de D.** Testes sintéticos e validação estrutural **não** demonstram compatibilidade operacional com dados reais nem conformidade/transporte RNDS.

## 11. Trabalho read-only que posso fazer sem gate (preparação, sem dados reais)
- Portar `Provenance` e status preliminar/final do #119 ao projetor canônico (código puro + testes sintéticos).
- Ligar `terminology_bindings` confirmados ao `coding` (código puro + sintético).
- `read-model source` como **porta abstrata + fakes sintéticos** (sem banco real).
- Especificar o roteiro de execução do preview (script read-only), **sem executar**.

## 12. Gate
**Preview com dados reais / aplicação da Fase 0 em preview = GATE MATERIAL** — aguarda sua autorização explícita.
Permaneço **parado antes de qualquer acesso a dados reais**. Preparações read-only da §11 seguem sob o regime autônomo, se você desejar; caso contrário, aguardo.
