# SINTERA — Auditoria Completa de Estado e Continuidade

**Data:** 2026-06-12
**Escopo verificado:** repositório `Ca-V/sintera-platform` (109 commits), GitHub (branches/PRs), banco Supabase de produção (`pxiglvrgxooawetboglb`, projeto "SINTERA"), Vercel (projeto `sintera-platform`, time "Carina's projects").
**Método:** apenas evidência verificável (código, commits, estrutura do banco, deploys). Inferências e hipóteses estão marcadas explicitamente como tal.

---

## 1. Auditoria de continuidade entre chats

**FATO VERIFICADO:** Sessões do Claude Code são efêmeras e isoladas. Esta sessão **não tem acesso ao conteúdo de nenhum chat anterior** — nem lista de sessões, nem transcrições. Não é possível "vincular histórico de chats"; só é possível reconstruir o passado a partir dos artefatos que os chats produziram (commits, migrações, deploys, dados).

| Pergunta | Resposta |
|---|---|
| Quais chats estão sendo considerados? | Nenhum diretamente. Indiretamente, todos os que deixaram artefatos: 109 commits (28/05 a 09/06), 23 migrações (03/06 a 10/06), 1 Edge Function, 20+ deploys Vercel. |
| Há perda de contexto detectada? | **Sim, total no plano conversacional.** Decisões, planos e justificativas discutidas em chats anteriores não existem em nenhum artefato — o repositório não tem NENHUM documento de planejamento (README é boilerplate do create-next-app; só existem CLAUDE.md/AGENTS.md com instrução sobre Next.js). |
| Artefatos mencionados que não podem ser localizados? | Impossível saber o que foi "mencionado" em chats. O que se detecta é o inverso: artefatos que existem sem origem rastreável no repo (ver §3 e §8). |
| Divergências entre discussão e realidade? | Não verificável diretamente. Divergências **entre artefatos** estão em §3 e §8. |
| Nível de confiança na continuidade? | **Alto** para estado de código/banco/deploy (tudo auditável). **Zero** para decisões não materializadas (critérios clínicos, backlog do Sprint 2, racional dos templates de insight). |

**Lacunas a recuperar (precisam vir da fundadora ou de documentos externos):**
1. A especificação do motor de insights (o desenho existe apenas *implícito* no schema da migração 022 e em 2 prompts `draft` no banco).
2. A definição oficial do "Sprint 2" (escopo, critérios de aceite).
3. Critérios clínicos: quais regras determinísticas, limiares e templates foram ou serão aprovados, e por quem.
4. Os arquivos-fonte das migrações 001–022b e da Edge Function `pipeline-alert` (existem aplicados no banco, mas **não estão versionados no repositório**).

---

## 2. Estado real do repositório

**FATOS VERIFICADOS:**

- **Branch principal:** `main` (HEAD `8f8597c`, 09/06/2026). Working tree limpo, **zero commits locais não publicados**.
- **Branch de trabalho desta sessão:** `claude/magical-volta-dyd5rv` — criado a partir de `main`, idêntico a ele (0 ahead / 0 behind) até esta auditoria.
- **Branches remotos:** `main`, `claude/magical-volta-dyd5rv`, `claude/dreamy-noether-ER3WQ` (obsoleto: 14 commits à frente / 100 atrás de main, último commit 30/05; *inferência:* superado — os arquivos que ele tocava foram reescritos em main em 03–08/06).
- **Pull Requests:** apenas PR #1 (merged em 30/05). Nenhuma PR aberta.
- **Produção (Vercel):** deploy READY do commit `8f8597c` (= HEAD de main) em sinteramais.com.br. **Produção = main = branch de trabalho.**

