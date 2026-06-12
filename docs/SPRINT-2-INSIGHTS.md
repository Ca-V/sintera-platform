# SINTERA — Sprint 2: Motor de Insights

**Versão:** v1 (rascunho institucional)
**Data:** 2026-06-12
**Status:** documento de continuidade. Captura a arquitetura-alvo do motor de insights e o estado real de cada componente.

> ⚠️ **A definição oficial de "Sprint 2" não existe em nenhum artefato do projeto** (commits, banco, deploys). O escopo abaixo foi **derivado** do schema preparado nas migrações 022/022b e dos prompts em draft. Tudo marcado como *derivado* é inferência estruturada, não decisão registrada. A fundadora deve confirmar/corrigir o escopo.

---

## 1. Estado atual (FATO VERIFICADO, 2026-06-12)

| Componente | Status | Evidência |
|---|---|---|
| Contrato de dados (schema) | ✅ Pronto | migrações 022/022b aplicadas; `ai_insights` estendida, `insight_feedback`, `biomarker_catalog` (83), `biomarker_aliases` (99) |
| Governança básica | ⚠️ Parcial | `prompt_registry` + `ai_processing_log` existem; prompts narrative/qa em `draft` não aprovados |
| Resolver | ✅ Implementado e testado (não conectado) | `src/lib/ai/insights/resolver.ts`; smoke test bate 100% nos 118 pares reais |
| Assembler | ✅ Implementado e testado (não conectado) | `src/lib/ai/insights/assembler.ts` |
| Motor determinístico | ⚠️ Mecanismo implementado e testado; regras (limiares) bloqueadas por clínica | `src/lib/ai/insights/engine.ts` + `rules.clinical.ts` (ruleset VAZIO até aprovação) |
| Templates rule-based | ❌ Não implementado | `template_key` previsto no schema, sem catálogo de templates |
| Geração narrativa | ❌ Não implementado | prompt existe (draft); sem código que o invoque |
| Gate de QA | ❌ Não implementado | prompt existe (draft); sem código |
| Persistência em `ai_insights` | ⚠️ Schema pronto, sem código de escrita | só há leitura para export LGPD |
| Página `/dashboard/insights` | ⚠️ Placeholder "Em desenvolvimento" | `src/app/dashboard/insights/page.tsx` |

Os 13 registros existentes em `ai_insights` são **legado** do pipeline antigo (Gemini/Groq, até 02/06), sem `template_key`/`insight_type`. Ver `docs/AUDITORIA-ESTADO-2026-06-12.md`.

---

## 2. Ordem de execução recomendada

Seguindo o princípio "conhecimento institucional é mais difícil de mudar que código" — **governança clínica antes do código**:

```
Recuperação (✅ feito: migrações/prompts/edge no repo)
        ↓
Governança Clínica v1  ← BLOQUEIA o resto (ver docs/GOVERNANCA-CLINICA-SINTERA.md)
        ↓
Motor Determinístico (limiares → clinical_flag)
        ↓
Templates Rule-Based
        ↓
Narrativa (prompt narrative aprovado)
        ↓
QA (prompt qa aprovado)
        ↓
Ativação (UI + feedback + persistência)
```

Os componentes puramente técnicos sem dependência clínica (**Resolver** e **Assembler**) podem ser construídos **em paralelo** desde já, pois operam apenas sobre dados já existentes.

---

## 3. Especificação derivada de cada componente

> *Derivado do schema — confirmar antes de implementar.*

### 3.1 Resolver  ✅ implementado — `src/lib/ai/insights/resolver.ts`
**Entrada:** `biomarkers.name` + `biomarkers.unit`.
**Processo:** normaliza o nome (lowercase, sem acento — porte do `translate(...)` da migração 022), casa contra `biomarker_aliases.alias_normalized`, desambigua por `unit_pattern` (substring literal, ver correção 022b).
**Saída:** entrada do `biomarker_catalog` (ou null se não casar).
**Validação:** smoke test executável (`__smoke__/resolver.e2e.mjs`) resolve 118/118 pares reais idêntico ao `catalog_id` de produção.
**Falta:** conectar à rota de extração para preencher `biomarkers.catalog_id` em exames novos.

