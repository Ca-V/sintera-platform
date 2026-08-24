# SEC-002 — Fronteira de produção

Auditoria de 21–24/08/2026 dos caminhos automatizados que alcançam o banco de produção
`pxiglvrgxooawetboglb`, e as correções aplicadas.

Toda a investigação foi read-only. As correções estruturais estão nas migrations 144 e 145
e nas remoções descritas abaixo.

## 1. Por que esta auditoria existiu

Ao reconciliar o histórico de migrations (ver `RECONCILIACAO-SCHEMA-2026-08-21.md`),
descobriu-se que o merge em `main` **acionava a integração GitHub do Supabase**, que aplica
migrations em produção. O drift do histórico era a única coisa que a bloqueava desde 12/06.
Reconciliar removeria o bloqueio — e o merge passaria a escrever no banco.

Isso motivou uma auditoria mais ampla, que encontrou uma classe de problema, não um caso
isolado: **automação que alcança produção fora da superfície que alguém se lembrou de olhar.**
Três instâncias, descobertas em momentos diferentes:

| # | Instância | Superfície onde vivia |
|---|---|---|
| 1 | Integração GitHub↔Supabase | configuração externa (dashboard) |
| 2 | `DATABASE_URL` + `concurrency-harness` | GitHub Actions |
| 3 | 3 jobs de `pg_cron` | dentro do próprio banco |

A terceira só apareceu quando se olhou dentro do banco, e não no CI.

## 2. Estado comprovado (24/08/2026)

```
105 branches · 155 ocorrências de workflow · 8 conteúdos únicos
1 colaborador (admin) · 0 pull_request_target · GITHUB_TOKEN = read
environments Preview/Production existem mas estão VAZIOS, sem proteção
todos os 7 secrets em escopo de REPOSITÓRIO
```

### Caminhos de escrita encontrados

| Caminho | Gatilho | Situação |
|---|---|---|
| `concurrency-harness` → `DATABASE_URL` → `service_role` | manual | **removido** (§3) |
| Integração Supabase → merge em `main` | automático | desconectado (§3) |
| `pg_cron` `pipeline-daily-error-digest` → INSERT | automático | **removido** (migration 144) |
| `pg_cron` `agenda-email-reminders` → HTTP | automático | versionado (migration 145) |
| `pg_cron` `pipeline-stuck-exam-alert` → HTTP | automático | mantido; versionado desde a 016 |
| Vercel runtime → `service_role` | runtime | é o produto; fora do escopo |
| `seed-demo.mjs` local → `service_role` | manual | **barreira fail-closed** (§3) |

## 3. Correções

**Removido o `concurrency-harness`** (workflow + script). Validava um invariante real de
`write_canonical_extraction` (serialização sob concorrência, dedup, ponteiro único), mas:
rodou 3 vezes em junho e nunca mais; não é citado em nenhum documento de governança; não é
requisito de nenhum gate. Mantê-lo exigiria ou uma credencial de escrita permanente no CI,
ou construir um staging inteiro. Ambos desproporcionais.

> **Dívida técnica registrada:** o invariante de concorrência ficou sem cobertura. Se voltar
> a ser requisito, a forma correta é um job com **Postgres efêmero criado pelo próprio job**
> — migrations do commit, usuário sintético, destruição ao final — com **zero secrets**.
> Nunca uma credencial persistente.

**Removidos os secrets `DATABASE_URL`, `TEST_USER_ID` e `CRON_SECRET`.** O arquivo do harness
continua existindo em 87 branches antigas — deliberadamente não reescritas. **O controle é o
secret, não o arquivo:** sem credencial, o workflow antigo falha em qualquer branch. Reescrever
87 históricos seria caro, arriscado e não acrescentaria proteção.

`CRON_SECRET` era **órfão**: zero referências no código. O segredo realmente usado pelo job de
lembretes é o `ADMIN_SECRET`, que vive na Vercel.

**`SUPABASE_SERVICE_ROLE_KEY` removido do GitHub Actions.** Verificado: nenhum workflow, em
nenhuma das 105 branches, o consome. É usado apenas pelo runtime da aplicação (9 pontos) e
pela edge function — que o recebem da Vercel/Supabase, não do GitHub. Manter uma credencial
de privilégio máximo num repositório **público** sem nenhum consumidor era risco sem função.

