# WEA-001 — Wearables Domain (1ª implementação da Connector Layer)

**Status:** ativo · **Versão:** 1.0 (17/07/2026) · **Responsável:** Fundadora (direção) · Claude (redação).
**Objetivo:** trazer dados contínuos de wearables (atividade, sono, FC, recuperação…) para a plataforma como
**primeira implementação** da Connector Layer definida em [[HIP-001]]. **Escopo:** conectores de nuvem
(OAuth2/REST) de wearables. **Dependências:** HIP-001, DATA-001/UCDA, OPS-001, SEC-001. **Relacionado:**
Sinais Vitais, Timeline, Indicadores, Registros de Saúde. Segue a estrutura de [[ARCH-000]] §4.

> **Herda a cláusula de generalidade do HIP-001:** o CÓDIGO da camada é vendor+domain-neutral. WEA-001 é a
> primeira instância (wearables); labs/hospitais/EMR/farmácias/etc. entram como novos conectores sem mudar o núcleo.

## 1. Objetivo
Sincronizar métricas de wearables para a visão longitudinal, **sem substituir a fonte** (proveniência sempre
preservada), com histórico de sincronizações e reconciliação/dedup entre provedores.

## 2. Escopo
**Dentro:** Strava (1º ao vivo, self-service), Garmin (completo até auth+sync; ativação com credenciais de
parceria); métricas: atividades·passos·distância·calorias·FC·sono·carga/recuperação·VO₂máx (quando disponíveis).
**Fora (1.1+):** Apple Health/Health Connect (exigem app nativo — MOB-001); WHOOP/Oura/demais (mesma infra).

## 3. Modelo de Dados
- **Núcleo puro** `src/lib/connectors/connector.ts`: `ConnectorDescriptor` (source·domain·acquisition·version·
  capabilities), `CanonicalSample` (metric·value·unit·recordedAt·**provenance**{source·connectorVersion·externalId}),
  `SyncRun` (status·recordsCount·error·lastSuccessAt), `reconcileSamples`/`dedupWithinSource`/`sampleKey`. Testado.
- **Persistência:** `wearable_connections` (conexões OAuth por usuário×fonte; tokens = segredo, acesso service_role),
  `wearable_readings` (leituras normalizadas + `external_id`/`connector_version` de proveniência — migration 120),
  `connector_sync_runs` (histórico de sync — migration 120, RLS owner-select).
- **Reconciliação/dedup:** chave (métrica, instante, fonte); mesma fonte → idempotente (última vence); fontes
  distintas → coexistem (multi-provedor, origem preservada).

## 4. Componentes
- `lib/connectors` (núcleo puro, este domínio). Por vir: registro de conectores; conector Strava; conector Garmin;
  orquestrador de sync (auto+manual); Painel Operacional de Integrações (UI). Consome UCDA/DATA-001 na propagação.

## 5. Fluxos
1. **Conectar:** usuária autoriza (OAuth2) → tokens em `wearable_connections` (service_role). 2. **Sync
   (manual/automática):** abre `connector_sync_runs` (pending) → busca janela na API → normaliza p/ `CanonicalSample`
   → `reconcileSamples` vs persistido → grava `wearable_readings` → fecha o run (ok/partial/error, nº, erro,
   lastSuccess). 3. **Propagação:** leituras alimentam Timeline·Indicadores·Registros de Saúde (via UCDA). 4.
   **Revogar:** usuária desconecta → revoga tokens; leituras históricas permanecem (com proveniência).

## 6. APIs
Entrada: OAuth2 callback + endpoints de sync (a criar). Saída: contrato canônico (`CanonicalSample`/UCDA) — os
consumidores nunca leem o payload do fabricante. Segredos (`client_id`/`client_secret`) em env/Vault, nunca no git.

## 7. Segurança
Tokens fora do cliente (service_role); `connector_sync_runs` RLS owner-select; `wearable_connections` = **SEC
follow-up** (policy/serviço service-role-only + view de status sem tokens). Consentimento explícito (LGPD Art. 11);
revogação efetiva. Egresso HTTPS ao provedor liberado no ambiente.

## 8. Governança
Precedência ADR-000 > SPAGS > HIP-001 > WEA-001. **Invariantes:** conector nunca vaza formato ao núcleo; toda
amostra tem proveniência; novos conectores = nova implementação, não mudança de schema/núcleo. Rótulo de release:
Strava/Garmin = **[1.0]**; Apple/Health Connect/WHOOP/Oura = **[1.1]**.

## 9. Auditoria
`connector_sync_runs` = trilha completa (origem·quando·status·nº·erro·última ok); `external_id`/`connector_version`
por leitura = reprodutibilidade/idempotência. Painel Operacional expõe isso a suporte·debug·auditoria·usuário·LGPD.

## 10. Evolução
- **Feito (ciclo 1):** núcleo puro (reconciliação/dedup/proveniência) + teste; migration 120 (sync history +
  proveniência) aplicada; WEA-001.
- **Próximo:** registro de conectores; Strava OAuth+sync (até credenciais); orquestrador auto+manual; propagação;
  Painel Operacional; Garmin até auth+sync. **1.1+:** Apple/Health Connect (app nativo), WHOOP/Oura, mais domínios.
