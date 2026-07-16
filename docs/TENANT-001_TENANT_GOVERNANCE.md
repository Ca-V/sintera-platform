# TENANT-001 — Tenant Governance (multitenancy)

> Referencia `ADR-000`. Mesmo hoje com uma organização, definir a governança de tenant **agora** evita
> limitações caso a plataforma evolua para múltiplas organizações (B2B2C — a estratégia já prevê isso).

## Definições
- **Isolamento lógico (hoje):** dados segregados por titular via RLS (`auth.uid() = user_id`); toda leitura/
  escrita escopada. O tenant é a camada acima (organização que atende o paciente).
- **Isolamento físico (futuro):** possibilidade de separar fisicamente dados por organização (schema/instância)
  sem mudar a aplicação — decisão de escala/contrato.
- **Segregação de dados** — nenhum dado cruza fronteira de tenant sem autorização explícita (Privacy by Design).
- **Políticas por organização** — retenção, canais de notificação, perfis de acesso podem variar por tenant.
- **Branding** — identidade visual por organização (a estratégia de marca prevê B2B2C).
- **Configurações** — feature flags (`ARCH-FEATURE-FLAGS`), entitlements/billing e integrações por tenant.

## Regras
- Todo dado nasce vinculado a um **titular** e (quando aplicável) a um **tenant**; nunca órfão.
- Mudança que afete isolamento/segregação → Compliance Gate (LGPD · Privacidade · Segurança · Arquitetura).
- O modelo canônico (`DATA-001`) e os eventos (`EVENTS-001`) são **tenant-aware por design** (carregam o escopo).

## Estado
Uma organização hoje; isolamento lógico por RLS ativo. Multitenancy plena (isolamento físico, políticas/branding
por org) = evolução futura, preparada por este documento e por Billing (`BILLING-001`).
