-- ============================================================
-- SINTERA — Migração 034: prompt de extração v1.3.0
--   (a) aumenta max_tokens 8192 -> 32000 para evitar truncamento do JSON em
--       laudos grandes (causava "Falha ao parsear resposta da IA");
--   (b) flexibiliza a regra de exam_date para aceitar data de ENTRADA/recebimento
--       e emissão (ordem: coleta > entrada > emissão), retornando null só quando
--       não há data alguma. É extração de FATO, não conteúdo clínico.
-- content_hash recomputado pela mesma fórmula do prompt-loader
--   (system || user || temperature('0') || max_tokens).
-- ============================================================

UPDATE prompt_registry
SET max_tokens = 32000,
    version = '1.3.0',
    user_prompt_template = $T$Extraia todos os biomarcadores do seguinte laudo laboratorial.

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
- Extraia a data do exame impressa no laudo, nesta ordem de preferência: (1) data de coleta, (2) data de entrada/recebimento, (3) data de emissão/liberação.
- Aceite rótulos como: Data da coleta, Coletado em, Data de entrada, Entrada, Recebimento, Data do exame, Data de emissão, Liberado em.
- Converta para o formato YYYY-MM-DD. Exemplo: 01/04/2025 vira 2025-04-01.
- Retorne null APENAS se nenhuma data estiver presente no laudo. NUNCA invente a data.

TEXTO DO LAUDO:
{{examText}}$T$
WHERE operation = 'extraction' AND status = 'active';

UPDATE prompt_registry
SET content_hash = encode(digest(system_prompt || user_prompt_template || '0' || max_tokens::text, 'sha256'), 'hex')
WHERE operation = 'extraction' AND status = 'active';
