# EXDOC-026 — GAP ASSESSMENT de Segurança (Fase 1 · diagnóstico, READ-ONLY)

> **Natureza deste documento.** Diagnóstico. **Nada foi implementado, alterado ou corrigido.** Nenhuma mudança em
> produção, IAM, RLS, firewall, rede, egress, KMS, secrets, banco, migrations, cloud ou RNDS. Coleta de evidência
> 100% read-only (inspeção de código, configuração, schema, CI e documentação do próprio repositório).
> **Data:** 2026-08-19. **Escopo:** SEC-001…SEC-025 (Plano Mestre Arquitetural de Segurança v2.0) com referência
> cruzada a CLD-001…CLD-015 (Diretrizes de Cloud e Infraestrutura v1.0).
>
> **Regra de ouro aplicada:** *código existente ≠ controle operacional comprovado*; *"não encontrei evidência" ≠
> "não existe"*. Quando um controle não pôde ser comprovado pelo material do repositório, ele é classificado como
> **não comprovado / não verificável** — não é presumida ausência nem implementação.

---

## 0. Proveniência da evidência (transparência)

A coleta foi feita contra a **árvore de desenvolvimento ativa** do repositório — a linha FHIR/preview
(`feat/fase-c-sql-source`, herdeira de `feat/mobile-inc4-perfil`), estado de 2026-08-19 — que contém o trabalho
canônico C-2/137→143/Fase C e os EXDOC-024/025. Os caminhos `arquivo:linha` citados referem-se a essa árvore.
Este EXDOC-026 é **entregue** na branch designada `claude/relaxed-curie-mag4pb` conforme o regime de branches; alguns
artefatos citados (ex.: `.github/workflows/ci.yml`, `src/lib/fhir/canonical/validate.ts`,
`src/app/api/connectors/[source]/webhook/route.ts`, `docs/OPS-002_RELEASE_BACKUP_RUNBOOK.md`) vivem naquela linha de
desenvolvimento e podem não estar presentes nesta branch de entrega. **Os gaps são arquiteturais e transversais à
plataforma** (identidade, autorização, rede, IA, SDLC): valem para todas as linhas de código.

---

## 1. Legendas

### 1.1 Estado (semáforo do Plano Mestre)
| Cor | Significado |
|---|---|
| 🟢 **VERDE** | Implementado **+** testado **+** resultado **+** evidência **+** owner. (Nenhum controle atinge VERDE hoje.) |
| 🟡 **AMARELO** | Implementado (código/config) mas **sem teste/evidência operacional suficiente** ou apenas parcial. |
| 🔵 **AZUL** | **Arquitetado/especificado**, não implementado (ou intencionalmente diferido para gate próprio). |
| 🔴 **VERMELHO** | **Ausente ou inadequado** — controle não existe ou existe de forma que não atende ao critério. |
| ⚫ **PRETO** | Violação ativa criando risco crítico **com dado real exposto**. Reservado — hoje **não aplicável**, pois **não há dado clínico real em produção** (backfill não autorizado). Ver §6. |

### 1.2 Nível de evidência (para separar código de comprovação operacional)
| Nível | Significado |
|---|---|
| **E0** | Inexistente (não há artefato). |
| **E1** | Especificado (existe só em documento/intenção arquitetural). |
| **E2** | Implementado em código/configuração (não testado como controle de segurança). |
| **E3** | Testado em ambiente isolado/sintético (ex.: Postgres isolado, preview descartável). |
| **E4** | Validado em ambiente representativo (schema real, stack real, não produção). |
| **E5** | Validado operacionalmente em **produção**. |

> **Nota crítica de leitura (aplica-se a quase todos os controles):** o que foi comprovado no **Preview sintético
> (EXDOC-025)** e no **adapter B+ (EXDOC-024)** é **E3** — ambiente isolado, dados sintéticos. **Produção permanece
> E-não-comprovado.** RLS "efetiva sem service_role" é evidência **do preview**, **não** de produção.

---

## 2. Matriz-resumo (visão de relance)

