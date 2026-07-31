# MOBILE-024 — Planejamento do Incremento 5 (Histórico de Exames)

- **Estado:** PLANEJAMENTO (nenhuma implementação neste documento). O código do Inc.5 só inicia **após o aceite
  do Inc.4** (gate da Onda 1 — [MOBILE-015 §Governança](MOBILE-015_ROADMAP_INCREMENTOS.md)).
- **Pré-condição:** Inc.4 [aceito]; branch de implementação nasce de `mobile-inc4-accepted`.
- **Relaciona-se com:** `src/app/dashboard/exams/` (Exames da Web — **referência de PARIDADE**) · [MOBILE-016](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md) (padrão do Inc.4) · REG-001 (fronteira factual).

## 0. Readiness Review (2026-07-31) — "existe surpresa?"

**Não. Fundação PRONTA e testada** (veio no merge do Inc.4):
- `@sintera/api-client` domínio **`exams`**: `listExams(query?, signal?)→ExamDTO[]` e `getExam(id, signal?)→ExamDTO|null`
  (contrato **congelado**, tipos em `packages/api-client/src/exams/types.ts`); `ApiClient.exams` wired.
- Testes: `tests/api-client/exams.test.ts` (mapeamento/filtros/erros). Typecheck/CI verdes na branch do Inc.4.
- **Dependências:** nenhuma nova (tabela `exams` já existe; RLS reusa a Web; **sem migrations**).
- **Riscos:** R1 escopo (mostrar só campos centrais do `ExamDTO`, não a linha inteira — já garantido pelo DTO);
  R2 fronteira (NÃO exibir "resultado interpretado" — só lista + documento original); R3 regressão de navegação.
- **Impacto arquitetural:** nenhum contrato público muda; nenhuma divergência com a Web (reusa o mesmo api-client).

## 1. Objetivo
Permitir **ver o histórico de exames** no app: lista (mais recentes primeiro) e o **documento original** de cada
um — paridade funcional com a tela de Exames da Web, adaptada a mobile. **Factual (REG-001):** organiza/exibe o
que existe; **não interpreta** resultado, não gera diagnóstico/risco.

## 2. Escopo
**Incluído:** tela **Lista de Exames** (via `listExams`) com `display_title`, `exam_date`, `issuer`, `status`,
`clinical_family` (chips), agrupada por período; **Detalhe** (via `getExam`) com os campos centrais + **acesso ao
documento original** (`file_url`). Ponto de entrada na aba **Documentos** (SSOT: Documentos = [Exames]).
**Excluído (incrementos/domínios próprios):** upload de exame (Inc.6), registro manual (Inc.7), biomarcadores/
evolução (Histórico de Exames avançado — depende de mais dados), financeiro (FIN-001).

## 3. Contrato de dados — CONGELADO (via `ApiClient.exams`, nunca Supabase direto)
`ExamDTO` (só exibição): `id · exam_date · display_title · document_type · clinical_family · status · issuer ·
requesting_physician · file_url · created_at`. `ExamsQuery`: `from/to` (DateRange) · `limit/offset` (PageRequest)
· `type` · `family`. Convenção: leitura → `T[]`/`T|null`, LANÇA em falha.

## 4. Navegação (§ paridade com a Web)
Aba **Documentos** ganha stack próprio (padrão do Inc.4: `ExamsList` raiz + `ExamDetail` empilhável, header
nativo temático). Só navegação (critério 10). Abrir o `file_url` = visualização do documento (a definir:
`Linking.openURL` para o PDF/imagem — decisão de implementação, sem regra de negócio).

## 5. Critérios de aceite
1. Lista exibe os exames (via api-client) mais recentes primeiro; estados carga/erro/vazio.
2. Detalhe abre um exame e dá **acesso ao documento original** (`file_url`).
3. **Fronteira REG-001:** nenhum "resultado interpretado"/diagnóstico/risco — só lista + documento.
4. **Fronteira Inc.1:** zero Supabase direto (teste estático, como `profile-boundary`).
5. Identidade DS-002; **sem regressão** de auth/navegação/Home/Perfil (Inc.1–4).
6. Engenharia verde (typecheck+testes+CI) → **Homologação** em Android físico → **Aceito** (tag + rastreabilidade MOBILE-022).

## 6. Sequência de implementação (pós-aceite do Inc.4)
1. **Mobile:** hook `useExams`/`useExam` (encapsulam `apiClient.exams`, abort/estados — padrão `useProfile`).
2. **Mobile:** `ExamsListScreen` + `ExamDetailScreen` (composição de primitivos DS; agrupamento por período).
3. **Navegação:** stack da aba **Documentos** (ExamsList + ExamDetail).
4. **Fronteira:** teste estático `exams-boundary` (não acessa Supabase direto).
5. **Validação:** typecheck + testes + CI → build EAS → homologação → aceite.

Cada etapa isolada e reversível (`tsc` + testes + commit por etapa) — mesma disciplina dos Inc.2–4.
