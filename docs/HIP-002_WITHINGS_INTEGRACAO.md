# HIP-002 — Integração Withings (Fase 2 · captura automática real)

**Status:** APROVADO (20/07) — implementação dos Épicos 2.1–2.4 (independentes de credenciais) em curso; homologação
(2.5) bloqueada até haver credenciais reais. Sob [[ADR-000]] · [[HIP-001]] (plataforma de integrações) · [[COMPLIANCE-001]].

## Diretrizes de execução (fundadora, na aprovação)
1. **Infra × integração separadas:** implementar agora tudo que não depende de credenciais (client, OAuth, webhook,
   mapeamento canônico, testes, erros, refresh, sync incremental, observabilidade); homologação espera as credenciais.
2. **Orientado a CAPACIDADE:** diante de "lógica específica do Withings" vs "fortalecer a infra genérica de conectores",
   preferir SEMPRE a infra genérica — desde que não aumente a complexidade desnecessariamente (como na NOV-001).
3. **Isolar o fornecedor:** toda adaptação que existe só porque a API do Withings funciona de certo jeito fica
   **isolada no adaptador** (`src/lib/connectors/withings/`); o núcleo da SINTERA não incorpora particularidades dele.
4. **Critério de conclusão (ciclo real completo):** autenticação · sync inicial · sync incremental · webhook ·
   atualização automática · NOV-001 · Composição Corporal · erros · reconexão · **revogação de acesso** — todos
   demonstrados com dados reais. Só então: homologado.
5. **Próxima ação:** eu construo 2.1–2.4 (com fakes); a fundadora provê registro/plano/Callback URIs/credenciais/conta
   e dispositivo; então partimos para a integração real e a homologação completa.
**Processo:** Planejamento → **Aprovação** → Implementação → Validação (Preview) → Homologação → Encerramento.
Nenhuma ação destrutiva/irreversível ou homologação sem aprovação explícita após validação no Preview
([[governanca_aprovacao_acao_destrutiva]]).

> **Norte:** o Withings deixa de ser mock e passa a alimentar de verdade a Composição Corporal (e, opcionalmente,
> o Monitoramento), reaproveitando 100% da infraestrutura da V2. O usuário conecta uma vez e a história cresce sozinha.

---

## 1. Arquitetura da integração (reúso da V2)

A V2 já isola exatamente os dois únicos pontos vendor-específicos. Trocar mock→Withings = **registrar dois objetos
no `runtime.server.ts`**; nada de rota/UI/persistência/novidade muda.

| Camada V2 (existente) | Muda? | Papel na Fase 2 |
|---|---|---|
| `OAuthProvider` (contrato) | **novo impl.** | `WithingsOAuthProvider`: authorize/exchange/refresh |
| `Connector.fetchSamples` (contrato) | **novo impl.** | `WithingsConnector`: getmeas → `CanonicalSample[]` |
| `ConnectionStore` (tokens, refresh, rotação) | não | já persiste o **novo** refresh token a cada renovação |
| `SyncService` (janela incremental + token válido) | não | usa marca d'água → `lastupdate` |
| `orchestrator` / `persistence` / `supabase-persist` | não | mapeia `metric`→`body_metrics` genérico |
| `connector_sync_runs` / estados / on-open sync | não | histórico, painel e "sua história cresceu" |
| **NOV-001** (novidade, fluxo `body_composition`) | não | selos "Novo" + aviso já funcionam sobre o dado real |
| Rotas `connect`/`callback`/`disconnect`/`sync` | não | genéricas, já operam por `source` |
| Rota `webhook` | **adaptar** | hoje assume segredo+userId próprios; Withings envia `userid` dele (ver §7) |
| Tela **Conexões** | trivial | lista do registro → "Withings" aparece automaticamente |

**Fonte:** `source='withings'`, `domain='wearable'`, `acquisition='oauth'` (+ webhook). Segredos só no servidor.

---

## 2. Fluxo OAuth completo (Authorization Code)

