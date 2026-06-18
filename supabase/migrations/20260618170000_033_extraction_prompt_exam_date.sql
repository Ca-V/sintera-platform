-- ============================================================
-- SINTERA — Migração 033: prompt de extração passa a capturar exam_date
-- ============================================================
-- Adiciona o campo factual exam_date (data de coleta/realização IMPRESSA no
-- laudo) ao schema de saída do prompt de extração ativo, e uma regra de como
-- extraí-la (converter para YYYY-MM-DD; null se ausente; nunca inventar).
--
-- É EXTRAÇÃO DE FATO (data impressa), não conteúdo clínico nem interpretação.
-- Bump de versão 1.1.0 -> 1.2.0. O content_hash é recomputado a partir da
-- própria coluna (mesma fórmula do prompt-loader: system||user||temp||maxTokens),
-- preservando a verificação de integridade em runtime.
--
-- Idempotente o suficiente: só altera a linha ativa de operation='extraction'.
-- ============================================================

UPDATE prompt_registry
SET user_prompt_template = $T$Extraia todos os biomarcadores do seguinte laudo laboratorial.

Retorne um objeto JSON com este schema exato:

{
  "exam_type": "string",
  "exam_date": "string no formato YYYY-MM-DD ou null",
  "biomarkers": [
    {
      "name": "string",
      "value": "number ou null",
      "value_text": "string ou null",
      "unit": "string ou null",
      "reference_min": "number ou null",
      "reference_max": "number ou null",
      "range_extracted": "boolean",
      "reference_source": "laudo ou ausente",
      "result_type": "numeric, qualitative, missing ou extraction_failed",
      "raw_text": "string",
      "confidence": "number entre 0.0 e 1.0",
      "extraction_notes": "string ou null"
    }
  ],
  "extraction_notes": "string ou null"
}

REGRAS PARA exam_date:
- Extraia a data de COLETA/realização do exame impressa no laudo (ex.: Data da coleta, Data de coleta, Coletado em, Data do exame).
- Converta para o formato YYYY-MM-DD. Exemplo: 05/03/2026 vira 2026-03-05.
- Se houver apenas data de emissão/liberação e nenhuma data de coleta, retorne null.
- Se nenhuma data estiver presente, retorne null. NUNCA invente a data.

TEXTO DO LAUDO:
{{examText}}$T$,
    version = '1.2.0'
WHERE operation = 'extraction' AND status = 'active';

-- Recomputa o content_hash a partir da coluna já gravada (consistência garantida).
UPDATE prompt_registry
SET content_hash = encode(digest(system_prompt || user_prompt_template || '0' || '8192', 'sha256'), 'hex')
WHERE operation = 'extraction' AND status = 'active';
