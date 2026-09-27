// SINTERA — entrega do convite da Rede de Cuidado (CARE-003 §2.3 + NOTIF-001).
//
// ============================================================================================
// O DEFEITO QUE ISTO CORRIGE (homologação da fundadora, 27/09/2026)
// ============================================================================================
// O convite era gravado e a tela dizia "Convites enviados" — e nada saía. Este arquivo é o envio que não
// existia.
//
// ============================================================================================
// ELE ESCOLHE O CANAL; NÃO FALA COM NENHUM
// ============================================================================================
// A primeira versão chamava o Resend aqui dentro, e a catraca `ARCH-single-notification-infra` reprovou —
// corretamente. O NOTIF-001 diz que a infraestrutura de notificações é ÚNICA: quem fala com e-mail e com
// WhatsApp são os adaptadores em `src/lib/email/` e `src/lib/whatsapp/`.
//
// Então o que sobra aqui é a única coisa que é do domínio do cuidado: POR ONDE este convite deve sair.
//
// DOIS CANAIS, lado a lado, como a fundadora pediu. Qual deles depende do FORMATO do contato, porque o
// destinatário ainda não é usuário e não tem preferência configurada.
//
// NUNCA LANÇA. Falhar o envio não pode desfazer o convite: a linha já existe, o token já vale, e quem
// convidou pode tentar de novo. O que devolve é o ESTADO, para a tela relatar em vez de adivinhar.
//
// `nao_configurado` NÃO É `falhou`. Canal sem credencial resolve-se em minutos, por quem tem acesso ao
// painel; falha de envio é problema a investigar. Misturá-los é a armadilha da degradação silenciosa que já
// custou dois ciclos a este projeto.
import 'server-only'
import { canalDoContato, contatoNormalizado, type CanalDoConvite, type EntregaDoConvite } from '@sintera/core'
import { sendConviteEmail } from '@/lib/email/convite'
import { sendWhatsAppConvite } from '@/lib/whatsapp/convite'

export interface ResultadoDaEntrega {
  readonly canal: CanalDoConvite
  readonly entrega: EntregaDoConvite
  readonly detalhe?: string
}

export interface ConviteParaEnviar {
  readonly paraContato: string
  readonly token: string
  readonly nomeDeQuemConvida?: string | null
  /** Origem pública da plataforma, para montar o link de aceite. */
  readonly baseUrl: string
}

export function linkDeAceite(baseUrl: string, token: string): string {
  return new URL(`/convite/${encodeURIComponent(token)}`, baseUrl).toString()
}

/** `skipped` do adaptador significa credencial ausente — configuração, não falha. */
function traduzir(status: 'sent' | 'skipped' | 'failed'): EntregaDoConvite {
  if (status === 'sent') return 'entregue'
  return status === 'skipped' ? 'nao_configurado' : 'falhou'
}

export async function enviarConvite(c: ConviteParaEnviar): Promise<ResultadoDaEntrega> {
  const canal = canalDoContato(c.paraContato)
  const destino = contatoNormalizado(c.paraContato)

  if (canal === 'desconhecido' || !destino) {
    return { canal, entrega: 'falhou', detalhe: 'contato_nao_reconhecido' }
  }

  const link = linkDeAceite(c.baseUrl, c.token)
  const nomeDeQuemConvida = c.nomeDeQuemConvida ?? null

  const r = canal === 'whatsapp'
    ? await sendWhatsAppConvite(destino, { nomeDeQuemConvida, link })
    : await sendConviteEmail({ para: destino, nomeDeQuemConvida, linkDeAceite: link })

  return { canal, entrega: traduzir(r.status), detalhe: r.detail }
}
