# Governança da Versão Canônica — Reprodutibilidade da Extração

**Status:** Norma arquitetural. Acompanha a subfase 1a (migration `065`) e rege as fases seguintes.

## 1. Princípio inequívoco

> **Toda leitura voltada à usuária consome EXCLUSIVAMENTE a versão canônica** apontada por `exams.current_extraction_version_id`, através das views `current_*`. Versões não promovidas **nunca** aparecem em fluxos de uso normal.

A versão canônica só muda por **promoção explícita** da usuária (auditada em `promoted_by` / `promoted_at` / `promotion_reason`). Não há promoção automática por nenhuma heurística (contagem, confiança, modelo, etc.).

## 2. Cenário de referência (comportamento garantido)

| Passo | Estado |
|---|---|
| 1. Usuária reprocessa o documento | cria `extraction_versions` **v2** (`origin='reprocess'`) |
| 2. v2 **não** é promovida | `current_extraction_version_id` **permanece em v1** |
| 3. Usuária acessa histórico, indicadores, dashboard, insights, export LGPD | **todos leem v1** (canônica) |

**Resultado:** v2 **não aparece** em nenhum desses fluxos. v2 só é visível na **tela dedicada de versões/comparação** (fase futura), onde é **rotulada explicitamente** como versão não vigente. Em nenhuma hipótese um fluxo de uso normal exibe resultado de versão não promovida sem deixar isso explícito.

## 3. Consumidores e a regra (migração na 1c)

Todos passam a ler via view canônica (`current_biomarkers` / `current_clinical_findings` / `current_omics_results`):

| Consumidor | Tipo | Regra |
|---|---|---|
| Detalhe do exame (`exams/[id]`) | tela | só canônica |
| Histórico de Saúde (`historico`) | tela | só canônica |
| Indicadores de Saúde (`saude`) | tela | só canônica |
| Painel / Perfil / Admin | contadores | contam **só** a canônica (senão inflam com versões) |
| Motor de insights (`lib/ai/insights/assembler.ts`) | serviço | deriva **só** da canônica |
| Export LGPD (`account/export`) | API | exporta **só** a canônica |
| Ômica: resultados do painel + histórico de feature | API/tela | só canônica |

**Garantia técnica:** as views `current_*` filtram `where <resultado>.extraction_version_id = exams.current_extraction_version_id`. Como **todos** os consumidores passam a ler pelas views (1c), é **impossível** um fluxo exibir versão não canônica por engano.

**Segurança das views:** as views `current_*` são criadas com `security_invoker = true`, de modo que a **RLS das tabelas-base** (por usuária) é aplicada ao usuário que consulta — cada usuária vê apenas a sua própria versão canônica.

## 4. Versionamento ÚNICO (proibido coexistirem múltiplos sistemas)

`extraction_versions` é o **único** sistema de versionamento de extração da plataforma. Serve, com a **mesma** mecânica (hash + versão imutável + ponteiro canônico), a **todas** as modalidades:

| Modalidade | Tabela de resultado | Vínculo |
|---|---|---|
| Laboratorial | `biomarkers` | `extraction_version_id` |
| Imagem (findings) | `clinical_findings` | `extraction_version_id` (nasce com) |
| Ômica | `omics_results` | `extraction_version_id` |
| Documento clínico estruturado | tabela da modalidade | `extraction_version_id` |

**Reconciliação da ômica:** hoje a ômica possui `omics_versions` (versionamento próprio de painel). Para **não** manter dois sistemas em paralelo, `omics_versions` é **reconciliada** com `extraction_versions` (mapeamento 1:1 na migração de backfill), e o estado-alvo passa a ter **um único eixo**: `extraction_versions` + `current_extraction_version_id` para todas as modalidades.

**Regra de governança:** é **proibido** introduzir um novo mecanismo de versionamento por modalidade. Toda modalidade nova **pluga** em `extraction_versions` via `extraction_version_id` + ponteiro canônico. Qualquer exceção exige revisão arquitetural explícita.

## 5. Invariantes (verificáveis)

