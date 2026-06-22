// ============================================================
// SINTERA — Envio de lembrete por WhatsApp (Meta Cloud API)
// ============================================================
// Envia uma mensagem de TEMPLATE (lembrete proativo exige template aprovado).
// Configuração via variáveis de ambiente (não há credencial no código):
//   WHATSAPP_CLOUD_TOKEN      — token de acesso (System User / permanente)
//   WHATSAPP_PHONE_NUMBER_ID  — ID do número remetente no WhatsApp Business
//   WHATSAPP_TEMPLATE_NAME    — nome do template aprovado (padrão 'lembrete_sintera')
//   WHATSAPP_TEMPLATE_LANG    — idioma do template (padrão 'pt_BR')
//
// Sem as credenciais, retorna 'skipped' (não quebra o worker de lembretes).
// O conteúdo é factual (lembrete de evento da própria usuária), sem juízo clínico.
// ============================================================

const GRAPH_VERSION = 'v21.0'

export type WhatsAppStatus = 'sent' | 'skipped' | 'failed'

/**
 * Resultado do envio, com detalhe para diagnóstico/observabilidade.
 * `detail` traz o motivo do skip (ex.: 'no_token') ou o erro da Meta
 * (ex.: 'http_400: <corpo>'). Nunca contém credenciais.
 */
export interface WhatsAppResult {
  status: WhatsAppStatus
  detail?: string
}

/** Normaliza telefone para E.164 só-dígitos (assume Brasil +55 se sem país). */
export function normalizePhoneBR(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/\D/g, '')
  if (d.length < 10) return null            // muito curto p/ ser válido
  if (!d.startsWith('55')) d = `55${d}`     // adiciona DDI Brasil quando ausente
  return d
}

export interface ReminderParams {
  /** Texto do evento (parâmetro {{1}} do template). */
  title: string
  /** Data legível do evento (parâmetro {{2}} do template). */
  dateLabel: string
}

/**
 * Envia um lembrete por WhatsApp via Meta Cloud API.
 * Retorna { status:'skipped' } se faltar credencial/telefone, 'sent' se a API
 * aceitou, 'failed' em erro de envio (com `detail` do erro). Nunca lança.
 */
export async function sendWhatsAppReminder(
  phone: string | null | undefined,
  params: ReminderParams,
): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_CLOUD_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token) return { status: 'skipped', detail: 'no_token' }
  if (!phoneNumberId) return { status: 'skipped', detail: 'no_phone_number_id' }

  const to = normalizePhoneBR(phone)
  if (!to) return { status: 'skipped', detail: 'invalid_phone' }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? 'lembrete_sintera'
  const lang = process.env.WHATSAPP_TEMPLATE_LANG ?? 'pt_BR'

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.title.slice(0, 200) },
            { type: 'text', text: params.dateLabel.slice(0, 60) },
          ],
        },
      ],
    },
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) return { status: 'sent' }
    const errText = await res.text().catch(() => '')
    return { status: 'failed', detail: `http_${res.status}: ${errText.slice(0, 400)}` }
  } catch (e) {
    return { status: 'failed', detail: `exception: ${String(e).slice(0, 200)}` }
  }
}