**Integração GitHub↔Supabase desconectada.** O pipeline oficial de migrations passa a ser o
caminho deliberado (revisão + aplicação explícita). Manter dois caminhos concorrentes — um
deles bloqueado apenas por estar quebrado — era a origem do problema. *"Está bloqueado porque
está quebrado" não é um controle de segurança.*

**Barreira de produção em `seed-demo.mjs`** — recusa incondicional quando o alvo é o projeto
de produção, avaliada antes de qualquer escrita. Sem flag de liberação: uma variável do tipo
`ALLOW_PRODUCTION` transformaria a barreira em formalidade, já que quem aponta a URL também
define a variável.

## 4. `pg_cron` — reconstrutibilidade

Produção tinha **3 jobs**; o repositório versionava **2**. O `agenda-email-reminders` fora
criado à mão. Um banco reconstruído do Git produzia 2 de 3 — o Git não era a representação
completa da infraestrutura.

A migration **145** fecha isso e corrige um segundo defeito: o procedimento manual mandava
colar o `ADMIN_SECRET` literal no comando do job. Verificado em 24/08: **o segredo estava em
texto claro em `cron.job.command`** — tabela legível por `pg_read_all_data`, com privilégio de
SELECT alcançando `anon`. A 145 substitui o literal por uma consulta ao Vault.

> **Rotação obrigatória:** o valor esteve legível. Trocar o local de armazenamento não desfaz
> a exposição pregressa — o `ADMIN_SECRET` precisa ser rotacionado na Vercel e regravado no Vault.

A migration **144** remove o `pipeline-daily-error-digest`, que **nunca funcionou**: três
incompatibilidades independentes contra `ai_processing_log` (coluna `created_at` inexistente,
`model` NOT NULL omitido, `status` fora do CHECK), 81 falhas em ~2,5 meses sem impacto notado.
Removido em vez de corrigido — código morto que ninguém consumia.

## 5. Invariante permanente

> **Nada que altere estado persistente de produção pode existir apenas como configuração
> manual no banco.** Isso inclui tabelas, colunas, índices, constraints, funções, triggers,
> views, RLS, policies, roles/grants, buckets, extensões e **jobs de `pg_cron`.**

O teste é o rebuild: reconstruir do repositório deve produzir a mesma infraestrutura — não os
mesmos dados, mas os mesmos mecanismos. Após as migrations 144 e 145, isso inclui os jobs.

## 6. Backlog — Architecture Boundary CI

**Não implementado.** Registrado aqui para não se perder.

O controle que fecharia a *classe* de problema é um CI que reconstrói o grafo
`branch → workflow → secret → environment → script → banco → operação` sobre todas as branches
e **falha** quando encontra:

- secret sensível em escopo de repositório
- job que consome secret sensível sem `environment:`
- credencial com capacidade de escrita em workflow de gatilho automático
- `pull_request_target`
- action de terceiro fora de allowlist
- URL de banco embutida no código
- drift de `pg_cron` (job em produção ausente das migrations)

**Detecção por contexto de uso, não por nome.** Uma allowlist de nomes é contornável: bastaria
criar `NEW_DATABASE_URL`. A regra sólida é *qualquer* `secrets.*` consumido por job sem
`environment:`, independentemente de como se chame.

**Por que foi adiado:** com 1 colaborador, zero `pull_request_target` e nenhum secret de banco
restante no repositório, não há hoje credencial de produção que um workflow novo possa obter —
o risco que o CI mitigaria já foi removido pela raiz. Ele volta a ser necessário quando o
projeto ganhar mais committers ou quando alguma credencial de banco voltar ao GitHub.

## 7. Limites honestos

- **Risco residual:** o próprio administrador, manualmente, com as credenciais que
  legitimamente possui. Nenhum CI impede isso.
- **`main` sem revisão obrigatória:** o ruleset `protect-main` bloqueia apenas deleção e
  force-push. Push direto continua permitido. Aceito para um projeto de um committer;
  revisar ao ampliar a equipe.
- **Destino do antigo `DATABASE_URL`:** nunca foi determinado. Segredos do GitHub são
  write-only. A evidência convergente (único Postgres na organização em 25/06; função
  presente só em produção; execução bem-sucedida) aponta para produção, mas **não é prova**.
  A remoção do secret tornou a pergunta irrelevante.
