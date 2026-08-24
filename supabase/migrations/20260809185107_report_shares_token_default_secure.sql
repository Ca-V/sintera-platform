-- H-18: token do link público gerado no BANCO (pgcrypto, criptograficamente seguro), removendo a
-- dependência de Web Crypto no cliente (que não existe no Hermes/Expo por padrão → "criar link falha").
-- Aditivo e retrocompatível: inserts que ainda enviam token continuam válidos; os que omitem recebem o default.
alter table public.report_shares
  alter column token set default encode(gen_random_bytes(32), 'hex');