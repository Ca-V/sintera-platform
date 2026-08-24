# SEC-003 — Inventário de privilégio (READ-ONLY) · v0.1

> **Natureza:** inventário **read-only** exigido pelo EXDOC-026 §7 **antes** de qualquer remediação. **Nada foi
> alterado** — sem IAM, secrets, autenticação, RLS, RPC, permissões, rotação ou infraestrutura. **Habilita** a
> decisão do gate **S1** (SEC-003), **não o executa**. Baseline de evidência: `feat/fase-c-sql-source @ 1e77c79`.

## 1. Mecanismos de privilégio elevado (o que existe)
| Mecanismo | Onde | Natureza |
|---|---|---|
| `service_role` (fábrica central) | `src/lib/connectors/runtime.server.ts:73-77` — `adminClient()` → `createAdmin(URL, SUPABASE_SERVICE_ROLE_KEY \|\| SUPABASE_SECRET_KEY)` | **Permanente**, disponível ao runtime; **bypassa RLS** |
| `service_role` (inline nas rotas) | `account/route.ts:15-21`, `waitlist/route.ts:19-24`, `exams/[id]/route.ts:36-40`, `consent/route.ts:28-33`, `agenda/reminders/route.ts:99-111` | idem — cada rota instancia o admin client |
| Segredo estático `ADMIN_SECRET` | `agenda/reminders/route.ts:35` (`x-admin-secret`), `email/welcome/route.ts:10-11` | Segredo **compartilhado permanente**; sem expiração/rotação |
| Segredo estático `CONNECTOR_WEBHOOK_SECRET` | `connectors/[source]/webhook/route.ts:41` | idem (autenticação server-to-server do webhook) |
| Fallback `SUPABASE_SECRET_KEY` | em todos os pontos acima | **amplia a superfície** (duas chaves aceitas) |

## 2. Rotas/consumidores que dependem de privilégio
| Consumidor | Operação privilegiada | Escopo por usuária? |
|---|---|---|
| `exams/[id]/route.ts` (DELETE) | limpeza cross-tabela + storage | **Sim** (`.eq('user_id')` + `path.startsWith(userId+'/')`) |
| `account/route.ts` | exclusão de conta (LGPD) | Sim (opera sobre a própria usuária autenticada) |
| `consent/route.ts` | gravação de consentimento | Sim |
| `agenda/reminders/route.ts` | job diário (pg_cron) de lembretes | Via `ADMIN_SECRET` (não sessão) |
| `waitlist/route.ts` | insert público em `waitlist` (RLS service-role-only) | N/A (público, sem usuária) |
| `novelty/route.ts`, `novelty/seen/route.ts` | leitura/gravação de estado "visto" | **Sem `user_id` no arquivo** — usa `user.id` da sessão como argumento (`markSeen(adminClient(), user.id, …)`) |
| `connectors/route.ts`, `connectors/[source]/{webhook,disconnect,callback,sync}` | estado/sync de conectores | Parcial — resolvem usuária por sessão/provedor; **webhook** confia em `userId` do corpo + segredo (IDOR condicional, ver SEC-005 residual) |

## 3. Onde há privilégio **permanente** (observação, não veredito)
- O `service_role` está disponível de forma **permanente** a todo o runtime (via `adminClient()` e instâncias inline).
- Os segredos `ADMIN_SECRET`/`CONNECTOR_WEBHOOK_SECRET` são **estáticos e permanentes** (sem JIT/expiração/aprovação/rotação observável no material).
- **Não há** PAM/JIT, elevação temporária, cofre, nem trilha de elevação.

## 4. Alvo de remediação (EM PRINCÍPIO — não executado; material S1)
> Apenas direção; **nenhuma** ação autorizada neste lote.
1. Migrar operações `service_role` para **RPC `SECURITY DEFINER`** de escopo mínimo (ou Edge Functions), reduzindo o admin client no caminho de dados da usuária.
2. Substituir `ADMIN_SECRET`/`CONNECTOR_WEBHOOK_SECRET` estáticos por **tokens curtos/assinados** (ou OIDC do pg_cron; HMAC nativo no webhook — cruza com SEC-005).
3. **Remover o fallback** `SUPABASE_SECRET_KEY`; padronizar 1 chave com **rotação testada** (SEC-007).
4. Introduzir **PAM/JIT** para qualquer privilégio administrativo (SEC-003 propriamente).

## 5. Dependências para executar a remediação (exigem seu gate S1)
IAM/identidade central (SEC-001/002), KMS/rotação (SEC-007), decisão sobre RPC×RLS, e revisão do modelo de confiança
do webhook (SEC-005). **Tudo material** — fora deste lote.

## 6. Estado
Inventário completo e revisável. **Nenhuma alteração feita.** Pronto para embasar sua decisão de abrir (ou não) o
gate **S1/SEC-003**.
