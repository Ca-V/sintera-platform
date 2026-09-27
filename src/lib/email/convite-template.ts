// SINTERA — e-mail do convite para a Rede de Cuidado (CARE-003 §2.3).
//
// O QUE ESTE E-MAIL NUNCA PODE CONTER: dado de saúde. Nem exame, nem condição, nem medida, nem motivo
// clínico. Um convite lido por quem não deveria — caixa compartilhada, celular na mesa, encaminhamento —
// não pode revelar nada além de que uma pessoa quis se conectar a outra.
//
// Por isso o texto fala do CONVITE, nunca de quem convidou estar doente, em tratamento ou acompanhando algo.
// "Quer que você acompanhe a saúde dela" já diria demais em alguns contextos; "quer se conectar a você na
// SINTERA" não diz nada que o remetente não tenha escolhido dizer.
//
// E não promete interpretação clínica (RDC 657): a SINTERA organiza e dá acesso.

export interface ConviteEmailParams {
  /** Primeiro nome de quem convidou, quando houver. Sem sobrenome: o e-mail não é um cadastro. */
  readonly nomeDeQuemConvida?: string | null
  /** Endereço completo da página de aceite, com o token. */
  readonly linkDeAceite: string
}

const RODAPE =
  'Se você não esperava este convite, pode ignorar este e-mail — nada acontece sem a sua ação.'

export function conviteEmailAssunto(p: ConviteEmailParams): string {
  return p.nomeDeQuemConvida?.trim()
    ? `${p.nomeDeQuemConvida.trim()} quer se conectar a você na SINTERA`
    : 'Convite para se conectar na SINTERA'
}

export function conviteEmailTexto(p: ConviteEmailParams): string {
  const quem = p.nomeDeQuemConvida?.trim()
  return [
    quem ? `${quem} convidou você para a Rede de Cuidado dela na SINTERA.` : 'Você foi convidado para uma Rede de Cuidado na SINTERA.',
    '',
    'A SINTERA reúne, num só lugar, exames, medidas e documentos que hoje ficam espalhados. Ao aceitar, você',
    'passa a ver o que a pessoa autorizar — e só isso. Ela escolhe as áreas e pode encerrar quando quiser.',
    '',
    'Aceitar o convite:',
    p.linkDeAceite,
    '',
    'Aceitar é gratuito, e não há cobrança para receber informações de quem convidou você.',
    '',
    RODAPE,
  ].join('\n')
}

export function conviteEmailHtml(p: ConviteEmailParams): string {
  const quem = p.nomeDeQuemConvida?.trim()
  const abertura = quem
    ? `<strong>${escapar(quem)}</strong> convidou você para a Rede de Cuidado dela na SINTERA.`
    : 'Você foi convidado para uma Rede de Cuidado na SINTERA.'
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f6f6;font-family:'Segoe UI',Calibri,system-ui,sans-serif;color:#1F2A2E">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:40px 32px">
    <p style="margin:0 0 28px;font-size:24px;font-weight:700;color:#579DA8;letter-spacing:-.01em">SINTERA</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6">${abertura}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#56646A">
      A SINTERA reúne, num só lugar, exames, medidas e documentos que hoje ficam espalhados. Ao aceitar, você
      passa a ver <strong>o que a pessoa autorizar — e só isso</strong>. Ela escolhe as áreas e pode encerrar
      quando quiser.
    </p>
    <p style="margin:0 0 28px">
      <a href="${escapar(p.linkDeAceite)}"
         style="display:inline-block;background:#579DA8;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:8px;font-size:15px">
        Aceitar o convite
      </a>
    </p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#56646A">
      Aceitar é gratuito, e não há cobrança para receber informações de quem convidou você.
    </p>
    <p style="margin:0;padding-top:20px;border-top:1px solid #D5E0DC;font-size:12px;line-height:1.6;color:#56646A">
      ${RODAPE}
    </p>
  </div>
</body></html>`
}

/** O nome vem de dado da pessoa; entra em HTML, então escapa. */
function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
