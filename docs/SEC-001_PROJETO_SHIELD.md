# SEC-001 — Projeto Shield · Segurança, Governança e Continuidade

**Status:** Charter aprovado + refinado pela fundadora (10/07/2026). **Domínio permanente da plataforma** — no mesmo nível de arquitetura, produto, estratégia, branding e compliance; **não** um conjunto de correções pré-lançamento.
**Objetivo:** operar **dados sensíveis de saúde** com padrões elevados de **segurança, recuperação e governança**.

> **Meta (reformulada):** nenhuma plataforma séria afirma estar "100% segura". O alvo é um **nível compatível com plataformas que armazenam dados sensíveis de saúde** (LGPD Art. 11). Segurança é **processo**, não evento.

---

## Estado atual — verificado 10/07 (Supabase Advisor + get_project · ref `pxiglvrgxooawetboglb`)
- **Código:** Git + GitHub (histórico, reversível) + Vercel (todo deploy preservado; **rollback instantâneo**). ✅
- **Banco:** `ACTIVE_HEALTHY`, Postgres 17, us-east-2. **Nenhuma tabela com RLS desligado.** **Backup/PITR = A CONFIRMAR** (depende do plano).
- **Advisor:** **2 ERROS** — views `current_biomarkers`/`current_catalog` `SECURITY DEFINER` · **4 funções `SECURITY DEFINER`** exec por `authenticated` (`write_canonical_extraction`, `replace_biomarkers`, `canonical_route`, `should_write_canonical`) · **senha vazada OFF** · 3 `search_path` mutável · `pg_net` no `public` · 1 policy telemetria permissiva · 4 tabelas RLS-sem-policy = deny-all (ok).

---

## Divisão em duas fases *(refinamento fundadora 10/07)*

### 🔴 Shield P0 — pré-requisito MÍNIMO para produção (antes do lançamento)
Tudo que representa **risco imediato**.
- **Infraestrutura:** backup automático · **PITR** · **teste de restauração**.
- **Segurança:** proteção contra senhas comprometidas · correção dos `SECURITY DEFINER` · **revisão de RLS**.
- **Governança:** **inventário das permissões** · **revisão das secrets** · **rotação das chaves** (quando necessário).
  - *Item de verificação:* a Edge Function `pipeline-alert` está com `verify_jwt=false`. **Confirmar se é intencional** (ex.: webhook / função pública protegida por segredo próprio) **antes de classificar como vulnerabilidade**. Se **não** for intencional, entra como correção do P0.

### 🟡 Shield Evolução — Onda 2 (contínuo, após o lançamento)
monitoramento/observabilidade · auditoria contínua · classificação de dados · **Disaster Recovery completo** · LGPD aprofundada · documentação · testes periódicos.

*Racional: separa o **pré-requisito mínimo para produção** da **evolução contínua** — reduz risco imediato sem travar o roadmap funcional.*

---

## Os 5 pilares da continuidade
1. **Código-fonte** — GitHub oficial · **branch protegida** · histórico · **tags de versões estáveis** · rollback (Vercel).
2. **Banco de dados** — backups automáticos · **PITR** · **restauração testada** · procedimento documentado.
3. **Infraestrutura reproduzível** — recriar **só a partir do repo**: banco · storage · auth · funções · buckets · RLS · Edge Functions · cron. *(Migrations existem; buckets/edge/cron/policies a auditar.)*
4. **Deploy reproduzível** — GitHub → Vercel → Supabase, documentado.
5. **Disaster Recovery** — RTO/RPO conhecidos: *"quanto tempo para voltar ao ar se perder toda a infra?"* — documentar **e testar**.

## Criptografia *(capítulo próprio — documentar mesmo em serviço gerenciado)*
Dados **em trânsito (TLS)** · dados **em repouso** · **gerenciamento de chaves** · **política de rotação** · **armazenamento de segredos** · **criptografia dos backups**.

## Auditoria de recuperação *(crítico — provar que o backup funciona)*
Não basta existir backup. Critério: **restaurar integralmente uma cópia do ambiente em ambiente ISOLADO e validar a integridade**. *(Muitas empresas descobrem que o backup estava incompleto só quando precisam dele.)*

## Monitoramento e observabilidade
A plataforma precisa **saber quando algo para de funcionar**: disponibilidade · erros · tempo de resposta · **falhas de OCR** · **falhas de IA** · **falhas de upload** · **falhas de sincronização** · **falhas de notificação**.

## Auditoria contínua (segurança como rotina)
Após cada release relevante, executar e **registrar**: Supabase Advisor · OWASP Top 10 · `npm audit` · Dependabot · políticas RLS · funções SQL · permissões.

## Classificação da informação
| Categoria | Exemplo | Nível |
|---|---|---|
| Pública | Landing page | Baixo |
| Operacional | Configurações | Médio |
| **Saúde** | Exames, laudos, medicamentos | **Alto** |
| **Credenciais** | Tokens, chaves, autenticação | **Crítico** |

Dado de **Saúde** = **sensível (LGPD Art. 11)** → define política de acesso/proteção por tipo.

## LGPD + enquadramento regulatório
Dados de saúde **sensíveis (LGPD Art. 11)**: base legal reforçada · minimização · **retenção definida** · exclusão a pedido (já existe) · **encarregado (DPO)** · registro das operações. Enquadramento **RDC 657/2022** mantido (organiza, não interpreta — fora de SaMD). *(Detalhe futuro em REG-001.)*

---

## Critérios de conclusão (Definition of Done)

**Shield P0 (gate de produção):**
- [ ] Backups automáticos confirmados · **PITR** habilitado · **restauração testada** (auditoria de recuperação).
- [ ] Proteção contra senhas comprometidas habilitada.
- [ ] `SECURITY DEFINER` (2 views + 4 funções) revisados/corrigidos.
- [ ] **Políticas RLS auditadas**.
- [ ] Inventário de permissões · secrets revisadas · chaves rotacionadas (se necessário).
- [ ] Advisor **sem pendências críticas**.

**Onda 2 (evolução):**
- [ ] Monitoramento/observabilidade implementados · auditoria contínua em rotina.
- [ ] Classificação de dados aplicada às políticas · **DR completo** documentado e testado.
- [ ] LGPD aprofundada (retenção/DPO/registro) · criptografia documentada.

## Sequência aprovada (fundadora)
1. **Finalizar landing + TEMA A.** 2. **Homologar e publicar a Onda 1.** 3. **Executar o Shield P0.** 4. **Iniciar formalmente a Onda 2** (restante da governança/segurança/escalabilidade).