| SEC | Domínio | Controle (Plano Mestre) | Prio | Estado inicial (doc) | **Estado (gap)** | **Nível** | SEC↔CLD | Bloqueia prod. c/ dado real? |
|---|---|---|---|---|---|---|---|---|
| 001 | IAM | MFA obrigatório p/ contas privilegiadas | P0 | Amarelo | 🔴 VERMELHO | E0 | CLD-002 | **Sim** |
| 002 | IAM | RBAC + ABAC contextual | P0 | Azul | 🔴 VERMELHO | E1 | CLD-002 | **Sim** |
| 003 | IAM | PAM/JIT para privilégios | P0 | Azul | 🔴 VERMELHO | E0 | CLD-003 | **Sim** |
| 004 | Data | Isolamento por tenant/organização | P0 | Amarelo | 🟡 AMARELO | E3 | CLD-001, CLD-004 | **Sim** |
| 005 | API | Object-level authorization / BOLA | P0 | Amarelo | 🟡 AMARELO | E2 | CLD-006 | **Sim** |
| 006 | API | API Gateway, rate limit, schema validation | P0 | Azul/Amarelo | 🟡 AMARELO | E2 | CLD-006 | **Sim** |
| 007 | Crypto | KMS/secrets/rotação | P0 | Azul | 🟡 AMARELO | E2 | CLD-007 | **Sim** |
| 008 | Network | Segmentação e egress deny-by-default | P0 | Azul | 🔴 VERMELHO | E0¹ | CLD-004, CLD-005 | **Sim** |
| 009 | Logging | Auditoria de acesso clínico/eventos críticos | P0 | Amarelo | 🟡 AMARELO | E2 | CLD-008 | **Sim** |
| 010 | SIEM | Detecção e alertas de segurança | P0 | Azul | 🟡 AMARELO | E1 | CLD-009, CLD-010 | **Sim** |
| 011 | AI | AI Gateway (nenhum modelo fora do gateway) | P0 | Azul | 🟡 AMARELO | E2 | CLD-015 | **Sim** |
| 012 | AI | Tool Gateway + policy enforcement | P0 | Azul | 🔵 AZUL | E1² | CLD-015 | Condicional² |
| 013 | AI | Sandbox + egress control da IA | P0 | Azul | 🔴 VERMELHO | E0 | CLD-015, CLD-005 | **Sim** |
| 014 | FHIR | Validação de recursos/perfis | P0 | Azul | 🟡 AMARELO | E3³ | (CLD-004) | **Sim** |
| 015 | RNDS | Conformidade do adaptador RNDS | P0 | Azul | 🔵 AZUL | E0 | — | Só gate RNDS |
| 016 | SDLC | SAST/SCA/secret/IaC scanning no CI/CD | P0 | Azul | 🔴 VERMELHO | E0 | CLD-013 | **Sim** |
| 017 | SDLC | DAST/API security testing | P0 | Azul | 🔴 VERMELHO | E0 | CLD-013, CLD-006 | **Sim** |
| 018 | IR | Incident Response (playbooks+tabletop) | P0 | Azul | 🔴 VERMELHO | E0 | (CLD-012) | **Sim** |
| 019 | DR | Backup/restore/RPO/RTO | P0 | Azul | 🟡 AMARELO | E1 | CLD-011, CLD-012 | **Sim** |
| 020 | Assurance | Pentest independente | P0 | Azul | 🔴 VERMELHO | E0 | CLD-010 | **Sim** |
| 021 | Privacy | DPIA/RIPD e data inventory | P0 | Azul | 🔴 VERMELHO | E0 | — | **Sim** |
| 022 | Privacy | Retenção, descarte e direitos do titular | P0 | Azul | 🟡 AMARELO | E2 | CLD-011 | **Sim** |
| 023 | Third party | Due diligence de cloud/LLM/subprocessadores | P1 | Azul | 🔴 VERMELHO | E0 | — | Não (P1) |
| 024 | Assurance | SBOM e provenance de artefatos | P1 | Azul | 🔴 VERMELHO | E0 | CLD-014 | Não (P1) |
| 025 | Assurance | ISO 27001/27701/27799 readiness | P2 | Azul | 🟡 AMARELO | E1 | — | Não (P2) |

¹ SEC-008 **E0 no repositório**: nenhuma configuração de rede/egress versionada. Controles de rede podem existir no
provedor (Supabase/Vercel) mas **não são verificáveis a partir do material** → *não comprovado*, tratado como VERMELHO
até evidência.
² SEC-012: a IA **não usa tool-calling/functions hoje** → não há superfície de ferramenta a proteger. Controle
**AZUL** (a construir junto com qualquer adoção de tools). Só bloqueia produção **se/quando** tool-calling for
introduzido.
³ SEC-014: validação **estrutural** do grafo FHIR canônico existe e foi testada em ambiente isolado (**E3**);
validação de **perfis oficiais FHIR/BR-Core** é **E0**.

**Contagem:** 🔴 VERMELHO ×10 · 🟡 AMARELO ×9 · 🔵 AZUL ×2 · 🟢 VERDE ×0 · ⚫ PRETO ×0.
**P0 não-VERDE = 22/22** → nenhum P0 comprovado; **go-live com dado clínico real está bloqueado** por múltiplos P0.

---

## 3. Fichas por controle (evidência · nível · gap · risco · proposta · owner · dependências · gate)

> Formato por ficha: **Controle** · **Evidência concreta** · **Nível** · **Estado** · **Gap** · **Arquivo/recurso
> afetado** · **Mudança proposta (só proposta)** · **Risco** · **Owner** · **Dependências** · **SEC↔CLD** · **Gate (T)**.

### SEC-001 · IAM — MFA obrigatório para contas privilegiadas 🔴 VERMELHO (E0)
- **Evidência:** `src/app/login/page.tsx:22` `signInWithPassword(...)`, `:38` `signInWithOAuth(...)` — sem 2º fator, sem checagem `aal2`. Busca `mfa|aal2|totp|enrollMFA|listFactors` em `src/` e `apps/mobile/src/` → **zero** ocorrências reais. `supabase/config.toml` mínimo (só `project_id`), **sem** `[auth.mfa]`. Conta privilegiada gateada por e-mail hardcoded: `src/app/admin/page.tsx:14` `ADMIN_EMAIL = 'carinaleite.br@gmail.com'`.
- **Gap:** MFA não implementado nem arquitetado; admin (fundadora) autentica só com senha/OAuth; enforcement de `aal2` inexistente no servidor.
- **Arquivo/recurso:** `supabase/config.toml`, `src/app/login/page.tsx`, `src/app/admin/*`, rotas com `x-admin-secret`.
- **Mudança proposta:** habilitar `[auth.mfa]` (TOTP) no Supabase; exigir enrollment para e-mail(s) privilegiado(s); no servidor bloquear rotas admin quando `session.aal !== 'aal2'`.
- **Risco:** comprometimento de credencial única da conta com maior privilégio → acesso total a dados de saúde. **Crítico.**
- **Owner:** TBD (IAM). **Dependências:** identidade central (CLD-002). **SEC↔CLD:** CLD-002. **Gate:** **T1**.

