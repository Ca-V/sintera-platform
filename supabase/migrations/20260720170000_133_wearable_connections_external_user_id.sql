-- HIP-002 — capacidade GENÉRICA (não específica do Withings): mapear o id do usuário NA FONTE → usuário da
-- plataforma, para resolver webhooks chaveados pelo id interno do provedor (ex.: Withings `userid`). Aditivo/seguro.
alter table public.wearable_connections add column if not exists external_user_id text;
comment on column public.wearable_connections.external_user_id is
  'HIP-002: id do usuario na FONTE (ex.: Withings userid). Resolve webhooks provedor->usuario da plataforma. Generico.';
-- Lookup por (provider, external_user_id) no webhook.
create index if not exists wearable_connections_provider_extuid
  on public.wearable_connections (provider, external_user_id);
