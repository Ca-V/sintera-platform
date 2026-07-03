# SINTERA — Knowledge Graph v2 — Modelagem (Sprint 2)

**Status:** Sprint 2 — **modelagem, documento apenas** (sem código, sem banco, sem SQL, sem tecnologia). 3 partes SEQUENCIAIS com Design Review entre cada: **Parte 1 (conceitual) — 🟢 APROVADA COM RESSALVAS resolvidas** (fundadora, 03/07: Reference≠Evidence · direção semântica geral · identidade≠estado) — **ENCERRADA**. **Parte 2 (lógico) — 🟢 APROVADA COM RESSALVAS resolvidas** (fundadora, 03/07: identidade natural×técnica · domínio/range formal · versionamento Reference×Relationship · metadados científicos×operacionais) — **ENCERRADA**. **Parte 3 (decisão arquitetural) — em revisão** (abaixo).
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

**Regra geral de direção:** *toda relação possui **direção semântica definida** (origem → destino).* Apenas os tipos **explicitamente marcados como simétricos** (ex.: `measured_with`) admitem **navegação bidirecional sem duplicar a relação** — a relação é cadastrada **uma única vez**; a navegação A↔B decorre da simetria, não de dois registros (A→B e B→A).

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

**Toda** relação carrega, obrigatoriamente, duas coisas **distintas e não intercambiáveis**:
- **Reference** = a **FONTE científica identificável** — *onde* a relação está documentada (ex.: uma diretriz, um artigo, uma base como LOINC/Reactome/KEGG/MedlinePlus), com **identificador** e **versão**.
- **Evidence** = o **SUPORTE que justifica** aquela relação **naquela** referência — *quão forte* ela é (nível/força da evidência, tipo de estudo, qualidade metodológica).

> **Reference ≠ Evidence.** "Evidence" nunca é usada como sinônimo de "fonte": a Reference diz **de onde vem**; a Evidence diz **o quão sustentada está**. Uma relação **sem fonte identificável e versionada não existe** no KG (Regra nº 6).

## 1.6 Versionamento

- **Fonte** e **relação** são versionadas. Nova evidência ou nova versão da fonte → **nova versão da relação**; a anterior é **deprecada**, não sobrescrita.
- O grafo é reconstruível por versão (auditoria científica), espelhando a filosofia de reprodutibilidade da ingestão.

## 1.7 Regra de identidade da relação (ressalva da fundadora)

> A identidade de uma `Relationship` é **`origin + relationship_type + target + source_version`**.

Consequência: **duas relações iguais, oriundas da mesma versão da mesma fonte, não coexistem duplicadas**. Uma mudança em qualquer um dos quatro componentes é uma relação distinta (ou uma nova versão).

> **Identidade ≠ estado.** O **estado** (`draft`, `approved`, `active`, `deprecated`) **NÃO** participa da identidade da relação. Uma mudança de estado (ex.: `approved` → `active`, ou `active` → `deprecated`) **não** cria uma nova relação — é a **mesma** relação mudando de estado no seu ciclo de vida.

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

**Independente de tecnologia** (nada de PostgreSQL/grafo/SQL — isso é a Parte 3). Aqui: entidades lógicas, atributos, chaves, restrições, índices conceituais e regras de integridade.

## 2.1 Entidades lógicas e atributos

**Nós (conceitos):**

| Entidade | Atributos | Chave |
|---|---|---|
| **Biomarker** (nó) | `catalog_id` (referência ao Scientific Catalog — SOMENTE LEITURA) | `catalog_id` |
| **PhysiologicalSystem** | `system_id`, `name` | `system_id` |
| **Pathway** | `pathway_id`, `name`, `reference_id` | `pathway_id` |
| **Guideline** | `guideline_id`, `name`, `organization`, `reference_id`, `version` | `guideline_id` |

> O nó **Biomarker não tem atributos próprios de identidade/dado** — nome, material, painel e unidade vêm do Catálogo (Regra nº 7). O KG só guarda a **referência** (`catalog_id`).

**Proveniência (Reference ≠ Evidence):**

| Entidade | Atributos | Chave |
|---|---|---|
| **Reference** (a FONTE) | `reference_id`, `source_type` (loinc/snomed/reactome/kegg/guideline/article/medlineplus…), `external_identifier` (código/DOI/PMID/URL), `version`, `organization`, `retrieved_at` | `reference_id` |
| **Evidence** (o SUPORTE) | `evidence_id`, `reference_id` (→ Reference), `strength` (nível/força), `study_type?`, `quality?`, `notes?` | `evidence_id` |

**Relação (aresta de 1ª classe):**

| Entidade | Atributos | Chave |
|---|---|---|
| **Relationship** | `origin_node`, `relationship_type`, `target_node`, `source_version`, `evidence_id` (→ Evidence), `reference_id` (→ Reference), `status`, `created_at`, `retired_at` | **identidade natural** = (`origin_node`, `relationship_type`, `target_node`, `source_version`) |

> **Refinamento decorrente da Ressalva 1:** a **força da evidência (`strength`) é atributo de `Evidence`**, não é duplicada na `Relationship` — a relação a alcança via `evidence_id`. Assim "força" tem um único dono.

