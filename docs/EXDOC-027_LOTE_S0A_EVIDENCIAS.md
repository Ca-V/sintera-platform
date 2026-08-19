# EXDOC-027 — Lote S0-A (controles autônomos de engenharia/SDLC): mini-specs + implementação + evidências

> **Autorização:** Lote **S0-A** aprovado (abrir ≠ aprovar). **Escopo exclusivo:** SEC-005, SEC-006, SEC-016,
> SEC-024 + documentação SEC-018/019/025. **SEC-009 e SEC-011 NÃO abertos** (gates separados).
> **Regime cumprido:** somente código, testes, CI e documentação. **Nada** de dados reais, produção, IAM/RBAC/MFA,
> secrets, rede/egress/KMS, backfill, RNDS. Ciclo 1 congelado; nenhuma alteração funcional clínica.
> **Árvore:** branch **`feat/sec-s0a`** a partir do baseline de evidência **`4c1716d`** (EXDOC-026).
> **Data:** 2026-08-19. **Entrega:** PR **draft** → sua revisão → aprovação do lote → merge. **Sem merge aqui.**

## 0. Evidência global (validação técnica)
| Verificação | Comando | Resultado |
|---|---|---|
| Testes de segurança do lote | `vitest run tests/security/` | **24/24 passed** (3 arquivos) |
| Suíte completa (regressão) | `npm test` | **1333 passed** · 11 skipped · 126 todo · 187 arquivos |
| Typecheck web | `npm run typecheck` | **0 erros** |
| SBOM CycloneDX (SEC-024) | `cyclonedx-npm --ignore-npm-errors` | **CycloneDX 1.6**, 855 componentes, ~1.8 MB |
| SCA (SEC-016) | `npm audit --audit-level=high` | 26 findings (11 mod, 15 high) — **informativo** (o gate detecta) |

---

## 1. SEC-005 · Object-level authorization / BOLA

**Mini-spec** — *Objetivo:* provar e regredir a pré-condição de autorização por objeto (autenticação presente,
superfície pública fechada) + comportamento "A não acessa objeto de B → 404". *Arquivos:* `tests/security/` (novos,
somente teste). *Risco:* mínimo (não altera rotas). *Dependências:* nenhuma. *Testes:* guarda estática + comportamental.
*Rollback:* remover os arquivos de teste (nenhum efeito em runtime).

- **Implementação:** nenhuma mudança de rota (read-only sobre o código).
  - `tests/security/ARCH-SEC005-object-authorization.test.ts` — guarda estática (modelo NOTIF-001): toda rota em
    `src/app/api/**/route.ts` tem gate de auth; **allowlist pública** com justificativa = `connectors/[source]/webhook`
    (webhook externo), `email/welcome` (ADMIN_SECRET), `waitlist` (signup público). Detecta rota nova sem auth.
  - `tests/security/FUNC-SEC005-ownership.test.ts` — comportamental (Supabase mockado). Cobre **A→A permitido**,
    **A→B negado** e **sem sessão negado** para as duas rotas:
    | Caso | `insights/[id]/feedback` | `exams/[id]` DELETE |
    |---|---|---|
    | A → recurso de A (permitido) | ✅ 200 | ✅ 200 |
    | A → recurso de B (negado) | ✅ 404 | ✅ 404 |
    | sem sessão (negado) | ✅ 401 | ✅ 401 |
- **Resultado:** verde (parte dos 24/24).
- **Evidência:** a query escopada retorna `data:null` → 404 (objeto de outra usuária não vaza); objeto próprio → 200
  (exclusão autorizada, admin service_role **mockado** — sem rede/credencial real); guarda confirma 0 rotas sem auth
  fora da allowlist. **Natureza:** estrutural (ARCH) + unitária/comportamental com **mock** (lógica do handler) — **E2,
  não operacional (E3)**; isolação real em DB/RLS destas rotas legadas continua não comprovada (permanece 🟡).
- **Arquivos alterados:** +2 arquivos de teste.
- **Limitações / residual:**
  - A guarda cobre **autenticação presente**, não prova ownership em todas as rotas estaticamente.
  - **Observação (não afirmada como violação):** `novelty`, `novelty/seen`, `connectors/*` usam service_role **sem**
    `user_id` no arquivo — pode ser legítimo (identidade por sessão/provedor). **Requer revisão humana** (gate S1),
    não classificado como falha aqui.
  - **RESIDUAL material (fora do S0-A):** `connectors/[source]/webhook` confia em `userId` do corpo + segredo
    compartilhado → verificar **HMAC nativo** do provedor (toca auth/secret → gate S1/S3).

## 2. SEC-006 · API Gateway, rate limit, schema validation (validação de schema)

