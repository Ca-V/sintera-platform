# RI-001 — Homologação estruturada (Condições como Reference Implementation)

> Executa o **Gate RI-001** (CAP-002-REF §4) como homologação **verificável**, não subjetiva.
> Ao final, a decisão sobre o RI-001 é objetiva: todos os cenários obrigatórios aprovados,
> sem regressões relevantes. Só então: **merge de Condições** + encerramento do marco RI-001.
> Preencher no **preview** da branch `feat/condicoes-captura` (já com o hotfix v1.0.1).

**Ambiente:** preview `feat/condicoes-captura` · **Testador:** fundadora · **Data:** ____
**Legenda:** ✅ aprovado · ❌ reprovado (abrir correção) · ⚠️ aprovado com ressalva (registrar)

---

## 1. Matriz de cenários obrigatórios

| # | Cenário | Resultado esperado | Status |
|---|---|---|---|
| 1 | **Receita médica** | Cria **Condição**; **não** cria Exame | ☐ |
| 2 | **Laudo laboratorial com um único exame** | Cria **Exame**; título = **nome do exame** (ex.: "Hemograma") | ☐ |
| 3 | **Painel laboratorial** (Hermes Pardini, Axial…) | Cria Exame; título = **"Exames laboratoriais"** | ✅ (Hermes Pardini) |
| 4 | **Sangue + urina no mesmo PDF** | `document_scope = mixed`; título = **"Exames laboratoriais"** | ✅ (`scope=mixed` confirmado no banco) |
| 5 | **Exame de imagem** | Título = **modalidade** (ex.: "Ressonância magnética") | ☐ |
| 6 | **Documento ilegível** | Solicita **revisão**; **não** cria registros incorretos | ☐ |
| 7 | **Documento duplicado** | Comportamento esperado **documentado** (até o DOC-001) | ☐ |
| 8 | **Documento original** | "Ver documento original" **funciona** | ☐ |
| 9 | **Timeline** | Exame e/ou Condição aparecem corretamente | ☐ |
| 10 | **Proveniência** | `origin`, `display_title`, `document_type`, `document_scope` **persistidos corretos** | ✅ (display_title/document_type/document_scope/issuer confirmados) |

---

## 2. Casos específicos (atenção redobrada — histórico do projeto)

| # | Caso | O que confirmar | Status |
|---|---|---|---|
| A | **Hermes Pardini** (painel sangue+urina) | O bug de nomenclatura **não regrediu** → "Exames laboratoriais", `scope=mixed` | ✅ + `issuer=Hermes Pardini` |
| B | **Axial** (se houver PDF representativo) | Mesmo padrão documental tratado igual (título por categoria+escopo) | ☐ |
| C | **PDF com diagnóstico + exames** | (a) Exame criado · (b) Condição criada **só** com diagnóstico explícito · (c) **vínculo** `source_exam_id` correto | ☐ |

---

## 3. Verificação de proveniência (SQL de conferência)

Após os cenários, conferir os registros criados no preview:

```sql
SELECT type, display_title, document_type, document_scope, status, created_at
FROM exams ORDER BY created_at DESC LIMIT 10;

SELECT name, kind, source, source_exam_id, file_url IS NOT NULL AS tem_documento
FROM health_conditions ORDER BY created_at DESC LIMIT 10;
```

Esperado: nenhum exame nomeado por biomarcador; `document_type`/`document_scope` coerentes
com o documento; condições com diagnóstico afirmado têm `source_exam_id` quando há laudo.

---

## 4. Critério de aprovação do RI-001

Marcar **Aprovado** somente quando:

- [ ] **Todos** os cenários obrigatórios (1–10) aprovados.
- [ ] Casos específicos A–C aprovados.
- [ ] Sem regressões relevantes.
- [ ] Verificação de proveniência (§3) coerente.

**Resultado do ARG:** ☐ Aprovado · ☐ Aprovado com ressalvas · ☐ Requer revisão · ☐ Requer ADR

Ao aprovar → **merge de `feat/condicoes-captura`** + marcar **RI-001 = ✅** (GOVERNANCA) + ADL.
Só **depois** disso inicia o **HUB-001** (contrato `CapturedDocument` extraído da ref. impl.
já validada em produção — não de hipótese arquitetural).

---

## 5. Ressalvas / achados durante a homologação

_(P0 bloqueia o merge; P1 corrige/homologa/segue; P2 vai ao backlog)_

| # | Cenário | Observado | Prioridade | Encaminhamento |
|---|---|---|---|---|
| F1 | Painel Hermes Pardini (captura em Condições) | A captura exibia o nome do documento por **um biomarcador** ("IGE específico para látex") — classificador leve (`vision/condition`) contornava o Content Classifier | P1 | **Corrigido + verificado** ✅: nome final salvo = "Exames laboratoriais • Hermes Pardini" (banco). |
| F2 | Mesmo documento (IgE látex **negativo**) | Pré-preencheu a condição **"Alergia a látex"** a partir de um exame **negativo** (inferência indevida; viola RDC 657 e "condição só com diagnóstico afirmado") | P1 | **Corrigido + verificado** ✅: nenhuma condição criada (banco). |
| F3 | Mesmo documento | Mensagem "Não consegui ler a condição" (vermelha) tratava ausência de condição como erro e empurrava a inventar uma | P2 | **Corrigido + verificado** ✅ (fundadora): nota informativa neutra. |
| F4 | Enriquecimento (sugestão fundadora) | Incluir o **nome do laboratório emissor** no título | — | **Feito + verificado** ✅: `issuer` extraído e exibido ("• Hermes Pardini"). |
