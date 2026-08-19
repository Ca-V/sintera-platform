# EXDOC-029 — Planejamento do Gate S0 (fundação): SEC-007 · SEC-008 · Separação de ambientes · SEC-003 (plano)

> **Natureza:** planejamento **read-only**. **Nada foi implementado, alterado, rotacionado, criado ou mergeado.**
> Sem produção, IAM, RLS, KMS/secrets reais, rede/egress, dados reais, backfill, RNDS/OpenCare, SEC-009, SEC-011,
> Ciclo 1. **Baseline congelado:** `feat/fase-c-sql-source @ d440b64`. **Data:** 2026-08-19. Fontes: código
> (`process.env.*`, hosts, `fetch`), `supabase/config.toml`, `next.config.ts`, `.gitignore`, EXDOC-026 v2 / 027 / 028.
> **Regra mantida:** *evidência ≠ promoção de controle*; nenhum controle vira 🟢 VERDE por existir doc/design.

---

## 1. SEC-007 — Secrets / KMS (inventário + desenho-alvo)

### 1.1 Inventário atual (consumido no código, via `process.env`)
| Segredo/Config | Ocorrências | Classe | Onde é consumido |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | 23 | **Secret de produção** | `src/lib/ai/*`, rotas de IA (vision, capture, medications, omics, exams) |
| `SUPABASE_SERVICE_ROLE_KEY` | 7 | **Secret de produção (bypassa RLS)** | `runtime.server.ts`, account, waitlist, exams/[id], consent, reminders |
| `SUPABASE_SECRET_KEY` | 7 | **Secret de produção (fallback)** | mesmos pontos (fallback de service role) |
| `RESEND_API_KEY` | 2 | **Secret de produção** | `src/lib/email/*` |
| `ADMIN_SECRET` | 2 | **Secret compartilhado estático** | `agenda/reminders`, `email/welcome` (`x-admin-secret`) |
| `CONNECTOR_WEBHOOK_SECRET` | 1 | **Secret compartilhado estático** | `connectors/[source]/webhook` |
| `WHATSAPP_CLOUD_TOKEN` | 2 | **Secret de produção** | `src/lib/whatsapp/send.ts` |
| `WITHINGS_CLIENT_SECRET` | 1 | **Secret de produção** | connector Withings |
| `NEXT_PUBLIC_SUPABASE_URL` | 12 | Público (config) | cliente/servidor Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 5 | Público (limitado por RLS) | cliente Supabase |
| `WHATSAPP_PHONE_NUMBER_ID` / `WABA_ID` / `TEMPLATE_*` | 5 | Config | WhatsApp |
| `WITHINGS_CLIENT_ID` / `WITHINGS_REDIRECT_URI` | 2 | Config | connector |
| `CONNECTOR_PUBLIC_BASE_URL` | 1 | Config | webhooks de connectors |
| `NODE_ENV`, `NEXT_PUBLIC_*_V2`, `*_DEMO_FEATURES`, `CATALOG_CACHE_TTL_MS` | 8 | Flags/config | feature flags/tuning |

