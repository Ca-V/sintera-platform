# EXDOC-030 — Pacote de Execução do Gate S0 (design executável; SEM mudança material)

> **Natureza:** transforma o `EXDOC-029` em plano **executável** de infraestrutura. **Nenhuma mudança material foi
> feita.** Sem IAM, MFA/RBAC, RLS de produção, rotação de secrets reais, KMS, rede/egress, banco, dados reais, backfill,
> RNDS/OpenCare, SEC-009, SEC-011, SEC-013, Ciclo 1. **Sem PR de implementação.** **Baseline estrutural congelado:**
> `feat/fase-c-sql-source @ d440b64` (o `2bf18cf` é só registro documental). Este doc vive na branch de planejamento.
> **Data:** 2026-08-19.
>
> **Ordem adotada (sua recomendação):** S0 = (1) separação real de ambientes → (2) Secrets/KMS → (3) Rede/egress →
> (4) evidência operacional → (5) fechamento S0. **Regra:** infraestrutura implementada **não** promove controle a
> 🟢 VERDE; promoção exige **evidência operacional (E4/E5)**.

---

## 0. Verificação read-only no provedor — “confirmar antes de afirmar”

| # | Afirmação a validar | Classificação | Evidência (read-only) |
|---|---|---|---|
| 1 | **Preview usa o banco de produção** | **HIPÓTESE A VALIDAR** (forte) | Supabase branching `MIGRATIONS_FAILED`/não-persistente; não há staging; **valores de env do Vercel não expostos via MCP** → precisa o owner conferir *Vercel → Settings → Environment Variables (Preview)* |
| 2 | **Existe isolamento de rede** | **NÃO COMPROVADO** | Nenhuma config de rede no repo; advisors não reportam restrição; host do DB é DNS público por padrão |
| 3 | **Onde os secrets são armazenados** | **NÃO VERIFICÁVEL via MCP** | Env do Vercel/Supabase (provedor); sem KMS/cofre evidenciado; valores não expostos |
| 4 | **Como ocorre a rotação hoje** | **NÃO COMPROVADO** | Nenhum mecanismo/rotação evidenciado |
| 5 | **O banco está publicamente acessível** | **HIPÓTESE A VALIDAR** | Supabase Postgres tem host público por padrão; **restrições de rede não verificáveis via advisors** → owner deve checar *Supabase → Database → Network Restrictions* |
| 6 | **Quais regras de egress existem no provedor** | **NÃO VERIFICÁVEL** | Vercel não expõe firewall de egress; default = allow-all |

**COMPROVADO (provedor, read-only):**
- **Ambientes:** 2 projetos Supabase — **PROD** `pxiglvrgxooawetboglb` (ACTIVE, us-east-2) e **`sintera-fhir-preview`** `xfrlbtchkerhavqregeq` (**INACTIVE/pausado**). **Sem staging persistente.**
- **Branching Supabase:** branch `main` `MIGRATIONS_FAILED`, `persistent:false` → **não funcional** (sem DB isolado por preview).
- **Auth:** *leaked-password protection* **DESABILITADA** (SEC-007).
- **Advisors PROD (SECURITY):** 2×ERROR `security_definer_view` (`current_biomarkers`, `current_catalog`); WARN — RPCs `SECURITY DEFINER` executáveis por `authenticated` (`canonical_route`, `replace_biomarkers`, `should_write_canonical`, `write_canonical_extraction`), `function_search_path_mutable`, `pg_net` em `public`; 3×INFO `rls_enabled_no_policy` (`account_deletion_log`, `ai_insights_archive`, `audit_purge_log`).
- **Vercel:** `ssoProtection: enabled (all_except_custom_domains)`; `passwordProtection: off`; `trustedIps: off`.

> **Achado relevante p/ SEC-003:** o padrão **RPC `SECURITY DEFINER` já existe** em produção (caminho canônico). Isso
> **favorece** a remediação-alvo (mover privilégio para RPC), mas os advisors mostram que essas RPCs estão **expostas ao
> `authenticated`** — a ser revisado em S1 (não agora).

### 0.1 Verificação final read-only (tentativa direta via MCP) — resultado

