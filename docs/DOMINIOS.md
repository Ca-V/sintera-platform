# DOMINIOS — Painel mestre dos domínios da SINTERA

> Índice único do estado de cada domínio. O **processo** é o mesmo para todos (`docs/LIFECYCLE_DOMINIOS.md`);
> o **estado** de cada domínio vive no seu próprio doc. Estados do domínio (passo atual do ciclo):
> `Planejamento` · `Não iniciado` · `Implementação` · `Auditoria estática` · `Gate Arquitetural` ·
> `Auditoria funcional` · `Homologação` · `Certificação` · `Encerrado`.

| Domínio | Estado | Estado / Backlog | Homologação | Especificação |
|---|---|---|---|---|
| **Exames** | Auditoria estática ✅ → Gate Arquitetural / Auditoria funcional (pendente) | `EXAMES_CHECKLIST_FUNCIONAL.md` | `tests/homolog/COVERAGE.md` (0/8) | `EXAMES_CONCLUSAO.md` · `CEF-001…` · `UCDA-001` |
| **Eventos Assistenciais** | Implementação (consolidado; mesmo mecanismo `health_events`) | — | — | `EVENTO_ASSISTENCIAL.md` |
| **Financeiro** | Implementação (gastos/NF via evento; assinatura = Billing) | — | — | (via Eventos + Billing) |
| **Notificações (NOTIF-001)** | Implementação (infra única; push pendente) | — | — | `NOTIF-001_NOTIFICACOES.md` |
| **Medicamentos** | Implementação | — | — | (backlog) |
| **Suplementos** | Implementação | — | — | (backlog) |
| **Vacinas** | Não iniciado (como domínio próprio; hoje via Eventos) | — | — | — |
| **Procedimentos** | Implementação (via Eventos) | — | — | — |
| **Medidas Corporais** | Implementação (reorg pendente) | — | — | `BACKLOG_EVOLUCOES.md` (Fase C) |
| **Sinais Vitais** | Implementação (aquisição automática = HIP-001) | — | — | `BACKLOG_EVOLUCOES.md` (Fase E) |
| **Billing (SaaS)** | Implementação (fundação: entitlements + ciclo + invoices) | — | — | `BILLING-001_ASSINATURAS.md` |
| **HIP-001 (Integrações)** | Planejamento (registrado; implementar fase 3/4) | — | — | `HIP-001_PLATAFORMA_INTEGRACOES.md` |
| **CARE-001 (Espaço Colaborativo)** | Planejamento (registrado; fase posterior) | — | — | `CARE-001_ESPACO_COLABORATIVO.md` |

**Prioridade (um domínio por vez até `Encerrado`):** **Exames** é o foco atual; só após seu encerramento
(Checklist `Homologado` + Matriz 100% + Certificação) o próximo domínio entra no ciclo. Cada domínio, ao
entrar, ganha seus próprios docs (`<DOMINIO>_CHECKLIST_FUNCIONAL.md`, `_HOMOLOGACAO`, `_CERTIFICACAO`) seguindo
o LIFECYCLE, sem redefinir governança.

## Estrutura de governança (referência)
```
GOVERNANCA.md          → princípios constitucionais · regras permanentes · referência ao Lifecycle
LIFECYCLE_DOMINIOS.md  → ciclo obrigatório (7 passos) · critérios · NCs · homologação · certificação
DOMINIOS.md            → este painel (estado de cada domínio + links)
docs/<DOMINIO>_*.md    → estado e evidências de cada domínio
```
