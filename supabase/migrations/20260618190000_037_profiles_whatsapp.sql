-- ============================================================
-- SINTERA — Migração 037: telefone + opt-in de lembrete por WhatsApp
-- ============================================================
-- Campos no perfil para enviar lembretes da agenda por WhatsApp (Meta Cloud API).
-- phone = telefone da usuária (dado sensível/LGPD); pref_whatsapp_reminder = opt-in
-- explícito. Sem opt-in OU sem telefone, nenhum WhatsApp é enviado.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pref_whatsapp_reminder boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.phone IS 'Telefone da usuária para lembretes por WhatsApp (E.164/BR). NULL se não informado.';
COMMENT ON COLUMN profiles.pref_whatsapp_reminder IS 'Opt-in explícito para receber lembretes por WhatsApp.';
