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

## 3. O que falta (plano de execução — 4 passos, ~1 build)
1. **Migration** (única linha de política): `create policy exams_delete on public.exams for delete to public
   using (auth.uid() = user_id);` — mesmo padrão owner-scoped das políticas existentes. *(Supabase MCP `apply_migration`.)*
2. **api-client** `exams.deleteExam(id)`: `storage.from('exams').remove([storagePath])` (best-effort) +
   `from('exams').delete().eq('id', id)` (a cascata cuida do resto). Convenção de escrita `{ error }`.
3. **Mobile** — botão **"Excluir exame"** no `ExamDetailScreen` + **confirmação** (ação irreversível); ao excluir,
   volta à lista (que já re-busca ao focar). Fronteira Inc.1 preservada (via `apiClient`).
4. **Testes** (deleteExam: sucesso/erro/sem sessão) + typecheck + suíte + build + homologação.

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