Executadas chamadas **read-only** para responder às duas perguntas pendentes. **Nenhuma alteração feita.**

| Pergunta | Tentativa (read-only) | Resultado | Classificação |
|---|---|---|---|
| **Preview aponta a PROD `pxiglvrgxooawetboglb` ou outro projeto?** | Vercel `get_project` + `get_project_deployment_protection` | As ferramentas MCP disponíveis **não expõem as variáveis de ambiente** (não há leitor de env; `get_project` retorna só metadados/domínios). Valor de `NEXT_PUBLIC_SUPABASE_URL` por ambiente **não obtido**. | **NÃO COMPROVADO** (permanece **HIPÓTESE**; sem inferência) |
| **Network Restrictions do DB PROD** | Supabase `get_project` (`pxiglvrgxooawetboglb`) | O MCP **não expõe Network Restrictions**. `get_project` retorna apenas `status=ACTIVE_HEALTHY` e `database.host=db.pxiglvrgxooawetboglb.supabase.co` (hostname público existe, mas isso **não prova** porta aberta a todos os IPs). | **NÃO COMPROVADO** (estado das restrições não obtido) |

**Como comprovar (manual, pelo owner — sem mudança):**
- **#1:** Vercel → Project `sintera-platform` → *Settings → Environment Variables* → filtrar **Preview**: ler o valor de `NEXT_PUBLIC_SUPABASE_URL` (e a referência de `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY`) e comparar com `pxiglvrgxooawetboglb`.
- **#2:** Supabase → Project SINTERA → *Database → Network Restrictions*: registrar se há allowlist de IPs ou se está aberto (`0.0.0.0/0`).

> **Sem inferência:** não afirmo que Preview usa o banco de produção nem que o banco está aberto. Ambos permanecem
> **não comprovados** pelas ferramentas read-only disponíveis; a confirmação exige leitura manual no painel (itens acima).

#### Resultado da verificação manual do owner (2026-08-19)
- **#1 — Vercel Preview env:** o owner confirmou no Dashboard que `NEXT_PUBLIC_SUPABASE_URL` está configurada
  **simultaneamente para Production e Preview** e marcada **Sensitive** → **o valor não é legível no Dashboard**.
  Portanto, **não é possível comprovar visualmente** se o Preview aponta a `pxiglvrgxooawetboglb`.
  - **Fato COMPROVADO (reportado):** existe **uma** configuração de `NEXT_PUBLIC_SUPABASE_URL` abrangendo Production+Preview, **Sensitive/ilegível**.
  - **Conclusão “Preview → DB de PROD”: NÃO COMPROVADA** (valor ilegível; **sem inferência**). *(A entrada única cobrindo ambos os ambientes é um indicador estrutural de valor compartilhado, mas — por decisão de rigor — não é tratada como comprovação.)*
  - **Única via de confirmação sem inferência (owner, opcional, sem mudança):** `vercel env pull --environment=preview` revela o valor localmente para o usuário autorizado. Não executável por este agente.
- **#2 — Network Restrictions:** permanece **NÃO COMPROVADO** (aguardando leitura em Supabase → Database → Network Restrictions).

**Leitura de risco (sem inferência sobre o valor):** a isolação Preview↔PROD **não pôde ser comprovada** e **não há
evidência de isolamento**. Para fins de decisão, “não comprovado” ≠ “seguro”: a ausência de prova de isolamento é
tratada como **risco em aberto** — o que **fortalece** a justificativa do C1 (STAGING isolado) como precaução, sem
depender de provar o valor do secret.

### Legenda de classificação de mudança
`READ-ONLY` · `CLOUD CHANGE` · `APPLICATION CHANGE` · `DATA CHANGE` · `SECURITY-SENSITIVE`.
Para cada mudança: **quem executa · quem aprova · pré-requisito · evidência esperada · rollback**.

---

## 1. S0 Architecture Plan

**Objetivo:** estabelecer a fundação (ambientes isolados, secrets gerenciados, rede deny-by-default) que habilita S1–S3
sem testar mudanças contra produção.

