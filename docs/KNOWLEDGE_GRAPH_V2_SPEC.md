# SINTERA — Knowledge Graph v2 — Specification (Sprint 1)

**Status:** Sprint 1 do KG v2 — **🟢 APROVADA COM RESSALVAS** (fundadora, 03/07). Ressalvas **editoriais resolvidas**: (1) `Relationship` como entidade de PRIMEIRA CLASSE com atributos formais (§3); (2) **Regra nº 7 — monotonicidade científica** (§1). **SPRINT 1 ENCERRADA.** **Documento apenas: sem código, sem banco, sem migrations, sem importação de fontes.** Descreve *o que* o KG relaciona e *o que ele nunca faz*. **Próxima etapa = Sprint 2 (Modelagem conceitual e física do grafo)**, dentro das fronteiras desta Spec aprovada. Não reabrir fases anteriores.
**Base congelada (contrato):** consome a **ingestão v2** (Fidelidade da Ingestão) e o **Scientific Catalog v2** (identidade dos biomarcadores — `catalog_id`), já homologados e consistentes. Coerente com `ARCHITECTURAL_DECISIONS.md`, `DOMAIN_GLOSSARY.md`, `CATALOG_SINGLE_SOURCE_OF_TRUTH.md`, `SCIENTIFIC_RETRIEVAL_LAYER.md` e a **Governança Científica** (RDC 657 — organiza/relaciona, não conclui).
**Pré-requisito para IMPLEMENTAR:** esta Spec aprovada (Design Review) — como no Catalog v2.

---

## 1. Princípios (regras imutáveis)

Estas regras precedem qualquer modelagem e não podem ser violadas por nenhuma decisão posterior.

- **Regra nº 1 — O Knowledge Graph NUNCA altera dados da ingestão.** Apenas **consome** informações já validadas pelas camadas inferiores (material, nome do exame, biomarcadores, `catalog_id`). É proibido "corrigir" ingestão a partir do KG.
- **Regra nº 2 — O KG não interpreta PDFs.** Não faz OCR, parsing, extração nem re-extração. Isso pertence à ingestão (congelada).
- **Regra nº 3 — O KG não modifica biomarcadores.** Não renomeia, re-materializa, reclassifica nem recategoriza medições ou entradas do catálogo.
- **Regra nº 4 — Toda relação científica é versionada e auditável.** Origem, versão, data, autor/aprovador e força de evidência são rastreáveis.
- **Regra nº 5 — O KG é somente leitura para as camadas superiores.** UI, notificações e (futuramente) IA/SRL **consultam** o grafo; não escrevem relações nele por conta própria.
- **Regra nº 6 — Rastreabilidade obrigatória (Proveniência Científica, ADR-017).** *Uma relação científica só existe no Knowledge Graph se puder ser rastreada até uma **fonte científica identificável e versionada**.* Proíbe relações por conveniência ou inferência não documentada; mantém o KG alinhado à governança científica.
- **Regra nº 7 — Monotonicidade científica (complementa a nº 1).** *O Knowledge Graph somente **ACRESCENTA** conhecimento às entidades existentes. Nunca modifica a identidade nem os dados canônicos provenientes do Scientific Catalog ou da Ingestão.* Responsabilidade única por camada: **o Catálogo define o QUE é o biomarcador · a Ingestão define ONDE ele foi encontrado · o KG define COMO ele se relaciona cientificamente.**

> Consequência das regras: o KG é uma camada de **conhecimento** sobre o dado do paciente — separada do dado do paciente. A dimensão científica (sistemas fisiológicos, vias, painéis científicos) que **saiu da interface operacional** (ING-003/004) **vive aqui**, e só aqui.

---

## 2. Objetivo

O KG v2 existe para **responder perguntas de RELAÇÃO CIENTÍFICA**, tais como:
- Quais biomarcadores pertencem ao **mesmo sistema fisiológico**?
- Quais participam da **mesma via metabólica**?
- Quais fazem parte da **mesma diretriz**?
- Quais **costumam ser interpretados em conjunto** (segundo fonte científica)?

O KG v2 **NÃO** responde (Governança Científica / RDC 657):
- **diagnóstico**;
- **tratamento**;
- **recomendação clínica**;
- **decisão médica**.

O KG **organiza e relaciona conhecimento**; a leitura clínica pertence ao profissional. Sínteses derivadas do grafo, quando existirem no futuro, serão **factuais e rotuladas**, nunca conclusões.

---

## 3. Entidades

Definição conceitual apenas — **nada de tabelas ainda**.

- **Biomarker** — o biomarcador, **identificado por `catalog_id`** (SSOT — não duplica identidade; consome do Catálogo).
- **Physiological System** — sistema fisiológico (endócrino, renal, cardiovascular, hematológico…).
- **Pathway** — via metabólica/bioquímica.
- **Guideline** — diretriz/protocolo de fonte científica identificável.
- **Evidence** — a evidência que sustenta uma relação (nível/força + referência).
- **Reference** — a fonte primária rastreável (identificador + versão).
- **Relationship** — a aresta científica entre entidades. É **entidade de PRIMEIRA CLASSE** (não um atributo implícito de outra entidade): toda relação é explícita, governada e rastreável. Isso impede que o grafo evolua para relacionamentos "implícitos" ou sem governança.