Withings usa OAuth2 Authorization Code, mas com **envelope próprio** (respostas sempre HTTP 200 + campo `status`).

1. **Authorize** — `GET https://account.withings.com/oauth2_user/authorize2`
   `?response_type=code&client_id=…&scope=user.metrics&redirect_uri=…&state=…`
   (`state` = CSRF, já gerado/validado por cookie nas rotas V2).
2. **Callback** — Withings redireciona para o nosso `redirect_uri` com `code` + `state`.
3. **Exchange** — `POST https://wbsapi.withings.net/v2/oauth2`
   `action=requesttoken&grant_type=authorization_code&client_id&client_secret&code&redirect_uri`
   → `body: { userid, access_token, refresh_token, expires_in, scope, token_type }`.
   Guardamos tokens **e** o `userid` do Withings (mapeamento p/ webhook, §7).
4. **1ª sync** imediata no callback (já existe) → o dado aparece na hora.

`getAuthorizeUrl/exchangeCode/refresh` retornam o `TokenSet` da V2 (`expiresAt` = agora + `expires_in`).

---

## 3. Registro da aplicação no portal Withings *(depende da fundadora)*

No **developer.withings.com → Dashboard → criar aplicação** (Public Health Data API):
- Obter **`client_id`** e **`client_secret`**.
- Cadastrar **Callback URI** (whitelist) — a URL do nosso `redirect_uri` **e** a URL do webhook (§7). Precisam ser
  **HTTPS públicas e estáveis** → domínio de produção (ver Risco R2/decisão D2).
- Escolher o **plano/solução de API** e aceitar os termos (ver Risco R1 — pode exigir plano comercial/contrato).

## 4. Credenciais necessárias e onde configurar

Variáveis de ambiente **no Vercel** (Server-side, nunca no cliente; nunca commitadas):
| Variável | Uso |
|---|---|
| `WITHINGS_CLIENT_ID` | authorize + token |
| `WITHINGS_CLIENT_SECRET` | token/refresh (server-only) |
| `WITHINGS_REDIRECT_URI` *(opcional)* | fixar o redirect exato whitelistado (senão derivamos do host) |
| `CONNECTOR_WEBHOOK_SECRET` *(já existe)* | reforço do webhook (§7) |

Reutiliza `SUPABASE_SERVICE_ROLE_KEY` já existente. A fundadora fornece as duas primeiras; eu configuro/guio.

## 5. Escopos (mínimo necessário — least privilege)

- **`user.metrics`** — medidas corporais e sinais (peso, gordura, músculo, PA, FC…). **É o que precisamos.**
- ~~`user.activity`~~ (passos/treinos) e ~~`user.info`~~ — **não** solicitar agora (fora do escopo da Composição).
  Adicionáveis depois sem retrabalho (só amplia o `scope` do authorize).

## 6. Sincronização inicial e incremental

- **Endpoint:** `POST https://wbsapi.withings.net/measure?action=getmeas` com `meastypes` (lista), `category=1`
  (medidas reais, não "objetivos").
- **Inicial (histórico):** `since=null` → busca o histórico; **paginar** por `offset`/`more` da resposta, com
  throttle e backoff (rate limit, §10).
- **Incremental:** `lastupdate = marca d'água` (maior `recorded_at` já gravado — a V2 já entrega isso) → só o novo.
- **Mapeamento** `measuregrps[].measures[]` → `CanonicalSample`: valor real = `value × 10^unit`; `recordedAt` = `date`
  (unix→ISO, [[date_001_temporal_ssot]]); `provenance.externalId = grpid`. Códigos `meastype` → métrica canônica
  (mesma nomenclatura que a Composição já usa): 1→`peso`, 6→`gordura_corporal`(%), 8→massa de gordura, 5→massa magra,
  76→`massa_muscular`, 77→hidratação, 88→massa óssea; (sinais: 9/10→PA, 11→FC — só se D1 incluir Monitoramento).

## 7. Webhooks (Notify) e sincronização sob demanda