**Alvo arquitetural:**
- **3 ambientes** com isolamento real de dados/secrets: **DEV** (local) · **STAGING** (não-prod, dado sintético) · **PROD**.
- **Secrets** por ambiente em cofre/KMS gerenciado; 1 chave por ambiente (sem fallback).
- **Rede:** DB privado; egress **deny-by-default** + allowlist; segmentação app×dados×segurança.
- **Logging central** baseline (fonte para S3; **não** abre SEC-009).

**Sequência (sua ordem):** 1 ambientes → 2 secrets/KMS → 3 rede/egress → 4 evidência operacional → 5 fechamento.

**Classificação global:** este plano é `READ-ONLY`; a execução dos itens abaixo é `CLOUD CHANGE`/`SECURITY-SENSITIVE`
e **exige nova autorização material** (parar antes da 1ª mudança).

---

## 2. Cloud Implementation Plan (passo a passo — NÃO executar)

| Passo | Ação | Classe | Quem executa | Quem aprova | Pré-requisito | Evidência esperada | Rollback |
|---|---|---|---|---|---|---|---|
| C1 | Provisionar **STAGING** isolado (projeto Supabase próprio ou branch Pro funcional) | CLOUD CHANGE | Cloud/Plataforma | **Proprietária** (custo) | decisão de custo | projeto/branch ativo, ref distinto | despausar/descartar projeto |
| C2 | **Escopar env do Vercel** por ambiente (Preview→STAGING, Production→PROD) | CLOUD CHANGE / SECURITY-SENSITIVE | Cloud | **Proprietária** | C1 | env de Preview aponta a STAGING (print/config) | reverter env |
| C3 | **Cofre/KMS** + migrar 8 secrets por ambiente | SECURITY-SENSITIVE | Cloud | **Proprietária** | C1, C2 | secrets no cofre; app lê do cofre | manter env atual |
| C4 | **Remover fallback** `SUPABASE_SECRET_KEY` → 1 chave/ambiente | SECURITY-SENSITIVE / APPLICATION CHANGE | Cloud + App | **Proprietária** | C3 | código sem fallback; smoke test STAGING | reintroduzir fallback |
| C5 | **DB privado** + Network Restrictions (allowlist de origens) | CLOUD CHANGE / SECURITY-SENSITIVE | Cloud | **Proprietária** | C1 | teste: acesso externo negado | remover restrição |
| C6 | **Egress deny-by-default + allowlist** (hosts §5) | CLOUD CHANGE / SECURITY-SENSITIVE | Cloud | **Proprietária** | C5 | teste: saída não-allowlisted bloqueada | abrir egress |
| C7 | **Logging central** baseline | CLOUD CHANGE | Cloud | **Proprietária** | — | logs pesquisáveis | desligar coletor |

> Todos os passos são **material** → **parar** e obter autorização específica por passo. Nada aqui é executado agora.

---

## 3. Environment Isolation Matrix

| Recurso | DEV | STAGING (alvo) | PROD | Estado atual (comprovado) |
|---|---|---|---|---|
| **Banco** | local/efêmero | **projeto Supabase próprio** (sintético) | `pxiglvrgxooawetboglb` | **Só PROD ativo**; preview project pausado; branching falho |
| **Secrets** | `.env.local` | cofre/KMS **STAGING** | cofre/KMS **PROD** | env por projeto; **isolamento por ambiente não comprovado** |
| **Storage** | local | bucket STAGING | bucket PROD | um projeto → **provável storage único** (HIPÓTESE) |
| **Serviços externos** | mocks/sandbox | sandbox/keys STAGING | keys PROD | **mesmas keys/endpoints** para todos (sem sandbox) — HIPÓTESE forte |
| **Deploy** | local | Vercel Preview→STAGING | Vercel Production (main) | Preview existe (SSO); **destino de dados = HIPÓTESE A VALIDAR** |
| **Proteção acidental de prod** | n/a | env separada + guard | — | **inexistente hoje** (risco central) |

