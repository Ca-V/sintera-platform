# OPS-001 — Observability Governance

> Referencia `ADR-000`. **Distinção crítica:** **auditoria** (`COMPLIANCE-001` COMP-04) é trilha IMUTÁVEL para
> conformidade/rastreabilidade (quem fez o quê); **observabilidade** (OPS-001) é instrumentação OPERACIONAL
> (o sistema está saudável?). São separadas: propósito, retenção e consumidores diferentes.

## Pilares
- **Logs** — estruturados, sem PII/segredo (mensagens amigáveis; erro interno logado com contexto — ver `console.error` já usado no pipeline).
- **Métricas** — latência, throughput, taxa de erro, filas (ex.: duração de extração, telemetria de rollout canônico já existente).
- **Traces** — rastreamento de requisições ponta a ponta (correlation/request id — alinha com API-001 §8).
- **Health checks** — verificação de disponibilidade de dependências (banco, storage, provedores).
- **Dashboards** — visão operacional consolidada.
- **Alertas** — automáticos em degradação (o cron de alertas de pipeline já é um exemplo).
- **SLO / SLA / Error budget** — metas de nível de serviço e orçamento de erro por classe de funcionalidade (API-001 §10).

## Regras
- Observabilidade **nunca** vaza PII/dado sensível de saúde (LGPD) — logs/traces higienizados.
- Alertas acionáveis (evitar ruído); cada alerta tem dono e runbook (evolui com Plano de Resposta a Incidentes, COMP-08).
- Observabilidade **não** substitui auditoria e vice-versa.

## Estado
Base parcial: `console.error` no pipeline (observabilidade da persistência — reforçada nesta sessão), telemetria
de rollout canônico, cron de alertas de pipeline. Monitoramento/dashboards/SLO/error-budget plenos = infra
(COMP-10, dependente de recurso/produção). Formalizado aqui.
