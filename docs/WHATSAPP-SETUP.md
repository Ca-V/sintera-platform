# Lembretes por WhatsApp — setup (Meta WhatsApp Cloud API)

O código já está pronto: o worker diário de lembretes (`/api/agenda/reminders`) envia
por WhatsApp, além do e-mail, para usuárias que **ativaram o opt-in e informaram o
telefone** (em Configurações). Falta só **configurar a Meta** e as variáveis de ambiente.
Sem isso, o WhatsApp é simplesmente ignorado (o e-mail continua funcionando).

## 1. Criar o acesso na Meta
1. Em **developers.facebook.com**, crie um App (tipo *Business*) e adicione o produto **WhatsApp**.
2. Associe/verifique uma **Conta Business** (Meta Business verificada).
3. Em **WhatsApp → API Setup**, anote o **Phone Number ID** (número remetente).
4. Gere um **token permanente** (recomendado: *System User* com permissão
   `whatsapp_business_messaging`) — o token de teste expira em 24h.

## 2. Criar e aprovar o template de mensagem
Mensagens proativas (lembretes) exigem **template aprovado**. Em **WhatsApp → Message
Templates**, crie:

- **Nome:** `lembrete_sintera`
- **Categoria:** `Utility` (utilidade)
- **Idioma:** `Português (BR)` → `pt_BR`
- **Corpo (body)** com 2 variáveis:

  > Lembrete SINTERA: {{1}} em {{2}}. Esta é uma organização da sua jornada de saúde e não substitui avaliação médica.

  ({{1}} = título do evento · {{2}} = data legível)

Aguarde a **aprovação** da Meta (de minutos a ~1 dia).

## 3. Variáveis de ambiente (Vercel → Settings → Environment Variables)
```
WHATSAPP_CLOUD_TOKEN      = <token permanente>
WHATSAPP_PHONE_NUMBER_ID  = <Phone Number ID>
WHATSAPP_TEMPLATE_NAME    = lembrete_sintera     (opcional — este é o padrão)
WHATSAPP_TEMPLATE_LANG    = pt_BR                (opcional — este é o padrão)
```
Redeploy após salvar.

## 4. Como a usuária ativa
Em **Configurações → Lembretes por WhatsApp**: liga o opt-in e informa o telefone (com DDD).
O telefone é normalizado para E.164 (Brasil +55) no envio.

## Observações
- **LGPD/consentimento:** o envio só ocorre com **opt-in explícito** + telefone informado.
- **Conteúdo:** factual (lembrete de evento criado pela própria usuária) — sem juízo clínico.
- **Janela de 24h:** fora de uma conversa ativa, o WhatsApp só permite **templates** — por
  isso usamos template (e não texto livre) para os lembretes.
- Se as variáveis não estiverem configuradas, o worker apenas **pula** o WhatsApp (o
  lembrete por e-mail continua normal).