**Fluxo de promoção (alvo):** DEV → PR → **Preview(STAGING)** com dado sintético → merge `main` → **PROD**.
**Proteção contra uso acidental de prod (alvo):** env de Preview **nunca** com secrets de PROD; guard de boot que recusa
subir Preview apontando a `NEXT_PUBLIC_SUPABASE_URL` de produção.

---

## 4. Secrets / KMS Migration Plan

**Secrets a migrar (8):** `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`(eliminar como fallback),
`RESEND_API_KEY`, `ADMIN_SECRET`, `CONNECTOR_WEBHOOK_SECRET`, `WHATSAPP_CLOUD_TOKEN`, `WITHINGS_CLIENT_SECRET`.

| Item | Ação | Classe | Quem aprova | Evidência (E4/E5) | Rollback |
|---|---|---|---|---|---|
| Arquitetura de armazenamento | cofre/KMS gerenciado, segregado por ambiente | SECURITY-SENSITIVE | Proprietária | secrets no cofre; app lê do cofre | env atual |
| Segregação por ambiente | STAGING×PROD com valores distintos | SECURITY-SENSITIVE | Proprietária | matriz de secrets (sem valores) | — |
| Política de rotação | período + procedimento + owner | SECURITY-SENSITIVE | Proprietária | doc + 1ª rotação em STAGING | — |
| Eliminar `SUPABASE_SECRET_KEY` fallback | confirmar necessidade e remover | APPLICATION CHANGE | Proprietária | código sem fallback + smoke | reintroduzir |
| Validação da rotação | rotacionar em **STAGING** e provar app saudável | SECURITY-SENSITIVE | Proprietária | log de rotação + health | rollback chave |
| Leaked-password protection | **ligar** (hoje OFF — comprovado) | SECURITY-SENSITIVE | Proprietária | advisor sem o WARN | desligar |

> **Nenhuma rotação/substituição real** nesta etapa. A 1ª rotação ocorre **em STAGING**, com sua autorização específica.

---

## 5. Network / Egress Plan

**Egress necessário (allowlist-alvo, hosts comprovados no código):** Supabase (projeto), `api.anthropic.com`,
Resend, `graph.facebook.com` (WhatsApp), `wbsapi.withings.net`/`account.withings.com`, `connect.medlineplus.gov`,
`CONNECTOR_PUBLIC_BASE_URL`. *(Client-side redirects — Google/Outlook Calendar — não são egress de servidor.)*

| Item | Ação | Classe | Quem aprova | Evidência | Rollback |
|---|---|---|---|---|---|
| Arquitetura de rede | segmentação app×dados×segurança | CLOUD CHANGE | Proprietária + Cloud | diagrama + IaC (não aplicado) | — |
| Isolamento do banco | DB privado + Network Restrictions | SECURITY-SENSITIVE | Proprietária | teste acesso externo negado | remover restrição |
| Deny-by-default | egress bloqueado por padrão | SECURITY-SENSITIVE | Proprietária | teste saída não-allowlisted bloqueada | abrir egress |
| Allowlist | liberar só os hosts acima | CLOUD CHANGE | Proprietária | conectividade OK aos allowlisted | ajustar lista |
| Testes bloqueado/permitido | matriz de casos | READ-ONLY (design) → teste em STAGING | Cloud | resultados dos testes | — |

> **Nada de firewall/VPC/DNS/banco** é alterado agora.

---

## 6. SEC-003 Remediation Dependency Map

| Vetor | Alvo | Classe | Depende de S1? | Observação (advisor) |
|---|---|---|---|---|
| `service_role` (5 rotas + fábrica) | migrar p/ **RPC `SECURITY DEFINER`** de escopo mínimo; reduzir no caminho de leitura | APPLICATION CHANGE / SECURITY-SENSITIVE | **Sim** (papéis p/ autorizar RPC) | RPC DEFINER **já existe** em prod, mas **exposto ao `authenticated`** → revisar EXECUTE em S1 |
| `ADMIN_SECRET` | token curto/assinado ou OIDC pg_cron | SECURITY-SENSITIVE | parcial | precisa KMS (S0) |
| `CONNECTOR_WEBHOOK_SECRET` | HMAC nativo | APPLICATION CHANGE | não (decisão SEC-005) | — |
| Fallback `SECRET_KEY` | 1 chave/ambiente | APPLICATION CHANGE | não | ligado ao S0 (§4) |
| RLS × RPC | preferir RLS-scoped; DEFINER só cross-user com escopo interno | DATA CHANGE (policies) | **Sim** | não executar RLS de prod |

