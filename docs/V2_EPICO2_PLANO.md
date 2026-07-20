# V2 · Épico 2 — Primeiro conector cloud end-to-end (impl. inicial: Withings) — PLANO + ESTADO

**Status:** ✅ **Arquitetura completa com MOCK COMPORTAMENTAL (20/07)** — pronta para acender o Withings (só o adapter).
Sob [[V2_PLANO_EXECUCAO]], [[HIP-001_PLATAFORMA_INTEGRACOES]]. Fundação (Épico 1) concluída.

## ✅ Encerramento (Etapa 2 com mock) — subitens 2.1–2.5 verdes
Entregue e verificado (tsc + suíte 676 + build): `oauth` · `connections`(+repo) · `mock`(comportamental, 7 cenários) ·
`syncService` · `runtime.server` · rotas `connect/callback/sync/disconnect/webhook` · página `/dashboard/conexoes` +
entrada no Monitoramento. **30 testes de conector** (FUNC + E2E dos 7 cenários + substituibilidade). Migração 129.

### Changelog de PRODUTO — o que mudou para o usuário
- Existe uma tela **Conexões** (a partir do Monitoramento): o usuário **conecta uma fonte** e a história passa a se
  construir sozinha — as medições entram no **Monitoramento** e na **Composição Corporal** automaticamente.
- **Estado sempre visível**: Conectado · Última sincronização · Sincronizando · Atenção · Reconexão necessária · Fonte.
- **Feedback do 1º dado** ("Seu primeiro dado chegou").
- Hoje a fonte é o **"Dispositivo de demonstração"** (mock); **acender o Withings = trocar só o adapter**, sem mudar
  a experiência — prova de *"toda integração é substituível"*.

### Ativação do Withings (quando você fornecer as credenciais) — só isto muda
1. Implementar `WithingsConnector` (getmeas → CanonicalSample) + `WithingsOAuthProvider` (OAuth2 + refresh).
2. Registrá-los em `runtime.server.ts` (1 linha cada) + `client_id/secret` em env + URL de callback + segredo do webhook.
Nenhuma rota, UI, persistência ou teste de arquitetura muda.

---


## Objetivo (a transformação, provada de ponta a ponta)
Provar que **toda a arquitetura de sincronização funciona**, com UM fluxo impecável: **conectar → autorizar →
sincronizar → persistir → rastrear origem → atualizar Timeline/Monitoramento/Composição → mostrar que foi automático**,
com **estado visível** e **idempotência**. A implementação inicial usa um **mock comportamental**; a troca para o
Withings real será **só o adapter** (prova de *"toda integração é substituível"*).

## Estratégia em 2 etapas (fundadora 20/07)
1. **Planejar** o Épico 2 por completo (este documento).
2. **Implementar toda a arquitetura com um MOCK COMPORTAMENTAL** (não estático). Ativar o Withings real depois, trocando
   **apenas** a implementação do adapter + provider OAuth, **sem mudar UX nem arquitetura**.

---

## 1. Funcionalidades
1. **Registro do conector** — descriptor da fonte no `connectorRegistry` (mock agora; Withings depois).
2. **Consentimento / autorização (OAuth)** — o usuário conecta a fonte: inicia OAuth → autoriza → callback → conexão
   salva. **Revogação** (desconectar) a qualquer momento (LGPD Art. 11).
3. **Credenciais** — tokens em `wearable_connections` via service-role; **refresh automático** quando expira.
4. **Sincronização** — **1ª sync** (histórico, `since=null`), **incremental** (`since=última`), disparada **on-open** +
   **webhook** (Notify do provedor). Reusa o **orquestrador** do Épico 1.
5. **Propagação** — já pronta (Épico 1): `CanonicalSample` → `wearable_readings` (bruto) + `body_metrics` (projeção).
6. **Estado visível** — Conectado · Última sincronização · Sincronizando · Atenção necessária · Erro de autenticação ·
   Fonte dos dados. Lê `wearable_connection_status` + `connector_sync_runs`.
7. **Atualização automática da plataforma** — o dado sincronizado aparece **sozinho** na Composição/Monitoramento/
   Timeline; **feedback do 1º dado** ("seu primeiro dado chegou").
