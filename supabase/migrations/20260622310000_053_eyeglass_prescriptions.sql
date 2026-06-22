-- 053 — eyeglass_prescriptions (receitas de óculos)
--
-- Registro factual e autorrelatado da receita oftalmológica de óculos: grau por
-- olho (esférico, cilíndrico, eixo, adição), DNP, data e prescritor, com a foto
-- da receita. A SINTERA apenas organiza e transcreve o que a pessoa informa/
-- fotografa — não interpreta nem prescreve. Vive em "Condições de Saúde".

CREATE TABLE IF NOT EXISTS public.eyeglass_prescriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prescribed_on  date,
  prescriber     text,
  od_sph         text,   -- olho direito (OD) — esférico
  od_cyl         text,   -- cilíndrico
  od_axis        text,   -- eixo
  od_add         text,   -- adição
  oe_sph         text,   -- olho esquerdo (OE) — esférico
  oe_cyl         text,
  oe_axis        text,
  oe_add         text,
  dnp            text,   -- distância naso-pupilar
  notes          text,
  file_url       text,   -- foto/scan da receita (signed URL do bucket exams)
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eyeglass_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY eyeglass_prescriptions_own ON public.eyeglass_prescriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS eyeglass_prescriptions_user_idx
  ON public.eyeglass_prescriptions (user_id, prescribed_on DESC);
