# OPS-002 — Runbook de Release, Backup e Restauração

**Status:** ativo · **Versão:** 1.0 (17/07/2026) · Referencia [[ADR-000]], [[COMPLIANCE-001]], [[OPS-001]].
**Objetivo:** procedimento operacional para **liberar** com segurança e **recuperar** dados, dado o princípio
**base-única (beta = produção)** — os dados do beta são o **histórico oficial** e devem ser **preservados
integralmente**. Complementa a observabilidade (OPS-001) e o escopo do [[RELEASE-1.0-DEFINITION]].

---

## 1. Princípio operacional (base-única)
> O Beta Oficial usa a **mesma base** que será promovida para Produção 1.0. **Não há migração** entre bancos de
> beta e produção; os dados inseridos pelos participantes constituem o **histórico oficial**. **Consequências:**
> (a) toda migração é **aditiva e reversível** (nunca destrutiva); (b) **backup/PITR** é pré-requisito de release;
> (c) ao surgir o **primeiro usuário externo**, features experimentais exigem **ambientes separados OU feature
> flags** ([[ARCH-FEATURE-FLAGS]]). Enquanto não há usuários reais, Preview = Prod DB é aceitável.

## 2. Gate de Pré-Push / Pré-Deploy (checklist obrigatório)
Antes de promover uma branch (merge/deploy), confirmar — **todos verdes**:
- [ ] **Build:** `npx next build` sem erros.
- [ ] **Tipos:** `npx tsc --noEmit` limpo.
- [ ] **Testes:** `npx vitest run` verde (suíte + contratos).
- [ ] **Migrações:** apenas **aditivas/reversíveis**; aplicadas via Supabase MCP e **versionadas** em
  `supabase/migrations/` (arquivo = o que rodou no banco). Nenhum `drop`/alteração destrutiva de coluna com dados.
- [ ] **Seed/dados demo:** não sobrescrevem dados reais (seed idempotente, resolvido por e-mail).
- [ ] **Feature flags:** feature experimental atrás de flag quando houver usuários externos (§1).
- [ ] **Backup/PITR:** habilitado e recente (§3) — especialmente **antes de migração**.
- [ ] **Observabilidade:** erros do pipeline logados sem PII (OPS-001); sem regressão de alertas.
- [ ] **Compliance Gate:** funcionalidade passou pelos eixos do [[COMPLIANCE-001]].
- [ ] **Segredos:** nenhum segredo versionado (service-role/API keys só em env).

## 3. Backup & Point-in-Time Recovery (PITR)
- **PITR (Supabase):** manter **habilitado** no projeto (`pxiglvrgxooawetboglb`); retenção conforme o plano.
  É a rede de segurança primária — recupera o banco a um **instante** (segundos/minutos) antes de um incidente.
- **Snapshot pré-migração:** antes de aplicar migração relevante, registrar o **timestamp** (UTC) para, se
  necessário, restaurar via PITR ao ponto imediatamente anterior.
- **Export lógico periódico:** além do PITR, um `pg_dump`/export lógico off-site fortalece a resiliência
  (proteção contra falha do projeto). Frequência conforme volume; guardar cifrado, fora do repositório.
- **Escopo:** banco (Postgres) **e** Storage (anexos/laudos) — o laudo original é fonte primária
  ([[principio_rastreabilidade_documental]]); o backup do bucket é tão crítico quanto o do banco.

## 4. Restauração (procedimento)
1. **Conter:** identificar a janela do incidente (o que corrompeu/apagou e quando).
2. **Decidir o alvo:** PITR a um instante **antes** do incidente (preferencial — preserva o máximo de histórico).
3. **Restaurar** pelo painel Supabase (PITR) para o timestamp escolhido; validar contagens-chave
   (usuários, exams, biomarkers, body_metrics, health_events) contra o esperado.
4. **Storage:** se anexos foram afetados, restaurar o bucket ao mesmo ponto.
5. **Verificar:** rodar a suíte de contratos + smoke manual das telas críticas (Exames, Registros de Saúde,
   Composição Corporal, Relatórios).
6. **Registrar** o incidente e a restauração (auditoria, COMP-08 — Plano de Resposta a Incidentes).

## 5. Rollback de deploy
- **Aplicação (Vercel):** reverter para o deploy anterior (imutável) — rollback instantâneo, sem tocar dados.
- **Banco:** como as migrações são **aditivas**, o rollback de app **não** exige reverter schema (colunas novas
  ficam nullable/ignoradas pela versão anterior). **Preferir forward-fix** a rollback destrutivo de schema.
- **Nunca** reverter schema apagando colunas com dados — isso viola o princípio base-única (§1).

## 6. Governança
Precedência ADR-000 > COMPLIANCE-001 > OPS-002. **Invariantes:** migração aditiva/reversível; PITR+Storage
como pré-requisito de release; restauração preserva o máximo de histórico; segredos nunca versionados;
observabilidade sem PII. Mudança nesses invariantes = revisão explícita.
