// SINTERA — adaptador de CANAL para o convite por e-mail (NOTIF-001).
//
// POR QUE ISTO VIVE EM `src/lib/email/` E NÃO NO MÓDULO DA REDE DE CUIDADO.
//
// A catraca `ARCH-single-notification-infra` reprovou a primeira versão, e estava certa: eu tinha posto
// `new Resend(...)` dentro de `src/lib/care/`. O NOTIF-001 diz que a infraestrutura de notificações é ÚNICA e
// que nenhum módulo notifica por conta própria — quem fala com o canal são os adaptadores.
//
// A diferença não é organizacional. Com o envio espalhado pelos módulos, trocar de provedor, acrescentar
// registro de entrega ou aplicar preferência de canal viraria uma caçada por chamadas soltas. Aqui, o módulo
// diz O QUE mandar; o adaptador sabe COMO.
import 'server-only'
import { Resend } from 'resend'
import { conviteEmailAssunto, conviteEmailHtml, conviteEmailTexto } from './convite-template'

const REMETENTE = 'SINTERA <ola@sinteramais.com.br>'

export type EmailStatus = 'sent' | 'skipped' | 'failed'

export interface EmailResult {
  status: EmailStatus
  detail?: string
}

export interface ConviteEmailArgs {
  readonly para: string
  readonly nomeDeQuemConvida: string | null
  readonly linkDeAceite: string
}

/**
 * Envia o convite por e-mail. NUNCA lança.
 *
 * `skipped` = sem credencial (configuração ausente). `failed` = o provedor recusou (problema a investigar).
 * A distinção é o que permite a tela dizer "ainda não está configurado" em vez de "falhou" — e é ela que
 * manda a pessoa certa resolver.
 */
export async function sendConviteEmail(a: ConviteEmailArgs): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { status: 'skipped', detail: 'sem_resend_api_key' }
  if (!a.para.trim()) return { status: 'skipped', detail: 'sem_destinatario' }

  const params = { nomeDeQuemConvida: a.nomeDeQuemConvida, linkDeAceite: a.linkDeAceite }
  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: REMETENTE,
      to: [a.para],
      replyTo: 'ola@sinteramais.com.br',
      subject: conviteEmailAssunto(params),
      html: conviteEmailHtml(params),
      text: conviteEmailTexto(params),
    })
    if (error) return { status: 'failed', detail: sanitizar(error.message) }
    return { status: 'sent' }
  } catch (e) {
    return { status: 'failed', detail: sanitizar(e instanceof Error ? e.message : String(e)) }
  }
}

/**
 * O detalhe é gravado no banco e lido em diagnóstico. Corta o tamanho e remove qualquer coisa com cara de
 * credencial — mensagem de erro de fornecedor às vezes ecoa o cabeçalho de autorização.
 */
function sanitizar(msg: string): string {
  return msg.replace(/Bearer\s+[\w.\-]+/gi, 'Bearer ***').replace(/re_[\w]+/g, 're_***').slice(0, 300)
}
