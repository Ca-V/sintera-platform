# SEC-019 — Backup / Restore / RPO / RTO · v0.1 (rascunho para revisão)

> **Estado:** E1 (documento). Define **objetivos propostos** de continuidade e o **procedimento de teste de
> restore**. **Escopo do Lote S0-A:** documentação. **Não** executa restore real nem altera configuração de
> backup do provedor (infra — gate S3). Complementa `docs/OPS-002_RELEASE_BACKUP_RUNBOOK.md`.

## 1. Objetivos propostos (para aprovação)
| Métrica | Definição | Alvo proposto | Estado |
|---|---|---|---|
| **RPO** (Recovery Point Objective) | perda máxima de dados aceitável | ≤ 24h (PITR do provedor pode reduzir a minutos) | **a aprovar** |
| **RTO** (Recovery Time Objective) | tempo máximo para restaurar serviço | ≤ 4h | **a aprovar** |

> Estes números são **propostas** de baseline; o valor final depende da criticidade clínica e do plano do provedor
> (Supabase). Devem ser ratificados no gate S3.

## 2. Escopo de dados
- **Banco (Postgres/Supabase):** tabelas de usuária, exames, biomarcadores, canônico FHIR (137→143), consent/audit.
- **Storage (arquivos/laudos):** bucket `exams` (documentos por usuária).
- **Config/segredos:** fora deste escopo (SEC-007 / gate material).

## 3. Estratégia de backup (estado atual + alvo)
- **Atual:** backups gerenciados do provedor (Supabase). Retenção/imutabilidade **não verificadas** no material.
- **Alvo (S3):** backups **criptografados e isolados** (vault imutável, cópia fora da conta primária), retenção
  definida por classe de dado (C0–C5), PITR habilitado.

## 4. Procedimento de teste de restore (checklist — a executar em S3, ambiente descartável)
1. Provisionar ambiente de recuperação **separado da produção** (sem dado real, ou cópia controlada sob gate).
2. Restaurar o backup mais recente (DB + storage) para o ambiente.
3. Validar integridade: contagens por tabela, checksums de amostras, RLS efetiva, abertura de um laudo.
4. Medir **tempo real de restore** (→ RTO efetivo) e a **defasagem do ponto de restauração** (→ RPO efetivo).
5. Registrar evidência (E3→E4) e descartar o ambiente.

> **Ainda não executado.** O restore real é infra e roda no gate S3. Este documento fixa o **procedimento**.

## 5. DR (recuperação de desastre)
Runbook operacional em `OPS-002`. Pendências para S3: ambiente de recuperação declarado, ordem de restauração
(DB → storage → app), critério de "serviço restaurado", e comunicação (integra SEC-018 §7).

## 6. Limitações / residual
- Nenhum restore foi testado (E-doc apenas). RPO/RTO são **propostas**, não medições.
- Imutabilidade/isolamento de backup **não comprovados** — exigem config de cloud (gate S3, material).
