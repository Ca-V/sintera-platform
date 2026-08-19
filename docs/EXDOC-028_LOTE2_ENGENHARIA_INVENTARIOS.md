# EXDOC-028 — Lote Autônomo 2 “Engenharia + Inventários”: mini-specs + implementação + evidências

> **Autorização:** Lote Autônomo 2 aprovado. **Escopo exclusivo:** SEC-006 (rollout em rotas **não-clínicas**),
> SEC-014 (invariantes internas), SEC-016 (triagem SCA), SEC-003 (inventário read-only), SEC-023 (registro de
> subprocessadores). **Regime:** só código/testes/CI/docs. **Não tocou:** produção, dados clínicos reais, backfill,
> IAM, RLS de produção, rede/egress, KMS, secrets, infra cloud, RNDS/OpenCare, Ciclo 1, **SEC-009**, **SEC-011**,
> nenhum gate material. **Baseline:** `feat/fase-c-sql-source @ 1e77c79`. **Entrega:** PR **draft** → sua revisão.
> **Data:** 2026-08-19. **Sem merge.** Nenhum controle promovido a 🟢 VERDE.

## 0. Evidência global
| Verificação | Resultado |
|---|---|
| Testes novos do lote (SEC-006 rollout + SEC-014) | **19/19 passed** |
| `tests/security/` (total) | **37 passed** (24 do S0-A + 13 do rollout) |
| Suíte completa (regressão) | ver §7 (executada verde) |
| Typecheck / lint (arquivos do lote) | 0 / 0 |

---

## 1. SEC-006 · Rollout da validação (rotas NÃO-clínicas)
**Mini-spec** — *Objetivo:* padronizar via helper a checagem de campos obrigatórios em rotas não-clínicas, sem alterar
contrato. *Escopo:* `events`, `feedback` migrados byte-idênticos; `waitlist`, `novelty/seen` **não** migrados
(validação idiossincrática) mas **pinados** por teste. *Arquivos:* `src/lib/api/validate.ts` (+`requirePresent`),
`src/app/api/events/route.ts`, `src/app/api/feedback/route.ts`, `tests/security/FUNC-SEC006-rollout.test.ts`.
*Risco:* baixo (migração equivalente, coberta). *Rollback:* reverter as 2 rotas + remover `requirePresent`/teste.
- **Implementação:** novo primitivo puro `requirePresent` (semântica *legacy* `!valor`, sem trim — preserva
  `if (!campo)`); `events` e `feedback` usam o helper mantendo **mensagens e status idênticos**.
- **Não migradas (documentado):** `waitlist` (regex de e-mail + `name.length<2`) e `novelty/seen` (parse + allowlist
  `isKnownStream`) — comportamento **pinado** por testes de regressão; migração fica para lote futuro (sem ganho sem
  mudar contrato).
- **Testes (13):** por rota — 401 sem sessão · 400 com mensagem exata · 200 no caminho válido.
- **Limitações/residual:** **rate limit distribuído** (infra) e rollout às rotas **clínicas** = fora de escopo.
- **Estado:** 🟡 (permanece — não VERDE).

## 2. SEC-014 · Validação de invariantes internas (FHIR)
**Mini-spec** — *Objetivo:* rejeitar bundle canônico que viole invariantes **já definidas**. *Escopo:* aditivo, sem
alterar `validateStructural` nem o projetor; **sem** perfis oficiais/BR-Core/terminologias novas; sem emissão externa.
*Arquivos:* `src/lib/fhir/canonical/validate.ts` (aditivo), `tests/fhir/FUNC-SEC014-invariants.test.ts`. *Risco:*
baixo (sintético, isolado). *Rollback:* remover funções aditivas + teste.
- **Implementação:** `hasHonestIdentifiers` ([NC]: todo `identifier` com `system`+`value`), `invariantViolations`
  (lista acionável) e `validateInvariants` (gate `ok/violations`) — consolidando invariantes **já declaradas**
  (refs resolvidas, ids de report únicos, RNDS desacoplado, coding honesto) + identificador honesto.
- **O que valida:** invariantes internas do grafo canônico. **O que permanece fora (explícito):** validação de
  **perfis oficiais FHIR R4/BR-Core**, cardinalidades normativas, terminologias — **gate próprio** (não inventado aqui).
