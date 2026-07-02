# SINTERA — Glossário de Domínio (Domain Glossary)

**Status:** definições oficiais dos termos de domínio. Fonte única para devs, design, IA e documentação. Coerente com `UI_LANGUAGE_STANDARD.md` (linguagem) e a Governança Científica (RDC 657 — descreve fatos, não interpreta).

---

**Evento (Evento de Saúde)** — Ocorrência datada na jornada de saúde do paciente (exame, consulta, vacina, procedimento, cirurgia, medicamento, etc.). É a **unidade central** do modelo orientado a eventos e o que a Linha do Tempo organiza. Um exame é **um tipo** de evento, não o centro.

**Documento** — Arquivo enviado pelo paciente (PDF, imagem) que **origina ou comprova** um evento (ex.: um laudo). A IA transcreve/organiza; não interpreta.

**Exame** — Um tipo de evento: coleta/medição laboratorial ou de imagem, com data e (quando laboratorial) **biomarcadores** extraídos. Não é sinônimo de "registro".

**Resultado** — Valor observado de um biomarcador num exame (numérico ou descritivo/qualitativo). Sempre factual; nunca classificado clinicamente ("normal/alterado" são proibidos).

**Biomarcador** — Parâmetro biológico medido num exame (ex.: Hemoglobina), **identificado unicamente por `catalog_id`** no Catálogo Científico. Nomenclatura, painel, material e unidade vêm do catálogo. **Não** é "medição".

**Medição** — Uma **leitura pontual** de um biomarcador (um ponto na série longitudinal). "3 medições" = 3 leituras ao longo do tempo. Nunca usar "medição" como sinônimo de "biomarcador".

**Painel** — Agrupamento de biomarcadores relacionados (ex.: Perfil lipídico, Série vermelha, Urina tipo I). Definido no catálogo (hoje `category`; futuro `panel_id`).

**Material (Specimen)** — Tipo de amostra do exame (sangue, urina, urina 24h). Definido no catálogo (hoje `specimen`; futuro `material_id`).

**Histórico** — O registro do que já aconteceu (eventos concluídos). Tem duas visões: **Linha do Tempo** (eventos no tempo) e **Evolução** (números/biomarcadores no tempo).

**Linha do Tempo (Timeline)** — Visão cronológica única de todos os eventos de saúde do paciente.

**Agenda** — O que ainda vai acontecer (eventos planejados). Ao concluir, o evento passa ao Histórico.

**Produto** — Recurso terapêutico usado pelo paciente: medicamento, suplemento, vitamina, órtese, prótese, lente, óculos, dispositivo médico, wearable, equipamento, terapia. Cada um com histórico de uso e associação a eventos.

**Medicamento / Medicação** — Produto farmacológico com dose/frequência/estoque/recompra, no módulo Medicamentos. Projeta para Agenda/Histórico/Gastos.

**Suplemento** — Produto de suplementação; mesma mecânica do medicamento no catálogo de produtos.

**Protocolo** — Conjunto estruturado de condutas publicado por fonte científica. A plataforma **organiza e referencia**; nunca prescreve nem aplica.

**Diretriz** — Recomendação publicada por sociedade/entidade científica. **Referenciada** ("veja a diretriz"); nunca transformada em decisão automática.

**Fonte de Conhecimento** *(v1.2, ADR-016)* — Qualquer origem de conhecimento científico recuperável pela Scientific Retrieval Layer: diretriz · artigo · consenso · revisão sistemática · protocolo · documento técnico · base governamental · sociedade científica. Toda Fonte tem **proveniência rastreável** (origem·versão·data·organização·identificador — ADR-017).

**Scientific Retrieval Layer (SRL)** *(v1.2, ADR-016)* — Capacidade **transversal** de recuperação/indexação de conhecimento externo (porta de entrada). Alimenta o Knowledge Layer. **Opcional e desacoplada** (nunca dependência). Recupera documentos/contexto/referências; **não** responde clinicamente.

**Catálogo Científico** — Base canônica de metadados dos biomarcadores (SSOT). Origem única de nome, aliases, painel, material, unidade, ordenação, ícone. Ver `CATALOG_SINGLE_SOURCE_OF_TRUTH.md`.

**Clinical Knowledge Layer** — Camada que **relaciona** metadados científicos (biomarcador↔órgão↔sistema↔doença↔protocolo↔diretriz↔evidência↔histórico) para **organizar e contextualizar**. Não conclui, não decide.

**Knowledge Graph** — Grafo que conecta paciente↔eventos↔biomarcadores↔órgãos↔doenças↔medicamentos↔ômicas↔protocolos↔literatura. **Organiza relações**; não produz diagnóstico.

**Ômica** — Exame de alta dimensionalidade (metabolômica, proteômica, microbioma, genética) com fluxo próprio (catálogo/versionamento). É um tipo de evento/exame.

---
**Manutenção:** novo termo de domínio entra aqui antes de aparecer em código/UI/IA. Divergências de nomenclatura resolvem-se por este glossário.
