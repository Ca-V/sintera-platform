// Template de e-mail de lembrete de evento da Agenda.
// Renderiza a PROJEÇÃO do domínio (REQ-NOTIF-001): data, horário, tipo, profissional,
// estabelecimento, local, modalidade e preparo — quando disponíveis. Sem juízo clínico.

import type { EventNotification } from '@/lib/agenda/notification'

interface ReminderData {
  firstName: string
  notification: EventNotification   // heading + typeLabel + lines (já projetadas do domínio)
}

export function reminderEmailHtml(d: ReminderData): string {
  const name = d.firstName.trim() || 'Olá'
  const n = d.notification
  const lines = n.lines.map(l =>
    `<p style="margin:0 0 4px;font-size:14px;color:#6B6B70;">${l.icon} ${l.text}</p>`).join('')
  return /* html */`
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#0E6E64,#14746B);width:32px;height:32px;border-radius:50%;text-align:center;vertical-align:middle;">
              <span style="color:#fff;font-size:16px;line-height:32px;">◎</span>
            </td>
            <td style="padding-left:9px;font-size:18px;font-weight:700;letter-spacing:0.2em;color:#1C1C1E;">SINTERA</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;padding:36px 32px;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
          <p style="margin:0 0 6px;font-size:13px;color:#9B8EA8;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
            Lembrete · ${n.typeLabel}
          </p>
          <h1 style="margin:0 0 18px;font-size:22px;color:#1C1C1E;font-weight:700;">${name}, você tem um compromisso de saúde</h1>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border-radius:14px;padding:18px 20px;margin-bottom:18px;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:17px;color:#1C1C1E;font-weight:600;">${n.heading}</p>
              ${lines}
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#9B8EA8;line-height:1.6;">
            A SINTERA organiza seus eventos de saúde. Não oferece diagnóstico nem orientação clínica.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:22px;">
          <p style="margin:0;font-size:11px;color:#B8B0C0;">Você recebe este lembrete porque criou este evento na SINTERA.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function reminderEmailText(d: ReminderData): string {
  const name = d.firstName.trim() || 'Olá'
  const n = d.notification
  return [
    `SINTERA — Lembrete (${n.typeLabel})`,
    '',
    `${name}, você tem um compromisso de saúde:`,
    '',
    `• ${n.heading}`,
    ...n.lines.map(l => `• ${l.icon} ${l.text}`),
    '',
    'A SINTERA organiza seus eventos de saúde. Não oferece diagnóstico nem orientação clínica.',
    'Você recebe este lembrete porque criou este evento na SINTERA.',
  ].join('\n')
}
