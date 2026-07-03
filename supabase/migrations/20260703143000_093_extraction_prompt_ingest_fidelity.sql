-- ============================================================
-- SINTERA — Migração 093: prompt de extração v1.5.0 (Fidelidade da Ingestão)
-- ============================================================
-- Adiciona source_material e source_exam_name ao schema de saída + regras de
-- extração ESTRITAMENTE DESCRITIVAS (texto original do laudo; null quando ausente;
-- sem normalizar/traduzir/inferir/conhecimento médico) + regra anti-vazamento de
-- contexto entre biomarcadores em laudos com múltiplos exames/materiais.
-- Redação aprovada pela fundadora (03/07). Extração de FATO (RDC 657).
-- content_hash recomputado pela fórmula do prompt-loader (system||user||'0'||max_tokens).
-- ============================================================

UPDATE prompt_registry
SET version = '1.5.0',
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
      "extraction_notes": "string ou null",
      "source_material": "string ou null",
      "source_exam_name": "string ou null"
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

REGRAS PARA source_material e source_exam_name:
- source_material: o material/origem da amostra informado pelo laboratório (ex.: "Sangue", "Sangue venoso", "Urina de 24 horas").
- source_exam_name: o nome do exame informado no laudo (ex.: "Hemograma", "Gasometria venosa", "Urina tipo I (EAS)").
- Extraia EXATAMENTE o material informado pelo laboratório e EXATAMENTE o nome do exame informado no laudo. Não normalize. Não traduza. Não complete. Não infira. Não utilize conhecimento médico. Caso não estejam explicitamente presentes no laudo, retorne null.
- source_material e source_exam_name devem representar o contexto do biomarcador ao qual pertencem. NÃO reutilize automaticamente esses valores entre biomarcadores quando o laudo apresentar mais de um exame ou mais de um material (ex.: um mesmo PDF com Hemograma, Gasometria venosa e Urina tipo I). Cada biomarcador deve carregar o contexto correto.

TEXTO DO LAUDO:
{{examText}}$T$
WHERE operation = 'extraction' AND status = 'active';

UPDATE prompt_registry
SET content_hash = encode(digest(system_prompt || user_prompt_template || '0' || max_tokens::text, 'sha256'), 'hex')
WHERE operation = 'extraction' AND status = 'active';
