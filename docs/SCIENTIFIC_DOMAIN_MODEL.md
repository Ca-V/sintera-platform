# SINTERA — Modelo de Domínio Científico (SCIENTIFIC_DOMAIN_MODEL)

**Status:** Etapa 1 do Catalog v2 (fundadora, 02/07/2026). **Conceitual — independente de banco de dados, schema ou implementação.** O domínio define a arquitetura; a arquitetura define o modelo de dados (não o contrário).
**Precede:** `SCIENTIFIC_CATALOG_V2_SPEC.md` → `CATALOG_V2_MIGRATION_PLAN.md` → implementação. Nada de schema até este documento estar **fechado/aprovado**.
**Princípio de produto:** Governança Científica — a plataforma **relaciona, organiza e recupera**; não conclui, não diagnostica, não recomenda (RDC 657). Ver `DOMAIN_GLOSSARY.md`, `CATALOG_SINGLE_SOURCE_OF_TRUTH.md`.

---

## 1. Entidades conceituais

**Biomarcador** — Conceito científico canônico de um parâmetro biológico (ex.: Hemoglobina). Tem **identidade única** (independente de como cada laudo o nomeia). É o eixo da nomenclatura: nome, aliases, painel, material, unidade canônica pertencem ao Biomarcador no catálogo. Nunca é definido pela UI nem por um exame isolado.

**Material** — **Tipo** de amostra biológica onde um biomarcador é medido (sangue, urina, urina 24h, saliva, fezes, líquor…). É uma classe, não uma coleta específica.

**Amostra** — **Instância** concreta de material coletada num momento (esta coleta de sangue nesta data). Uma Amostra é de um Material e origina Medições. *(Hoje implícita; explicitada aqui para o modelo futuro.)*

**Método** — Técnica analítica pela qual um biomarcador é medido (ex.: imunoturbidimetria, LC-MS/MS). Afeta **unidade e comparabilidade** entre Medições (séries só são comparáveis com mesma unidade/método coerentes).

**Medição** — **Leitura pontual** de um Biomarcador, resultante de um Exame sobre uma Amostra: valor (numérico ou descritivo), unidade, data, e a **Referência informada pelo laudo**. Uma série longitudinal é um conjunto de Medições do **mesmo Biomarcador** (identidade do catálogo, não pelo nome).

**Referência** — Intervalo de referência associado a uma Medição, **com proveniência** (do laudo / documental / ausente). É factual e específica do laboratório/método; nunca vira juízo clínico.

**Painel** — Agrupamento nomeado de Biomarcadores relacionados (ex.: Perfil lipídico, Série vermelha, Urina tipo I). É organização/apresentação científica; definido no catálogo.

**Evento (de Saúde)** — Ocorrência datada na jornada do paciente. Unidade central do modelo orientado a eventos; posicionada na Linha do Tempo.

**Exame** — **Tipo de Evento**: produz Medições de Biomarcadores a partir de uma Amostra, em geral originado por um Documento (laudo). Exames de imagem e **ômicos** são especializações.

**Documento** — Artefato-fonte enviado pelo paciente (PDF, imagem) que **origina/comprova** um Exame/Evento. A IA transcreve/organiza; não interpreta.

**Diretriz** — Recomendação publicada por entidade científica. **Referenciada**, nunca aplicada como decisão.

**Protocolo** — Conjunto estruturado de condutas publicado. **Organizado/referenciado**, nunca prescrito.

**Evidência Científica** — Referência de literatura (artigo, estudo) que embasa diretrizes/protocolos. Organizada e ligada ao contexto; não é conselho.

**Produto** — Recurso terapêutico usado pelo paciente (medicamento, suplemento, vitamina, órtese, prótese, lente, óculos, dispositivo, wearable, equipamento, terapia).

**Dispositivo** — Especialização de Produto (equipamento/wearable), possível **fonte de Observações contínuas** (integrações futuras).

## 2. Relações (cardinalidades conceituais)
```
Painel 1—N Biomarcador           (um painel agrupa vários biomarcadores; um biomarcador pode estar em painéis)
Biomarcador N—1 Material         (um biomarcador é medido em um material; ex.: Hemoglobina→sangue)
Biomarcador N—N Método           (pode ser medido por métodos distintos; método afeta unidade/comparabilidade)
Exame 1—N Medição                (um exame produz várias medições)
Medição N—1 Biomarcador          (cada medição é de exatamente um biomarcador)
Medição N—1 Amostra ; Amostra N—1 Material
Medição 1—1 Referência           (a faixa informada, com proveniência)
Exame is-a Evento ; Exame 1—1 Documento (origem, quando há laudo)
```
Camada de conhecimento (organizacional, NÃO clínica):
```
Biomarcador → Órgão/Sistema → Doença/Condição → Diretriz → Protocolo → Evidência → (contexto do paciente via Eventos/Timeline)
```

## 3. Invariantes (regras que o domínio deve preservar)
1. **Identidade única do Biomarcador** — resolvida pelo Catálogo (SSOT). Nome/painel/material/unidade/aliases vêm do catálogo, nunca da UI ou de um laudo isolado.
2. **Toda Medição pertence a exatamente um Biomarcador e um Exame.**
3. **Séries longitudinais agrupam por identidade de Biomarcador** (catálogo), **não por nome** — "Glicose/Glicemia/Glicose sérica" são o mesmo Biomarcador.
4. **Referência é sempre factual e com proveniência**; nunca classificada ("normal/alterado" são proibidos).
5. **Comparabilidade** só entre Medições de unidade/método coerentes (senão, série não comparável — declarado, não escondido).
6. **A plataforma relaciona/organiza; não conclui** (Governança Científica). Knowledge Layer/Graph existem para contextualizar, não decidir.

## 4. O que este documento NÃO faz
Não define tabelas, colunas, tipos, índices, migração ou API. Isso é a `SCIENTIFIC_CATALOG_V2_SPEC` (Etapa 2), a fazer **somente após** este modelo ser aprovado.

---
**Pergunta de fechamento (para a fundadora):** as entidades, relações e invariantes acima descrevem corretamente o domínio científico da SINTERA? Ajustes antes de avançar para a Spec?