- **Testes (6):** cada violação → rejeição; bundle íntegro → ok.
- **Estado:** 🟡 (estrutural/invariantes; perfis oficiais seguem E0).

## 3. SEC-016 · Triagem SAST/SCA/Secrets
**Mini-spec** — *Objetivo:* classificar os 26 findings e registrar baseline/exceções, **mantendo o CI informativo**.
*Escopo:* documentação/análise; **sem** mudança de CI, **sem** upgrade de dependência, **sem** ferramenta nova.
*Arquivos:* `docs/SEC-016_TRIAGEM_SCA.md`. *Risco:* nulo. *Rollback:* remover doc.
- **Resultado:** 0 críticos · 15 high · 11 moderate; diretos = `expo`, `next`, `expo-dev-client`. Maioria é cadeia
  **Expo/Metro** (tooling mobile dev-time). Web/runtime a acompanhar: `next`, `sharp`, `undici`, `nanoid`, etc.
- **Exceções (baseline):** cadeia Expo aceita como débito de tooling (fix = upgrade major `expo`, lote mobile próprio);
  bumps de `next`/`expo` = **material**, fora de escopo. **CI permanece informativo.**
- **Estado:** 🟡 (detecção + triagem; tornar bloqueante e upgrades = material).

## 4. SEC-003 · Inventário de privilégio (READ-ONLY)
**Mini-spec** — *Objetivo:* mapear privilégio permanente para habilitar (não executar) o gate S1. *Escopo:* read-only;
**nenhuma** alteração. *Arquivos:* `docs/SEC-003_INVENTARIO_PRIVILEGIO.md`. *Risco:* nulo. *Rollback:* remover doc.
- **Resultado:** mapeados `service_role` (fábrica `adminClient()` + inline em 5 rotas), `ADMIN_SECRET`,
  `CONNECTOR_WEBHOOK_SECRET`, fallback `SUPABASE_SECRET_KEY`; rotas/consumidores; onde há **privilégio permanente**;
  alvo de remediação **em princípio** (RPC `SECURITY DEFINER`, tokens curtos, remover fallback, PAM/JIT) — **material S1**.
- **Estado:** 🔴 (controle) — inventário produzido **habilita** a decisão de gate; remediação **não** executada.

## 5. SEC-023 · Registro de subprocessadores
**Mini-spec** — *Objetivo:* registro inicial separando fato técnico de contrato não verificado. *Escopo:* doc.
*Arquivos:* `docs/SEC-023_SUBPROCESSADORES.md`. *Risco:* nulo. *Rollback:* remover doc.
- **Resultado:** verificáveis por código — **Supabase**, **Anthropic**, **Resend**; **Vercel** = inferido pelo ambiente
  (não confirmado por artefato). DPA/localização/finalidade/retenção **não assumidos** → **pendentes (DPO/Jurídico)**.
- **Estado:** 🔴 (P1) — registro inicial; due diligence formal = S3.

---

## 6. Conformidade de escopo (o que NÃO foi tocado)
Produção · dados reais · backfill · IAM · RLS de produção · rede/egress · KMS · secrets · infra cloud · RNDS/OpenCare ·
Ciclo 1 · **SEC-009** · **SEC-011** · qualquer gate material. Rotas **clínicas** intocadas. Migração apenas em 2 rotas
**não-clínicas**, byte-idêntica. Nenhum upgrade de dependência; CI inalterado.

## 7. Regressão e evidência (preencher no run)
- `tests/security/` → 37 passed · `tests/fhir/` (inclui SEC-014) → verde · suíte completa → ver seção de execução.
- `npm run typecheck` → 0 · eslint (arquivos do lote) → 0.

## 8. Dependências/gaps registrados (NÃO executados — exigem seu gate)
- SEC-006: rate limit distribuído (infra); rollout clínico.
- SEC-014: perfis oficiais FHIR/BR-Core (gate próprio).
- SEC-016: tornar CI bloqueante; upgrades `next`/`expo` (material); lote mobile.
- SEC-003: remediação PAM/JIT/RPC/rotação (S1, IAM/secrets).
- SEC-023: DPA/DD formal, localização, finalidade (S3, DPO/Jurídico).

## 9. Estado
Lote 2 implementado (código/testes/CI-doc/docs), validado e evidenciado. **Sem merge.** Nenhum controle 🟢 VERDE.
Aguarda sua revisão. Nada será mergeado nem nenhum gate material será aberto sem sua autorização.