1. Para todo exame com resultado: `current_extraction_version_id` aponta para uma versão existente do próprio exame.
2. Todo resultado (`biomarkers`/`clinical_findings`/`omics_results`) referencia uma `extraction_versions`.
3. Nenhum fluxo de uso normal lê resultado cujo `extraction_version_id ≠ current_extraction_version_id`.
4. A canônica só muda por promoção explícita e auditada.
5. Existe **um** sistema de versionamento (`extraction_versions`) para todas as modalidades.

## 6. Independência documento ↔ extração (propriedade vs. reuso)

Garantido **estruturalmente** pelo schema:

- **1 documento → N versões:** `extraction_versions.exam_id` é `NOT NULL` + `unique (exam_id, version_number)`. Um documento pode ter quantas versões forem necessárias.
- **Propriedade exclusiva:** cada `extraction_version` pertence a **exatamente um** `exam_id`. **Nunca** é compartilhada entre documentos diferentes.
- **Reuso ≠ compartilhamento:** quando o reuso dispara (mesmo `document_sha256` + chave completa), cria-se uma **nova versão pertencente ao NOVO documento**, com `reused_from_version_id` apontando para a versão-fonte **apenas como linhagem/auditoria**. Os resultados são **copiados** (copy-on-reuse) para o novo exame — **nenhuma linha de resultado é compartilhada** entre documentos.
- **Rastreabilidade:** documento → versões é sempre auditável (`exam_id`, `version_number`, lineage `reused_from_version_id`, `created_by`/`created_at`, `ai_log_id`).

> Resultado: o **reuso de resultado** (eficiência/reprodutibilidade) e a **propriedade do documento original** ficam **separados sem ambiguidade**. Apagar um documento (`exams`) remove **só** as suas versões (`on delete cascade`); a versão-fonte de um reuso, se em outro documento, permanece (o lineage vira `null` por `on delete set null`).

## 7. Neutralidade de modalidade

`extraction_versions` é **100% neutra** — nenhum campo assume biomarcadores laboratoriais:

| Campo | Natureza |
|---|---|
| `document_sha256`, `source_text` | identidade e texto-fonte de **qualquer** documento (PDF/OCR/transcrição) |
| `extractor_version`, `prompt_version`, `model_version` | pipeline/modelo — `prompt_version`/`model_version` **nullable** (modalidade sem LLM, ex.: parser determinístico, fica neutra) |
| `origin`, `reused_from_version_id`, `reason` | ciclo de vida da versão |
| `ai_log_id`, `created_by/at`, `promoted_by/at/reason` | proveniência e auditoria |

Nenhum campo cita biomarcador, unidade, referência ou valor numérico. Os dados **específicos de modalidade** moram **só** na tabela de resultado (`biomarkers` / `clinical_findings` / `omics_results`), nunca em `extraction_versions`.

**Views `current_*`:** uma por modalidade, com **estrutura idêntica** (filtro pela versão canônica). Cada view lê apenas a sua tabela de resultado — **nenhuma** assume o schema de outra modalidade. O padrão é uniforme; o conteúdo é da modalidade.

## 8. Diretriz arquitetural — `extraction_versions` é o núcleo documental

`extraction_versions` é o **artefato central** da plataforma documental da SINTERA — **não** apenas da extração de biomarcadores. Biomarcadores são **um** tipo possível de resultado, entre outros.

Uma extração pode produzir: **biomarcadores**, **achados clínicos estruturados**, **medições**, **classificações**, **recomendações documentadas no laudo**, **metadados do exame**, ou **simplesmente um documento versionado sem extração estruturada** (uma versão com `source_text` e sem linhas de resultado é válida).

**Princípio (vinculante para as próximas fases):** os resultados especializados (`biomarkers`/`clinical_findings`/`omics_results`/…) são **projeções derivadas da versão canônica**, não a entidade central. É **proibido** qualquer evolução que recoloque biomarcadores (ou qualquer tipo específico de resultado) como entidade central da arquitetura. Toda modalidade nova pluga em `extraction_versions`.
