# EXDOC-026 — GAP ASSESSMENT de Segurança (Fase 1 · diagnóstico, READ-ONLY)

> **Natureza deste documento.** Diagnóstico. **Nada foi implementado, alterado ou corrigido.** Nenhuma mudança em
> produção, IAM, RLS, firewall, rede, egress, KMS, secrets, banco, migrations, cloud ou RNDS. Coleta de evidência
> 100% read-only (inspeção de código, configuração, schema, CI e documentação do próprio repositório).
> **Data:** 2026-08-19. **Revisão:** v2 (reconciliação de integridade — placar, cobertura 25/25, SHA imutável de
> evidência, verificação de citações, gates S0–S3). **Escopo:** SEC-001…SEC-025 (Plano Mestre Arquitetural de
> Segurança v2.0) com referência cruzada a CLD-001…CLD-015 (Diretrizes de Cloud e Infraestrutura v1.0).
>
> **Regra de método (mantida com rigor):** *código existente ≠ controle operacional comprovado*; *"não encontrei
> evidência" ≠ "não existe"*. Quando um controle depende de infraestrutura fora do repositório, o estado reflete
> apenas a parte **positivamente demonstrável**; o restante é marcado **NÃO COMPROVADO / NÃO VERIFICÁVEL**, sem
> presumir inexistência no provedor. **VERDE só com** implementação + teste + resultado + evidência + owner.

---

## 0. Proveniência da evidência (SHA imutável)

```
Evidence tree (onde os agentes analisaram):
  branch      = feat/fase-c-sql-source
  commit/SHA  = 4c1716d1f83f1b4b6fdd1c8307a9efacaf39df8c   (short 4c1716d)
  committed   = 2026-08-19 18:35:56 +0000  (agentes rodaram 18:37Z, sobre esta árvore)

Assessment document (onde este EXDOC vive):
  branch      = claude/relaxed-curie-mag4pb   (PR #109)
  version     = v2 reconciliada (este commit)  · v1 = fb5615d

Provenance:
  a evidência foi coletada contra o SHA imutável 4c1716d;
  o assessment foi redigido contra essa árvore fixa.
```

Os caminhos `arquivo:linha` deste documento referem-se **exatamente** a `4c1716d`. **Verificação executada:** todos
os arquivos citados existem nesse SHA e as linhas-âncora foram conferidas (login, admin, rate-limiter, gateway,
exams ownership, runtime.server, reminders, webhook, admin/catalogo, ci.yml). **Uma correção** aplicada nesta v2:
SEC-011 citava `src/lib/ai/document-understanding.ts` (inexistente) → caminho real `src/lib/capture/document-understanding.ts`.

> **Nota de reprodutibilidade.** A branch de entrega `claude/relaxed-curie-mag4pb` é uma linha de feature paralela que
> **não contém** todos os arquivos citados (ex.: `.github/workflows/ci.yml`, `src/lib/fhir/canonical/validate.ts`, o
> webhook de connectors, `docs/OPS-002...`). Para auditar as evidências, use **`git checkout 4c1716d`** (a árvore de
> evidências), não a branch de entrega. Os gaps são arquiteturais e transversais à plataforma.

---

## 1. Legendas

### 1.1 Estado (semáforo do Plano Mestre)
| Cor | Significado |
|---|---|
| 🟢 **VERDE** | Implementado **+** testado **+** resultado **+** evidência **+** owner. (Nenhum controle atinge VERDE — resultado esperado num 1º assessment.) |
| 🟡 **AMARELO** | Implementado (código/config) mas **sem teste/evidência operacional suficiente** ou apenas parcial. |
| 🔵 **AZUL** | **Arquitetado/especificado**, não implementado (ou intencionalmente diferido para gate próprio). |
| 🔴 **VERMELHO** | **Ausente ou inadequado** — deficiência **positivamente demonstrada**. |
| ⚫ **PRETO** | Violação ativa criando risco crítico **com dado real exposto**. Reservado — hoje **não aplicável**, pois **não há dado clínico real em produção** (backfill não autorizado). Ver §6. |

### 1.2 Nível de evidência (separa código de comprovação operacional)
| Nível | Significado |
|---|---|
| **E0** | Inexistente (não há artefato). |
| **E1** | Especificado (existe só em documento/intenção arquitetural). |
| **E2** | Implementado em código/configuração (não testado como controle de segurança). |
| **E3** | Testado em ambiente isolado/sintético (Postgres isolado, preview descartável). |
| **E4** | Validado em ambiente representativo (schema real, stack real, não produção). |
| **E5** | Validado operacionalmente em **produção**. |

### 1.3 Comprovação (flag anti-falso-positivo)
| Flag | Significado |
|---|---|
| **COMPROVADO** | Evidência direta no material (código/config/teste). |
| **NÃO COMPROVADO** | Ausência positivamente demonstrada no material (ex.: nenhuma chamada MFA no código). |
| **NÃO VERIFICÁVEL** | Depende de infra fora do repositório (provedor/cloud) — **não se presume inexistência**. |

> **Nota crítica (aplica-se a quase tudo):** o que foi comprovado no **Preview sintético (EXDOC-025)** e no **adapter
> B+ (EXDOC-024)** é **E3** — ambiente isolado, dados sintéticos. **Produção permanece não comprovada.** "RLS efetiva
> sem service_role" é evidência **do preview**, **não** de produção.

---

## 2. Matriz-resumo (25/25 controles — cada SEC-ID exatamente uma vez)

