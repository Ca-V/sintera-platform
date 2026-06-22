-- 047 — medications.until_date (até quando vai tomar)
--
-- started_on já registra o início. Agora um fim OPCIONAL: quando não se sabe
-- até quando, fica em branco (uso contínuo / sem previsão).

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS until_date date;

COMMENT ON COLUMN public.medications.until_date
  IS 'Até quando tomar (opcional). Em branco = sem previsão / uso contínuo.';
