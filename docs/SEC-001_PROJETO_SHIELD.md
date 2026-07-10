# SEC-001 — Projeto Shield · Onda 2: Segurança, Governança e Escalabilidade

**Status:** Charter aprovado pela fundadora (10/07/2026). **Fase permanente de governança** — no mesmo nível da arquitetura, da estratégia e do branding; **não** um conjunto de correções pré-lançamento.
**Objetivo:** certificar a SINTERA para operar **dados sensíveis de saúde** com padrões elevados de **segurança, recuperação e governança**.

> **Meta de segurança (reformulada):** nenhuma plataforma séria afirma estar "100% segura". O objetivo é atingir um **nível compatível com plataformas que armazenam dados sensíveis de saúde** (LGPD Art. 11). Segurança é um **processo**, não um evento.

---

## Estado atual — verificado 10/07 (Supabase Advisor + get_project)
- **Código:** Git + GitHub (histórico completo, reversível) + Vercel (todo deploy preservado; **rollback instantâneo** em produção). ✅ **Encaminhado.**
- **Banco:** `ACTIVE_HEALTHY`, Postgres 17, us-east-2. RLS amplo — **nenhuma tabela com RLS desligado**. **Backup/PITR = A CONFIRMAR** (depende do plano Supabase).
- **Advisor de segurança (achados reais):**
  - **2 ERROS** — views `current_biomarkers` e `current_catalog` como `SECURITY DEFINER`.
  - **4 funções `SECURITY DEFINER`** executáveis por usuário logado (`write_canonical_extraction`, `replace_biomarkers`, `canonical_route`, `should_write_canonical`).
  - **Proteção de senha vazada DESLIGADA.**
  - 3 funções com `search_path` mutável · `pg_net` no schema `public` · 1 política de telemetria permissiva (`INSERT WITH CHECK true`).
  - 4 tabelas "RLS sem policy" = **deny-all** (logs internos — seguras).

---

## Os 5 pilares da continuidade operacional

**1. Código-fonte** — GitHub oficial · **branch protegida** · histórico completo · **tags de versões estáveis** · rollback imediato (Vercel). *(Branch protection + tags: a implementar.)*

**2. Banco de dados** — não basta "backup diário": **backups automáticos** · **Point-in-Time Recovery (PITR)** · **restauração TESTADA** · **procedimento documentado**. *(Backup sem restauração testada não garante recuperação.)*

**3. Infraestrutura reproduzível** — qualquer desenvolvedor autorizado recria **só a partir do repositório**: banco · storage · autenticação · funções · buckets · políticas RLS · Edge Functions · cron jobs. *(Migrations existem; buckets/edge/cron/policies a auditar — elimina dependência de config manual.)*

**4. Deploy reproduzível** — toda implantação reproduzível e documentada: GitHub → Vercel → Supabase.

**5. Disaster Recovery** — RTO/RPO conhecidos: *"quanto tempo para voltar ao ar se toda a infraestrutura for perdida?"* — documentar **e testar**.

---

## Auditoria contínua (o diferencial: segurança como rotina)
**Após cada release relevante**, executar e **registrar**: Supabase Advisor · OWASP Top 10 · `npm audit` · Dependabot · revisão de políticas RLS · revisão de funções SQL · revisão de permissões.

## Classificação da informação
| Categoria | Exemplo | Nível |
|---|---|---|
| Pública | Landing page | Baixo |
| Operacional | Configurações | Médio |
| **Saúde** | Exames, laudos, medicamentos | **Alto** |
| **Credenciais** | Tokens, chaves, autenticação | **Crítico** |

→ define política de acesso e proteção por tipo. Dado de **Saúde** = **sensível (LGPD Art. 11)**.

## LGPD + enquadramento regulatório
Dados de saúde são **sensíveis (LGPD Art. 11)**: base legal reforçada, minimização, **retenção definida**, exclusão a pedido (já existe exclusão de conta), **encarregado (DPO)**, registro das operações de tratamento. Mantido o enquadramento **RDC 657/2022** (organiza, não interpreta — fora de SaMD).

---

## Priorização

**P0 — imediato (barato, alto impacto; antes da fase):**
1. Ligar **proteção contra senhas vazadas** (Supabase Auth · painel).
2. Ligar **backups automáticos + PITR** (confirmar plano Pro · painel).
3. Corrigir os **2 ERROS `SECURITY DEFINER`** (views) — migration.

**P1 — a fase Shield:** revisar as 4 funções `SECURITY DEFINER` · fixar `search_path` · mover `pg_net` · corrigir política de telemetria · auditar reprodutibilidade (buckets/edge/cron) · DR runbook + teste de restauração · auditoria contínua · LGPD.

---

## Critérios de conclusão (Definition of Done)
- [ ] Supabase Advisor **sem pendências críticas**.
- [ ] Políticas **RLS auditadas**.
- [ ] Todas as funções **`SECURITY DEFINER` revisadas**.
- [ ] **Proteção contra senhas comprometidas** habilitada.
- [ ] **Backups automáticos e PITR** configurados.
- [ ] Procedimento de **restauração documentado e testado**.
- [ ] Plano de **Disaster Recovery** documentado.
- [ ] **Monitoramento e auditoria contínuos** implementados.
- [ ] Revisão de conformidade com **LGPD** e com o enquadramento regulatório (RDC 657/2022).