| SEC | Domínio | Prio | Controle (Plano Mestre) | **Estado** | **Nível** | **Comprovação** | **Gate (S)** | Bloqueia prod. c/ dado real? |
|---|---|---|---|---|---|---|---|---|
| 001 | IAM | P0 | MFA obrigatório p/ contas privilegiadas | 🔴 VERMELHO | E0 | NÃO COMPROVADO | S1 | **Sim** |
| 002 | IAM | P0 | RBAC + ABAC contextual | 🔴 VERMELHO | E1 | NÃO COMPROVADO | S1 | **Sim** |
| 003 | IAM | P0 | PAM/JIT para privilégios | 🔴 VERMELHO | E0 | COMPROVADO (privilégio permanente) | S1¹ | **Sim** |
| 004 | Data | P0 | Isolamento por tenant/organização | 🟡 AMARELO | E3 | COMPROVADO (preview) | S1² | **Sim** |
| 005 | API | P0 | Object-level authorization / BOLA | 🟡 AMARELO | E2 | COMPROVADO | S1 | **Sim** |
| 006 | API | P0 | API Gateway, rate limit, schema validation | 🟡 AMARELO | E2 | COMPROVADO (parcial) | S1 | **Sim** |
| 007 | Crypto | P0 | KMS/secrets/rotação | 🟡 AMARELO | E2 | COMPROVADO (sem hardcode) / NÃO VERIFICÁVEL (rotação) | S0 | **Sim** |
| 008 | Network | P0 | Segmentação e egress deny-by-default | 🔴 VERMELHO | E0 | NÃO VERIFICÁVEL (infra) | S0 | **Sim** |
| 009 | Logging | P0 | Auditoria de acesso clínico/eventos críticos | 🟡 AMARELO | E2 | COMPROVADO (schema; não emitido) | S1 | **Sim** |
| 010 | SIEM | P0 | Detecção e alertas de segurança | 🟡 AMARELO | E1 | NÃO COMPROVADO (SIEM) | S3 | **Sim** |
| 011 | AI | P0 | AI Gateway (nenhum modelo fora do gateway) | 🟡 AMARELO | E2 | COMPROVADO (10 bypasses) | S2 | **Sim** |
| 012 | AI | P0 | Tool Gateway + policy enforcement | 🔵 AZUL | E1 | COMPROVADO (sem tools hoje) | S2 | Condicional³ |
| 013 | AI | P0 | Sandbox + egress control da IA | 🔴 VERMELHO | E0 | COMPROVADO (in-process) | S2¹ | **Sim** |
| 014 | FHIR | P0 | Validação de recursos/perfis | 🟡 AMARELO | E3/E0 | COMPROVADO (estrutural) | S2 | **Sim** |
| 015 | RNDS | P0 | Conformidade do adaptador RNDS | 🔵 AZUL | E0 | COMPROVADO (diferido por design) | S3⁴ | Só gate RNDS |
| 016 | SDLC | P0 | SAST/SCA/secret/IaC scanning no CI/CD | 🔴 VERMELHO | E0 | COMPROVADO (CI sem gates) | S1 | **Sim** |
| 017 | SDLC | P0 | DAST/API security testing | 🔴 VERMELHO | E0 | NÃO COMPROVADO | S3 | **Sim** |
| 018 | IR | P0 | Incident Response (playbooks+tabletop) | 🔴 VERMELHO | E0 | NÃO COMPROVADO | S3 | **Sim** |
| 019 | DR | P0 | Backup/restore/RPO/RTO | 🟡 AMARELO | E1 | COMPROVADO (runbook) / NÃO VERIFICÁVEL (restore) | S3 | **Sim** |
| 020 | Assurance | P0 | Pentest independente | 🔴 VERMELHO | E0 | NÃO COMPROVADO | S3 | **Sim** |
| 021 | Privacy | P0 | DPIA/RIPD e data inventory | 🔴 VERMELHO | E0 | NÃO COMPROVADO | S3⁵ | **Sim** |
| 022 | Privacy | P0 | Retenção, descarte e direitos do titular | 🟡 AMARELO | E2 | COMPROVADO (deleção/export) | S2 | **Sim** |
| 023 | Third party | P1 | Due diligence de cloud/LLM/subprocessadores | 🔴 VERMELHO | E0 | NÃO COMPROVADO | S3 | Não (P1) |
| 024 | Assurance | P1 | SBOM e provenance de artefatos | 🔴 VERMELHO | E0 | COMPROVADO (ausente no CI) | S1 | Não (P1) |
| 025 | Assurance | P2 | ISO 27001/27701/27799 readiness | 🟡 AMARELO | E1 | COMPROVADO (roadmap; sem SoA) | S3 | Não (P2) |

¹ SEC-003 e SEC-013 exigem **inventário obrigatório antes de qualquer remediação** (§7) — não são "correção rápida".
² SEC-004: controle em S1, mas **validação E4/E5 só no gate de dados reais (S3)**.
³ SEC-012: IA **não usa tool-calling hoje** → sem superfície atual; bloqueia produção só **se/quando** tools forem introduzidas.
⁴ SEC-015: RNDS diferido por design (`isRndsDecoupled`); tem **gate RNDS próprio**, fora da sequência S0–S3.
⁵ SEC-021: **governança**, não tarefa de código — owner de privacidade/DPO (§7).

### 2.1 Placar reconciliado (fecha em 25/25)
```
VERMELHO 12  +  AMARELO 11  +  AZUL 2  +  VERDE 0  +  PRETO 0   =  25 / 25   ✔
```
- **VERMELHO (12):** 001, 002, 003, 008, 013, 016, 017, 018, 020, 021, 023, 024
- **AMARELO (11):** 004, 005, 006, 007, 009, 010, 011, 014, 019, 022, 025
- **AZUL (2):** 012, 015 · **VERDE (0)** · **PRETO (0)**

### 2.2 Prioridade (do Plano Mestre) e bloqueio de produção
```
P0 = SEC-001 … SEC-022   (22 controles)  →  22/22 NÃO-VERDE  →  go-live c/ dado real BLOQUEADO
P1 = SEC-023, SEC-024    (2 controles)
P2 = SEC-025             (1 controle)
Total classificado = 22 + 2 + 1 = 25 / 25   ✔
```
Entre os P0: VERMELHO 10 (001,002,003,008,013,016,017,018,020,021) · AMARELO 10 (004,005,006,007,009,010,011,014,019,022) · AZUL 2 (012,015). **VERDE 0.**

### 2.3 Veredito de cobertura do assessment
**Cobertura 100% verificável:** cada SEC-ID de 001 a 025 aparece **exatamente uma vez**, com estado, nível de
evidência, comprovação, prioridade, gate e (na §3) evidência, gap, risco, owner e dependências. O placar (§2.1) e a
soma por prioridade (§2.2) fecham **ambos em 25/25**. Nenhum controle foi contado em duas categorias nem omitido.

---

## 3. Fichas por controle (evidência · nível · gap · risco · proposta · owner · dependências · gate)

