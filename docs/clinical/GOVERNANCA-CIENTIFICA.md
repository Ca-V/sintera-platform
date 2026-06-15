# SINTERA — Governança Científica

**Versão:** v1 (rascunho de engenharia)
**Data:** 2026-06-15
**Status:** documento de arquitetura. Define **de onde** vêm os parâmetros/referências dos biomarcadores, **como** são versionados e **quem** os aprova antes de ficarem ativos. Complementa `docs/GOVERNANCA-CLINICA-SINTERA.md` (que trata da política clínica) — aqui o foco é a **proveniência das fontes** e o **fluxo de atualização**.

> ⚠️ **Nada neste documento decide conteúdo clínico.** Ele descreve o *mecanismo* de rastreabilidade e o *processo* de curadoria. Os valores (limiares, faixas, `clinical_flag`, textos) continuam sendo decisão de um **Responsável Clínico humano identificado (CRM)**, a ser contratado antes do go-live clínico. Enquanto não houver aprovação, o `CLINICAL_RULESET` permanece vazio e o motor não emite insights.

---

## 0. Premissa primária (não-negociável)

**A faixa de referência impressa no laudo é a referência primária.** O laboratório que emitiu o exame é o responsável legal pela faixa adotada (método, equipamento, população). A SINTERA:

- usa a faixa do **próprio laudo** para o cálculo aritmético de `rangeStatus` (below / within / above) — isso já está implementado e **não é juízo clínico**;
- só usa fontes científicas externas para **enriquecer a interpretação** (texto educativo, contexto, criticidade), **nunca** para sobrescrever a faixa do laudo sem aprovação clínica explícita.

Motivo: não existe uma única fonte/API legível por máquina que entregue, de forma confiável e atualizada, "faixa de referência + interpretação clínica" para todos os biomarcadores. Toda interpretação científica passa por **curadoria humana versionada**.

---

## 1. Hierarquia de fontes científicas

Quatro camadas, da mais forte (evidência primária) à de apoio. **Nenhuma delas é consumida automaticamente como verdade clínica** — todas alimentam a curadoria humana.

| Camada | Fontes | Papel na SINTERA | Integração técnica |
|---|---|---|---|
| **1. Evidência primária** | PubMed / NCBI E-utilities (NIH) | Citação de estudos (PMID) que respaldam uma regra. | API pública gratuita — **apenas metadados/citação**, não interpretação automática. |
| **2. Diretrizes de sociedades** | AHA/ACC, ESC, ADA, KDIGO, Endocrine Society, SBC/SBD/SBEM (Brasil) | Base das regras clínicas e limiares. | **Curadoria humana** a partir de PDFs/publicações — sem scraping. |
| **3. Consultiva** | UpToDate | Conferência pontual pelo Responsável Clínico. | **Não integrável** (ToS proíbe scraping/redistribuição). Uso humano apenas. |
| **4. Padrões e qualidade** | CLSI, IFCC, CAP, ABIM | Padronização de unidades, métodos e nomenclatura. | Documentos de referência — consulta humana. |

### 1.1 Camada educacional (apoio à usuária)

- **MedlinePlus Connect / Web Service (NIH)** — conteúdo leigo estruturado para explicar o que é cada exame. API pública. **Camada educativa**, nunca interpretação de resultado.

### 1.2 Padrões de interoperabilidade (ativo estratégico, não-clínico)

Adotados por recomendação validada — servem para **identificar e padronizar** o que medimos, facilitando integração futura (hospitais, outros sistemas). **Não carregam juízo clínico.**

| Padrão | Para quê | Onde entra |
|---|---|---|
| **LOINC** | Identificador universal de exame laboratorial. | Mapear cada item do `biomarker_catalog` a um código LOINC → interoperabilidade e desambiguação. |
| **SNOMED CT** | Padronização semântica de conceitos clínicos. | Vocabulário controlado para conceitos/condições referenciados. |
| **FHIR Terminology Services** | Troca de dados em saúde (HL7 FHIR). | Exportar/integrar resultados com sistemas de saúde no futuro. |

> Parecer de engenharia: LOINC é o de maior retorno imediato (desambiguação do catálogo e base para qualquer integração). SNOMED CT e FHIR são investimentos para integração institucional futura — estrutura agora, uso depois.

---

## 2. Proveniência por regra (rastreabilidade obrigatória)

Toda regra clínica ativada **deve** carregar sua proveniência. Estrutura (espelhada em `src/lib/ai/insights/engine.ts → RuleProvenance`):

| Campo | Significado |
|---|---|
| `ruleId` | Identificador estável da regra. |
| `source` | Fonte da decisão (ex.: `KDIGO 2024`, `ADA 2025`, `laudo`). |
| `version` | Versão da fonte/diretriz. |
| `publicationDate` | Data de publicação da fonte (ISO). |
| `pmid` | PMID do estudo de respaldo, quando houver. |
| `loincCode` | Código LOINC do biomarcador, quando mapeado. |
| `approvedBy` | **CRM** do Responsável Clínico que aprovou. |
| `approvalDate` | Data da aprovação (ISO). |
| `effectiveFrom` | A partir de quando a regra vale (ISO). |
| `status` | `draft` → `validated` → `active` (ver §3). |

Sem `approvedBy` + `approvalDate`, uma regra **não pode** ter `status: 'active'`. O loader (`rules-loader.ts`) já exige `approved_by` para transcrever uma linha do CSV — esta seção formaliza e amplia o conjunto de metadados.

---

## 3. Fluxo de atualização científica (Scientific Staging)

Toda mudança em parâmetros/regras passa por três estados, permitindo comparação de versões, revisão por mais de um clínico e **rollback**:

