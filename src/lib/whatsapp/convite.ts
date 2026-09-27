// SINTERA — convite da Rede de Cuidado por WhatsApp (CARE-003 §2.3 + NOTIF-001).
//
// POR QUE NÃO REUSA `sendWhatsAppReminder`. Aquele envia o template de LEMBRETE, com parâmetros de evento e
// data. Convite é outra mensagem, para outra pessoa, com outro propósito — e a Meta exige template aprovado
// por finalidade. Enviar um convite disfarçado de lembrete é o caminho mais curto para a conta ser suspensa.
//
// Por isso: template próprio, nome configurável por ambiente, e o mesmo comportamento de degradação — sem
// credencial ou sem template, devolve `skipped`, que a camada de cima traduz como "não configurado", nunca
// como "falhou".
//
// O TEMPLATE NÃO PODE CONTER DADO DE SAÚDE. Os dois parâmetros são o nome de quem convidou e o link. Nada
// sobre condição, tratamento ou motivo — um WhatsApp aparece na tela de bloqueio de quem estiver por perto.
import 'server-only'
import { toDialDigits } from '@sintera/core'

const GRAPH_VERSION = 'v21.0'

export type WhatsAppStatus = 'sent' | 'skipped' | 'failed'

export interface WhatsAppResult {
  status: WhatsAppStatus
  detail?: string
}

export interface ConviteWhatsAppParams {
  readonly nomeDeQuemConvida: string | null
  readonly link: string
}

/**
 * Envia o convite. Nunca lança.
 *
 * `skipped` = credencial ou telefone ausente (configuração). `failed` = a Meta recusou (problema).
 */
export async function sendWhatsAppConvite(
  phone: string | null | undefined,
  params: ConviteWhatsAppParams,
): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_CLOUD_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token) return { status: 'skipped', detail: 'no_token' }
  if (!phoneNumberId) return { status: 'skipped', detail: 'no_phone_number_id' }

  const to = toDialDigits(phone)
  if (!to) return { status: 'skipped', detail: 'invalid_phone' }

  // Template PRÓPRIO do convite. Enquanto não houver um aprovado na Meta, o envio falha com #132001 e a
  // pessoa lê "o envio por WhatsApp ainda não está configurado" — que é a verdade.
  const templateName = process.env.WHATSAPP_TEMPLATE_CONVITE ?? 'sintera_convite'
  const lang = process.env.WHATSAPP_TEMPLATE_LANG ?? 'pt_BR'
  const langCandidates = [lang, ...['pt_BR', 'en', 'en_US'].filter(l => l !== lang)]

  const quem = (params.nomeDeQuemConvida ?? '').trim() || 'Alguém'

  const attempt = async (code: string) => {
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: quem.slice(0, 60) },
            { type: 'text', text: params.link.slice(0, 300) },
          ],
        }],
      },
    }
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return { ok: res.ok, status: res.status, text: res.ok ? '' : await res.text().catch(() => '') }
  }

  try {
    let ultimo = ''
    for (const code of langCandidates) {
      const r = await attempt(code)
      if (r.ok) return { status: 'sent' }
      ultimo = `http_${r.status}: ${r.text.slice(0, 200)}`
      // #132001 = template inexistente naquele idioma. Qualquer outro erro não melhora trocando o idioma.
      if (!r.text.includes('132001')) break
    }
    // Template ausente é CONFIGURAÇÃO, não falha de envio — a distinção muda o que a tela diz e quem age.
    if (ultimo.includes('132001')) return { status: 'skipped', detail: 'template_nao_aprovado' }
    return { status: 'failed', detail: ultimo }
  } catch (e) {
    return { status: 'failed', detail: e instanceof Error ? e.message.slice(0, 200) : 'erro_desconhecido' }
  }
}