### SEC-001 · IAM — MFA obrigatório para contas privilegiadas 🔴 VERMELHO (E0 · NÃO COMPROVADO)
- **Evidência:** `src/app/login/page.tsx:22` `signInWithPassword(...)`, `:38` `signInWithOAuth(...)` — sem 2º fator/`aal2`. Busca `mfa|aal2|totp|enrollMFA|listFactors` em `src/` e `apps/mobile/src/` → **zero**. `supabase/config.toml` mínimo (só `project_id`), **sem** `[auth.mfa]`. Conta privilegiada por e-mail hardcoded: `src/app/admin/page.tsx:14` `ADMIN_EMAIL = 'carinaleite.br@gmail.com'`.
- **Gap:** MFA não implementado nem arquitetado; enforcement de `aal2` inexistente no servidor.
- **Arquivo/recurso:** `supabase/config.toml`, `src/app/login/page.tsx`, `src/app/admin/*`.
- **Mudança proposta:** `[auth.mfa]` (TOTP) no Supabase; enrollment obrigatório p/ e-mail(s) privilegiado(s); bloquear rotas admin quando `session.aal !== 'aal2'`.
- **Risco:** comprometimento de credencial única da conta de maior privilégio → acesso total a dados de saúde. **Crítico.**
- **Owner:** TBD (IAM). **Dependências:** identidade central (CLD-002). **SEC↔CLD:** CLD-002. **Gate:** **S1**.

### SEC-002 · IAM — RBAC + ABAC contextual 🔴 VERMELHO (E1 · NÃO COMPROVADO)
- **Evidência:** sem tabela/coluna de papéis (`create role|user_roles|has_role|app_metadata|is_admin` em `supabase/migrations/**` → zero). Autorização real = **ownership por usuário**: `supabase/migrations/20260603165446_001_fix_rls_policies.sql:15-99` (`profiles/exams/biomarkers/ai_insights/biological_scores/daily_logs` todas `USING (auth.uid() = user_id)`). "Papel" privilegiado = e-mail hardcoded: `src/app/admin/page.tsx:123,197`; `src/app/admin/catalogo/page.tsx:21,190`. Intenção documentada: `docs/API-001_API_GOVERNANCE.md` §6.
- **Gap:** sem matriz de autorização por papel nem checagem contextual (clínico/organização).
- **Arquivo/recurso:** schema Supabase (falta `user_roles`/claims), `src/app/admin/*`, `src/app/api/**`.
- **Mudança proposta:** papéis via `app_metadata`/`user_roles` + custom claims JWT; substituir gate por e-mail por checagem de claim no servidor; ABAC (paciente↔profissional↔organização) nas policies **quando** houver acesso multiusuário.
- **Risco:** impossível conceder acesso clínico legítimo sem expor tudo; gate de UI contornável. **Alto.**
- **Owner:** TBD (IAM). **Dependências:** SEC-001. **SEC↔CLD:** CLD-002. **Gate:** **S1**.

### SEC-003 · IAM — PAM/JIT para privilégios 🔴 VERMELHO (E0 · COMPROVADO: privilégio permanente)
- **Evidência:** `service_role` permanente: `src/lib/connectors/runtime.server.ts:73-77` `adminClient()` → `createAdmin(URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SECRET_KEY)`; uso inline bypass RLS: `src/app/api/exams/[id]/route.ts:36-40`; também `src/app/api/account/route.ts`, `src/app/api/agenda/reminders/route.ts`, `src/app/api/connectors/[source]/*`. "PAM" atual = segredo estático `x-admin-secret` vs `process.env.ADMIN_SECRET` (`src/app/api/agenda/reminders/route.ts:35`, `src/app/api/email/welcome/route.ts:10-11`).
- **Gap:** privilégio elevado permanente e amplamente disponível ao runtime; sem JIT/elevação/aprovação/trilha; fallback `SUPABASE_SECRET_KEY` amplia superfície.
- **Arquivo/recurso:** `src/lib/connectors/runtime.server.ts`, `src/app/api/exams/[id]/route.ts`, rotas c/ `ADMIN_SECRET`.
- **Mudança proposta:** **primeiro o inventário** (§7); depois mover operações service-role para RPC `SECURITY DEFINER` de escopo mínimo; trocar `ADMIN_SECRET` por tokens curtos/assinados; rotação; remover fallback.
- **Risco:** vazamento de chave/secret = comprometimento total persistente. **Crítico. Não é correção rápida — é modelo de confiança.**
- **Owner:** TBD (IAM/Plataforma). **Dependências:** SEC-007, inventário §7. **SEC↔CLD:** CLD-003. **Gate:** **S1** (após inventário).

### SEC-004 · Data — Isolamento por tenant/organização 🟡 AMARELO (E3 · COMPROVADO no preview)
- **Evidência:** RLS `auth.uid() = user_id` em `...001_fix_rls_policies.sql:15-99` + `.eq('user_id', userId)` nas rotas. **Comprovação isolada:** EXDOC-024 (Postgres isolado: B→`user_id=A` = 0) e EXDOC-025 (Preview Supabase real, role `authenticated`, **não** service_role: A=2 SR, B=1, **B→A=0**) → **E3**.
- **Gap:** **produção não comprovada** (E5 ausente); testes cross-tenant no app são mockados; runtime ainda usa `service_role` em rotas (bypassa RLS — SEC-003).
- **Arquivo/recurso:** `supabase/migrations/**`, `src/app/api/**`, `tests/**`.
- **Mudança proposta:** teste cross-tenant contra schema real (E4) → validação operacional (E5) no gate de dados reais; reduzir service_role no caminho de leitura do usuário.
- **Risco:** vazamento entre usuários se uma rota service-role não escopar. **Alto** (mitigado: sem dado real hoje).
- **Owner:** TBD (Data). **Dependências:** SEC-003. **SEC↔CLD:** CLD-001, CLD-004. **Gate:** **S1** (validação E4/E5 em **S3**).