**Conclusão:** SEC-003 **não** é executável em S0. Pré-requisitos: **S0** (KMS) + **S1** (papéis). O advisor confirma que
há RPCs DEFINER a **revisar** (EXECUTE ao `authenticated`) — item de S1, **não** de S0.

---

## 7. Runbook de Implementação e Rollback (por passo — parar antes da 1ª mudança material)

Para **cada** passo C1–C7 (§2) e itens §4/§5:
1. **Pré-check (READ-ONLY):** validar estado atual (advisor/branch/env) e registrar baseline.
2. **Mudança em STAGING primeiro** (nunca PROD antes de STAGING validado).
3. **Evidência:** capturar prova (advisor limpo / teste de egress / health) — **E4** em STAGING.
4. **Promoção a PROD:** só após E4 em STAGING + sua autorização — gera **E5**.
5. **Rollback:** cada passo tem reversão (coluna “rollback”); manter o estado anterior recuperável antes de aplicar.
6. **Registro:** EXDOC de evidências por passo.

> Ordem de aplicação segue sua recomendação: ambientes → secrets → rede → evidência → fechamento.

---

## 8. Matriz de Evidências e Critérios de Aceite (E4/E5)

| Eixo | Critério de aceite | Nível | Como comprovar |
|---|---|---|---|
| Separação de ambientes | Preview/STAGING usa **DB/secrets próprios** (não PROD) | **E4** | env de Preview → STAGING; teste de escrita não toca PROD |
| Secrets/KMS | secrets no cofre; **rotação testada** em STAGING; fallback removido | **E4→E5** | log de rotação + health; advisor sem WARN de senha |
| Rede/egress | DB privado; **saída não-allowlisted bloqueada** | **E4→E5** | teste de bloqueio (negado) + allowlisted (OK) |
| Logging central | eventos pesquisáveis | **E4** | consulta a logs |
| Fechamento S0 | todos os acima com evidência + owner | **E5 (prod)** | pacote de evidências |

**Regra de promoção:** um controle S0 (SEC-007/008) só migra de 🟡/🔴 para 🟢 **VERDE** com **E5 em produção +
owner** — **não** por ter design/infra pronta. (Consistente com sua regra.)

---

## 9. Proposta de Gate S0 (entrada / saída / decisões)

- **Entrada:** baseline `d440b64` ✔ · inventários read-only (EXDOC-029) ✔ · verificação de provedor (este doc §0) ✔ ·
  **owner de Cloud atribuído** (pendente) · decisão da proprietária de separar ambientes (custo).
- **Saída (E4→E5):** STAGING isolado · secrets/KMS + rotação testada + fallback removido · DB privado + egress
  deny-by-default testado · logging central · evidências arquivadas.
- **Decisão da proprietária:** custo/arquitetura de STAGING; escopo de env Vercel; remover fallback; ligar
  leaked-password protection.
- **Depende de Cloud:** projeto STAGING; KMS; network restrictions; egress; logging.
- **Depende de DPO/Jurídico:** nada executável em S0 (classificação C0–C5 apenas informa segmentação).
- **Fora do S0:** SEC-001/002, SEC-003 remediação, SEC-005 HMAC, SEC-009, SEC-011, SEC-013, DAST/pentest, RNDS,
  dados reais/backfill, CI bloqueante, Ciclo 1.

---

## 10. Estado
Pacote de execução S0 **completo (design)**. **Nenhuma mudança material executada**; nenhuma rotação/rede/banco/IAM
tocada; sem PR de implementação. Verificações de provedor foram **read-only** (metadados/advisories; nenhum dado real
lido). **Parado antes da primeira mudança material**, aguardando sua autorização **passo a passo** (começando por C1 —
STAGING isolado) e a atribuição de um **owner de Cloud/Infra**. Nenhum controle promovido a 🟢 VERDE.