**Definição conceitual da entidade `Relationship`** (atributos, ainda **sem tabela**):

```
Relationship
  origin_node          — entidade de origem (ex.: Biomarker por catalog_id)
  target_node          — entidade de destino
  relationship_type    — tipo (§4: pertence ao sistema, participa da via, …)
  evidence_id          — evidência que sustenta a relação (Evidence)
  reference_id         — fonte primária rastreável (Reference — Regra nº 6)
  source_version       — versão da fonte científica
  strength             — força/nível da evidência
  status               — draft | approved | active | deprecated (governança §6)
  created_at           — criação
  retired_at           — depreciação (null enquanto ativa; nunca apagada — histórico)
```

Uma `Relationship` sem `evidence_id` + `reference_id` + `source_version` **não pode existir** (Regras nº 4 e nº 6).

> Nomenclatura de qualquer termo novo entra antes no `DOMAIN_GLOSSARY.md`.

---

## 4. Tipos de relacionamento

Conjunto inicial (extensível por governança, nunca por conveniência):

```
BIOMARKER
    ├── pertence ao sistema        (Biomarker → Physiological System)
    ├── participa da via           (Biomarker → Pathway)
    ├── recomendado pela diretriz  (Biomarker → Guideline)
    ├── correlaciona com           (Biomarker ↔ Biomarker)
    ├── depende de                 (Biomarker → Biomarker)
    ├── mede                       (Biomarker → grandeza/analito)
```

**Toda relação DEVE possuir:**
- **evidência** (o que sustenta a relação);
- **fonte** (Reference identificável);
- **versão** (da fonte e da relação);
- **força da evidência** (nível/grau).

Uma relação sem os quatro **não pode existir** (Regra nº 6).

---

## 5. Fontes científicas

Define **apenas quais origens podem alimentar o KG** — **sem importar nada ainda**. Toda fonte tem proveniência (identificador + versão), coerente com o conceito **Fonte de Conhecimento** (ADR-016) e a SRL (porta de entrada futura, desacoplada).

- **Terminologias/identidade:** LOINC, SNOMED CT, HGNC, ChEBI, UCUM.
- **Ontologias/vias:** Gene Ontology, Reactome, KEGG, Human Phenotype Ontology.
- **Educação/consumidor:** MedlinePlus.
- **Diretrizes/sociedades:** ADA, KDIGO, ESC, AHA, Endocrine Society, etc.

> A **importação/indexação** dessas fontes é responsabilidade da **SRL** (fase posterior) — a Spec apenas declara o conjunto elegível.

---

## 6. Governança

- **Quem cria** relações: curadoria científica (proposta), sempre com fonte identificável (Regra nº 6).
- **Quem aprova:** revisão científica responsável (papel de governança).
- **Quem publica:** promoção explícita de uma versão da relação para "ativa".
- **Quem aposenta:** depreciação versionada (a relação nunca é apagada silenciosamente — histórico preservado).
- **Versionamento:** relações e fontes versionadas; toda mudança gera novo estado auditável.
- **Auditoria:** origem·versão·data·autor·aprovador rastreáveis para cada relação (append-only conceptual, coerente com o modelo de reprodutibilidade da ingestão).

---

## 7. Navegação

Descreve **apenas como o usuário navegará** — a navegação **decorre** do grafo; **não cria** relações.

```
PTH
 ↓  (pertence ao sistema)
Sistema Endócrino
 ↓  (participa da via)
Metabolismo Mineral
 ↓  (correlaciona com)
Vitamina D → Cálcio → Fósforo
```

A UI operacional (Exames = Material→Exame→Resultados; Evolução = Material→Biomarcadores) **permanece congelada e inalterada**; a navegação científica é uma **camada de consulta adicional**, somente leitura, que parte do grafo.

---

## 8. Fora do escopo

Esta sprint **NÃO** inclui (declaração explícita):
- **IA**;
- **inferência**;
- **recomendações**;
- **interpretação clínica**;
- **SRL** (recuperação/indexação — fase posterior);
- **busca semântica**;
- **geração de texto**;
- **raciocínio**.

Também fora: qualquer alteração de **ingestão**, **catálogo**, **parser**, **OCR** ou **UI operacional** (todos congelados).

---

## 9. Critérios de aceite

Objetivos, verificáveis:
- [ ] **Nenhuma alteração na ingestão** (código/schema/prompt intactos).
- [ ] **Nenhuma alteração na UI operacional** (Exames/Evolução/Timeline/Relatório inalterados).
- [ ] **Grafo versionado** (relações e fontes com versão).
- [ ] **Relacionamentos auditáveis** (origem·versão·data·autor·aprovador).
- [ ] **Fontes científicas rastreáveis** (toda relação → Reference identificável e versionada — Regra nº 6).
- [ ] Biomarcadores referenciados por **`catalog_id`** (SSOT; sem duplicar identidade).
- [ ] `tsc` 0 · ESLint 0 · testes verdes · build limpa.

---

**Próximo passo:** **Design Review** desta Spec → decisão (Aprovada / Aprovada com ressalvas / Reprovada). Só após aprovação formal segue a modelagem física e a implementação (nunca antes). Não reabrir ingestão nem apresentação.
