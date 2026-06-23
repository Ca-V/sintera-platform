# Convergência da Ômica → `extraction_versions`

**Status:** Estratégia (sem implementação). Garante que a exclusão da ômica da 1b é **temporária e planejada**.
**Contexto:** hoje `omics_panels.exam_id` é nullable e está **null** (a ômica não tem vínculo com `exams`), e a ômica versiona por `omics_versions`. Objetivo: trazê-la para o **mesmo** núcleo (`extraction_versions` + ponteiro canônico), sem dois sistemas permanentes.

## 1. Como `omics_panels` passará a se relacionar com `exams`

- **Estado-alvo:** todo painel ômico pertence a um **exame** (modalidade `omics`). O fluxo de ingestão de ômica passa a, no upload, **criar o `exams`** (modality=`omics`, com `document_sha256`) e **setar `omics_panels.exam_id`**.
- `omics_results` já recebe `extraction_version_id` (criado na 1a); passa a apontar para a versão canônica do exame do painel.
- **Legado:** o painel atual sem `exam_id` recebe um `exams` (modality `omics`) criado no backfill da convergência, e é vinculado.

## 2. Em qual fase ocorre

Fase **dedicada**, **após** o lab estar no modelo canônico (1c/1d estáveis) — para não ter peças móveis concorrentes. Mini-rollout próprio, espelhando 1a→1e, com gates:
- **Ω-a (código):** ingestão de ômica cria `exams` + linka `panel.exam_id` (novos painéis já nascem ligados).
- **Ω-b (backfill):** painéis órfãos ganham `exams`; `omics_results` → `extraction_versions v1`; ponteiro canônico setado.
- **Ω-c (reconciliação):** `omics_versions` → `extraction_versions` (1:1).
- **Ω-d (leituras):** ômica passa a ler `current_omics_results` (view canônica).

## 3. Objetos reconciliados

| Objeto | Destino |
|---|---|
| `omics_panels` | ganha `exam_id` **real** (exame por painel); estado-alvo: NOT NULL para novos |
| `omics_results` | `extraction_version_id` preenchido → projeção da versão canônica |
| `omics_versions` | mapeado **1:1** para `extraction_versions` (version_number, source_file→source); depois **aposentado** (histórico/retirado) |
| `extraction_versions` | passa a ser o **único** versionamento também da ômica |
| `exams.current_extraction_version_id` | ponteiro canônico também para ômica |

## 4. Pré-requisitos antes da migração

1. Lab no modelo canônico (1c/1d) estável — evita mover dois domínios ao mesmo tempo.
2. Caminho de escrita versionado (1d) **generalizado** para aceitar ômica (inserção por versão + ponteiro), não só lab.
3. Fluxo de ingestão de ômica atualizado para **criar exame + linkar painel** (Ω-a) — para que novos dados nasçam ligados.
4. `modalities` com `omics` (já semeado na 1a ✅).
5. Regra de mapeamento `omics_versions → extraction_versions` definida (alinhamento de `version_number` e proveniência `source_file`).
6. View `current_omics_results` definida (padrão uniforme da 1c).

## 5. Como evitar coexistência permanente de dois sistemas

**Critério de fim (vinculante):** a convergência só é considerada concluída quando:
- **nenhuma escrita** nova vai para `omics_versions` (a ingestão grava `extraction_versions`);
- **nenhuma leitura** depende de `omics_versions` (tudo via `current_omics_results`);
- `omics_versions` é **retirado** (migrado e então dropado, ou mantido apenas como view histórica read-only).

Enquanto esse critério não for atingido, a ômica permanece **explicitamente** no fluxo antigo (sem leitura canônica) — **nunca** um meio-termo silencioso. Alinha-se à diretriz §8 da governança: **um único** sistema de versionamento (`extraction_versions`); a fase de convergência é a execução dessa diretriz para a ômica.

---

**Resumo:** a ômica sai da 1b por uma razão estrutural (sem `exam_id`), com convergência **planejada** numa fase própria (Ω-a→Ω-d), pré-requisitos definidos e critério de fim que **proíbe** a coexistência permanente.