- **Assinatura:** no connect, `POST …/notify?action=subscribe&callbackurl=…&appli=1` (appli 1 = medidas). A
  `callbackurl` precisa estar na whitelist do app e **responder 200 a HEAD e POST** (o Withings testa na assinatura).
- **Notificação:** Withings faz `POST` *form-urlencoded* com `userid, appli, startdate, enddate` — **sem** o nosso
  userId e **sem** o nosso segredo. Só sinaliza; **não** traz o dado. Nós então chamamos `getmeas`.
- **Adaptação da rota `webhook`:** hoje ela espera `{ userId }` + header de segredo. Para o Withings:
  (a) responder `HEAD 200`; (b) parsear o form; (c) **mapear `userid` Withings → usuário da plataforma** via nova
  coluna `wearable_connections.external_user_id`; (d) disparar `getmeas` na janela `startdate/enddate`.
  Proposta: **generalizar** a rota delegando o parse a um `parseWebhook()` opcional do provider (mantém HIP-001
  vendor-neutral) em vez de hard-code Withings.
- **Sob demanda:** o botão "Sincronizar agora" e o **on-open sync** (throttle) da V2 continuam como fallback quando
  o webhook não chega (rede/assinatura perdida).

## 8. Renovação de tokens

- `access_token` expira em **3 h**; `refresh_token` em **1 ano**, mas **rotaciona a cada refresh**: cada renovação
  devolve um **novo** refresh token e o antigo vale só **~8 h** (ou até o novo access ser usado). ⇒ **persistir sempre
  o novo refresh token.** A V2 **já faz isso** (`resolveAccessToken` faz upsert do `renewed.refreshToken`). ✅
- Endpoint: `POST …/v2/oauth2` `action=requesttoken&grant_type=refresh_token&client_id&client_secret&refresh_token`.

## 9. Tratamento de erros e reconexão

- Respostas Withings são **sempre HTTP 200** + `status` no corpo (0 = ok). Um `WithingsClient` deve **checar `status`**
  e lançar erro tipado: `401` (token inválido) → cai no caminho `ReconnectRequiredError` da V2 (marca `expired`,
  UI pede "Reconectar"); `601` (rate limit) → backoff/retry (§10).
- Falha de refresh já marca `expired` e pede reconexão (V2). Webhook com `userid` desconhecido → ignora (200) e loga.

## 10. Rate limits e boas práticas (doc oficial)

- **60 req/min por app** (120 p/ intraday activity). Erro **601** = excesso.
- Práticas: preferir **webhook + `lastupdate`** a polling; **paginação** com backoff exponencial no histórico;
  throttle já existe no on-open; nunca logar tokens; `category=1`; agrupar `meastypes` numa chamada.

## 11. Estratégia de reúso da infra V2 (resumo)

Novo código isolado em `src/lib/connectors/withings/` (client HTTP + provider + connector + mapeamento) + **1 migração
aditiva** (`external_user_id`) + **adaptação da rota webhook**. Tudo o mais (persistência, janela, refresh, estados,
sync runs, on-open, NOV-001, telemetria, tela Conexões) é **reaproveitado sem alteração**. Testabilidade: client com
`fetch` injetável (fakes de resposta Withings), provider/connector puros — sem tocar rede nos testes.

---

## 12. Análise crítica — riscos, limitações e decisões

### Riscos técnicos / limitações da API
- **R1 · Acesso comercial/plano (ALTO):** o uso em produção pode exigir um **plano/contrato** Withings (não só o app
  grátis de dev). Pode bloquear ou ter custo. → *A fundadora precisa verificar plano/termos no registro.*
- **R2 · URL de callback estável (MÉDIO):** Withings exige `redirect_uri` e `callbackurl` **whitelistados e estáveis**.
  URLs de Preview do Vercel são dinâmicas → a **homologação do OAuth real precisa de domínio fixo** (produção ou alias
  estável). Afeta *onde* validamos. (D2)
- **R3 · Contrato de webhook (MÉDIO):** o modelo do Withings (form `userid`, HEAD/POST, sem nosso segredo) difere do
  webhook genérico atual → exige adaptação + coluna de mapeamento (§7).
