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
