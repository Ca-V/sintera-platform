# DOMINIOS — Painel mestre dos domínios da SINTERA

> Índice único do estado de cada domínio. O **processo** é o mesmo para todos (`docs/LIFECYCLE_DOMINIOS.md`);
> o **estado** de cada domínio vive no seu próprio doc. Estados do domínio (passo atual do ciclo):
> `Planejamento` · `Não iniciado` · `Implementação` · `Auditoria estática` · `Gate Arquitetural` ·
> `Auditoria funcional` · `Homologação` · `Certificação` · `Encerrado`.

Indicadores por domínio: **Func.** (implementadas/total) · **NCs abertas** · **Jornada** (passo atual do
ciclo) · **Estado**. Prefixo de ID por domínio entre parênteses. `—` = ainda não cataloga do (entra no ciclo depois).

| Domínio (prefixo) | Func. | NCs abertas | Jornada / passo | Estado | Docs |
|---|:--:|:--:|---|---|---|
| **Exames** (`EXA`) | 13/13 | 0 | Gates ✅ · Auditoria funcional (execução) pendente | Em andamento | `EXAMES_CHECKLIST_FUNCIONAL.md` · `tests/homolog/COVERAGE.md` (0/8) |
| **Eventos Assistenciais** (`EVT`) | 11/11 | 0 | Gates ✅ · Auditoria funcional (execução) pendente | Em andamento | `EVENTOS_CHECKLIST_FUNCIONAL.md` · `EVENTO_ASSISTENCIAL.md` |
| **Financeiro** (`FIN`) | — | 0 | Implementação (gastos/NF via evento) | Em andamento | (via Eventos + Billing) |
| **Notificações** (`NOTIF`) | — | 0 | Implementação (infra única; push pendente) | Em andamento | `NOTIF-001_NOTIFICACOES.md` |
| **Medicamentos** (`MED`) | — | 0 | Implementação | Em andamento | (backlog) |
| **Suplementos** (`SUP`) | — | 0 | Implementação | Em andamento | (backlog) |
| **Vacinas** (`VAC`) | — | 0 | Não iniciado (domínio próprio; hoje via Eventos) | — | — |
| **Procedimentos** (`PROC`) | — | 0 | Implementação (via Eventos) | Em andamento | — |
| **Medidas Corporais** (`MED-C`) | — | 0 | Implementação (reorg pendente) | Em andamento | `BACKLOG_EVOLUCOES.md` (Fase C) |
| **Sinais Vitais** (`VIT`) | — | 0 | Implementação (aquisição = HIP-001) | Em andamento | `BACKLOG_EVOLUCOES.md` (Fase E) |
| **Billing** (`BILL`) | — | 0 | Implementação (fundação: entitlements+ciclo+invoices) | Em andamento | `BILLING-001_ASSINATURAS.md` |
| **HIP-001** (`HIP`) | — | 0 | Planejamento (implementar fase 3/4) | Planejado | `HIP-001_PLATAFORMA_INTEGRACOES.md` |
| **CARE-001** (`CARE`) | — | 0 | Planejamento (fase posterior) | Planejado | `CARE-001_ESPACO_COLABORATIVO.md` |

**NCs abertas na plataforma inteira: 0.** Sequência global de NC: `NC-0005` é a última registrada (todas encerradas).

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