8. **Painel operacional (MVP)** — por conexão: status · última sync · nº de erros (derivado do histórico).

## 2. Arquitetura, componentes e CONTRATOS entre eles
Fronteiras estáveis (é nelas que o mock troca pelo real sem afetar nada acima):

- **`Connector`** *(contrato do Épico 1)* — `descriptor` + `fetchSamples(ctx) → CanonicalSample[]`. Vendor-específico.
  - impl. mock: `MockCloudConnector`; impl. real: `WithingsConnector` (getmeas → CanonicalSample canônico).
- **`OAuthProvider`** *(novo contrato)* — `getAuthorizeUrl(state)` · `exchangeCode(code) → TokenSet` ·
  `refresh(refreshToken) → TokenSet`. `TokenSet = { accessToken, refreshToken, expiresAt, scope }`.
  - impl. mock: `MockOAuthProvider`; impl. real: `WithingsOAuthProvider`.
- **`ConnectionStore`** *(service-role; IO)* — `upsertConnection` · `getConnection` · `setStatus` · `revoke` ·
  `resolveAccessToken` (refresh se expirado; marca `expired`/`auth_error` se refresh falha). Único a tocar tokens.
- **`SyncService`** — resolve token → monta `ConnectorContext` → `runConnectorSync` (orquestrador Épico 1). Determina a
  janela (1ª vs incremental) a partir do histórico.
- **Rotas API** (`src/app/api/connectors/...`, service-role):
  - `GET /api/connectors` — descriptors + estado do usuário (para a UI).
  - `GET /api/connectors/[source]/connect` — gera `state`, redireciona ao provedor (OAuth).
  - `GET /api/connectors/[source]/callback` — `code` → tokens → salva conexão → dispara **1ª sync** → redireciona à UI.
  - `POST /api/connectors/[source]/sync` — sync manual/on-open (idempotente).
  - `POST /api/connectors/[source]/disconnect` — revoga.
  - `POST /api/connectors/[source]/webhook` — recebe Notify → sync da janela.
- **UI** — tela **"Conexões / Dispositivos"** (primitivos DS-001): fontes disponíveis (do registry) · Conectar/
  Desconectar · **cartão de estado** por conexão · **feedback do 1º dado**. Entrada a partir do **Monitoramento** (já
  antecipa "em breve, de dispositivos"). *(Ver Decisão UX-1.)*

**Fluxo de dados:** `Provider ⇄ OAuthProvider` (tokens) · `Provider → Connector.fetchSamples → CanonicalSample` ·
`SyncService → orchestrator → persistence → wearable_readings + body_metrics` · `UI ← wearable_connection_status +
connector_sync_runs`. **Nada acima do `Connector`/`OAuthProvider` conhece o fabricante.**

## 3. Estados da integração (máquina de estados)
`disconnected → connecting → connected → syncing → connected(+última sync)`; ramos: `auth_error` (refresh falhou →
reconectar), `error` (falha temporária na última sync), `attention` (derivado: sem dados há muito / ação necessária).
Mapeamento (sem novas colunas): `wearable_connections.status ∈ {connected, expired(=auth_error), revoked, error}`;
`syncing` e `attention` são **derivados na UI** (a partir de `connector_sync_runs`). `records_count=0` em `ok` = "em dia".

## 4. Fluxos de SUCESSO
- **Conectar:** clica Conectar → OAuth → callback → tokens → **1ª sync (histórico)** → dado aparece na Composição/
  Monitoramento/Timeline → **"1º dado chegou"**.
- **Retorno:** abrir a plataforma → **on-open incremental** → novos dados → *"a história cresceu sozinha"*.
- **Webhook:** provedor notifica → sync da janela → dado aparece sem ação.
- **Sem novidades:** sync `ok` com `records_count=0` → estado "em dia" (sem ruído).

## 5. Fluxos de ERRO (a queda de um provedor nunca quebra a experiência)
- **Usuário cancela o OAuth** → volta sem conexão, mensagem neutra.
- **Token expira** → refresh automático; **refresh falha** → `auth_error` → UI pede **reconectar** (dados já
  sincronizados permanecem).
