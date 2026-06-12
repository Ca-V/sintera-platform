
-- Política DELETE ausente impedia a limpeza de biomarcadores antes do reprocessamento
CREATE POLICY "biomarkers_delete"
  ON public.biomarkers
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
