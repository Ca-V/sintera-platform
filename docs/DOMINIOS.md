# DOMINIOS — Painel mestre dos domínios da SINTERA

> Índice único do estado de cada domínio. O **processo** é o mesmo para todos (`docs/LIFECYCLE_DOMINIOS.md`);
> o **estado** de cada domínio vive no seu próprio doc. Estados do domínio (passo atual do ciclo):
> `Planejamento` · `Não iniciado` · `Implementação` · `Auditoria estática` · `Gate Arquitetural` ·
> `Auditoria funcional` · `Homologação` · `Certificação` · `Encerrado`.

Indicadores por domínio: **Func.** (implementadas/total) · **NCs abertas** · **Jornada** (passo atual do
ciclo) · **Estado**. Prefixo de ID por domínio entre parênteses. `—` = ainda não cataloga do (entra no ciclo depois).

| Domínio (prefixo) | Func. | NCs abertas | Jornada / passo | Estado | Docs |
|---|:--:|:--:|---|---|---|
| **Exames** (`EXA`) | 13/13 | 3 (2 méd. + 1 baixa; todas justif.) | Gates ✅ · Auditoria funcional (execução) pendente | Em andamento | `EXAMES_CHECKLIST_FUNCIONAL.md` · `tests/homolog/COVERAGE.md` (0/8) |
| **Eventos Assistenciais** (`EVT`) | 11/11 | 8 (5 méd. + 3 baixa; 0 crít./alta) | Gates ✅ · Auditoria funcional (execução) pendente | Em andamento | `EVENTOS_CHECKLIST_FUNCIONAL.md` · `EVENTO_ASSISTENCIAL.md` |
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
| **Fase 0 — Compliance & Governança** (`COMP`) | 2 ✅ · 8 🟡 · 3 ⬜ (13) | 0 (2 exceções) | **Trilha PARALELA oficial** · Compliance Review ativo (gate 2 partes, **9 eixos** = Definition of Done) | Em andamento (paralelo a Exames) | `COMPLIANCE-001_GOVERNANCA.md` · `SEC-001` · `HIP-001` |

**NCs abertas (crítica/alta) na plataforma: 0.** Total aberto: **11** (6 média + 5 baixa). Encerradas na
auditoria: **NC-0008** (consistência canônica, corrigida com de-promoção append-only) e **NC-0019** (fix
aditivo). Nenhuma aberta bloqueia o Lifecycle; a maioria são justificadas/adiadas (Convergência Progressiva,
roadmap multi-exame, vínculo duro) ou dependem de ambiente executável / decisão de produto. Por Tipo: Dados 1 ·
Funcional 4 · UX 5 · Arquitetural 1. Encerradas também **NC-0020** (idempotência de irmãos multi-exames), **NC-0021** (nomenclatura urina) e **NC-0022** (financeiro: milhar pt-BR em `parseAmountToCents`), todas no mesmo ciclo. Última NC: `NC-0022`.

**Fase 0 (Compliance & Governança) — trilha PARALELA:** roda ao lado de Exames, sem pausá-lo. **Gate em duas
partes** (Review Técnico → **Compliance Review**, 8 eixos) é **Definition of Done de TODA a plataforma**: nenhuma
funcionalidade é `Done` sem passar (`COMPLIANCE-001_GOVERNANCA.md`). Exceção só via **Exception Register** (nunca
implícita); toda alteração passa por **Impact Assessment**. Postura conservadora: só `✅` com evidência verificável.

**Prioridade (um domínio por vez até `Encerrado`):** **Exames** é o foco atual; só após seu encerramento
(Checklist `Homologado` + Matriz 100% + Certificação) o próximo domínio entra no ciclo. Cada domínio, ao
entrar, ganha seus próprios docs (`<DOMINIO>_CHECKLIST_FUNCIONAL.md`, `_HOMOLOGACAO`, `_CERTIFICACAO`) seguindo
o LIFECYCLE, sem redefinir governança.

## Estrutura de governança — RESPONSABILIDADE ÚNICA por documento (não duplicar informação)
```
GOVERNANCA.md          → princípios constitucionais · regras permanentes · referência ao Lifecycle
LIFECYCLE_DOMINIOS.md  → ciclo obrigatório (8 passos) · gates · critérios · NCs (regra) · homologação · certificação
DOMINIOS.md            → PAINEL EXECUTIVO do projeto (estado de cada domínio + links)
<DOM>_CHECKLIST_FUNCIONAL.md → BACKLOG OFICIAL do domínio (itens F, estado, evidências)
  └─ (seção) Registro de Execução → ACOMPANHAMENTO da Auditoria Funcional (jornada·executor·data·resultado·NCs)
tests/homolog/COVERAGE.md   → MATRIZ DE HOMOLOGAÇÃO (aceite com documentos reais)
<DOM>_CERTIFICACAO (quando houver) → validação contra os princípios constitucionais
```
Cada documento tem UMA responsabilidade; o processo (regra) vive só no LIFECYCLE, o estado só no doc do domínio.
