# ARCH-FEATURE-FLAGS — Feature Flags (governança de liberação)

> Referencia `ADR-000`. Para um SaaS de saúde, reduzir risco operacional exige poder ligar/desligar
> funcionalidades sem novo deploy. Formaliza o requisito; a implementação evolui com a necessidade.

## Requisito
Toda funcionalidade relevante deve poder ser:
- **ativada** / **desativada** (kill-switch operacional);
- **liberada por tenant** (organização — ver `TENANT-001`);
- **liberada por usuário** (rollout gradual / beta);
- **liberada por ambiente** (dev/homologação/produção — segregação, COMP-02).

## Regras
- Flag tem **estado padrão seguro** (novo recurso nasce OFF até liberação deliberada).
- Flag **não** contorna o Compliance Gate: um recurso atrás de flag ainda passa pelos 9 eixos antes do `Done`.
- Flag e suas transições são **auditáveis** (quem ligou/desligou, quando — COMP-04).
- Remoção de flag morta faz parte da higiene (evita dívida de configuração).

## Relação com o rollout canônico existente
O dispatcher `canonical_route` (allowlist/percent) já é um flag de rollout controlado por exame — modelo de
referência: liberação determinística (allowlist) + percentual, com telemetria. Novas flags seguem esse padrão.

## Estado
Padrão de rollout controlado já existe (canônico). Framework de flags por tenant/usuário/ambiente = a evoluir
junto de `TENANT-001` e do modelo de billing/entitlements (que já consulta entitlements por usuário).