| Status | Item | Localização | Evidência |
|---|---|---|---|
| ✅ Implementado | Plataforma Next.js 16 completa (landing, auth, dashboard, onboarding) | `src/app/**` | 47 arquivos `.tsx`/`.ts` de páginas e rotas |
| ✅ Implementado | Pipeline de extração de biomarcadores (PDF → IA → banco) | `src/app/api/exams/[id]/analyze/route.ts`, `src/lib/ai/gateway.ts`, `src/lib/pdf/extractor.ts` | commits 03–04/06 (Epics 1.1–1.4A, F1-M2) |
| ✅ Implementado | AI Gateway com provider Anthropic + prompt_registry loader + rate limiter | `src/lib/ai/*` (gateway 325 linhas, prompt-loader, providers/anthropic, rate-limiter, types) | commit `7d82a52` |
| ✅ Implementado | Histórico longitudinal + Índice Experimental | `src/app/dashboard/historico/page.tsx` | commits `2deeec5`, `a419ce9` |
| ✅ Implementado | LGPD: privacidade, termos, /lgpd, exportação de dados, exclusão de conta | `src/app/privacidade`, `termos`, `lgpd`, `api/account/*` | commits 04/06 e 09/06 |
| ✅ Implementado | Beta: waitlist, e-mail boas-vindas (Resend), admin, eventos de uso, feedback survey, SEO | `api/waitlist`, `api/email/welcome`, `admin/page.tsx`, `api/events`, `api/feedback`, `FeedbackModal` | commits 05/06–09/06 |
| ⚠️ Placeholder | Página de Insights do dashboard | `src/app/dashboard/insights/page.tsx` | Exibe "Em desenvolvimento" hardcoded; **não lê `ai_insights`** |
| ❌ Inexistente no repo | Motor de insights (resolver, assembler, motor determinístico, QA gate, narrativa) | — | grep por resolver/assembler/insight em `src/`: zero resultados de pipeline |
| ❌ Inexistente no repo | Migrações SQL 001–022b | `supabase/` contém só `schema.sql` | `list_migrations` mostra 23 aplicadas no banco |
| ❌ Inexistente no repo | Edge Function `pipeline-alert` | — | existe ativa no Supabase (v4), sem fonte versionada |
| ⚠️ Desatualizado | `supabase/schema.sql` (166 linhas, 5 tabelas) | `supabase/schema.sql` | banco real tem 18 tabelas |
| ❌ Inexistente | Documentação de projeto, testes automatizados, CI | — | nenhum `docs/`, nenhum `*.test.*`, nenhum workflow |

---

## 3. Estado real do Supabase

**FATOS VERIFICADOS:**

**18 tabelas em `public`, todas com RLS habilitado:**
`profiles` (3), `exams` (7), `biomarkers` (133), `ai_insights` (13), `biological_scores` (7), `daily_logs` (0), `audit_purge_log` (4), `ai_processing_log` (45), `prompt_registry` (4), `ai_provider_config` (3), `consent_records` (0), `account_deletion_log` (0), `usage_events` (13), `feedback_responses` (0), `waitlist` (0), `biomarker_catalog` (83), `biomarker_aliases` (99), `insight_feedback` (0).

**23 migrações aplicadas** (001_fix_rls_policies … 022b_fix_unit_pattern_literal_match). Nenhuma pendente conhecida — mas como as migrações não estão no repo, "pendente" não é verificável por diff.

**Objetos:** view `retencao_usuarios`; funções `handle_new_user`, `set_updated_at`, `replace_biomarkers`; trigger `profiles_updated_at`; Edge Function `pipeline-alert` (ativa, verify_jwt=false); extensão `pg_net` (via migração 016, pg_cron alerts).

**Configuração de IA (`ai_provider_config`):**
| operation | provider/model | ativo |
|---|---|---|
| extraction | anthropic / claude-haiku-4-5 | ✅ |
| narrative | anthropic / claude-sonnet-4-6 | ✅ (sem código que use) |
| qa | anthropic / claude-haiku-4-5 | ✅ (sem código que use) |

**`prompt_registry`:**
| operation | versão | status | aprovado | deployed |
|---|---|---|---|---|
| extraction | 1.0.0 | deprecated | sim | sim |
| extraction | 1.1.0 | **active** | sim | sim |
| narrative | 1.0.0 | **draft** | **não** | não |
| qa | 1.0.0 | **draft** | **não** | não |