- **R4 · Modelo de resposta (MÉDIO):** sempre 200 + `status` no corpo; não confiar no HTTP. Requer client dedicado.
- **R5 · Corrida de refresh (MÉDIO):** webhook + on-open podem renovar em paralelo; o 2º refresh pode invalidar o 1º.
  A janela de graça de ~8 h mitiga. Opção: single-flight/lock por (user, provider). (D4)
- **R6 · Backfill histórico (MÉDIO):** 1ª sync pode trazer muitos grupos → paginação + backoff obrigatórios.
- **R7 · Semântica de medida (BAIXO/MÉDIO):** `value×10^unit`, `category`, `grpid` duplicado, múltiplos `meastype` por
  grupo — mapear com cuidado e testes.
- **R8 · LGPD/segurança (MÉDIO, [[compliance_001_fase0_gate]]):** tokens de terceiros + `userid` externo = dado
  sensível. Avaliar **cifragem em repouso** (Supabase Vault/coluna cifrada) além de RLS service-role. Gate de
  Conformidade antes do `Done`.

### Decisões de arquitetura (D1/D2 DEFINIDAS pela fundadora 20/07)
- **D1 · Escopo inicial = SÓ Composição Corporal** ✔ (peso/gordura/músculo…), alinhado à superfície homologada na
  NOV-001. Sinais Vitais (PA/FC → Monitoramento) = **fast-follow** posterior (só amplia `meastypes`, sem retrabalho).
- **D2 · Homologação do OAuth real = domínio ESTÁVEL de PRODUÇÃO** ✔ (callback whitelistado no domínio de produção,
  atrás de feature protegida). URLs de Preview dinâmicas não servem para o whitelist do Withings.
- **D3 · Webhook:** generalizar a rota por `provider.parseWebhook()` (recomendado, mantém vendor-neutral) vs específico.
- **D4 · Refresh concorrente:** aceitar (graça 8 h) + monitorar vs single-flight lock já no início. *Recomendo aceitar
  e observar.*
- **D5 · Plano/licença Withings:** qual plano/termos — depende do registro (R1).

### Dependências da fundadora (não automatizáveis)
1. Registrar o app no Withings, escolher plano, cadastrar Callback URIs, obter `client_id`/`client_secret`.
2. Fornecer as credenciais (eu configuro no Vercel e guio onde).
3. Uma conta Withings + dispositivo (ou o **"demo user"** do Withings) para a validação real.

---

## 13. Sub-épicos (implementação — só após aprovação)
Cada um verificável (tsc + suíte + build verdes + commit; sem segredos):
- **2.0** Registro do app + segredos (fundadora + config Vercel). *Bloqueia os testes reais, não o código.*
- **2.1** `WithingsClient` (envelope `status`, erros tipados, `fetch` injetável) + `WithingsOAuthProvider`
  (authorize/exchange/refresh) + testes puros.
- **2.2** `WithingsConnector.fetchSamples` (getmeas, janela `lastupdate`, paginação, mapa `meastype`→métrica) + testes.
- **2.3** Migração aditiva `external_user_id` + salvar `userid` no callback + registrar Withings no `runtime.server.ts`.
- **2.4** Webhook Withings (HEAD/POST, parse form, mapeamento `userid`→usuário, subscribe no connect) + backoff.
- **2.5** Homologação com dado real (demo user/dispositivo) em ambiente estável + validação no Preview + relatório +
  (após aprovação) congelamento.

## 14. Critérios de aceite (produto)
Comportamento observado no ambiente estável: (1) conectar o Withings real via OAuth; (2) as medidas reais aparecem na
Composição com selo "Novo" (NOV-001) e no painel "sua história cresceu"; (3) uma nova pesagem chega sozinha (webhook
e/ou on-open); (4) expiração → "Reconectar" funciona; (5) sem tokens em log; (6) Gate de Conformidade ok. Só então:
homologar/congelar — **com aprovação explícita da fundadora**.
