# SINTERA — Governança Clínica

**Versão:** v1 (rascunho institucional)
**Data:** 2026-06-12
**Status:** documento de memória institucional. Captura as decisões clínicas **já codificadas** no banco/prompts e marca explicitamente as que **ainda precisam de aprovação humana**.

> ⚠️ **Propósito deste documento.** O código e o banco podem ser reescritos; as regras clínicas, os critérios de criticidade e a política de QA tendem a se tornar a base permanente do produto. Este arquivo existe para que essas decisões deixem de viver apenas implícitas em `CHECK constraints` e prompts `draft`, e passem a ser memória rastreável. **Nada aqui foi decidido por uma IA.** Itens marcados como PENDENTE exigem decisão de responsável clínico humano identificado.

---

## 0. Princípio fundador (não-negociável)

SINTERA **não diagnostica, não prescreve e não recomenda tratamentos**. Traduz resultados laboratoriais em compreensão, sempre encaminhando à avaliação médica. Este princípio está hoje codificado em dois lugares:

- Prompt `narrative` (system): *"VOCÊ NÃO É MÉDICA. Você NÃO diagnostica, NÃO prescreve e NÃO recomenda medicamentos, doses, suplementos ou tratamentos."*
- Prompt `qa` (system): reprova qualquer texto que afirme diagnóstico categórico, recomende substância/dose, ou prometa cura.

**FATO VERIFICADO** (2026-06-12): ambos os prompts existem no `prompt_registry` em status `draft`, `approved_by = NULL`. Ou seja, a política está escrita mas **não foi formalmente aprovada**.

---

## 1. Níveis de criticidade clínica

**FATO VERIFICADO** — codificado em `ai_insights.clinical_flag CHECK IN (...)`:

| Flag | Significado (interpretação institucional) |
|---|---|
| `atencao_imediata` | Resultado que pode exigir atenção médica em curto prazo. |
| `acompanhar` | Resultado fora da faixa que merece acompanhamento, sem urgência. |
| `normal` | Dentro da referência / sem nota clínica relevante. |

**PENDENTE — decisão clínica:** o mapeamento *valor do biomarcador → clinical_flag* (os limiares por biomarcador) **não existe em nenhum artefato**. É o coração do motor determinístico (§4 do Sprint 2) e precisa ser definido e aprovado por responsável clínico, biomarcador a biomarcador.

### 1.1 Biomarcadores marcados como críticos

**FATO VERIFICADO** — `biomarker_catalog.is_critical = true` para 6 biomarcadores:

`HEMOGLOBINA_SANGUE`, `GLICEMIA`, `CREATININA_SERICA`, `SODIO`, `POTASSIO`, `CALCIO_IONICO`.

> Os demais 77 itens do catálogo estão como `is_critical = false`. **PENDENTE:** validar se essa lista de 6 reflete a intenção clínica ou foi um conjunto inicial provisório.

---

## 2. Bandas de confiança

**FATO VERIFICADO** — `ai_insights.confidence_band CHECK IN ('alta','media','baixa')`, alimentado por três medidas numéricas (0–1) já previstas no schema:

| Coluna | O que mede (intenção pelo nome) |
|---|---|
| `extraction_confidence` | Confiança de que o valor foi extraído corretamente do laudo. |
| `clinical_confidence` | Confiança na classificação clínica (regra determinística). |
| `generation_confidence` | Confiança no texto narrativo gerado. |

**PENDENTE — decisão de produto + clínica:** (a) a fórmula que combina as três medidas na `confidence_band`; (b) o que a usuária vê em cada banda; (c) se `baixa` suprime o insight ou apenas o sinaliza.

---

## 3. Política generativa (texto educativo)

**FATO VERIFICADO** — codificada no prompt `narrative 1.0.0` (draft). Estrutura obrigatória de cada insight, em 3 partes:

1. O que o marcador representa (1–2 frases simples).
2. O que um resultado fora da faixa **pode** sugerir — sempre como possibilidade, nunca diagnóstico.
3. Quando vale conversar com um médico.

Regras já escritas: não recalcular nem contradizer o `clinical_flag`; nunca "você tem [doença]"; nunca instruir tomar/ajustar substância; não inventar valores; não gerar insight para `result_type` `missing`/`extraction_failed`.

**PENDENTE:** aprovação clínica formal do prompt (mudar status `draft → approved → active`, preencher `approved_by`/`approved_at`).

---

## 4. Política de QA (gate de conformidade)

**FATO VERIFICADO** — codificada no prompt `qa 1.0.0` (draft). Decisão binária `approved: true|false`.

**Reprova** se o texto: afirma diagnóstico categórico; recomenda tomar/usar/suspender/ajustar medicamento/suplemento/dose; cita substância como recomendação; promete cura/resultado/prazo.

**Aprova** se permanece educativo, possibilístico e encaminha à avaliação médica.

**PENDENTE — decisão de governança:**
- Aprovação formal do prompt `qa`.
- O que acontece com um insight **reprovado** pelo gate: descartar, regenerar, ou enviar para revisão humana? (não definido em lugar nenhum).
- Se há amostragem de revisão humana sobre insights *aprovados* pelo gate antes de exibição no Beta.

---

## 5. Rastreabilidade (já implementada)

**FATO VERIFICADO** — a infraestrutura de auditoria existe e é usada pela extração:
- Toda chamada de IA gera linha em `ai_processing_log` (tokens, modelo, prompt, hashes de reparo de JSON, duração).
- `prompt_registry` versiona prompts com `content_hash`, aprovação e deploy.
- `ai_insights` prevê `ai_log_id`, `content_hash` (dedup por exame), `template_key`, `model_version`.

Esta camada é o ativo de governança mais maduro do projeto e deve ser preservada em qualquer reescrita.

---

## 6. Registro de decisões clínicas (a preencher)

> Cada decisão clínica aprovada deve virar uma linha aqui, com responsável e data. Hoje está vazio porque nenhuma decisão clínica foi formalmente registrada — apenas codificada provisoriamente.

| Data | Decisão | Responsável clínico | Onde foi materializada |
|---|---|---|---|
| — | (nenhuma decisão clínica formalmente aprovada até 2026-06-12) | — | — |

---

## 7. Lista consolidada de pendências clínicas (bloqueiam o motor de insights)

1. **Aprovar** os prompts `narrative 1.0.0` e `qa 1.0.0** (responsável + data).
2. **Definir os limiares** valor→`clinical_flag` por biomarcador (motor determinístico).
3. **Validar** a lista de 6 biomarcadores críticos.
4. **Definir** a fórmula de `confidence_band` e seu efeito na exibição.
5. **Definir** o tratamento de insights reprovados pelo QA.
6. **Definir** se há revisão humana antes da exibição no Beta.

Enquanto 1 e 2 não forem resolvidos, o pipeline de insights não pode ser ativado com segurança clínica.