**`ai_insights`:** 13 linhas, todas `source='ai_generated'`, `insight_type` e `template_key` NULL, última em **02/06** — *inferência:* são legado do pipeline antigo (Gemini/Groq), anterior ao AI Gateway (03/06) e ao schema do motor (10/06). Sem rastreabilidade de template/confiança.

**`insight_feedback`:** tabela existe (migração 022), 0 linhas, **nenhuma rota de API no repo grava nela**.

**Inconsistências encontradas:**
1. `supabase/schema.sql` cobre só 5 de 18 tabelas e está defasado nas colunas (ex.: `ai_insights` real tem 21 colunas; schema.sql descreve 8).
2. Migrações e Edge Function existem só no banco/Supabase — sem fonte no Git.
3. `replace_biomarkers()` (RPC atômico) existe no banco, mas o código usa DELETE+INSERT não atômico (`analyze/route.ts:147-177`, comentário admite "sem RPC"). Janela de inconsistência em reanálise.
4. `ai_provider_config` ativa operações (`narrative`, `qa`) que nenhum código executa.
5. 13 insights legados sem rastreabilidade convivendo com schema novo de governança.
6. Advisors de segurança: `account_deletion_log` e `audit_purge_log` com RLS sem policies (INFO); `replace_biomarkers` com search_path mutável (WARN); `pg_net` no schema public (WARN); proteção contra senhas vazadas desabilitada no Auth (WARN).

---

## 4. Auditoria do pipeline de insights

Verificado no código, não assumido:

| Componente | Status | Evidência |
|---|---|---|
| Pipeline funcional de geração de insights | ❌ **Não implementado** | Nenhum código grava em `ai_insights`; única referência no app é leitura para export LGPD (`api/account/export/route.ts:24`); página de Insights é placeholder estático |
| Resolver (nome extraído → catálogo canônico) | ❌ **Não implementado** (fundação de dados pronta) | Zero código; `biomarker_catalog` (83) + `biomarker_aliases` (99) populados no banco |
| Assembler (montagem de contexto) | ❌ Não implementado | Zero código |
| Motor determinístico (regras → candidatos) | ❌ Não implementado | Zero código; colunas `template_key`, `clinical_flag`, `biomarker_ids` existem no banco aguardando |
| Gate de QA | ❌ Não implementado | Zero código; prompt `qa 1.0.0` em draft, não aprovado |
| Geração narrativa | ❌ Não implementado | Zero código; prompt `narrative 1.0.0` em draft; modelo configurado em `ai_provider_config` |
| Avaliação QA | ❌ Não implementado | Zero código |
| Persistência completa em `ai_insights` | ⚠️ **Parcial** | Schema completo no banco (confidence bands, content_hash, template_key, ai_log_id…); nenhum código de escrita |
| Integração com `prompt_registry` | ⚠️ **Parcial** | `prompt-loader.ts` existe e funciona — mas só é usado pela operação `extraction`; narrative/qa nunca carregados |

**Síntese:** o motor de insights está no estágio "infraestrutura de dados pronta, zero código de aplicação". O trabalho de 10/06 (migrações 022/022b) preparou o banco; a implementação TypeScript não começou (ou não foi commitada/pushada — *hipótese:* se foi escrita em outra sessão, perdeu-se com o container efêmero).

---

## 5. Inventário cronológico do que foi executado