```
  draft  ──(revisão clínica)──►  validated  ──(aprovação formal + effectiveFrom)──►  active
    ▲                                                                                   │
    └───────────────────────────  rollback (reverte para versão anterior) ◄────────────┘
```

- **draft** — proposta de regra/atualização (pode ser redigida a partir das fontes da §1). Não afeta produção.
- **validated** — revisada por Responsável Clínico; aguardando aprovação formal. Ainda não emite insight.
- **active** — aprovada (`approvedBy` + `approvalDate` + `effectiveFrom`); **única** que o motor consome.
- **rollback** — desativar uma `active` reverte para a versão `active` anterior; o histórico fica registrado.

Princípio: **nenhuma alteração entra em `active` sem aprovação clínica.** Atualizações de diretrizes (ex.: nova versão da ADA) entram como `draft`, são comparadas com a versão vigente e só substituem a ativa após aprovação.

---

### 3.1 Workflow do mapeamento de catálogo (LOINC/SNOMED)

O mapeamento de interoperabilidade tem seu próprio fluxo, **distinto** do staging
de regras clínicas (não exige CRM, mas exige revisão humana antes de produção):

```
  draft  →  em_curadoria  →  verificado  →  aprovado  →  producao
                  │
                  └──────────────►  rejeitado  (com rejection_reason)
```

- **draft** — código candidato sugerido (ver `loinc-mapping-draft.csv`). Não aplicado.
- **em_curadoria** — sendo conferido contra loinc.org (variante, unidade, método).
- **verificado** — código confirmado pelo curador.
- **aprovado** — registrado no ledger (`loinc-approval-ledger.csv`) com fonte/curador/data.
- **producao** — escrito no banco via migração versionada; visível em `/admin/catalogo`.
- **rejeitado** — candidato descartado na curadoria; `rejection_reason` preserva o
  porquê (ex.: "1234-5 é glicose sérica, não em jejum"). Mantém histórico/auditoria.

Materializado nos campos da migração 028: `loinc_status`, `snomed_status`,
`scientific_source`, `scientific_version`, `reviewed_by`, `reviewed_at`,
`approval_status`.

> **Risco de "falso progresso":** ter 83 códigos preenchidos ≠ governança pronta.
> Cada código precisa de variante/método/unidade corretos. Por isso o gate é a
> revisão, não o preenchimento. **Trilha de auditoria > o código em si** — daqui a
> 12 meses, "por que HbA1c virou 4548-4?" precisa ter resposta no ledger.

### 3.2 Priorização da curadoria (Sprints)

A partir da confiança das sugestões do rascunho (60 alta / 16 média / 3 baixa / 4 sem):

| Sprint | Escopo | Racional |
|---|---|---|
| **A** | 60 de alta confiança | Maior parte do uso; valida rápido. |
| **B** | 16 de média confiança | Conferir variante/unidade (ex.: eGFR, ureia vs BUN, Vit D). |
| **C** | 3 baixa + 4 sem candidato | Ambíguos (bastonetes, epitélios, muco, cilindros, atividade de protrombina); muito tempo, pouco valor — por último. |

### 3.3 Artefatos desta fase

| Arquivo | Papel |
|---|---|
| `loinc-mapping-draft.csv` | Rascunho `draft` (candidatos + confiança + notas). Não aplicado. |
| `loinc-approval-ledger.csv` | Trilha de auditoria — fonte/curador/data/status por biomarcador. |
| `loinc-apply.template.sql` | Template comentado de `UPDATE` (fora do runner; nunca executa só). |
| migração 028 | Campos permanentes de governança (estrutura vazia). |

---

## 4. O que a plataforma faz hoje vs. o que fica pronto para depois

| Item | Estado |
|---|---|
| `rangeStatus` aritmético contra a faixa do laudo | ✅ Implementado (não-clínico). |
| Motor determinístico rodando vazio até aprovação | ✅ Implementado (`CLINICAL_RULESET = []`). |
| Estrutura de proveniência por regra | ✅ Tipo definido (`RuleProvenance`) — **vazio** até a clínica preencher. |
| Fluxo `draft → validated → active` | ✅ Documentado; aplicável quando houver regras. |
| Colunas `loinc_code` e `snomed_ct_code` no catálogo | ✅ Criadas (migrações 026/027) — **vazias** até curadoria. |
| Campos de governança do catálogo (status, fonte, revisor…) | ✅ Migração 028 **aplicada** (estrutura vazia; todos os itens `draft`). |
| Rascunho de mapeamento LOINC + ledger + template | 📄 Prontos em `docs/clinical/` — **draft**, não aplicados. |
| Camada educacional MedlinePlus (por LOINC) | ✅ Implementada (`/api/education/biomarker/[code]`); retorna conteúdo só p/ itens já mapeados. |
| Painel de cobertura científica (`/admin/catalogo`) | ✅ Mostra LOINC/SNOMED/Regra e "experiência completa" por biomarcador. |
| Conteúdo clínico (limiares, flags, textos) | ⛔ **Bloqueado** até Responsável Clínico (CRM). |

---

## 5. Pendências (dependem do Responsável Clínico)

1. Contratar e identificar o **Responsável Clínico (CRM)**.
2. Preencher a proveniência de cada regra (§2) a partir das fontes da §1.
3. Mapear `biomarker_catalog` → LOINC (curadoria; pode ser apoiada por técnico, mas validada clinicamente).
4. Aprovar formalmente as regras (`draft → validated → active`) com assinatura e data.
5. Registrar cada decisão em `docs/GOVERNANCA-CLINICA-SINTERA.md §6`.

> Até que 1, 2 e 4 estejam resolvidos, o motor permanece vazio por desenho — comportamento seguro e intencional.
