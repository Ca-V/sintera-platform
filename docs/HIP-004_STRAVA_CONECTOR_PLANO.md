# HIP-004 — Conector Strava (1º conector real · plano)

**Status:** PLANO — aguardando aprovação + resolução de 2 gates. Sob [[ADR-000]] · [[HIP-001]] · decisão da fundadora
(HIP-003: Strava agora + app móvel em paralelo).
**Processo:** Planejamento → **Aprovação** → Implementação → Validação (Preview) → Homologação → Encerramento.

> **Aviso honesto de escopo:** ao detalhar, o Strava se revela **mais do que "um conector fino"**. Ver §2 (gates) antes
> de aprovar — há uma decisão de produto (nova representação "Atividade Física") e um gate jurídico (termos do Strava).

## 1. Por que Strava, o que ele é (e o que não é)
- **Acesso:** self-serve, grátis, **sem dispositivo e sem app móvel** (OAuth2 + webhooks server-to-server). Base enorme;
  funciona como **agregador de atividade** (usuários sincronizam Garmin/Wahoo/Apple no Strava).
- **Dados:** **sessões de treino** (corrida/pedalada/natação…): duração, distância, GPS, FC média/máx do treino, potência,
  cadência. **Não** é monitoramento contínuo (sem HRV, sono, SpO₂, FC de repouso). É **atividade física**, não sinais
  vitais contínuos — o diferencial de HRV/sono virá do **app móvel** (Health Connect/Apple Health), trilha paralela.

## 2. Dois GATES antes de implementar
- **GATE-J (jurídico, depende da fundadora):** os **termos de API do Strava** (endurecidos em 2024) restringem uso de
  **saúde/médico**, revenda e **armazenamento** de dados, e exigem atribuição de marca. É preciso **confirmar a
  compatibilidade** com o posicionamento de saúde da SINTERA e com a LGPD **antes** de liberar. *Sem esse aval, não
  homologamos.*
- **GATE-P (produto/arquitetura):** os dados são **eventos** (treinos), não **métricas pontuais** — **não** projetam para
  `body_metrics` (Composição/Monitoramento não acendem com Strava). Exige uma **nova representação "Atividade Física"**
  (evento de treino com métricas do treino) **+ uma superfície de consumo** (onde o usuário vê seus treinos). Ou seja:
  além do conector, há **modelo + UI novos**. Decisão: **modelar "Atividade Física" agora** (recomendado, é um domínio
  legítimo e reutilizável p/ futuras fontes de atividade) vs. adiar e ingerir só o bruto sem superfície.

## 3. Arquitetura (reúso da infra existente)
Reaproveita **tudo** o que a V2/HIP-002 já provou; o específico do Strava fica isolado em `src/lib/connectors/strava/`:
- **OAuthProvider (Strava):** authorize `https://www.strava.com/oauth/authorize` (scope `activity:read_all`), token/refresh
  `https://www.strava.com/oauth/token` (access ~6 h; refresh rotaciona; `athlete.id` = `externalUserId` — capacidade
  genérica já existe). *Nota: base muda para `api-v3.strava.com` em jan/2027.*
- **Connector.fetchSamples:** `GET /athlete/activities` (paginado por `page`/`per_page`; incremental por `after=` marca
  d'água) → mapeia cada treino. **Novo:** como não são pontos corporais, precisamos de um alvo canônico de **atividade**
  (ver GATE-P) — não `body_metrics`.
- **Webhook:** capacidade genérica já pronta (`WebhookHandler`/`WebhookSubscriber`); Strava valida o callback com um
  GET de verificação (echo do `hub.challenge`) + envia eventos POST → adaptar no `strava/webhook.ts` (isolado).
- **Reúso direto:** `ConnectionStore` (tokens/rotação/`external_user_id`), `SyncService` (janela incremental),
  `orchestrator`, `connector_sync_runs`, estados, on-open sync, registro condicional por env, rota `webhook` genérica.

## 4. O que é novo (isolado no adaptador + 1 representação)
- `src/lib/connectors/strava/` : `config.ts`, `client.ts`, `oauth.ts`, `connector.ts`, `webhook.ts` (espelha o padrão
  Withings; particularidades do Strava só aqui).
- **Representação "Atividade Física"** (GATE-P): tabela + projeção de eventos de treino + superfície de consumo mínima
  (lista de treinos). Vendor-neutral (serve futuras fontes de atividade). *A ser detalhada se GATE-P = "modelar agora".*
- Migração aditiva para a nova representação (se aprovada).
- Env: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` (server-only) → registro condicional.

## 5. Sub-épicos (só após aprovação + gates)
- **4.0** Registrar app no Strava + segredos (fundadora + config). *Bloqueia testes reais, não o código.*
- **4.1** `StravaClient` + `StravaOAuthProvider` (+ testes com fakes) — independe de credenciais.
- **4.2** Representação "Atividade Física" (modelo + migração + projeção) — se GATE-P aprovado.
- **4.3** `StravaConnector.fetchSamples` (activities → atividade; paginação/incremental) + testes.
- **4.4** Webhook Strava (verificação GET + eventos) sobre a capacidade genérica + testes.
- **4.5** Superfície de consumo (lista de treinos) + NOV-001 (fluxo `activity`) — reconhecimento natural.
- **4.6** Homologação com conta Strava real (Preview/estável) + relatório + (após aprovação) congelamento.

## 6. Critério de conclusão (ciclo real)
Com conta Strava real: conectar (OAuth) · sync inicial + incremental · webhook · atualização automática · os treinos
aparecem na superfície de Atividade Física com NOV-001 · erros/reconexão/revogação. Só então homologado — com aprovação
explícita ([[governanca_aprovacao_acao_destrutiva]]).

## 7. Trilha paralela — App móvel SINTERA (planejamento — [[HIP-005]] a detalhar)
Decisão da fundadora: iniciar o planejamento do **app móvel** (React Native/Flutter) como **espinha dorsal de cobertura**
via **Health Connect (Android) + Apple HealthKit (iOS)** — captura HR/HRV/sono/atividade de **qualquer** dispositivo que
o usuário sincroniza no celular (inclui **Garmin/Oura/WHOOP/Fitbit**, contornando APIs fechadas/pagas). Alimenta a MESMA
arquitetura canônica (`CanonicalSample` → Monitoramento/Composição). Detalhamento em documento próprio (HIP-005),
como um ciclo de planejamento à parte.

## 8. Riscos
- **GATE-J** pode inviabilizar/limitar o Strava para saúde → resolver antes de investir em 4.5/homologação.
- **Escopo real** (nova representação + UI) > "conector fino" → confirmar GATE-P.
- **Valor de monitoramento contínuo** do Strava é limitado (atividade, não HRV/sono) → o valor central vem do app móvel.
- Base URL do Strava muda em jan/2027 (planejar config).