### SEC-005 · API — Object-level authorization / BOLA 🟡 AMARELO (E2 · COMPROVADO)
- **Evidência (positiva):** ownership por objeto: `src/app/api/exams/[id]/route.ts:24-31` (`.eq('id',examId).eq('user_id',userId)`, 404 se não-dono; storage só se `path.startsWith(userId+'/')` `:48`); `src/app/api/insights/[id]/feedback/route.ts:35-44`; `src/app/api/omics/panels/[id]/ingest/route.ts:80-81`. Helpers: `src/lib/omics/server.ts:24-30`, `src/lib/supabase/authedClient.ts:32`.
- **Gap:** **sem testes de autz negativa** (A→objeto de B → 404); **IDOR condicional** no fallback do webhook que confia em `userId` do corpo protegido só por segredo: `src/app/api/connectors/[source]/webhook/route.ts:25,42-49`; catálogo global sem ownership (aceitável se sem PII): `src/app/api/omics/features/[id]/route.ts:13-16`.
- **Arquivo/recurso:** `src/app/api/**`, webhook de connectors, suíte de testes.
- **Mudança proposta:** testes de autz negativa por endpoint; verificar HMAC nativo do provedor no webhook.
- **Risco:** acesso indevido a objeto de outro titular (IDOR) / regressão silenciosa. **Alto.**
- **Owner:** TBD (API). **Dependências:** — (testes são código). **SEC↔CLD:** CLD-006. **Gate:** **S1**.

### SEC-006 · API — API Gateway, rate limit, schema validation 🟡 AMARELO (E2 parcial · COMPROVADO)
- **Evidência:** rate limit só p/ IA, **in-memory por instância**: `src/lib/ai/rate-limiter.ts:14-30` (Map, 5/min/usuário; limitação documentada `:3-7`), aplicado só em `src/lib/ai/gateway.ts:265-266` (429). Nenhuma outra rota tem rate limit. **Sem** `src/middleware.ts`. Validação ad-hoc (`src/app/api/profile/route.ts:43-55` casts; `insights/[id]/feedback:30`; `omics/panels/[id]/ingest:93-94`); `packages/validation` **não usado nas rotas** (`zod|safeParse` ausente em `src/app/api/**`). Governança documental: `docs/API-001_API_GOVERNANCE.md` §1/§4/§7.
- **Gap:** rate limit ineficaz em serverless e restrito à IA; sem gateway/middleware central; validação inconsistente.
- **Arquivo/recurso:** `src/lib/ai/rate-limiter.ts`, `src/lib/ai/gateway.ts`, `src/app/api/**`, `packages/validation`, infra (Redis/WAF).
- **Mudança proposta:** rate limit distribuído (Upstash/Redis) em middleware; `safeParse` (zod/`@sintera/validation`) → 400 por handler; versionamento (API-001 §1).
- **Risco:** abuso/DoS e payloads maliciosos aceitos. **Médio-Alto.**
- **Owner:** TBD (API). **Dependências:** infra (Redis) p/ rate global. **SEC↔CLD:** CLD-006. **Gate:** **S1**.

