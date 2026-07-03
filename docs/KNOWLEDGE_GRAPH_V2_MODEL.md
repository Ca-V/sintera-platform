# SINTERA — Knowledge Graph v2 — Modelagem (Sprint 2)

**Status:** Sprint 2 — **modelagem, documento apenas** (sem código, sem banco, sem SQL, sem tecnologia). Desenvolvida em 3 partes SEQUENCIAIS, cada uma com Design Review: **Parte 1 (conceitual)** → aprovar → **Parte 2 (lógico)** → **Parte 3 (decisão arquitetural)**.
**Base:** `KNOWLEDGE_GRAPH_V2_SPEC.md` (Sprint 1, aprovada). Herda as 7 regras imutáveis — em especial **nº 1** (KG nunca altera a ingestão), **nº 6** (rastreabilidade obrigatória) e **nº 7** (monotonicidade: KG só acrescenta; Catálogo=O QUE · Ingestão=ONDE · KG=COMO).
**Critério da Parte 1:** *um cientista e um engenheiro devem entender o modelo sem conhecer PostgreSQL.*

---

# PARTE 1 — MODELO CONCEITUAL

## 1.1 Tipos de nó

O KG conecta **conceitos científicos**. Cada nó é um conceito, não um dado do paciente.

| Nó | O que é | Identidade |
|---|---|---|
| **Biomarker** | O biomarcador | **`catalog_id`** do Scientific Catalog (SSOT — o KG NÃO cria identidade de biomarcador; referencia) |
| **Physiological System** | Sistema fisiológico (endócrino, renal, cardiovascular, hematológico…) | código próprio do KG |
| **Pathway** | Via metabólica/bioquímica | código próprio + referência à fonte (Reactome/KEGG…) |
| **Guideline** | Diretriz/protocolo científico | referência à fonte (ADA/KDIGO/ESC…) + versão |

> **Reference** e **Evidence** NÃO são nós de navegação — são **proveniência** anexada a cada relação (§1.5). O paciente, seus exames e medições **não** são nós do KG (o KG é conhecimento, não dado do paciente).

## 1.2 Tipos de relação — TAXONOMIA CONTROLADA (versionada)

Conjunto **fechado e versionado**. Novos tipos entram **apenas por governança** (nunca ad-hoc) — isso impede proliferação de relacionamentos arbitrários.

| Tipo | Origem → Destino | Direção | Exemplo |
|---|---|---|---|
| `belongs_to_system` | Biomarker → Physiological System | direcional | PTH → Sistema Endócrino |
| `participates_in_pathway` | Biomarker → Pathway | direcional | Glicose → Glicólise |
| `regulated_by` | Biomarker → Biomarker | direcional | Cálcio → PTH |
| `measured_with` | Biomarker ↔ Biomarker | simétrica | Ferritina ↔ Saturação de transferrina |
| `recommended_by` | Biomarker → Guideline | direcional | HbA1c → Diretriz ADA |
| `associated_with` | Biomarker → Physiological System | direcional | Albumina → Função renal |

## 1.3 Cardinalidades

- Um **Biomarker** pode pertencer a **vários** sistemas, participar de **várias** vias, ser recomendado por **várias** diretrizes → todas as relações são **N:N**.
- Um **Physiological System** agrega **muitos** biomarcadores.
- `regulated_by` e `measured_with` conectam **Biomarker↔Biomarker** (N:N); `regulated_by` é direcional (A é regulado por B ≠ B regulado por A), `measured_with` é simétrica.
- Nenhuma relação é 1:1 obrigatória — o grafo é intencionalmente esparso e explícito.

## 1.4 Ciclo de vida das relações

Toda relação percorre estados **governados** (nunca é apagada — histórico preservado, coerente com o modelo append-only da ingestão):

```
draft ──▶ approved ──▶ active ──▶ deprecated
 (proposta)  (revisada)  (publicada)  (aposentada; retired_at preenchido)
```

- **draft:** proposta pela curadoria, já com fonte (Regra nº 6).
- **approved:** revisada pela governança científica.
- **active:** publicada; visível para navegação.
- **deprecated:** aposentada por nova versão/evidência; **permanece auditável** (não deletada).

## 1.5 Proveniência (Regra nº 6)

**Toda** relação carrega, obrigatoriamente:
- **Reference** — a fonte identificável (ex.: LOINC/SNOMED/Reactome/diretriz) com **identificador** e **versão**;
- **Evidence** — o que sustenta a relação + **força/nível** da evidência.

Uma relação **sem fonte identificável e versionada não existe** no KG.

## 1.6 Versionamento

- **Fonte** e **relação** são versionadas. Nova evidência ou nova versão da fonte → **nova versão da relação**; a anterior é **deprecada**, não sobrescrita.
- O grafo é reconstruível por versão (auditoria científica), espelhando a filosofia de reprodutibilidade da ingestão.

## 1.7 Regra de identidade da relação (ressalva da fundadora)

> A identidade de uma `Relationship` é **`origin + relationship_type + target + source_version`**.

Consequência: **duas relações iguais, oriundas da mesma versão da mesma fonte, não coexistem duplicadas**. Uma mudança em qualquer um dos quatro componentes é uma relação distinta (ou uma nova versão).

## 1.8 Governança (conceitual)

- **Cria:** curadoria científica (proposta `draft`, sempre com fonte).
- **Aprova:** revisão científica responsável (`approved`).
- **Publica:** promoção a `active`.
- **Aposenta:** `deprecated` versionado (histórico preservado).
- **Monotonicidade (Regra nº 7):** o KG **só acrescenta** relações/conhecimento; **nunca** altera identidade ou dados canônicos do Catálogo ou da Ingestão.

---

## Critério de aceite da Parte 1
Ao final, esta parte responde, sem tecnologia:
- [ ] quais **nós** existem;
- [ ] quais **relações** existem (taxonomia controlada);
- [ ] quais **cardinalidades**;
- [ ] qual o **ciclo de vida** das relações;
- [ ] qual a **regra de identidade**;
- [ ] quais regras de **proveniência/versionamento/governança**.

---

# PARTE 2 — MODELO LÓGICO
*(A desenvolver após aprovação da Parte 1: entidades lógicas, atributos, chaves, restrições, índices conceituais, regras de integridade — ainda sem decidir implementação.)*

# PARTE 3 — DECISÃO ARQUITETURAL
*(A desenvolver após a Parte 2: relacional × extensão de grafo × grafo dedicado × híbrido — a decisão como CONSEQUÊNCIA do modelo, não o contrário.)*

---

**Próximo passo:** Design Review da **Parte 1 (Modelo Conceitual)** → decisão (Aprovada / com ressalvas / Reprovada). Só após aprovação segue a Parte 2 (lógico). Não reabrir fases anteriores.
