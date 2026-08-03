# MOBILE-030 — Readiness: Exclusão de exames (pelo dono)

- **Natureza:** planejamento. **Decisão da fundadora pendente** (infra/segurança/LGPD). Pronto para executar rápido.
- **Origem:** homologação Inc6 — a fundadora não consegue apagar exames de teste na plataforma.

## 1. Causa
A tabela `exams` tem RLS de **INSERT/SELECT/UPDATE**, mas **não há política de DELETE** → nem Web nem Mobile
apagam exames. É uma lacuna, não um bug do Mobile.

## 2. O que JÁ existe (verificado no banco)
- **Cascata de exclusão pronta** (FKs): `CASCADE` em `biomarkers`, `ai_processing_log`, `ai_insights`,
  `biological_scores`, `clinical_results`, `extraction_versions`, `omics_panels`; `SET NULL` em `agenda_events`,
  `body_metrics`, `health_conditions`, e auto-referências de `exams`. → apagar um exame **limpa/desliga** os
  dependentes automaticamente, sem lógica extra.
- **Storage:** política `storage_exams_delete` já permite o dono apagar o próprio arquivo (`folder[1]=auth.uid()`).

## 3. Plano de execução — estado
1. ⛔ **PENDENTE (infra isolada — decisão D-DEL-1):** migration da política RLS:
   `create policy exams_delete on public.exams for delete to public using (auth.uid() = user_id);`
   — mesmo padrão owner-scoped das existentes. Sem ela, `deleteExam` retorna erro (RLS bloqueia). *(MCP `apply_migration`.)*
2. ✅ **FEITO — `api-client` `exams.deleteExam(id)`** (`exams/delete.ts`): remove o arquivo do Storage (best-effort,
   via `storagePathFromUrl`) + `delete().eq('id', id)` (cascata FK cuida do resto). Wired no `ApiClient`. +testes.
3. ✅ **FEITO (gated) — botão "Excluir exame"** no `ExamDetailScreen` + confirmação irreversível (`Alert`) +
   `useExam.remove()`. Fica **atrás de flag** `featureFlags.examsDelete` (`EXPO_PUBLIC_EXAMS_DELETE_ENABLED`),
   **default DESLIGADO** — não expõe um botão que falharia sem a RLS. Sucesso → volta à lista.
4. ✅ **FEITO — testes** (`storagePathFromUrl` + guarda de sessão); typecheck + suíte verdes.

## 3b. Runbook de ativação (quando abrir a janela de infra — 1 passo de infra + 1 build)
1. **Migration RLS** (MCP `apply_migration`): `create policy exams_delete on public.exams for delete to public
   using (auth.uid() = user_id);`
2. **Ligar o flag:** `eas env:set --environment preview EXPO_PUBLIC_EXAMS_DELETE_ENABLED true` (plaintext).
3. **Rebuild** (o botão aparece e a exclusão fica **imediatamente operacional**) → homologar.

> **Resumo:** TODO o código está pronto (api-client + UI + testes). Falta só a **política RLS** (infra compartilhada,
> isolada para a janela apropriada). Ativar = migration + flag + build. Nada mais bloqueia.

## 4. Impacto / risco
- **LGPD-positivo:** a pessoa passa a apagar o **próprio** dado (direito de eliminação). RLS confina ao dono.
- **Reversível no código** (a política é droppável); **a exclusão do dado em si é irreversível** → exige
  **confirmação** na UI (e não oferecer "apagar tudo" sem dupla checagem).
- Afeta **Web e Mobile** (ambos ganham a capacidade via RLS) — coerente com arquitetura única.

## 5. Decisão pendente
- **D-DEL-1:** aprovar a política RLS de DELETE por dono em `exams`? (habilita a exclusão nas duas plataformas)
- **D-DEL-2 (imediato, separado):** quais exames de **teste** apagar agora pelo admin (limpeza da tela) — lista
  apresentada à fundadora; os reais já processados **não** são tocados.

> Aprovado o D-DEL-1, executo os 4 passos direto (migration + código + build). O D-DEL-2 é limpeza pontual e não
> depende do D-DEL-1.