### SEC-007 · Crypto — KMS/secrets/rotação 🟡 AMARELO (E2 · COMPROVADO sem hardcode / NÃO VERIFICÁVEL rotação)
- **Evidência:** **sem secrets hardcoded** (via env: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`, `ANTHROPIC_API_KEY`, `CONNECTOR_WEBHOOK_SECRET`). Rotação/KMS/cofre **não verificáveis** no material. Leaked-password protection do Supabase **não evidenciada como ativa** (não comprovado ligado). TLS/at-rest são do provedor (não verificável no repo).
- **Gap:** sem rotação testada, sem KMS/cofre, sem inventário de segredos; fallback de chave amplia exposição.
- **Arquivo/recurso:** gestão de env (Vercel/Supabase), `src/lib/connectors/runtime.server.ts`.
- **Mudança proposta:** cofre/KMS gerenciado; política e teste de rotação; ligar leaked-password protection; remover fallback.
- **Risco:** segredo comprometido sem rotação = janela longa. **Alto.**
- **Owner:** TBD (Plataforma). **Dependências:** infra/cloud. **SEC↔CLD:** CLD-007. **Gate:** **S0**.

### SEC-008 · Network — Segmentação e egress deny-by-default 🔴 VERMELHO (E0 · NÃO VERIFICÁVEL infra)
- **Evidência:** **nenhuma** config de rede/egress versionada (sem IaC/VPC/subnet/regras). Egress deny-by-default é, por padrão de cloud, ausente (allow-by-default); exposição pública do DB **não é verificável** a partir do material → **não presumir**, mas **não há evidência do contrário**.
- **Gap:** egress não é deny-by-default; segmentação/allowlist ausentes; postura de rede não declarada como IaC.
- **Arquivo/recurso:** infra de cloud (Supabase/Vercel), IaC inexistente.
- **Mudança proposta:** DB/data/security em rede privada; egress deny-by-default + allowlist; declarar como IaC.
- **Risco:** exfiltração por saída não controlada; possível exposição de DB. **Crítico** (ambiente com dado real).
- **Owner:** TBD (Cloud/Infra). **Dependências:** decisão de arquitetura de rede. **SEC↔CLD:** CLD-004, CLD-005. **Gate:** **S0** (**material**).

### SEC-009 · Logging — Auditoria de acesso clínico e eventos críticos 🟡 AMARELO (E2 · COMPROVADO schema; não emitido)
- **Evidência:** schema de auditoria existe (migração consent/audit — `audit_events`, lida pelo adapter em EXDOC-024). Logs operacionais/IA e governança documental `docs/OPS-001_OBSERVABILITY_GOVERNANCE.md`. Porém `audit_events` **não é emitido** no fluxo (no preview a única linha foi dado de teste, removida — EXDOC-025 §2).
- **Gap:** eventos de acesso clínico não gravados de fato; sem integridade/append-only comprovado; sem busca operacional.
- **Arquivo/recurso:** migração `..._142_...consent_audit`, camada de acesso, `src/app/api/**`.
- **Mudança proposta:** emitir `audit_events` nos acessos/mutações críticas; integridade (append-only/hash-chain) + retenção; pesquisável.
- **Risco:** incidentes clínicos não detectáveis/investigáveis (LGPD/rastreabilidade). **Alto.**
- **Owner:** TBD (Data/Segurança). **Dependências:** SEC-002, SEC-010. **SEC↔CLD:** CLD-008. **Gate:** **S1**.

### SEC-010 · SIEM — Detecção e alertas 🟡 AMARELO (E1 · NÃO COMPROVADO SIEM)
- **Evidência:** governança de observabilidade documental (`docs/OPS-001_OBSERVABILITY_GOVERNANCE.md`) e alertas **operacionais** (não de segurança). Sem SIEM/correlação IAM-rede-app.
- **Gap:** nenhuma detecção de segurança; alertas críticos (brute force, escalonamento, egress anômalo) inexistentes.
- **Arquivo/recurso:** infra de logging/SIEM (inexistente), pipeline de alerta.
- **Mudança proposta:** centralizar logs (CLD-008) → SIEM com casos de uso críticos testados.
- **Risco:** ataque em curso passa despercebido. **Alto.**
- **Owner:** TBD (SecOps). **Dependências:** SEC-009, rede. **SEC↔CLD:** CLD-009, CLD-010. **Gate:** **S3**.

### SEC-011 · AI — AI Gateway (nenhum modelo acessa dados fora do gateway) 🟡 AMARELO (E2 · COMPROVADO: 10 bypasses)
- **Evidência:** gateway central `src/lib/ai/gateway.ts` (importa o SDK `:3`; rate limit `:265-266`) **mas** há **10 arquivos** que chamam o SDK Anthropic **diretamente**, bypassando o gateway com dado clínico:
  `src/lib/ai/issuer.ts`, `src/lib/ai/document-classifier.ts`, `src/lib/ai/requestingPhysician.ts`, `src/lib/capture/document-understanding.ts`, `src/app/api/medications/scan/route.ts`, `src/app/api/capture/classify/route.ts`, `src/app/api/vision/eyeglasses/route.ts`, `src/app/api/vision/condition/route.ts`, `src/app/api/vision/bioimpedance/route.ts`, `src/app/api/omics/panels/[id]/ingest-pdf/route.ts`.
- **Gap:** o gateway **não é o único caminho**; política central (rate/redação/allowlist de dados) não é aplicada nos bypasses.
- **Arquivo/recurso:** `src/lib/ai/*`, `src/lib/capture/*`, rotas de IA acima.
- **Mudança proposta:** rotear 100% da IA pelo gateway (lint rule proibindo import direto do SDK fora dele); centralizar redação de PII/política.
- **Risco:** dado clínico ao modelo sem controle/registro. **Alto.**
- **Owner:** TBD (IA/Plataforma). **Dependências:** —. **SEC↔CLD:** CLD-015. **Gate:** **S2**.

### SEC-012 · AI — Tool Gateway + policy enforcement 🔵 AZUL (E1 · COMPROVADO sem tools)
- **Evidência:** a IA **não usa tool-calling/functions** hoje → sem superfície de ferramenta a proteger.
- **Gap:** controle inexistente, mas **sem superfície atual**; necessário ao adotar tools/agentes.
- **Arquivo/recurso:** `src/lib/ai/*` (futuro).
- **Mudança proposta:** ao introduzir tools, allowlist + autorização por chamada + auditoria.
- **Risco:** baixo hoje; alto se tools forem adicionadas sem controle. **Condicional.**
- **Owner:** TBD (IA). **Dependências:** SEC-011. **SEC↔CLD:** CLD-015. **Gate:** **S2** (quando aplicável).

### SEC-013 · AI — Sandbox + egress control da IA 🔴 VERMELHO (E0 · COMPROVADO: in-process)
- **Evidência:** processamento de IA roda **in-process** no runtime da app, mesmo ambiente/DB, com **egress irrestrito** (chamadas SDK diretas — ver SEC-011). Sem isolamento/sandbox.
- **Gap:** IA não isolada; egress não bloqueado; acesso a produção não segregado.
- **Arquivo/recurso:** `src/lib/ai/*`, `src/lib/capture/*`, rotas de IA, arquitetura de runtime.
- **Mudança proposta:** **primeiro o inventário do fluxo dado→IA (§7)**; depois runtime isolado sem credencial de produção; egress deny-by-default + allowlist (só endpoint do provedor).
- **Risco:** prompt injection/exfiltração com acesso direto a dados sensíveis. **Crítico — sub-gate próprio (dados clínicos).**
- **Owner:** TBD (IA/Cloud). **Dependências:** SEC-008, SEC-011, inventário §7. **SEC↔CLD:** CLD-015, CLD-005. **Gate:** **S2** (**material — runtime/rede**).

### SEC-014 · FHIR — Validação de recursos/perfis 🟡 AMARELO (E3 estrutural / E0 perfis · COMPROVADO)
- **Evidência:** validação **estrutural** do grafo canônico existe e é testada: `src/lib/fhir/canonical/validate.ts` (`validateStructural`: refs resolvidas, ids únicos, RNDS desacoplado, coding honesto) + `tests/fhir/*` e E2E do preview (EXDOC-025) → **E3**. **Não** valida perfis oficiais FHIR R4/BR-Core.
- **Gap:** payload pode ser coerente mas não conforme a perfil oficial; nenhuma rejeição por perfil.
- **Arquivo/recurso:** `src/lib/fhir/canonical/*`.
- **Mudança proposta:** validação contra perfis oficiais (FHIR validator/BR-Core) antes de emissão externa.
- **Risco:** interoperabilidade incorreta; dado mal formado exportado. **Médio** (mitigado: nada exportado hoje).
- **Owner:** TBD (FHIR). **Dependências:** curadoria de perfis. **SEC↔CLD:** CLD-004. **Gate:** **S2**.

### SEC-015 · RNDS — Conformidade do adaptador 🔵 AZUL (E0 · COMPROVADO diferido)
- **Evidência:** **não há** adaptador/integração RNDS (por design — desacoplamento é invariante; `isRndsDecoupled` em `validate.ts`). Gate RNDS **não autorizado/aberto**.
- **Gap:** adaptador inexistente (esperado nesta fase).
- **Arquivo/recurso:** — (futuro adaptador).
- **Mudança proposta:** ao abrir o gate RNDS, adaptador com testes de conformidade do fluxo específico.
- **Risco:** nenhum hoje (fora de escopo). **Baixo.**
- **Owner:** TBD (Interop). **Dependências:** decisão regulatória/gate RNDS. **SEC↔CLD:** —. **Gate:** **gate RNDS próprio** (fora de S0–S3).

### SEC-016 · SDLC — SAST/SCA/secret/IaC scanning no CI/CD 🔴 VERMELHO (E0 · COMPROVADO)
- **Evidência:** CI só faz `typecheck (web/mobile/pacotes)`, `test`, `build`, `lint` (`.github/workflows/ci.yml:33-52`); `concurrency-harness.yml` é harness de teste. **Sem** SAST, SCA, secret-scanning, IaC scan, Dependabot.
- **Gap:** vulnerabilidades de código/dependências/segredos não detectadas no pipeline.
- **Arquivo/recurso:** `.github/workflows/*`.
- **Mudança proposta:** gates CodeQL/Semgrep (SAST), dependency scan/Dependabot (SCA), gitleaks (secret), checkov/tfsec (IaC), bloqueando findings críticos.
- **Risco:** regressões de segurança e segredos vazam sem barreira. **Alto.**
- **Owner:** TBD (SDLC). **Dependências:** — (código de CI). **SEC↔CLD:** CLD-013. **Gate:** **S1** (candidato a lote **autônomo** cedo).

### SEC-017 · SDLC — DAST/API security testing 🔴 VERMELHO (E0 · NÃO COMPROVADO)
- **Evidência:** nenhum teste dinâmico de segurança (ZAP/fuzzing) em `tests/**` ou CI.
- **Gap:** superfície de API não exercitada por ataque dinâmico.
- **Arquivo/recurso:** CI, suíte de testes.
- **Mudança proposta:** DAST em staging (ZAP baseline) + testes de segurança de API; sem vuln crítica aberta.
- **Risco:** falhas de runtime não detectadas. **Médio-Alto.**
- **Owner:** TBD (SDLC/SecOps). **Dependências:** staging (SEC-004/CLD-001). **SEC↔CLD:** CLD-013, CLD-006. **Gate:** **S3**.

### SEC-018 · IR — Incident Response 🔴 VERMELHO (E0 · NÃO COMPROVADO)
- **Evidência:** sem playbook de IR, sem tabletop, sem plano de resposta em `docs/**`.
- **Gap:** nenhum processo de resposta a incidente; papéis/escalonamento indefinidos.
- **Arquivo/recurso:** `docs/` (IR inexistente).
- **Mudança proposta:** playbooks (detecção→contenção→erradicação→recuperação→lições), contatos, tabletop executado.
- **Risco:** resposta lenta/ad-hoc a incidente com dado de saúde (LGPD/ANPD). **Alto.**
- **Owner:** TBD (SecOps). **Dependências:** SEC-009/010. **SEC↔CLD:** CLD-012. **Gate:** **S3**.

### SEC-019 · DR — Backup/restore/RPO/RTO 🟡 AMARELO (E1 · COMPROVADO runbook / NÃO VERIFICÁVEL restore)
- **Evidência:** runbook existe (`docs/OPS-002_RELEASE_BACKUP_RUNBOOK.md`). Backups gerenciados do Supabase. **RPO/RTO não quantificados**; **restore não testado**; imutabilidade não comprovada.
- **Gap:** DR não testado; objetivos não definidos; imutabilidade não comprovada.
- **Arquivo/recurso:** `docs/OPS-002...`, config de backup do provedor.
- **Mudança proposta:** definir RPO/RTO; backup vault imutável; **teste de restore** documentado.
- **Risco:** perda de dados/indisponibilidade sem recuperação garantida. **Alto.**
- **Owner:** TBD (Plataforma). **Dependências:** cloud. **SEC↔CLD:** CLD-011, CLD-012. **Gate:** **S3**.

### SEC-020 · Assurance — Pentest independente 🔴 VERMELHO (E0 · NÃO COMPROVADO)
- **Evidência:** nenhum relatório/evidência de pentest.
- **Gap:** sem avaliação adversarial independente.
- **Arquivo/recurso:** — (assurance externo).
- **Mudança proposta:** pentest independente pré go-live; nenhum finding crítico aberto.
- **Risco:** falhas exploráveis desconhecidas. **Alto.**
- **Owner:** TBD (terceiro). **Dependências:** ambiente estável (S0–S2). **SEC↔CLD:** CLD-010. **Gate:** **S3**.

### SEC-021 · Privacy — DPIA/RIPD e data inventory 🔴 VERMELHO (E0 · NÃO COMPROVADO)
- **Evidência:** sem RIPD/DPIA, sem ROPA/inventário formal (há classificação C0–C5 conceitual, mas não um RIPD aprovado).
- **Gap:** riscos de privacidade não avaliados/documentados; inventário de dados/fluxos ausente formalmente.
- **Arquivo/recurso:** `docs/` (privacidade).
- **Mudança proposta:** RIPD/DPIA + ROPA + data inventory por domínio (LGPD art. 38). **Governança, não código** (§7).
- **Risco:** não conformidade LGPD; dado sensível sem avaliação de impacto. **Alto.**
- **Owner:** **DPO/Privacidade** (não é tarefa de código). **Dependências:** definição de tratamento/finalidade. **SEC↔CLD:** —. **Gate:** **S3**.

### SEC-022 · Privacy — Retenção, descarte e direitos do titular 🟡 AMARELO (E2 · COMPROVADO)
- **Evidência:** exclusão LGPD: `src/app/api/account/route.ts`; exportação: `src/app/api/account/export/route.ts`; consentimento versionado: `src/app/api/consent/route.ts`. Sem automação de **retenção/descarte** por política nem prazos; portabilidade padronizada não comprovada.
- **Gap:** falta política de retenção/descarte automatizada e testada; formato de portabilidade não normatizado.
- **Arquivo/recurso:** `src/app/api/account/*`, `src/app/api/consent/route.ts`, schema.
- **Mudança proposta:** políticas de retenção/descarte (jobs) + testes; padronizar export/portabilidade.
- **Risco:** dado retido além do necessário; direito do titular parcialmente atendido. **Médio.**
- **Owner:** TBD (Privacidade/Data). **Dependências:** SEC-021. **SEC↔CLD:** CLD-011. **Gate:** **S2**.

### SEC-023 · Third party — Due diligence de cloud/LLM/subprocessadores 🔴 VERMELHO (E0 · NÃO COMPROVADO) · P1
- **Evidência:** subprocessadores identificáveis pelo stack (Supabase, Anthropic, Vercel, Resend) mas **sem** registro/due diligence/contratos documentados.
- **Gap:** risco de terceiros não avaliado; DPA/subprocessadores não registrados.
- **Arquivo/recurso:** `docs/` (terceiros).
- **Mudança proposta:** registro de subprocessadores + due diligence + DPAs aprovados.
- **Risco:** exposição via terceiro sem contrato/avaliação. **Médio** (P1).
- **Owner:** TBD (Jurídico/Privacidade). **Dependências:** —. **SEC↔CLD:** —. **Gate:** **S3**.

### SEC-024 · Assurance — SBOM e provenance de artefatos 🔴 VERMELHO (E0 · COMPROVADO ausente) · P1
- **Evidência:** sem geração de SBOM, sem assinatura/verificação de artefatos, registry não privado/assinado.
- **Gap:** cadeia de suprimentos não verificável.
- **Arquivo/recurso:** CI/CD, build.
- **Mudança proposta:** SBOM por release (CycloneDX/syft) + assinatura/verificação (cosign/SLSA).
- **Risco:** artefato adulterado não detectável. **Médio** (P1).
- **Owner:** TBD (SDLC). **Dependências:** SEC-016. **SEC↔CLD:** CLD-014. **Gate:** **S1** (candidato a lote **autônomo** — CI).

### SEC-025 · Assurance — ISO 27001/27701/27799 readiness 🟡 AMARELO (E1 · COMPROVADO roadmap) · P2
- **Evidência:** roadmap/mapeamento de governança (`docs/COMPLIANCE-001_GOVERNANCA.md`); sem SoA formal; **ISO 27799 (saúde) ausente**.
- **Gap:** readiness formal e SoA inexistentes; controle de saúde específico não mapeado.
- **Arquivo/recurso:** `docs/COMPLIANCE-001...`.
- **Mudança proposta:** SoA + readiness assessment + incluir ISO 27799.
- **Risco:** maturidade/certificação não demonstrável. **Baixo-Médio** (P2).
- **Owner:** TBD (Compliance). **Dependências:** SEC-001..024. **SEC↔CLD:** —. **Gate:** **S3**.

---

## 4. Mapa SEC ↔ CLD (Diretrizes de Cloud/Infra)

| SEC | CLD relacionado | Observação |
|---|---|---|
| 001 MFA | **CLD-002** IAM/MFA | Identidade central + MFA de admins. |
| 002 RBAC/ABAC | **CLD-002** | Identidade central; papéis. |
| 003 PAM/JIT | **CLD-003** PAM/JIT | Privilégio administrativo temporário. |
| 004 Isolamento | **CLD-001** Separação de ambientes · **CLD-004** Network segmentation | Prod/staging/dev + DB privado. |
| 005 BOLA | **CLD-006** WAF/API Gateway | Proteção de APIs. |
| 006 API GW/rate/schema | **CLD-006** | Rate limits + logs no gateway. |
| 007 KMS/secrets | **CLD-007** KMS/Secrets | Vault/KMS + rotação. |
| 008 Rede/egress | **CLD-004** + **CLD-005** Egress | DB privado + egress deny-by-default. |
| 009 Auditoria | **CLD-008** Central logging | Logs centralizados/pesquisáveis. |
| 010 SIEM | **CLD-009** SIEM · **CLD-010** CSPM/CNAPP | Detecção + misconfig. |
| 011 AI Gateway | **CLD-015** AI sandbox | Runtime isolado de IA. |
| 012 Tool Gateway | **CLD-015** | Idem (quando houver tools). |
| 013 AI sandbox/egress | **CLD-015** + **CLD-005** | Sem credencial de produção; egress bloqueado. |
| 014 FHIR validação | **CLD-004** | FHIR store privado. |
| 016 SAST/SCA/secret/IaC | **CLD-013** CI/CD security | Gates no pipeline. |
| 017 DAST | **CLD-013** + **CLD-006** | Teste dinâmico + proteção de API. |
| 019 Backup/DR | **CLD-011** Backup · **CLD-012** DR | Restore/RTO/RPO testados. |
| 020 Pentest | **CLD-010** CSPM/CNAPP | Achados críticos tratados. |
| 022 Retenção | **CLD-011** | Retenção de backup. |
| 024 SBOM/provenance | **CLD-014** Artifact integrity | Registry privado + assinatura. |
| 015 RNDS · 018 IR · 021 DPIA · 023 Third-party · 025 ISO | — | Sem CLD direto (governança/assurance/privacidade). |

---

## 5. Gates de remediação **S0 → S3** (proposta; **nenhuma execução agora**)

> Estrutura de **quatro gates materiais** (substitui a sequência fina T0→T6 da v1). Uma aprovação **abre o gate
> inteiro**; dentro dele, execução autônoma; **parada automática** ao atingir mudança material fora do gate.

### S0 — Fundação de segurança (cloud/infra) — **material**
Pré-requisito de quase tudo. `CLD-001` ambientes separados (**hoje só há produção** — EXDOC-024 §6/EXDOC-025 §6),
`CLD-004` DB privado, `CLD-005` egress deny-by-default, `CLD-002` identidade central baseline, `CLD-007` KMS/secrets
baseline, `CLD-008` central logging, separação produção/preview, observabilidade básica.
**Controles SEC:** **SEC-007** (secrets/KMS), **SEC-008** (rede/egress). **Natureza:** IAM/rede/cloud/DB — **não autônomo.**

### S1 — Aplicação — **material (IAM) + lotes autônomos (código/CI)**
**SEC-001** MFA · **SEC-002** RBAC/ABAC · **SEC-003** PAM/JIT *(após inventário §7)* · **SEC-004** RLS *(validação
E4/E5 fica em S3)* · **SEC-005** BOLA (+ testes negativos) · **SEC-006** API security/rate/schema · **SEC-009** logging
(emissão de `audit_events`) · **SEC-016** SAST/SCA/secret/IaC no CI · **SEC-024** SBOM.

### S2 — Dados clínicos + IA — **material (sub-gate de dados clínicos)**
**SEC-011** unificar IA no gateway · **SEC-012** tool gateway (quando aplicável) · **SEC-013** sandbox/egress de IA
*(após inventário §7)* · **SEC-014** perfis FHIR · **SEC-022** retenção/descarte/portabilidade. Foco: minimização,
Provenance, tratamento de dado clínico, egress de dados.

### S3 — Assurance / produção — **material**
**SEC-010** SIEM · **SEC-017** DAST · **SEC-018** IR (playbooks+tabletop) · **SEC-019** DR (RPO/RTO+restore) ·
**SEC-020** pentest · **SEC-021** RIPD/DPIA · **SEC-023** due diligence de terceiros · **SEC-025** ISO/SoA readiness ·
**+ gate de produção com dado real** (backfill + validação E5) · **+ gate RNDS** (SEC-015). Só aqui os P0 podem migrar
para 🟢 VERDE.

### 5.1 Crosswalk T0→T6 (v1) ↔ S0–S3 (autoritativo) — preservado, nada perdido
| Fase fina (v1) | Conteúdo | Gate material (v2) |
|---|---|---|
| **T0** Fundação cloud/infra | ambientes, DB privado, egress, KMS, logging | **S0** |
| **T1** Identidade e acesso | SEC-001, 002, 003, 005, 006 | **S1** |
| **T2** Dados/cripto/logging/privacidade | SEC-007→**S0** · SEC-004, 009→**S1** · SEC-022→**S2** · SEC-021→**S3** | **S0/S1/S2/S3** |
| **T3** API/FHIR/IA | SEC-006→**S1** · SEC-011, 012, 013, 014→**S2** · SEC-015→gate RNDS | **S1/S2** |
| **T4** Cloud/rede/SIEM | SEC-008→**S0** · SEC-010→**S3** | **S0/S3** |
| **T5** SDLC/IR/DR/assurance | SEC-016, 024→**S1** · SEC-017, 018, 019, 020, 023→**S3** | **S1/S3** |
| **T6** Validação final | pentest sign-off, SEC-025, gate de dados reais, gate RNDS | **S3** |

> A granularidade T0→T6 continua útil como **ordem de execução dentro** dos gates; os **gates materiais** (unidade de
> aprovação) são **S0–S3**, conforme sua diretriz.

---

## 6. Distinção Preview × Produção (não extrapolar)

| Aspecto | Preview sintético (EXDOC-024/025) | Produção |
|---|---|---|
| RLS efetiva (authenticated, não service_role) | ✅ **comprovada (E3)** — B→A = 0 | ❓ **não comprovada** |
| Isolamento por usuário | ✅ isolado/sintético | ❓ não comprovado; runtime ainda usa service_role em rotas |
| Grafo FHIR estrutural | ✅ validado (E3) | ❓ sem dado real canônico (backfill não autorizado) |
| Dado clínico real presente | ❌ não (sintético) | ❌ **não** (por isso ⚫ PRETO é hoje não aplicável) |

**Leitura:** a força real hoje é o **isolamento por usuário via RLS**, comprovado **em preview** (E3). O resto, em
produção, é **não comprovado**. As maiores lacunas: **identidade forte (MFA)**, **papéis (RBAC/ABAC)**, **privilégio
(PAM/JIT)**, **isolamento de IA (sandbox/egress)** e **DevSecOps (SAST/SCA/DAST)**.

---

## 7. Itens que exigem **inventário antes de remediar** (não são correção rápida)

- **SEC-003 (PAM/service_role):** antes de qualquer mudança, mapear — onde `service_role` é usado; quais operações
  dependem dele; quais rotas usam privilégio elevado; separação admin×normal; quais secrets existem e quem os aciona;
  se há JIT/PAM; quais operações migrariam para RLS/RPC de privilégio mínimo. **Só então** arquitetura de remediação.
- **SEC-013 (IA×produção):** definir o fluxo `dado clínico → camada de acesso → modelo` — quais dados a IA recebe, em
  que momento, qual modelo, quais credenciais, retenção, treino com dados (não), logging, egress, minimização,
  isolamento, autorização contextual. **Sub-gate próprio** por envolver dado clínico.
- **SEC-021 (DPIA/RIPD):** governança de proteção de dados (finalidade, categorias, riscos, medidas, responsáveis) —
  **owner de privacidade/DPO**, não tarefa de código.

## 8. O que pode ser autônomo vs. o que exige seu gate

**Candidatos a lote autônomo** (código/CI/doc no repositório, sem tocar prod/IAM/rede/KMS/DB, revisável por PR):
SEC-005 (testes de autz negativa), SEC-006 (validação zod nas rotas), SEC-009 (emitir `audit_events`), SEC-011
(unificar IA no gateway + lint rule), SEC-014 (validação de perfis), SEC-016 (workflows SAST/SCA/secret), SEC-024
(SBOM no CI), SEC-018/019/025 (documentos: IR, objetivos de DR, SoA).

**Exigem gate material** (prod/IAM/rede/egress/KMS/cloud/DB/backfill/RNDS/dado clínico): S0 inteiro,
SEC-001/002/003 (IAM), SEC-004 validação E4/E5, SEC-007 (KMS/rotação), SEC-008 (rede/egress), SEC-010 (SIEM),
SEC-013 (runtime isolado), SEC-017 (DAST em staging), SEC-020 (pentest), SEC-021/023 (governança/privacidade),
gate de dados reais e gate RNDS.

---

## 9. Estado

Diagnóstico **reconciliado (v2)**: SEC-001…025 cada um **uma vez**; placar **12+11+2+0+0 = 25/25**; P0 = 22 (todos
não-VERDE) + P1 = 2 + P2 = 1 = **25/25**; proveniência fixada no **SHA imutável `4c1716d`**; citações verificadas
(1 correção em SEC-011). **Nada implementado, alterado ou corrigido.** Produção, IAM, RLS, rede, KMS, secrets, DB e
infra **intocados**; dados reais **não acessados**. Aguardando sua **revisão do gate de segurança** para, então,
autorizar a **abertura do primeiro gate material (S0)** — ou um lote autônomo de código/CI/doc. Nenhum gap será
corrigido automaticamente antes da sua aprovação.
