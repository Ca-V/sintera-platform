-- ============================================================
-- SINTERA — Migração 036: prompt de extração v1.4.0 (patient_name)
-- ============================================================
-- Adiciona patient_name ao schema de saída + regra de extração (nome do PACIENTE
-- impresso no laudo; não confundir com médico/laboratório). Usado para conferir
-- contra profiles.name e evitar carregar exame de outra pessoa. Extração de FATO.
-- content_hash recomputado pela fórmula do prompt-loader (system||user||'0'||max_tokens).
-- ============================================================

UPDATE prompt_registry
SET version = '1.4.0',
    user_prompt_template = $T$Extraia todos os biomarcadores do seguinte laudo laboratorial.

Retorne um objeto JSON com este schema exato:

{
  "exam_type": "string",
  "exam_date": "string no formato YYYY-MM-DD ou null",
  "patient_name": "string ou null",
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

REGRAS PARA patient_name:
- Extraia o nome completo do PACIENTE impresso no laudo (cabeçalho/identificação do paciente).
- NÃO confunda com nome de médico, laboratório, responsável técnico ou solicitante.
- Mantenha o nome como aparece, sem abreviar. Retorne null se o nome do paciente não estiver presente. NUNCA invente.

TEXTO DO LAUDO:
{{examText}}$T$
WHERE operation = 'extraction' AND status = 'active';

UPDATE prompt_registry
SET content_hash = encode(digest(system_prompt || user_prompt_template || '0' || max_tokens::text, 'sha256'), 'hex')
WHERE operation = 'extraction' AND status = 'active';
