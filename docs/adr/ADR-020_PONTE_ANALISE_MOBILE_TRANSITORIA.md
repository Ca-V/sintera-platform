# ADR-020 — Ponte transitória de análise de exames (Mobile reusa a rota `/analyze` da Web)

- **Status:** Aceito (fundadora, 2026-07-31) — **explicitamente TRANSITÓRIO**.
- **Escopo:** Onda 1 (Inc.6/Inc.7). Substituição planejada pós-Onda-1 (ver §Substituição / [RISK_REGISTER R-010](../../RISK_REGISTER.md)).

## Objetivo
Permitir que o Mobile dispare a **extração/análise** de um exame enviado **reusando a regra de negócio única já
existente na Web** (rota `POST /api/exams/[id]/analyze` → gateway de IA), **sem duplicar** essa lógica no Mobile.

## Contexto
- A extração é **server-side** (gateway de IA) e vive numa rota da Web. Não há cron; na Web dispara ao abrir o
  detalhe de um exame `pending`.
- A rota autenticava **só por Cookie** (`@supabase/ssr`). O Mobile usa **Bearer** → daria 401.
- Duplicar a extração no Mobile violaria "uma única regra de negócio" e o princípio [ADR-001] (sem duplicação).
- Reescrever já para uma camada compartilhada (Edge Function) **atrasaria a Onda 1**.

## Decisão
1. **Camada de auth COMPARTILHADA** `getAuthedSupabase(request)` (`src/lib/supabase/authedClient.ts`): resolve o
   cliente Supabase autenticado a partir de **Cookie (Web) OU Bearer (Mobile/API)**, **sem acoplar ao contexto da
   Web**. A rota `/analyze` passa a usá-la — **regra de negócio inalterada**, backward-compatible (Cookie segue
   igual). *(Preferido à edição inline por ser pequeno e reutilizável — orientação da fundadora.)*
2. **Mobile** dispara via `apiClient.exams.analyzeExam(id)` (`packages/api-client/src/exams/analyze.ts`): `POST`
   na rota da Web com `Authorization: Bearer <access_token>`. Configurado por `EXPO_PUBLIC_WEB_URL`. Chamado
   fire-and-forget após `createExam`; o status (`pending→processing→processed`) é acompanhado pelo refresh da lista.
3. **A ponte é registrada como transitória** — não é o estado final.

## Consequências
- **Positivas:** paridade imediata; **zero duplicação** da regra de extração; entrega da Onda 1 desbloqueada;
  aderente a "Contrato Primeiro, Plataforma Depois" (a regra é única desde já; só a *localização* evolui).
- **Custo / acoplamento (assumido e temporário):** o Mobile fica acoplado à **URL/deploy da Web**. A rota da Web
  (com a camada de auth) **precisa estar deployada** na URL que o Mobile chama, senão a análise responde 401.

## Substituição (backlog arquitetural pós-Onda-1 — R-010)
Migrar a extração para uma **camada de processamento COMPARTILHADA** (Edge Function do Supabase ou serviço comum)
consumida por Web **e** Mobile, **eliminando o acoplamento à aplicação Web**. A camada de auth compartilhada já
prepara o terreno. Alvo:
```
Web  ┐
Mobile ┘→  API/serviço compartilhado  →  Gateway de IA  →  Pipeline de extração
```

## Relação com outros ADRs
[ADR-001](../adr_001...) (sem duplicação/SSOT) · [ADR-019](ADR-019_GOVERNANCA_CICLO_INCREMENTOS.md) (ciclo) ·
[ADR-016](ADR-016...) · MOBILE-027 (Inc.6). Risco/retirada: [RISK_REGISTER R-010](../../RISK_REGISTER.md).