### SEC-002 · IAM — RBAC + ABAC contextual 🔴 VERMELHO (E1)
- **Evidência:** sem tabela/coluna de papéis (`create role|user_roles|has_role|app_metadata|is_admin` em `supabase/migrations/**` → zero). Autorização real = **ownership por usuário**: `supabase/migrations/20260603165446_001_fix_rls_policies.sql:15-99` (`profiles/exams/biomarkers/ai_insights/biological_scores/daily_logs` todas `USING (auth.uid() = user_id)`). "Papel" privilegiado = e-mail hardcoded no cliente: `src/app/admin/page.tsx:123,197`; `src/app/admin/catalogo/page.tsx:21,190`. Intenção documentada não implementada: `docs/API-001_API_GOVERNANCE.md` §6.
- **Gap:** não há matriz de autorização por papel nem checagem contextual (clínico/organização). Só existem de fato "dono do recurso" (RLS) e "fundadora" (e-mail + secret).
- **Arquivo/recurso:** schema Supabase (falta `user_roles`/claims), `src/app/admin/*`, `src/app/api/**`.
- **Mudança proposta:** papéis via `app_metadata`/`user_roles` + custom claims JWT; substituir gate por e-mail por checagem de claim no servidor; modelar ABAC (paciente↔profissional↔organização) nas policies **quando** houver acesso multiusuário.
- **Risco:** impossível conceder acesso clínico legítimo sem expor tudo; gate de UI contornável. **Alto.**
- **Owner:** TBD (IAM). **Dependências:** SEC-001. **SEC↔CLD:** CLD-002. **Gate:** **T1**.

### SEC-003 · IAM — PAM/JIT para privilégios 🔴 VERMELHO (E0)
- **Evidência:** `service_role` permanente: `src/lib/connectors/runtime.server.ts:73-77` `adminClient()` → `createAdmin(URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SECRET_KEY)`; uso inline bypass RLS: `src/app/api/exams/[id]/route.ts:36-40`; também `src/app/api/account/route.ts`, `src/app/api/agenda/reminders/route.ts`, `src/app/api/connectors/[source]/*`. "PAM" atual = segredo estático `x-admin-secret` vs `process.env.ADMIN_SECRET` (`src/app/api/agenda/reminders/route.ts:35`, `src/app/api/email/welcome/route.ts:10-11`). Sem JIT/elevação temporária/cofre.
- **Gap:** privilégio elevado permanente e amplamente disponível ao runtime; sem concessão temporária, aprovação ou trilha de elevação; fallback `SUPABASE_SECRET_KEY` amplia superfície.
- **Arquivo/recurso:** `src/lib/connectors/runtime.server.ts`, `src/app/api/exams/[id]/route.ts`, rotas c/ `ADMIN_SECRET`, gestão de env (Vercel/Supabase).
- **Mudança proposta:** mover operações service-role para Edge Functions/RPC `SECURITY DEFINER` de escopo mínimo; trocar `ADMIN_SECRET` estático por tokens de curta duração/assinados; rotação de chaves; remover fallback.
- **Risco:** vazamento de chave/secret = comprometimento total persistente. **Crítico.**
- **Owner:** TBD (IAM/Plataforma). **Dependências:** SEC-007 (secrets), infra. **SEC↔CLD:** CLD-003. **Gate:** **T1**.

### SEC-004 · Data — Isolamento por tenant/organização 🟡 AMARELO (E3)
- **Evidência:** RLS `auth.uid() = user_id` em `supabase/migrations/20260603165446_001_fix_rls_policies.sql:15-99` + reforço nas rotas (`.eq('user_id', userId)`). **Comprovação isolada:** EXDOC-024 (Postgres isolado: B consultando `user_id=A` → 0) e EXDOC-025 (Preview Supabase real, role `authenticated`, **não** service_role: A vê 2 SR, B vê 1, **B→A = 0**). Isso é **E3** (isolado/sintético).
- **Gap:** **produção não comprovada** (E5 ausente); testes de cross-tenant em código de app são mockados; runtime de produção ainda usa `service_role` em várias rotas (que **bypassa** RLS — ver SEC-003).
- **Arquivo/recurso:** `supabase/migrations/**`, rotas `src/app/api/**`, suíte `tests/**`.
- **Mudança proposta:** teste automatizado de cross-tenant contra schema real (E4) e depois validação operacional (E5); reduzir uso de `service_role` no caminho de leitura de dados do usuário.
- **Risco:** vazamento entre usuários se uma rota service-role não escopar corretamente. **Alto** (mitigado hoje por dados sintéticos/ausência de dado real).
- **Owner:** TBD (Data). **Dependências:** SEC-003. **SEC↔CLD:** CLD-001, CLD-004. **Gate:** **T2** (validação E4/E5 no gate de dados reais).