**Implementado de fato (com evidência):**
- **27–28/05:** projeto Supabase criado; plataforma inicial Next.js (commit `9d6f230`); schema inicial (profiles, exams, biomarkers, ai_insights v1, biological_scores).
- **29–30/05:** upload de exames + Storage; primeiras tentativas de análise por IA (Gemini → Groq, ~10 trocas de modelo); PR #1 merged. Os 13 `ai_insights` legados são deste pipeline (último em 02/06).
- **03/06:** Fase 0 (remoção do pipeline sintético) + Fase 1: AI Gateway com Anthropic, `prompt_registry`, migrações 001–012 (RLS, rastreabilidade, ai_processing_log), pipeline de extração de PDF com dual path (texto/nativo), jsonrepair com trilha de auditoria, página de detalhe do exame.
- **04/06:** Epic 1.3A/1.4A (transparência de resultados, filtro de páginas), Epic 2.0 (histórico longitudinal), Epic 3.0 (índice experimental), páginas LGPD, recuperação de senha, exclusão de conta, consent_records (mig. 015), pg_cron + Edge Function `pipeline-alert` (mig. 016).
- **05/06:** banner Beta, rate limit de upload, eventos de uso (6C), survey de feedback (6D).
- **08/06:** ajustes P1 v2.1 (medição de compreensão), view de retenção D7/D14/D30 (mig. 020).
- **09/06:** Beta Sprint — exportação LGPD, /lgpd, e-mail de boas-vindas, domínio sinteramais.com.br, waitlist (mig. 021), SEO completo, /como-funciona. **Deploy de produção atual (`8f8597c`).**
- **10/06 (somente banco):** migrações 022 e 022b — biomarker_catalog, aliases, insight_feedback, extensão de ai_insights, prompts narrative/qa em draft, config de modelos.

**Apenas planejado (evidência de intenção, sem implementação):** motor de insights completo (schema + prompts draft + config = intenção materializada; código = inexistente).

**Apenas discutido:** não verificável a partir desta sessão (ver §1).

**Criado localmente mas não publicado:** nada detectado (working tree limpo; main = origin/main = produção).

**Existe só no banco:** migrações 001–022b (conteúdo), catálogo de biomarcadores, prompts narrative/qa, Edge Function, view de retenção.

**Existe só no repositório:** `schema.sql` desatualizado (conflita com o banco — é o repo que está errado).

---

## 6. Inventário do que falta executar (roadmap até o fim do Sprint 2 / motor de insights)

*Nota: a definição oficial de "Sprint 2" não está em nenhum artefato; o roadmap abaixo é derivado do estado do schema e dos prompts (inferência estruturada).*

| # | Tarefa | Classificação | Depende de |
|---|---|---|---|
| 1 | Versionar no repo as migrações 001–022b + fonte da Edge Function + atualizar/substituir schema.sql | 🟢 Pronto para execução imediata | — |
| 2 | Implementar **resolver** (`biomarkers` → `biomarker_catalog` via aliases + normalização de unidades) | 🟢 Pronto (dados já no banco) | 1 (recomendado) |
| 3 | Implementar **assembler** (contexto: biomarcadores resolvidos + perfil + histórico) | 🟢 Pronto | 2 |
| 4 | Implementar **motor determinístico** (regras → candidatos com `template_key`, `clinical_flag`, bandas de confiança) | 🔴 Bloqueado por **decisão clínica** (regras, limiares e templates precisam de definição/aprovação) | 2, 3 |
| 5 | Aprovar prompts `narrative 1.0.0` e `qa 1.0.0` (`approved_by`/`approved_at` → status active) | 🔴 Bloqueado por **decisão clínica/governança** | — |
| 6 | Estender o AI Gateway para operações `narrative` e `qa` (modelos já configurados) | 🟢 Pronto (código), execução real depende de 5 | 5 |
| 7 | Implementar **gate de QA** + persistência em `ai_insights` (content_hash p/ dedup, ai_log_id p/ rastreio) | 🟡 Pronto tecnicamente após 4–6 | 4, 5, 6 |
| 8 | Decidir gatilho de geração (pós-análise síncrono? batch? botão?) e regras de exibição/disclaimers | 🟠 Bloqueado por **produto** | — |
| 9 | Conectar `dashboard/insights/page.tsx` a dados reais + API de `insight_feedback` | 🟢 Pronto (front), entrega real depende de 7, 8 | 7, 8 |
| 10 | Decidir destino dos 13 insights legados (purge ou marcação) | 🟠 Bloqueado por produto (decisão simples) | — |
| 11 | Corrigir advisors (policies de service-role nas tabelas de log, search_path, pg_net, leaked password protection) | 🟢 Pronto para execução imediata | — |
| 12 | Voltar a usar `replace_biomarkers()` (RPC atômico) na reanálise, ou remover a função | 🟢 Pronto (decisão técnica pequena) | — |