**Mini-spec** — *Objetivo:* fundação de validação de entrada (pura, sem deps) + adoção demonstrada, preservando
comportamento. *Arquivos:* `src/lib/api/validate.ts` (novo), refactor de `insights/[id]/feedback/route.ts`. *Risco:*
baixo (refactor comportamento-equivalente, rota não-clínica; coberto por testes de equivalência). *Dependências:*
`@sintera/types` (Result). *Testes:* unit do helper + equivalência na rota. *Rollback:* reverter o import/uso na rota
(volta ao check manual) e remover `validate.ts`.

- **Implementação:**
  - `src/lib/api/validate.ts` — helpers puros: `readJsonObject`, `requireString`, `requireEnum`, `requireIntInRange`,
    `badRequest`. Padrão `Result<T,string>` (mensagem acionável). **Não** adiciona zod nem toca `@sintera/validation`
    (fronteira travada, ADR-007).
  - `src/app/api/insights/[id]/feedback/route.ts` — troca o parse/validação manual pelo helper, **mensagens idênticas**
    (`'Corpo inválido.'` e `"rating deve ser 'util' ou 'nao_util'."`).
  - `tests/security/FUNC-SEC006-validation.test.ts` — 15 casos de unidade.
- **Resultado:** verde; equivalência de comportamento provada em `FUNC-SEC005-ownership` (mesmos 400/401/404/200).
- **Evidência:** rejeita array/null/primitivo/parse-erro; enum/allowlist; inteiro fora de faixa; `badRequest` = 400 `{error}`.
- **Arquivos alterados:** +1 lib, +1 teste, ~1 rota (refactor equivalente).
- **Limitações / residual:**
  - **Rate limit distribuído** (Upstash/Redis) = **infra**, fora do S0-A (o limiter atual é in-memory só na IA).
  - **Rollout** do helper para as demais rotas: incremental, próximos lotes (cada rota exige preservar seu contrato).
  - Sem gateway/WAF central (CLD-006, gate material).

## 3. SEC-016 · SAST/SCA/secret/IaC scanning no CI/CD

**Mini-spec** — *Objetivo:* introduzir gates de segurança no CI sem quebrar PRs. *Arquivos:*
`.github/workflows/security-scan.yml` (novo). *Risco:* baixo (workflow novo, informativo). *Dependências:* GitHub
Actions (CodeQL nativo; TruffleHog OSS). *Testes:* validação local de SBOM/audit; CodeQL/secret rodam no Actions.
*Rollback:* remover o arquivo de workflow.

- **Implementação:** `.github/workflows/security-scan.yml` — jobs:
  - **SAST:** CodeQL (`github/codeql-action` init+analyze, `javascript-typescript`).
  - **SCA:** `npm audit --audit-level=high` (informativo).
  - **Secret scan:** TruffleHog (`trufflesecurity/trufflehog`, OSS, `--results=verified,unknown`).
  - Todos **informativos** (`continue-on-error`) seguindo a convenção do lint em `ci.yml`; tornar SAST/secret
    **bloqueantes** após triagem do baseline.
- **Resultado:** workflow válido; `npm audit` executado localmente (26 findings — o gate detecta).
- **Evidência:** SCA local retornou 26 vulnerabilidades (majoritariamente cadeia `expo`/mobile) → confirma detecção.
- **Arquivos alterados:** +1 workflow.
- **Limitações / residual:**
  - **CodeQL e TruffleHog só executam no GitHub Actions** — não verificáveis nesta sessão local; a evidência de
    execução virá do primeiro run do PR.
  - **IaC scanning: N/A** hoje (não há IaC/Terraform no repo) → adicionar checkov/tfsec quando houver (S0/S4).
  - Gates ainda **informativos** (não bloqueiam) por decisão de não quebrar PRs abertos — tornar bloqueantes após triagem.

## 4. SEC-024 · SBOM e provenance de artefatos

**Mini-spec** — *Objetivo:* gerar SBOM por execução do CI, publicado como artefato. *Arquivos:* passo no
`security-scan.yml`. *Risco:* nenhum (só gera artefato). *Dependências:* `@cyclonedx/cyclonedx-npm` via npx.
*Testes:* geração local. *Rollback:* remover o passo.

- **Implementação:** passo `Gerar SBOM (CycloneDX)` + `upload-artifact` (`sbom-cyclonedx`). Flag `--ignore-npm-errors`
  (monorepo com workspaces faz `npm ls` sair !=0).
- **Resultado:** SBOM gerado localmente — **CycloneDX 1.6**, **855 componentes**.
- **Evidência:** `bomFormat: CycloneDX · specVersion: 1.6 · components: 855` (~1.8 MB).
- **Arquivos alterados:** parte do +1 workflow (§3).
- **Limitações / residual:**
  - **Provenance/assinatura** (cosign/SLSA, registry privado) = **residual material** (exige OIDC/registry — gate).
  - SBOM é artefato de CI (não versionado); retenção conforme política do Actions.

## 5. SEC-018 / SEC-019 / SEC-025 · Documentação