### 1.2 Quais são credenciais de produção
Os 8 **secrets** acima (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`,
`ADMIN_SECRET`, `CONNECTOR_WEBHOOK_SECRET`, `WHATSAPP_CLOUD_TOKEN`, `WITHINGS_CLIENT_SECRET`). `NEXT_PUBLIC_*` **não**
são secrets (embutidos no bundle).

### 1.3 Mecanismos de armazenamento/rotação
- **Comprovado:** nenhum secret **hardcoded** no repo; `.gitignore` cobre `.env*` (só `.env.example` permitido);
  segredos injetados por **variáveis de ambiente** (Vercel/Supabase integration).
- **Não verificável a partir do material:** cofre/KMS gerenciado, **política/rotação** de chaves, criptografia em
  repouso do provedor, *leaked-password protection* do Supabase, e **se os secrets diferem por ambiente**.

### 1.4 Desenho-alvo (proposta; NÃO executar)
1. **Cofre/KMS gerenciado** para os 8 secrets, com **ownership** e inventário versionado (sem valores).
2. **Rotação** com procedimento testado (evidência de rotação sem downtime).
3. **Remover o fallback** `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SECRET_KEY` → **uma** chave por ambiente.
4. Substituir `ADMIN_SECRET`/`CONNECTOR_WEBHOOK_SECRET` estáticos por **tokens curtos/assinados** (cruza SEC-003/005).
5. **Secrets distintos por ambiente** (pré-requisito da separação — §3).
6. Ligar *leaked-password protection*.
> **Nenhuma rotação/alteração real** é feita aqui. Implementação = material (S0/S1), exige sua autorização + Cloud.

---

## 2. SEC-008 — Rede / Egress (inventário read-only + desenho-alvo)

### 2.1 Endpoints externos usados (egress de servidor)
| Host | Uso | Origem |
|---|---|---|
| Supabase (`NEXT_PUBLIC_SUPABASE_URL`) | DB/Auth/Storage | onipresente |
| `api.anthropic.com` (via `@anthropic-ai/sdk`) | LLM (texto clínico) | `src/lib/ai/*`, rotas IA |
| Resend (via `resend`) | e-mail transacional | `src/lib/email/*` |
| `graph.facebook.com/v21.0` | WhatsApp Cloud API | `src/lib/whatsapp/send.ts` |
| `wbsapi.withings.net`, `account.withings.com` | connector Withings | connectors |
| `connect.medlineplus.gov` | conteúdo educativo | `src/lib/education/medlineplus.ts` |
| `CONNECTOR_PUBLIC_BASE_URL` | callbacks de webhook | connectors |
| (cliente) `calendar.google.com`, `outlook.live.com`, `sinteramais.com.br` | deep-links no browser (não é egress de servidor) | UI |

### 2.2 Arquivos com `fetch(` (egress HTTP de servidor)
`agenda/reminders`, `exams/[id]/analyze`, `exams/process-pending`, `lib/education/medlineplus`, `lib/omics/ingestClient`,
`lib/whatsapp/send`, `lib/medications/scanImage` (+ `lib/novelty/useNovelty` = cliente).

### 2.3 Topologia atual (o que é comprovável)
- **Comprovado:** `next.config.ts` **não** define rewrites/headers/allowlist de domínios; **nenhuma** config de rede/IaC
  versionada; egress é **allow-by-default**.
- **Não verificável:** se o **DB Supabase é publicamente acessível**, se as funções Vercel têm qualquer restrição de
  saída, e se há segmentação (data/security/app). → tratado como **não comprovado**, não como "ausente comprovado".

### 2.4 Desenho-alvo (proposta; NÃO executar)
1. **Egress deny-by-default** + **allowlist** exatamente dos hosts em §2.1 (Supabase, Anthropic, Resend, Graph/WhatsApp,
   Withings, MedlinePlus).
2. **DB/data/security privados** (não públicos); regras explícitas de ingress/egress.
3. **Segmentação** (app × dados × segurança) declarada como **IaC** versionável.
4. Teste de **saída não autorizada bloqueada** (evidência).
> **Nenhuma alteração de rede/IaC/cloud** aqui.

---

## 3. Separação de ambientes (mapeamento read-only)

### 3.1 O que existe de fato × conceito
| Ambiente | Existe? | Evidência | Isolamento de dados/secrets |
|---|---|---|---|
| **PROD** | **Sim (real)** | `supabase/config.toml`: migrações aplicadas ao mergear em **`main`**; projeto Supabase de produção (`pxiglvrgxooawetboglb`); Vercel produção | — |
| **PREVIEW** | **Sim, mas parcial** | deploys **Vercel por branch** (visto nos PRs #153/#154); **Supabase Preview = `skipped`** no CI | **Provável compartilhamento do Supabase de produção** (sem branch de DB) → **sem isolamento de dados** |
| **STAGING** | **Não (conceito)** | nenhuma evidência de projeto/branch dedicado | — |
| **DEV** | **Local apenas** | `.env*` local (não commitado) | isolado por máquina do dev |

### 3.2 Fluxo de deploy
`push em branch` → **Vercel preview** (efêmero) · `merge em main` → **GitHub Integration aplica migrações** ao Supabase
de produção + **Vercel produção**.

### 3.3 Onde secrets/banco/storage/serviços diferem
- **Banco/Storage:** aparentemente **um único** projeto Supabase (prod) — preview/dev sem DB próprio comprovado.
- **Secrets:** um conjunto de env por projeto (Vercel/Supabase) — **não comprovado** que preview usa secrets distintos.
- **Serviços externos:** mesmos endpoints (Anthropic/Resend/WhatsApp/Withings) para todos os ambientes (sem sandbox).

### 3.4 Existe isolamento real?
**Não comprovado — e provavelmente não, na camada de dados.** O preview parece consumir o **Supabase de produção**
(Supabase Preview *skipped*). Consistente com EXDOC-024/025 (“só há o projeto de produção”). **Este é o bloqueador
central do S0:** sem um não-produção isolado, os gates S1/S2 seriam testados contra dados/segredos de produção.
> **Nenhum ambiente foi criado.**

---

## 4. SEC-003 — Remediação (plano-alvo a partir do inventário do Lote 2)

> Baseia-se no `docs/SEC-003_INVENTARIO_PRIVILEGIO.md` (Lote 2). **Não executa remediação.**

| Vetor | Estado atual | Alvo (princípio) | Depende de |
|---|---|---|---|
| **`service_role`** | fábrica `adminClient()` + inline em 5 rotas; **bypassa RLS**; permanente | mover operações privilegiadas para **RPC `SECURITY DEFINER`** de escopo mínimo; reduzir service_role no **caminho de leitura** da usuária | **S1/IAM** (quem pode invocar), SEC-007 |
| **`ADMIN_SECRET`** | segredo estático (reminders, welcome) | **token curto/assinado** ou OIDC do pg_cron | SEC-007 (assinatura) |
| **`CONNECTOR_WEBHOOK_SECRET`** | confia no `userId` do corpo | **HMAC nativo** do provedor | SEC-005 (decisão) |
| **Fallback `SUPABASE_SECRET_KEY`** | duas chaves aceitas | **uma** chave/ambiente | SEC-007 |
| **RPC × RLS** | hoje service_role contorna RLS | preferir **RLS-scoped**; RPC `SECURITY DEFINER` **só** p/ operações genuinamente cross-user, com escopo interno | **S1/IAM** |

**Conclusão SEC-003:** o plano-alvo está claro, mas **toda** a execução depende de **S1/IAM** (modelo de papéis para
autorizar RPC) e de **SEC-007** (assinatura/rotação). **Não abrir agora.**

---

## 5. Dependências para abrir S1 (o que precisa estar pronto em S0)

**Pré-requisitos de S0 antes de SEC-001/002/003/005/009:**
1. **Ambiente não-produção isolado** (§3) — para testar IAM/RLS/PAM **sem** tocar dados/segredos de produção.
2. **Baseline de secrets/KMS** (SEC-007) — antes de rotacionar/assinar tokens ou remover fallback.
3. **Baseline de rede/egress + DB privado** (SEC-008) — reduz raio de explosão de mudanças de IAM.
4. **Identidade central** (CLD-002) — base para MFA/RBAC.

**Riscos de executar S1 antes de S0:**
- Testar mudanças de **IAM/RLS/PAM contra produção** (exposição/queda).
- **Rotacionar/alterar secrets sem KMS/rollback** (perda de acesso).
- Introduzir papéis/RPC **sem ambiente de validação** (regressões silenciosas em dados reais).
> **Nenhum controle S1 é aberto neste documento.**

---

## 6. Matriz S0

| Controle | Estado atual | Evidência | Gap | Dependência | Ação futura | Responsável | Autorização necessária |
|---|---|---|---|---|---|---|---|
| **SEC-007** Secrets/KMS | 🟡 (E2) | sem hardcode; env via provedor | rotação/KMS/cofre; fallback | Cloud/KMS | inventário→cofre→rotação testada | Plataforma (owner TBD) | **você** + Cloud |
| **SEC-008** Rede/Egress | 🔴 (E0/não verif.) | sem IaC; allow-by-default | egress deny + DB privado | Provedor/IaC | desenho→IaC→teste de bloqueio | Cloud/Infra (TBD) | **você** + Cloud |
| **Separação ambientes** | Parcial (só prod real) | Vercel preview; Supabase Preview *skipped* | não-prod isolado | Supabase Pro/branching ou projeto dedicado | provisionar não-prod isolado | Cloud/Plataforma (TBD) | **você** (custo/arquitetura) |
| **SEC-003** (plano) | 🔴 | inventário L2 | remediação | S1/IAM + SEC-007 | plano→(impl em S1) | IAM/Plataforma (TBD) | **você** (S1) |

**Nenhum 🟢 VERDE.** SEC-007 permanece 🟡, SEC-008 permanece 🔴 (não verificável ≠ ausente), SEC-003 🔴.

---

## 7. Regra de evidência (reafirmada)
Este documento é **design/inventário** — **não** promove nenhum controle. VERDE exige **implementação + teste +
resultado + evidência operacional (E4/E5) + owner**. Ausência de evidência (ex.: SEC-008) é registrada como
**não comprovado/não verificável**, nunca como “controle inexistente comprovado”.

---

## 8. Proposta de Gate S0

### 8.1 Critérios de ENTRADA
- Baseline congelado (`d440b64`) ✔ · inventários read-only completos (este doc) ✔ · **owner de Cloud/Infra atribuído** ·
  decisão da proprietária de **prosseguir com separação de ambientes** (custo/arquitetura).

### 8.2 Critérios de SAÍDA (todos com evidência E4+)
1. **Ambiente não-produção isolado** (DB/secrets/serviços próprios; preview **não** usa produção).
2. **Secrets/KMS:** cofre gerenciado + **rotação testada** + fallback `SUPABASE_SECRET_KEY` **removido** + secrets por ambiente.
3. **Rede/egress:** **deny-by-default** + allowlist dos hosts de §2.1 + **DB privado** (não público) + **teste de bloqueio** de saída não autorizada.
4. **Logging central** baseline (fonte para SEC-009/010 — sem abrir SEC-009).
5. Evidências reproduzíveis arquivadas (EXDOC).

### 8.3 Evidências necessárias
Prova de topologia (projetos/keys separados) · log de teste de rotação · teste de egress bloqueado · prova de DB não
público · matriz de secrets por ambiente (sem valores).

### 8.4 Dependem de **decisão da proprietária**
Prosseguir com separação de ambientes (custo Supabase Pro/branching ou projeto dedicado) · aprovar arquitetura de rede ·
atribuir owner de Cloud · autorizar remoção do fallback de chave.

### 8.5 Dependem de **Cloud**
Projeto(s) Supabase não-prod · escopo de env do Vercel por ambiente · configuração de rede/egress · KMS/cofre.

### 8.6 Dependem de **DPO/Jurídico**
Nenhum item **executável** de S0 depende de DPO. (A classificação de dados C0–C5 apenas **informa** a segmentação; o
RIPD/DPIA é S3.)

### 8.7 Explicitamente **FORA** do Gate S0
SEC-001/002 (IAM impl) · SEC-003 remediação (S1) · SEC-005 HMAC · **SEC-009** · **SEC-011** · SEC-013 (S2) · DAST/pentest ·
RNDS/OpenCare · dados reais/backfill · tornar CI bloqueante · Ciclo 1.

---

## 9. Estado
Planejamento S0 **completo e read-only**. **Nada implementado/alterado/rotacionado/criado.** Baseline `d440b64`
intocado. Aguardando sua revisão para decidir: (a) qual **preparação read-only** adicional deseja, ou (b) **abrir o
Gate S0** (material — Cloud/owner), que exige sua autorização explícita e um owner de Cloud/Infra.
