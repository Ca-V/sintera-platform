# Fase 2 — Integração de Wearables (plano de implementação)

**Status:** plano + decisões pendentes. Nenhum código de integração foi escrito
ainda — ele depende de credenciais externas e de uma escolha de provedor (ver
"Bloqueios"). Este documento prepara o terreno para implementar com segurança.

## Objetivo

Transformar a SINTERA de "exames" em "exames + dados contínuos", trazendo
métricas de wearables (sono, HRV, frequência cardíaca, atividade) para a visão
`/dashboard/saude` e o histórico.

## Bloqueios (só você/ambiente resolve — impedem o código)

1. **Credenciais OAuth do provedor.** Cada integração exige registrar um app no
   portal de desenvolvedor do provedor e obter `client_id` + `client_secret` +
   configurar a `redirect_uri`. Sem isso, o fluxo OAuth não pode ser concluído
   nem testado. Eu não tenho como criar essas contas.
2. **Escolha do provedor** (decisão de produto — ver comparação abaixo).
3. **Política de rede do ambiente** precisa permitir saída HTTPS para a API do
   provedor (token exchange + sync).

## Comparação de provedores

| Provedor | Auth | Dados mais relevantes | Viabilidade na stack web |
|---|---|---|---|
| **Oura** | OAuth2 REST | HRV, readiness, sono | ✅ Simples; **recomendado para o 1º** |
| **Garmin** | OAuth (Health API, requer parceria) | HRV, recovery, training load, sono | ⚠️ Mais dados, onboarding de parceria mais burocrático |
| **Strava** | OAuth2 REST | Atividade (corrida/ciclismo) | ✅ Simples, mas escopo de atividade (não saúde ampla) |
| **Apple Health** | HealthKit | Tudo do iPhone/Watch | ❌ **NÃO acessível por web** — exige app nativo iOS/companion |

**Recomendação:** começar por **Oura** (API REST OAuth2 direta, dados de maior
valor clínico-comportamental). Apple Health fica para depois, condicionado a uma
decisão de construir app nativo.

## Modelo de dados proposto (migration a criar)

```sql
-- Conexões OAuth por usuária/provedor (tokens = segredo; acesso via service_role)
create table wearable_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  provider      text not null check (provider in ('oura','garmin','strava')),
  access_token  text, refresh_token text, expires_at timestamptz,
  scope         text, status text default 'connected',
  created_at    timestamptz default now(),
  unique (user_id, provider)
);

-- Leituras normalizadas (provider-agnóstico)
create table wearable_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  provider    text not null,
  metric      text not null,   -- ex.: 'hrv','sleep_hours','resting_hr','readiness'
  value       numeric, unit text,
  recorded_at timestamptz not null,
  raw         jsonb,
  created_at  timestamptz default now(),
  unique (user_id, provider, metric, recorded_at)
);
```

> Tokens são dados sensíveis: RLS restrita, escrita só via service_role, e avaliar
> criptografia at-rest. `wearable_readings` segue RLS por usuária (SELECT próprio).

## Fluxo

```
Conectar (UI) → redirect OAuth do provedor → callback /api/wearables/<provider>/callback
  → troca de code por token → grava wearable_connections
Sync (pg_cron diário, como pipeline-alert | ou webhook) → fetch API → normaliza
  → upsert wearable_readings → aparece em /dashboard/saude e histórico
```

Camada de normalização **provider-agnóstica**: um mapper por provedor converte o
payload bruto em `wearable_readings` (metric/value/unit/recorded_at).

## Nota regulatória

Exibir métricas de wearable de forma **factual** (ex.: "HRV: 48 ms em 14/06") é
organização de dados — seguro. Mas **scores compostos** derivados (ex.:
"Recuperação 84") são interpretação e exigem **a mesma governança clínica** que os
insights (metodologia aprovada por responsável clínico). Manter a fronteira.

## Plano faseado (quando os bloqueios forem resolvidos)

- **2a** — migration do modelo de dados (`wearable_connections`, `wearable_readings`) + RLS. *(Posso escrever assim que o provedor for confirmado.)*
- **2b** — fluxo OAuth connect + callback (depende de credenciais).
- **2c** — sync (pg_cron/webhook) + normalização + upsert.
- **2d** — exibição factual em `/dashboard/saude` e histórico.

## O que destrava o código

1. Confirmar o provedor (recomendo **Oura**).
2. Criar a conta de desenvolvedor e fornecer `client_id`/`client_secret` (vars de
   ambiente) + definir a `redirect_uri`.
3. Confirmar que a política de rede do ambiente permite saída à API do provedor.
