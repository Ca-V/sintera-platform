-- clinical_results — MODELO ABERTO: material biológico/amostra (specimen) faltava na persistência canônica
-- (detectado pela CERT-persistence: um biomarcador com material não fazia round-trip). Aditivo. Fecha a
-- lacuna: parâmetros/biomarcadores/achados/classificações/medidas/anatomia/lateralidade/grupos/texto +
-- material — sem adaptação por modalidade.
alter table public.clinical_results add column if not exists specimen text;
comment on column public.clinical_results.specimen is 'Material/amostra biológico (laboratório: sangue/urina/fezes…). Modelo aberto.';