### SEC-005 · API — Object-level authorization / BOLA 🟡 AMARELO (E2)
- **Evidência (positiva):** ownership por objeto, não só por id do path: `src/app/api/exams/[id]/route.ts:24-31` (`.eq('id',examId).eq('user_id',userId)`, 404 se não-dono; storage só se `path.startsWith(userId+'/')` `:48`); `src/app/api/insights/[id]/feedback/route.ts:35-44`; `src/app/api/omics/panels/[id]/ingest/route.ts:80-81`. Helpers: `src/lib/omics/server.ts:24-30`, `src/lib/supabase/authedClient.ts:32`.
- **Gap:** **sem testes de autorização negativa** (A acessa objeto de B → 404) em `tests/**`; **IDOR condicional** no fallback de webhook que confia em `userId` do corpo protegido só por segredo compartilhado: `src/app/api/connectors/[source]/webhook/route.ts:25,42-49`; catálogo global sem ownership (aceitável se sem PII): `src/app/api/omics/features/[id]/route.ts:13-16`.
- **Arquivo/recurso:** `src/app/api/**`, webhook de connectors, suíte de testes.
- **Mudança proposta:** testes de autz negativa por endpoint; verificar assinatura HMAC nativa do provedor no webhook em vez de `userId` do corpo.
- **Risco:** acesso indevido a objeto de outro titular via IDOR (webhook) ou regressão silenciosa. **Alto.**
- **Owner:** TBD (API). **Dependências:** — (testes são autônomos, código). **SEC↔CLD:** CLD-006. **Gate:** **T1/T3**.

### SEC-006 · API — API Gateway, rate limit, schema validation 🟡 AMARELO (E2 parcial)
- **Evidência:** rate limit só para IA, **in-memory por instância**: `src/lib/ai/rate-limiter.ts:14-30` (Map, 5/min/usuário; limitação documentada `:3-7`), aplicado só em `src/lib/ai/gateway.ts:265-266` (429). **Nenhuma outra rota** tem rate limit. **Sem** `src/middleware.ts` (gateway global inexistente). Validação de entrada ad-hoc (`src/app/api/profile/route.ts:43-55` casts sem validação; `insights/[id]/feedback:30`; `omics/panels/[id]/ingest:93-94`); `packages/validation` existe mas **não é usado nas rotas** (`zod|safeParse` ausente em `src/app/api/**`). Governança só documental: `docs/API-001_API_GOVERNANCE.md` §1/§4/§7.
- **Gap:** rate limit ineficaz em serverless e restrito à IA; sem gateway/middleware central; validação inconsistente.
- **Arquivo/recurso:** `src/lib/ai/rate-limiter.ts`, `src/lib/ai/gateway.ts`, `src/app/api/**`, `packages/validation`, infra (falta Redis/WAF).
- **Mudança proposta:** rate limit distribuído (Upstash/Redis) em middleware compartilhado; padronizar `safeParse` (zod/`@sintera/validation`) → 400 em cada handler; prefixo de versão (API-001 §1).
- **Risco:** abuso/DoS e payloads maliciosos aceitos. **Médio-Alto.**
- **Owner:** TBD (API). **Dependências:** infra (Redis) para rate global; validação é código autônomo. **SEC↔CLD:** CLD-006. **Gate:** **T3** (validação de schema já em T1 como código).

