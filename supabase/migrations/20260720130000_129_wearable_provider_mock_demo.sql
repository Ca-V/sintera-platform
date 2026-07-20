-- HIP-001 / V2 Épico 2.3 — permite o conector de DEMONSTRAÇÃO (mock comportamental) end-to-end. Aditivo.
-- 'mock_demo' é um provider de demonstração (rótulo ao usuário: "Dispositivo de demonstração"); pode ser
-- removido quando o mock for aposentado. Não afeta os providers reais.
alter table public.wearable_connections drop constraint if exists wearable_connections_provider_check;
alter table public.wearable_connections
  add constraint wearable_connections_provider_check
  check (provider in ('oura','garmin','strava','withings','mock_demo'));