- **Falha temporária** (rede/provider/rate-limit) → run `error` registrado, experiência intacta, **retry** na próxima.
- **Sync duplicada** (webhook + on-open juntos) → **mesmo estado** (idempotência do Épico 1).
- **Revogação** → acesso limpo; **reconexão** volta a sincronizar do ponto correto.

## 6. MOCK COMPORTAMENTAL (não estático) — simula uma integração real
`MockOAuthProvider` + `MockCloudConnector` dirigidos por um **cenário roteirável** + **relógio simulado** (determinístico),
cobrindo: **(a)** 1ª sync com histórico · **(b)** sync incremental (só novos desde `since`) · **(c)** ausência de novos
dados (`[]`) · **(d)** falha temporária (lança 1×, recupera) · **(e)** expiração de token (força refresh; refresh às
vezes falha → `auth_error`) · **(f)** reconexão · **(g)** duplicidade (mesmos `externalId` → idempotência). Cada cenário
tem teste automatizado. *Se a arquitetura passa bem no mock, passa bem no provedor real.*

## 7. Dependências
- **Só sua (não bloqueia):** registrar o app no **Withings Developer** → `client_id`/`client_secret` (via env, nunca no
  código) + URL de callback. Necessária apenas na **ativação real**.
- **Técnica (na ativação):** deploy HTTPS para callback/webhook reais (Vercel).
- **Reusa:** Épico 1 inteiro · `body_metrics`/Composição/Monitoramento/Timeline (V1) · padrão service-role · DS-001.

## 8. Critérios OBJETIVOS de conclusão (com o mock)
- Conectar (mock) → 1ª sync → **dado aparece sozinho** na Composição/Monitoramento/Timeline, com **origem rastreável** e
  **estado visível**.
- Os **7 cenários** comportamentais passam (testes de integração/E2E).
- **Idempotência** comprovada (sync duplicada = mesmo estado).
- **Revogação** limpa o acesso; **reconexão** retoma a sync.
- **Substituibilidade provada:** trocar mock→Withings = só `Connector` + `OAuthProvider`; **zero** mudança em UI/rotas/
  persistência/arquitetura.
- tsc + suíte + build verdes · Gate de Conformidade · LGPD (consentimento + dado sensível) · **zero** framing de
  diagnóstico/tratamento (regra léxica DS-001 §9).

## 9. Oportunidades de SIMPLIFICAÇÃO
- **Reusar** `orchestrator`/`persistence`/`registry` (Épico 1) — nada novo de propagação.
- `OAuthProvider` e `ConnectionStore` genéricos **na medida** (2 casos reais: mock + Withings → interface justificada;
  sem abstrair além disso).
- **Estado visível MVP**: `syncing`/`attention` derivados na UI — **sem novas colunas**.
- **Sync on-open + webhook** (sem jobs de background nativos).
- **UI**: uma tela de Conexões + cartão de estado com primitivos DS-001; Painel Operacional completo (multi-conector)
  fica para quando houver ≥2 conectores reais.

## 10. Subitens verificáveis (Etapa 2 — após aprovação; cada um TSC+suíte+build verdes + commit)
- **2.1 — `OAuthProvider` + `ConnectionStore` + refresh** (contratos + service-role). Testes.
- **2.2 — Mock comportamental** (`MockOAuthProvider` + `MockCloudConnector` + cenário/relógio). Testes dos 7 cenários.
- **2.3 — `SyncService` + rotas API** (connect/callback/sync/disconnect/webhook). Testes de rota/integração.
- **2.4 — UI de Conexões + estado visível + feedback do 1º dado** + fiação à Composição/Monitoramento/Timeline.
- **2.5 — Validação end-to-end com o mock** (7 cenários) + critérios + changelog de produto.

## Decisões (estado — fundadora 20/07)
- **UX-1 — tela de Conexões:** ✅ **acessível a partir do Monitoramento** (superfície de captura automática; o
  Monitoramento já antecipa "de dispositivos").
- **Rótulo do mock:** ✅ **"Dispositivo de demonstração"** (neutro/honesto; não promete marca antes da ativação real).
- **Plano do Épico 2:** ✅ aprovado — seguir para a Etapa 2 (implementar tudo com o mock comportamental).