## 2.2 Chaves — identidade NATURAL × identidade TÉCNICA (Ressalva 1)
Toda entidade lógica tem **duas identidades distintas**:
- **Identidade natural (de negócio) — imutável:** o significado. Para a `Relationship` = (`origin_node`, `relationship_type`, `target_node`, `source_version`); para os nós = `catalog_id`/`system_id`/`pathway_id`/`guideline_id`.
- **Identidade técnica (de persistência) — interna:** um identificador de superfície (surrogate), usado **apenas** para persistência, referências internas (FKs) e auditoria. **Nunca** carrega significado científico e **não** substitui a identidade natural.

- **Nós:** identidade natural = `catalog_id` (Biomarker — chave externa/somente-leitura ao Catálogo), `system_id`, `pathway_id`, `guideline_id` (+ id técnico interno).
- **Proveniência:** `reference_id` (Reference); `evidence_id` (Evidence, com FK → Reference).
- **Relationship:** identidade natural **única** (`origin`+`type`+`target`+`source_version`); id técnico interno para persistência/auditoria; FKs → `Evidence` e → `Reference`.

## 2.3 Restrições / regras de integridade
- `relationship_type` ∈ **taxonomia controlada** (conjunto fechado — §1.2); valor fora dela é inválido.
- `status` ∈ {`draft`, `approved`, `active`, `deprecated`}; **não participa da identidade** (Ressalva 3).
- `evidence_id` **e** `reference_id` **obrigatórios** em toda relação (Regra nº 6 — sem proveniência não existe).
- **Identidade única:** não coexistem duas relações com (`origin`+`type`+`target`+`source_version`) iguais.
- `retired_at` preenchido **se e somente se** `status = deprecated`.
- **Direção/simetria:** `origin_node`→`target_node` sempre definido; tipos simétricos (`measured_with`) armazenados **uma vez** (proibido cadastrar A→B **e** B→A).
- **Compatibilidade de domínio/range:** `origin_node`/`target_node` devem ser dos tipos previstos para o `relationship_type` (ex.: `belongs_to_system` só de Biomarker → PhysiologicalSystem).
- **Somente-leitura entre camadas:** `catalog_id` é referência; o KG **nunca** escreve no Catálogo nem na Ingestão (Regras nº 1 e nº 7).
- **Append-only:** nenhuma relação é deletada; aposentadoria = `status=deprecated` + `retired_at` (histórico preservado).

### 2.3.1 Regra formal de domínio/range (Ressalva 2)
Cada `relationship_type` tem **origem obrigatória** e **destino obrigatório**. Criar uma relação fora do par é **inválido** (ex.: `Guideline belongs_to_system Pathway` não existe).

| relationship_type | origem obrigatória | destino obrigatório | simétrica |
|---|---|---|---|
| `belongs_to_system` | Biomarker | PhysiologicalSystem | não |
| `participates_in_pathway` | Biomarker | Pathway | não |
| `regulated_by` | Biomarker | Biomarker | não |
| `measured_with` | Biomarker | Biomarker | **sim** |
| `recommended_by` | Biomarker | Guideline | não |
| `associated_with` | Biomarker | PhysiologicalSystem | não |

### 2.3.2 Versionamento de Reference × Relationship (Ressalva 3)
*Uma nova versão de uma `Reference` **não** cria automaticamente uma nova `Relationship`.* A `Reference v2` só gera/atualiza relação **após passar novamente pelo ciclo editorial** (`draft → approved → active`). Isso preserva a governança: mudança de fonte não vira conhecimento ativo sem aprovação.

### 2.3.3 Metadados científicos × operacionais (Ressalva 4)
Atributos como `created_at`, `updated_at`, `retired_at`, `approved_by`, `status` (e o id técnico) são **metadados OPERACIONAIS** — de persistência/auditoria/governança. **NÃO** são conhecimento científico do grafo. O conhecimento científico está em: os **nós**, os **tipos de relação** (taxonomia), a **Evidence** (força) e a **Reference** (fonte). Essa separação evita que metadados operacionais sejam confundidos com atributos científicos.

## 2.4 Índices conceituais (padrões de acesso — sem DDL)
Quais buscas precisam ser eficientes (a **tecnologia** que as realiza é a Parte 3):
- por `origin_node` — todas as relações de um biomarcador;
- por `target_node` — todos os biomarcadores de um sistema/via/diretriz;
- por `relationship_type`;
- por `status` — só as `active` para a navegação;
- por `reference_id`/`source_version` — auditoria (tudo que veio de uma fonte/versão);
- navegação bidirecional para tipos simétricos.

## 2.5 Regras de integridade (resumo)
Rastreabilidade (nº 6) · Monotonicidade (nº 7) · append-only · identidade sem estado · direção semântica · taxonomia fechada · `catalog_id` somente-leitura · proveniência obrigatória.

## Critério de aceite da Parte 2
- [ ] quais **entidades lógicas** existem e seus **atributos**;
- [ ] quais **chaves** (identidade natural das relações; PKs dos nós; FKs de proveniência);
- [ ] quais **restrições/regras de integridade**;
- [ ] quais **índices conceituais** (padrões de acesso);
- [ ] **sem** decidir tecnologia de armazenamento.

# PARTE 3 — DECISÃO ARQUITETURAL
*(A desenvolver após a Parte 2: relacional × extensão de grafo × grafo dedicado × híbrido — a decisão como CONSEQUÊNCIA do modelo, não o contrário.)*

---

**Próximo passo:** Design Review da **Parte 1 (Modelo Conceitual)** → decisão (Aprovada / com ressalvas / Reprovada). Só após aprovação segue a Parte 2 (lógico). Não reabrir fases anteriores.
