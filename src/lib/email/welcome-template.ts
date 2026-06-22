export function welcomeEmailHtml(firstName: string): string {
  const name = firstName.trim() || 'bem-vinda'
  return /* html */`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vinda à SINTERA</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#E8A4B8,#C490D1);width:36px;height:36px;border-radius:50%;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;line-height:36px;">◎</span>
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;letter-spacing:0.2em;color:#1C1C1E;">
                    SINTERA
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;padding:40px 36px;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

              <p style="margin:0 0 6px;font-size:13px;color:#9B8EA8;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
                Acesso antecipado · Gratuito
              </p>
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:#1C1C1E;line-height:1.3;">
                Olá, ${name}! Seu acesso está confirmado.
              </h1>

              <p style="margin:0 0 16px;font-size:15px;color:#5A5068;line-height:1.7;">
                Você está entre as primeiras pessoas a acessar a SINTERA — uma plataforma para organizar suas informações de saúde num só lugar (exames, medicamentos, condições, hábitos e medidas) e acompanhar a evolução ao longo do tempo.
              </p>

              <p style="margin:0 0 28px;font-size:15px;color:#5A5068;line-height:1.7;">
                Na SINTERA, você pode:
              </p>

              <!-- Lista de recursos -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                ${[
                  ['📄', 'Enviar seus laudos em PDF', 'A IA extrai os biomarcadores automaticamente'],
                  ['📊', 'Visualizar seu histórico', 'Acompanhe a evolução dos seus resultados ao longo do tempo'],
                  ['💬', 'Dar feedback direto para mim', 'Cada opinião vai moldar o produto final'],
                ].map(([emoji, title, sub]) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F0EBF4;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;vertical-align:top;padding-top:2px;">${emoji}</td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#1C1C1E;">${title}</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#9B8EA8;">${sub}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://sinteramais.com.br/onboarding"
                      style="display:inline-block;background:linear-gradient(135deg,#E8A4B8,#C490D1);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.04em;">
                      Acessar a SINTERA →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;color:#5A5068;line-height:1.7;">
                Se tiver qualquer dúvida ou quiser me dar um feedback mais direto, é só responder este e-mail. Eu leio todas as mensagens.
              </p>

              <p style="margin:0;font-size:14px;color:#5A5068;">
                Com carinho,<br />
                <strong style="color:#1C1C1E;">Carina Leite</strong><br />
                <span style="font-size:13px;color:#9B8EA8;">Fundadora, SINTERA</span>
              </p>
            </td>
          </tr>

          <!-- Nota LGPD / rodapé -->
          <tr>
            <td style="padding:24px 8px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#B0A8B9;line-height:1.6;">
                Você recebeu este e-mail porque se cadastrou na lista de espera da SINTERA.<br />
                Seus dados são tratados conforme nossa
                <a href="https://sinteramais.com.br/privacidade" style="color:#C490D1;text-decoration:none;">Política de Privacidade</a>
                e a LGPD (Lei nº 13.709/2018).
              </p>
              <p style="margin:0;font-size:11px;color:#C8C0D0;">
                SINTERA Tecnologia em Saúde · privacidade@sinteramais.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function welcomeEmailText(firstName: string): string {
  const name = firstName.trim() || 'bem-vinda'
  return `Olá, ${name}!

Seu acesso à SINTERA está confirmado.

Você está entre as primeiras pessoas a acessar a plataforma para organizar suas informações de saúde num só lugar (exames, medicamentos, condições, hábitos e medidas) e acompanhar a evolução ao longo do tempo.

Crie sua conta agora: https://sinteramais.com.br/onboarding

Na SINTERA você pode:
- Enviar laudos em PDF (a IA extrai os biomarcadores automaticamente)
- Visualizar seu histórico e acompanhar a evolução dos resultados
- Dar feedback diretamente para mim

Qualquer dúvida, responda este e-mail — eu leio tudo.

Com carinho,
Carina Leite
Fundadora, SINTERA

---
Você recebeu este e-mail porque se cadastrou na lista de espera da SINTERA.
Seus dados são tratados conforme nossa Política de Privacidade (sinteramais.com.br/privacidade) e a LGPD.`
}