**Mini-spec** — *Objetivo:* produzir os artefatos documentais (IR playbook, objetivos+procedimento de DR, readiness/SoA)
sem executar exercícios/infra. *Arquivos:* `docs/SEC-018_*.md`, `docs/SEC-019_*.md`, `docs/SEC-025_*.md`. *Risco:*
nenhum (docs). *Dependências:* nenhuma. *Testes:* N/A. *Rollback:* remover os docs.

- **SEC-018** `docs/SEC-018_INCIDENT_RESPONSE_PLAYBOOK.md` — papéis (RACI, owners TBD), severidade SEV-1..4, fluxo
  detecção→contenção→erradicação→recuperação→lições, preservação de evidência, vertente LGPD/ANPD, tabletop **pendente (S3)**.
- **SEC-019** `docs/SEC-019_DR_BACKUP_RPO_RTO.md` — RPO/RTO **propostos** (a aprovar), estratégia de backup, **procedimento
  de teste de restore** (a executar em S3), DR. **Restore real não executado.**
- **SEC-025** `docs/SEC-025_ISO_READINESS_SOA.md` — roadmap 27001/27701/**27799 (ausente, gap)**, **esqueleto de SoA**
  ancorado em SEC-001…025, regra de "pronto" (E0–E5).
- **Resultado/Evidência:** 3 documentos criados (E1 → E2 documental).
- **Limitações / residual:** owners **TBD**; tabletop e restore são **execução em S3**; ISO 27799 a mapear; readiness
  formal exige escopo de SGSI aprovado.

---

## 6. O que este lote NÃO tocou (conformidade de escopo)
- **SEC-009** (audit_events) e **SEC-011** (unificar IA no gateway): **não abertos** — gates separados.
- Nenhuma alteração em: produção, IAM/RBAC/MFA, secrets, rede/egress/KMS, banco/migrations, backfill, RNDS, `ci.yml`
  existente, ou qualquer fluxo clínico. Ciclo 1 intocado.
- Rotas: apenas 1 refactor **comportamento-equivalente** em rota não-clínica (`insights/[id]/feedback`).

## 7. Estado residual do lote (para sua revisão)
| SEC | Estado antes | Após S0-A | Residual (gate) |
|---|---|---|---|
| 005 | 🟡 (sem testes) | 🟡 + **guarda estática + testes de ownership** | HMAC do webhook (S1/S3); revisão service_role connectors/novelty (S1) |
| 006 | 🟡 (validação ad-hoc) | 🟡 + **helper + adoção 1 rota + testes** | rollout demais rotas; rate limit distribuído (infra) |
| 016 | 🔴 (CI sem gates) | 🟡 **workflow SAST/SCA/secret** (informativo) | tornar bloqueante pós-triagem; IaC quando houver; run real no Actions |
| 024 | 🔴 (sem SBOM) | 🟡 **SBOM no CI** | provenance/assinatura (cosign/SLSA — material) |
| 018 | 🔴 | 🟡 **playbook** | tabletop (S3) |
| 019 | 🟡 (runbook) | 🟡 **RPO/RTO propostos + procedimento** | restore testado (S3) |
| 025 | 🟡 (roadmap) | 🟡 **SoA esqueleto** | readiness formal; ISO 27799 (S3) |

> Nenhum controle é declarado 🟢 VERDE: falta owner e/ou evidência operacional (E4/E5). Coerente com a regra do
> EXDOC-026 (VERDE = implementação + teste + resultado + evidência + owner).

## 8. Próximo passo
Controles materiais (S0 cloud, S1 IAM, S2 IA/dados, S3 assurance) permanecem em gates separados; nada será aberto sem
nova autorização. **S0-B não iniciado.**

## 9. Registro de merge (S0-A — MERGED)
| Campo | Valor |
|---|---|
| PR | #153 — `state=closed`, **`merged=true`**, `merged_by=Ca-V` |
| `merged_at` | 2026-08-19T20:39:59Z |
| **Merge SHA** | `1e77c794bcf7b2a381e7cc6074e7f83193e2886c` (`1e77c79`) |
| Base | `feat/fase-c-sql-source` (era `4c1716d` → agora `1e77c79`) |
| Head integrado | `1c4cd70` (ancestral da base ✔) |
| Diff do merge vs `4c1716d` | **exclusivamente S0-A** (11 arquivos, +1210/−10) |
| Autorização | merge limitado ao S0-A; nenhum novo lote/gate autorizado |

**Estados após merge (inalterados — evidência ≠ promoção):** SEC-005 🟡 (E2, mock — não operacional/E3),
SEC-006 🟡, SEC-016 🟡 (CI real não aprova o controle; 26 findings a triar; jobs informativos), SEC-024 🟡
(SBOM sem proveniência/assinatura), SEC-018/019/025 documental. **Nenhum controle 🟢 VERDE.**