### SEC-007 · Crypto — KMS/secrets/rotação 🟡 AMARELO (E2)
- **Evidência:** **sem secrets hardcoded** (chaves via env: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`, `ANTHROPIC_API_KEY`, `CONNECTOR_WEBHOOK_SECRET`). Ausência de rotação/KMS/cofre no material. Proteção "leaked password" do Supabase aparenta **desligada** (não evidenciada como ativa). TLS em trânsito e criptografia em repouso são do provedor (não verificável no repo).
- **Gap:** sem rotação testada, sem KMS/cofre, sem inventário de segredos; fallback de chave (`|| SUPABASE_SECRET_KEY`) amplia exposição.
- **Arquivo/recurso:** gestão de env (Vercel/Supabase), `src/lib/connectors/runtime.server.ts`.
- **Mudança proposta:** cofre/KMS gerenciado; política e teste de rotação; ligar leaked-password protection; remover fallback de chave.
- **Risco:** segredo comprometido sem rotação = janela de exposição longa. **Alto.**
- **Owner:** TBD (Plataforma). **Dependências:** infra/cloud. **SEC↔CLD:** CLD-007. **Gate:** **T2** (baseline no **T0** cloud).

### SEC-008 · Network — Segmentação e egress deny-by-default 🔴 VERMELHO (E0 no repo / não comprovado)
- **Evidência:** **nenhuma** configuração de rede/egress versionada no repositório (sem IaC, sem VPC/subnet/regras). Banco Supabase e egress da app não têm política verificável no material.
- **Gap:** DB potencialmente acessível publicamente (não comprovado o contrário); egress da app **não** é deny-by-default; sem allowlist de integrações.
- **Arquivo/recurso:** infra de cloud (Supabase/Vercel), IaC inexistente.
- **Mudança proposta:** DB/data/security em rede privada; egress deny-by-default + allowlist; declarar como IaC versionável.
- **Risco:** exfiltração de dados por saída não controlada; exposição de DB. **Crítico** (ambiente com dado real).
- **Owner:** TBD (Cloud/Infra). **Dependências:** decisão de arquitetura de rede. **SEC↔CLD:** CLD-004, CLD-005. **Gate:** **T0/T4** (**material — requer seu gate**).

### SEC-009 · Logging — Auditoria de acesso clínico e eventos críticos 🟡 AMARELO (E2)
- **Evidência:** schema de auditoria existe (migração de consent/audit — `audit_events`, lida pelo adapter em EXDOC-024). Há logs operacionais/IA (`ai_processing_log`) e governança documental `docs/OPS-001_OBSERVABILITY_GOVERNANCE.md`. Porém `audit_events` **não está "fiado"** (não emitido no fluxo — no preview a única linha foi dado de teste, removida no rollback, EXDOC-025 §2).
- **Gap:** eventos de acesso clínico não são gravados de fato; sem integridade/append-only comprovado; sem pesquisa operacional.
- **Arquivo/recurso:** migração `..._142_...consent_audit`, camada de acesso a dados, `src/app/api/**`.
- **Mudança proposta:** emitir `audit_events` nos acessos/mutações críticas; garantir integridade (append-only/hash-chain) e retenção; tornar pesquisável.
- **Risco:** sem trilha, incidentes clínicos não são detectáveis nem investigáveis (LGPD/rastreabilidade). **Alto.**
- **Owner:** TBD (Data/Segurança). **Dependências:** SEC-002 (quem acessou), SEC-010. **SEC↔CLD:** CLD-008. **Gate:** **T2**.

### SEC-010 · SIEM — Detecção e alertas 🟡 AMARELO (E1)
- **Evidência:** governança de observabilidade documental (`docs/OPS-001_OBSERVABILITY_GOVERNANCE.md`) e alertas **operacionais** (não de segurança). Sem SIEM, sem casos de uso de detecção, sem correlação IAM/rede/app.
- **Gap:** nenhuma detecção de segurança; alertas críticos (brute force, escalonamento, egress anômalo) inexistentes.
- **Arquivo/recurso:** infra de logging/SIEM (inexistente), pipeline de alerta.
- **Mudança proposta:** centralizar logs (CLD-008) → SIEM com casos de uso críticos testados.
- **Risco:** ataque em curso passa despercebido. **Alto.**
- **Owner:** TBD (SecOps). **Dependências:** SEC-009 (fonte), rede. **SEC↔CLD:** CLD-009, CLD-010. **Gate:** **T4**.

### SEC-011 · AI — AI Gateway (nenhum modelo acessa dados fora do gateway) 🟡 AMARELO (E2)
- **Evidência:** existe gateway central `src/lib/ai/gateway.ts` (rate limit, tratamento) — **mas** ~10 chamadas diretas ao SDK Anthropic **bypassam** o gateway enviando dado clínico direto ao LLM: `src/lib/ai/issuer.ts`, `document-understanding.ts`, `document-classifier.ts`, `requestingPhysician.ts`, e rotas `medications/scan`, `capture/classify`, `vision/*`, `omics/*/ingest-pdf`.
- **Gap:** o gateway **não é o único caminho**; política central (rate/redação/allowlist de dados) não é aplicada nos bypasses.
- **Arquivo/recurso:** `src/lib/ai/*`, rotas de IA acima.
- **Mudança proposta:** rotear 100% das chamadas de IA pelo gateway (proibir import direto do SDK fora dele via lint rule); centralizar redação de PII e política.
- **Risco:** dado clínico enviado ao modelo sem controle/registro. **Alto.**
- **Owner:** TBD (IA/Plataforma). **Dependências:** —. **SEC↔CLD:** CLD-015. **Gate:** **T3**.

### SEC-012 · AI — Tool Gateway + policy enforcement 🔵 AZUL (E1)
- **Evidência:** a IA **não usa tool-calling/functions** hoje (sem allowlist porque não há ferramentas). Nada a proteger ainda.
- **Gap:** controle inexistente, mas **sem superfície atual**; torna-se necessário ao adotar tools/agentes.
- **Arquivo/recurso:** `src/lib/ai/*` (futuro).
- **Mudança proposta:** ao introduzir tools, allowlist + autorização por chamada + auditoria.
- **Risco:** baixo hoje; alto se tools forem adicionadas sem controle. **Condicional.**
- **Owner:** TBD (IA). **Dependências:** SEC-011. **SEC↔CLD:** CLD-015. **Gate:** **T3** (quando aplicável).

### SEC-013 · AI — Sandbox + egress control da IA 🔴 VERMELHO (E0)
- **Evidência:** processamento de IA roda **in-process** no runtime da app, com acesso ao mesmo ambiente/DB de produção e **egress irrestrito** (chamadas SDK diretas). Sem isolamento/sandbox.
- **Gap:** IA não isolada; sem egress bloqueado; acesso a produção não segregado.
- **Arquivo/recurso:** `src/lib/ai/*`, rotas de IA, arquitetura de runtime.
- **Mudança proposta:** executar IA em runtime isolado sem credenciais de produção; egress deny-by-default + allowlist (só endpoint do provedor).
- **Risco:** prompt injection/exfiltração com acesso direto a dados sensíveis. **Crítico.**
- **Owner:** TBD (IA/Cloud). **Dependências:** SEC-008 (egress), SEC-011. **SEC↔CLD:** CLD-015, CLD-005. **Gate:** **T3/T4** (**material — runtime/rede**).

### SEC-014 · FHIR — Validação de recursos/perfis 🟡 AMARELO (E3 estrutural / E0 perfis)
- **Evidência:** validação **estrutural** do grafo canônico existe e é testada: `src/lib/fhir/canonical/validate.ts` (`validateStructural`: refs resolvidas, ids únicos, RNDS desacoplado, coding honesto) + testes `tests/fhir/*` e E2E do preview (EXDOC-025) — **E3**. **Não** valida perfis oficiais FHIR R4/BR-Core (cardinalidades/bindings normativos).
- **Gap:** payload pode ser estruturalmente coerente mas não conforme a perfil oficial; nenhuma rejeição por perfil.
- **Arquivo/recurso:** `src/lib/fhir/canonical/*`.
- **Mudança proposta:** validação contra perfis oficiais (FHIR validator/BR-Core) antes de qualquer emissão externa; rejeitar inválidos.
- **Risco:** interoperabilidade incorreta; dado mal formado exportado. **Médio** (mitigado: nada é exportado hoje).
- **Owner:** TBD (FHIR). **Dependências:** curadoria de perfis. **SEC↔CLD:** CLD-004 (FHIR store privado). **Gate:** **T3**.

### SEC-015 · RNDS — Conformidade do adaptador 🔵 AZUL (E0, diferido)
- **Evidência:** **não há** adaptador/integração RNDS (por design — desacoplamento é invariante do projeto; `isRndsDecoupled` em `validate.ts`). Gate RNDS **não autorizado/aberto**.
- **Gap:** adaptador inexistente (esperado nesta fase).
- **Arquivo/recurso:** — (futuro adaptador).
- **Mudança proposta:** ao abrir o gate RNDS, construir adaptador com testes de conformidade do fluxo específico.
- **Risco:** nenhum hoje (fora de escopo). **Baixo.**
- **Owner:** TBD (Interop). **Dependências:** decisão regulatória/gate RNDS. **SEC↔CLD:** —. **Gate:** **fora de T0→T6** (gate RNDS próprio).

### SEC-016 · SDLC — SAST/SCA/secret/IaC scanning no CI/CD 🔴 VERMELHO (E0)
- **Evidência:** CI só faz `typecheck/test/build/lint` (`.github/workflows/ci.yml`); `concurrency-harness.yml` é harness de teste. **Sem** SAST, SCA, secret-scanning, IaC scan, Dependabot.
- **Gap:** vulnerabilidades de código/dependências/segredos não são detectadas no pipeline.
- **Arquivo/recurso:** `.github/workflows/*`.
- **Mudança proposta:** adicionar gates: CodeQL/Semgrep (SAST), dependency scan/Dependabot (SCA), gitleaks/secret-scan, checkov/tfsec (IaC) — bloqueando findings críticos.
- **Risco:** regressões de segurança e segredos vazam sem barreira. **Alto.**
- **Owner:** TBD (SDLC). **Dependências:** — (código de CI, **autônomo**). **SEC↔CLD:** CLD-013. **Gate:** **T5** (candidato a lote **autônomo** cedo — só CI).

### SEC-017 · SDLC — DAST/API security testing 🔴 VERMELHO (E0)
- **Evidência:** nenhum teste dinâmico de segurança (ZAP/schema fuzzing) em `tests/**` ou CI.
- **Gap:** superfície de API não é exercitada por ataque dinâmico.
- **Arquivo/recurso:** CI, suíte de testes.
- **Mudança proposta:** DAST em staging (ZAP baseline) + testes de segurança de API (authz/负载); sem vuln crítica aberta.
- **Risco:** falhas expostas só em runtime não detectadas. **Médio-Alto.**
- **Owner:** TBD (SDLC/SecOps). **Dependências:** ambiente staging (SEC-004/CLD-001). **SEC↔CLD:** CLD-013, CLD-006. **Gate:** **T5**.

### SEC-018 · IR — Incident Response 🔴 VERMELHO (E0)
- **Evidência:** sem playbook de IR, sem tabletop, sem plano de resposta em `docs/**`.
- **Gap:** nenhum processo de resposta a incidente; papéis/escalonamento indefinidos.
- **Arquivo/recurso:** `docs/` (IR inexistente).
- **Mudança proposta:** playbooks (detecção→contenção→erradicação→recuperação→lições), contatos, e tabletop executado.
- **Risco:** resposta lenta/ad-hoc a incidente com dado de saúde (obrigações LGPD/ANPD). **Alto.**
- **Owner:** TBD (SecOps). **Dependências:** SEC-009/010. **SEC↔CLD:** (CLD-012). **Gate:** **T5** (doc autônomo; tabletop antes do go-live).

### SEC-019 · DR — Backup/restore/RPO/RTO 🟡 AMARELO (E1)
- **Evidência:** runbook existe (`docs/OPS-002_RELEASE_BACKUP_RUNBOOK.md`). Backups gerenciados do Supabase (provedor). **RPO/RTO não quantificados**; **restore não testado**; sem cópias imutáveis/isoladas comprovadas.
- **Gap:** DR não testado; objetivos não definidos; imutabilidade não comprovada.
- **Arquivo/recurso:** `docs/OPS-002...`, config de backup do provedor.
- **Mudança proposta:** definir RPO/RTO; backup vault imutável; **teste de restore** documentado (evidência).
- **Risco:** perda de dados/indisponibilidade sem recuperação garantida. **Alto.**
- **Owner:** TBD (Plataforma). **Dependências:** cloud. **SEC↔CLD:** CLD-011, CLD-012. **Gate:** **T5**.

### SEC-020 · Assurance — Pentest independente 🔴 VERMELHO (E0)
- **Evidência:** nenhum relatório/evidência de pentest.
- **Gap:** sem avaliação adversarial independente.
- **Arquivo/recurso:** — (assurance externo).
- **Mudança proposta:** pentest independente pré go-live clínico; nenhum finding crítico aberto.
- **Risco:** falhas exploráveis desconhecidas em produção. **Alto.**
- **Owner:** TBD (terceiro). **Dependências:** ambiente estável (T1–T4). **SEC↔CLD:** CLD-010. **Gate:** **T6**.

### SEC-021 · Privacy — DPIA/RIPD e data inventory 🔴 VERMELHO (E0)
- **Evidência:** sem RIPD/DPIA, sem inventário/ROPA formal em `docs/**` (há classificação C0–C5 conceitual, mas não um RIPD aprovado).
- **Gap:** riscos de privacidade não avaliados/documentados; inventário de dados/fluxos ausente formalmente.
- **Arquivo/recurso:** `docs/` (privacidade).
- **Mudança proposta:** RIPD/DPIA + ROPA + data inventory por domínio (LGPD art. 38).
- **Risco:** não conformidade LGPD; tratamento de dado sensível sem avaliação. **Alto.**
- **Owner:** TBD (DPO/Privacidade). **Dependências:** inventário (SEC-009 ajuda). **SEC↔CLD:** —. **Gate:** **T2** (doc autônomo; aprovação antes de dado real).

### SEC-022 · Privacy — Retenção, descarte e direitos do titular 🟡 AMARELO (E2)
- **Evidência:** exclusão LGPD implementada: `src/app/api/account/route.ts` (deleção de conta) e `src/app/api/account/export/route.ts` (exportação); consentimento versionado: `src/app/api/consent/route.ts` (+ migração de consent). Sem automação de **retenção/descarte** por política nem prazos definidos; portabilidade em formato padronizado não comprovada.
- **Gap:** falta política de retenção/descarte automatizada e testada; formato de portabilidade não normatizado.
- **Arquivo/recurso:** `src/app/api/account/*`, `src/app/api/consent/route.ts`, schema.
- **Mudança proposta:** políticas de retenção/descarte (jobs) + testes; padronizar export/portabilidade.
- **Risco:** dado retido além do necessário; direito do titular parcialmente atendido. **Médio.**
- **Owner:** TBD (Privacidade/Data). **Dependências:** SEC-021. **SEC↔CLD:** CLD-011. **Gate:** **T2**.

### SEC-023 · Third party — Due diligence de cloud/LLM/subprocessadores 🔴 VERMELHO (E0)
- **Evidência:** subprocessadores identificáveis pelo stack (Supabase, Anthropic, Vercel, Resend) mas **sem** registro/due diligence/contratos documentados.
- **Gap:** risco de terceiros não avaliado; DPA/subprocessadores não registrados.
- **Arquivo/recurso:** `docs/` (terceiros).
- **Mudança proposta:** registro de subprocessadores + due diligence + DPAs aprovados.
- **Risco:** exposição via terceiro sem contrato/avaliação. **Médio** (P1).
- **Owner:** TBD (Jurídico/Privacidade). **Dependências:** —. **SEC↔CLD:** —. **Gate:** **T5**.

### SEC-024 · Assurance — SBOM e provenance de artefatos 🔴 VERMELHO (E0)
- **Evidência:** sem geração de SBOM, sem assinatura/verificação de artefatos, registry não privado/assinado.
- **Gap:** cadeia de suprimentos não verificável.
- **Arquivo/recurso:** CI/CD, build.
- **Mudança proposta:** SBOM por release (CycloneDX/syft) + assinatura/verificação (cosign/SLSA).
- **Risco:** artefato adulterado não detectável. **Médio** (P1).
- **Owner:** TBD (SDLC). **Dependências:** SEC-016. **SEC↔CLD:** CLD-014. **Gate:** **T5** (candidato a lote **autônomo** — CI).

### SEC-025 · Assurance — ISO 27001/27701/27799 readiness 🟡 AMARELO (E1)
- **Evidência:** roadmap/mapeamento de governança existe (`docs/COMPLIANCE-001_GOVERNANCA.md`); sem SoA/declaração de aplicabilidade formal; **ISO 27799 (saúde) ausente**.
- **Gap:** readiness formal e SoA inexistentes; controle de saúde específico não mapeado.
- **Arquivo/recurso:** `docs/COMPLIANCE-001...`.
- **Mudança proposta:** SoA + readiness assessment + incluir ISO 27799.
- **Risco:** certificação/maturidade não demonstrável. **Baixo-Médio** (P2).
- **Owner:** TBD (Compliance). **Dependências:** SEC-001..024. **SEC↔CLD:** —. **Gate:** **T6**.

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
| 014 FHIR validação | (**CLD-004**) | FHIR store privado. |
| 016 SAST/SCA/secret/IaC | **CLD-013** CI/CD security | Gates no pipeline. |
| 017 DAST | **CLD-013** + **CLD-006** | Teste dinâmico + proteção de API. |
| 019 Backup/DR | **CLD-011** Backup · **CLD-012** DR | Restore/RTO/RPO testados. |
| 020 Pentest | **CLD-010** CSPM/CNAPP | Achados críticos tratados. |
| 022 Retenção | **CLD-011** | Retenção de backup. |
| 024 SBOM/provenance | **CLD-014** Artifact integrity | Registry privado + assinatura. |
| 015 RNDS · 018 IR · 021 DPIA · 023 Third-party · 025 ISO | — | Sem CLD direto (governança/assurance/privacidade). |

---

## 5. Sequência de remediação T0 → T6 (proposta; **nenhuma execução agora**)

> Agrupamento por **lote material**. Dentro de um lote aprovado, execução autônoma; a **abertura** de cada lote que
> toque prod/IAM/rede/KMS/cloud/DB é **gate material seu**.

### T0 — Fundação de cloud/infra (P0 estrutural) — **material, requer seu gate**
Pré-requisito de quase tudo. Mapeia a **CLD-001..009**:
- **CLD-001** ambientes separados (prod/staging/dev) — hoje **só existe produção** (EXDOC-024 §6, EXDOC-025 §6).
- **CLD-004** DB/data privados; **CLD-005** egress deny-by-default (**SEC-008**).
- **CLD-002** identidade central + MFA baseline (**SEC-001**).
- **CLD-007** KMS/secrets baseline (**SEC-007**).
- **CLD-008** central logging (**SEC-009** fonte).
> Natureza: IAM/rede/cloud/DB. **Não autônomo.**

### T1 — Identidade e acesso — **material (IAM)**
**SEC-001** MFA · **SEC-002** RBAC/ABAC · **SEC-003** PAM/JIT · **SEC-005** BOLA (+ testes negativos) · **SEC-006**
schema validation (parte de código é autônoma).

### T2 — Dados / criptografia / logging / privacidade
**SEC-004** isolamento (validação E4/E5 — **material**, gate de dados reais) · **SEC-007** rotação/KMS (**material**) ·
**SEC-009** wiring de `audit_events` (código autônomo) · **SEC-021** DPIA/RIPD (doc autônomo) · **SEC-022** retenção
(código autônomo).

### T3 — API / FHIR / IA
**SEC-006** rate limit distribuído (infra) · **SEC-011** unificar IA no gateway (código autônomo) · **SEC-012** tool
gateway (quando aplicável) · **SEC-013** sandbox/egress de IA (**material — runtime/rede**) · **SEC-014** perfis FHIR
(código autônomo).

### T4 — Cloud / rede / SIEM — **material**
**SEC-008** segmentação/egress · **SEC-010** SIEM (**CLD-009/010**).

### T5 — SDLC / IR / DR / assurance
**SEC-016** SAST/SCA/secret/IaC no CI (**autônomo, cedo**) · **SEC-017** DAST (staging) · **SEC-018** IR playbooks+tabletop ·
**SEC-019** RPO/RTO+restore testado · **SEC-023** due diligence terceiros · **SEC-024** SBOM/provenance (**autônomo**).

### T6 — Validação final e go-live
**SEC-020** pentest independente · **SEC-025** ISO/SoA readiness · **gate de produção com dado real** (backfill +
validação E5) — todos os P0 em 🟢 VERDE (impl+teste+resultado+evidência+owner).

---

## 6. Distinção Preview × Produção (não extrapolar)

| Aspecto | Preview sintético (EXDOC-024/025) | Produção |
|---|---|---|
| RLS efetiva (authenticated, não service_role) | ✅ **comprovada (E3)** — B→A = 0 | ❓ **não comprovada** |
| Isolamento por usuário | ✅ isolado/sintético | ❓ não comprovado; runtime ainda usa service_role em rotas |
| Grafo FHIR estrutural | ✅ validado (E3) | ❓ sem dado real canônico (backfill não autorizado) |
| Dado clínico real presente | ❌ não (sintético) | ❌ **não** (por isso ⚫ PRETO é hoje não aplicável) |

**Conclusão de leitura:** a força real hoje é o **isolamento por usuário via RLS**, comprovado **em preview** (E3). Tudo
o mais em produção é **não comprovado**. As maiores lacunas são **identidade forte (MFA)**, **modelo de papéis
(RBAC/ABAC)**, **gestão de privilégio (PAM/JIT)**, **isolamento de IA (sandbox/egress)** e **DevSecOps (SAST/SCA/DAST)**.

---

## 7. O que pode ser autônomo vs. o que exige seu gate

**Candidatos a lote autônomo** (código/CI/doc no repositório, sem tocar prod/IAM/rede/KMS/DB, revisável por PR):
SEC-005 (testes de autz negativa), SEC-006 (validação zod nas rotas), SEC-009 (emitir `audit_events` no código),
SEC-011 (unificar IA no gateway + lint rule), SEC-014 (validação de perfis), SEC-016 (workflows SAST/SCA/secret),
SEC-024 (SBOM no CI), SEC-018/019/021/023/025 (documentos: IR, DR objetivos, DPIA/RIPD, registro de terceiros, SoA).

**Exigem seu gate material** (prod/IAM/rede/egress/KMS/cloud/DB/backfill/RNDS): T0 inteiro, SEC-001/002/003 (IAM),
SEC-004 validação E4/E5, SEC-007 (KMS/rotação), SEC-008 (rede/egress), SEC-010 (SIEM/infra), SEC-013 (runtime isolado),
SEC-017 (DAST em staging), SEC-020 (pentest), gate de dados reais e gate RNDS.

---

## 8. Estado

Diagnóstico **concluído** (SEC-001…SEC-025 + SEC↔CLD + T0→T6). **Nada implementado, alterado ou corrigido.** Produção,
IAM, RLS, rede, KMS, secrets, DB e infra **intocados**. Dados reais **não acessados**. Aguardando sua **revisão da
matriz** para, então, autorizar a **abertura do primeiro lote material** (ou de um lote autônomo de código/CI/doc).
Nenhum gap será corrigido automaticamente antes da sua aprovação por lote.