### 3.2 Assembler  ✅ implementado — `src/lib/ai/insights/assembler.ts`
**Entrada:** `examId` + `userId`.
**Processo:** carrega biomarcadores + perfil, resolve contra o catálogo, organiza por categoria, calcula `rangeStatus` aritmético (valor vs. faixa impressa) e lista críticos/fora-de-faixa/não-resolvidos.
**Saída:** `InsightContext` estruturado para o motor determinístico (futuro).
**Sem dependência clínica.** Não emite `clinical_flag`.

### 3.3 Motor determinístico  🔴 bloqueado por decisão clínica
**Entrada:** contexto do assembler.
**Processo:** aplica regras *valor → `clinical_flag`* por biomarcador. **Estas regras não existem** — ver pendência §1.2 e §7 da governança.
**Saída:** candidatos a insight com `insight_type` (`biomarker`/`cluster`/`longitudinal`/`priority`), `clinical_flag`, `template_key`, `biomarker_ids`, `clinical_confidence`.

### 3.4 Templates rule-based  🔴 bloqueado por decisão clínica
Catálogo de textos-base por `template_key`. Não existe. Definir junto com o motor.

### 3.5 Narrativa  🔴 bloqueado por aprovação do prompt
Invoca operação `narrative` (modelo `claude-sonnet-4-6` já configurado em `ai_provider_config`). Respeita `clinical_flag` decidido pelo motor — não o recalcula.

### 3.6 Gate de QA  🔴 bloqueado por aprovação do prompt
Invoca operação `qa` (modelo `claude-haiku-4-5`). Decide `approved: true|false`. **Pendente:** o que fazer com reprovados (governança §4).

### 3.7 Persistência + Ativação  🟡 técnico, após os anteriores
Grava em `ai_insights` (dedup por `content_hash` + `exam_id` — índice único já existe). Conecta `/dashboard/insights` a dados reais. Implementa API de `insight_feedback` (tabela pronta, sem rota).

---

## 4. Integração com o AI Gateway

**FATO VERIFICADO:** `src/lib/ai/` tem gateway, prompt-loader e provider Anthropic, mas o `prompt-loader` só é chamado pela operação `extraction`. Para narrative/qa será preciso estender o gateway — os modelos já estão configurados em `ai_provider_config` (narrative/qa ativos), faltando apenas o código que os consome.

---

## 5. Dependências entre tarefas

```
Governança Clínica v1 ──┬──> Motor Determinístico ──> Templates ──┐
                        │                                          ├──> Persistência ──> Ativação UI
Aprovar prompt narrative ──> Narrativa ─────────────────┐         │
Aprovar prompt qa ─────────> Gate QA ───────────────────┴─────────┘
Resolver (paralelo) ──> Assembler (paralelo) ──> alimenta o Motor
```

---

## 6. Definição de "pronto" do Sprint 2 (PENDENTE — confirmar)

*Proposta derivada, a validar pela fundadora:*
- [ ] Resolver + Assembler implementados e cobertos por testes.
- [ ] Limiares clínicos aprovados e codificados (motor determinístico).
- [ ] Prompts narrative + qa aprovados (status `active`).
- [ ] Pipeline ponta-a-ponta gravando em `ai_insights` com rastreabilidade.
- [ ] `/dashboard/insights` exibindo insights reais + coleta de `insight_feedback`.
- [ ] Política de tratamento de insights reprovados pelo QA definida.

---

## 7. Riscos específicos do Sprint 2

- **Implementar antes de aprovar a clínica** → motor que precisa ser reescrito. Mitigação: governança primeiro.
- **Ativar narrativa de saúde sem gate aprovado** → risco regulatório/clínico alto. Mitigação: nunca passar `draft → active` sem `approved_by` humano.
- **Insights legados** misturados aos novos. Mitigação: decidir purge/marcação (item de produto).