**Caminho crítico:** 4 e 5 (decisão clínica) bloqueiam a entrega fim-a-fim. Tudo que é 🟢 pode andar em paralelo agora.

---

## 7. Riscos

| Risco | Tipo | Nível |
|---|---|---|
| Migrações e Edge Function sem fonte no Git — banco é irrecuperável a partir do repo; mudanças de schema feitas "por fora" | Técnico/Governança | 🔴 **Alto** |
| Perda de contexto entre chats: nenhuma documentação de decisões no repo; especificação do motor de insights existe só implícita no banco | Governança/Continuidade | 🔴 **Alto** (mitigado por este relatório) |
| Conteúdo narrativo de saúde gerado por IA sem processo formal de aprovação clínica (prompts draft, `approved_by` vazio) — se ativado sem gate | Clínico/Regulatório | 🔴 **Alto** (hoje latente, pois nada gera insights) |
| Zero testes automatizados + deploy direto em produção a cada push em main | Técnico | 🟡 Médio |
| LGPD: base sólida (consent_records, export, exclusão, /lgpd), mas `consent_records` tem 0 linhas — fluxo de consentimento pode não estar sendo acionado | Regulatório | 🟡 Médio (verificar antes do Beta) |
| Reanálise não atômica (DELETE+INSERT) pode deixar exame sem biomarcadores em falha no meio | Técnico | 🟡 Médio |
| 13 insights legados sem rastreabilidade visíveis em export LGPD | Clínico | 🟡 Médio |
| Advisors Supabase (search_path, pg_net, leaked passwords, RLS sem policy em logs) | Técnico/Segurança | 🟢 Baixo |
| Branch obsoleto `claude/dreamy-noether-ER3WQ` pode confundir sessões futuras | Governança | 🟢 Baixo |

---

## 8. Fonte de verdade final

**Não existe uma fonte única hoje. Existem duas, com papéis distintos:**

1. **Código da aplicação:** GitHub `Ca-V/sintera-platform`, branch **`main`** (commit `8f8597c`) — é exatamente o que está em produção na Vercel (deploy READY, sinteramais.com.br). ✅ Confiável e consistente.
2. **Schema e dados:** o **banco Supabase de produção** (`pxiglvrgxooawetboglb`) — é a ÚNICA fonte do schema real, do catálogo de biomarcadores, dos prompts e das migrações. ❌ Não reproduzível a partir do repo.

**Conflitos exatos entre fontes:**
- `supabase/schema.sql` (repo) ≠ banco real → **o banco vence**; o arquivo deve ser tratado como histórico.
- Motor de insights: existe no banco (schema/prompts/config), não existe no repo (código) → não é conflito de versão, é **implementação ausente**.
- `replace_biomarkers` (banco) vs DELETE+INSERT (código) → divergência deliberada documentada em comentário, mas não resolvida.
- Branch `claude/dreamy-noether-ER3WQ` ≠ main → obsoleto, ignorar.

**Recomendação para eliminar a dualidade:** versionar as migrações no repo (item 1 do roadmap). A partir daí, GitHub `main` torna-se fonte de verdade única; o banco passa a ser derivado.

---

## Classificação epistemológica do relatório

- **Fatos verificados:** todo o conteúdo de §2, §3, §4 e a lista "implementado de fato" de §5 (baseados em leitura direta de código, git, banco e Vercel).
- **Inferências (marcadas no texto):** origem dos 13 insights legados; obsolescência do branch antigo; derivação do roadmap a partir do schema.
- **Hipóteses:** se código do motor de insights foi escrito em sessão anterior e perdido, não há como confirmar — nenhum vestígio em branches remotos.
