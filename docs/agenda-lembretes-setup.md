# Agenda — Lembretes por e-mail (Fase 2): setup

O envio de lembretes é feito por um worker (rota Next `POST /api/agenda/reminders`)
acionado diariamente pelo `pg_cron`. Reaproveita Resend, `SUPABASE_SERVICE_ROLE_KEY`
e `ADMIN_SECRET` (já configurados na Vercel) e o padrão de `pg_cron` já usado pelo
`pipeline-alert`. **Não há nova variável de ambiente.**

## Passos (uma vez)

### 1. Migração 024 — colunas de lembrete
Supabase → SQL Editor → cole e rode (idempotente):

```sql
alter table public.agenda_events
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists reminder_sent_at timestamptz;

create index if not exists agenda_events_reminder_idx
  on public.agenda_events (event_date)
  where status = 'pending' and reminder_enabled = true and reminder_sent_at is null;
```

### 2. Deploy do código
Merge do PR no `main` → a Vercel publica a rota `/api/agenda/reminders`.
(Faça antes do passo 3, pois o cron chama essa rota.)

### 3. Agendar o cron diário
Supabase → SQL Editor. **Troque `COLE_AQUI_O_ADMIN_SECRET`** pelo valor real do
`ADMIN_SECRET` (o mesmo usado no painel de e-mails do Admin). Ajuste o domínio se
necessário.

```sql
select cron.schedule(
  'agenda-email-reminders',
  '0 12 * * *',   -- 12:00 UTC = 09:00 horário de Brasília
  $$
  select net.http_post(
    url     := 'https://www.sinteramais.com.br/api/agenda/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-secret', 'COLE_AQUI_O_ADMIN_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

Para conferir os jobs: `select jobname, schedule from cron.job;`
Para remover/reagendar: `select cron.unschedule('agenda-email-reminders');`

## Como testar
1. Crie um evento na agenda para **amanhã**, com "Receber lembrete" marcado.
2. Dispare o worker manualmente (substitua o secret):
   ```bash
   curl -X POST https://www.sinteramais.com.br/api/agenda/reminders \
     -H "x-admin-secret: COLE_AQUI_O_ADMIN_SECRET"
   ```
   Resposta esperada: `{"due":N,"sent":N,"failed":0}`. O e-mail chega na conta da usuária.
3. Rodar de novo não reenvia (o evento fica marcado com `reminder_sent_at`).

## Regras do worker
- Envia para eventos **pendentes**, com `reminder_enabled = true`, ainda não lembrados,
  que vencem **hoje ou amanhã** (janela de 1 dia).
- Um lembrete por evento; marca `reminder_sent_at`. Editar o evento re-arma o lembrete.
- Sem conteúdo clínico — apenas relembra o que a usuária mesma agendou.

## Notas
- Segurança: o cron envia o `ADMIN_SECRET` no header; ele fica armazenado em
  `cron.job` (acessível apenas via service role / dashboard). Aceitável para o Beta.
- LGPD: o lembrete é transacional sobre um evento criado pela própria usuária, com
  opção de desligar por evento (`reminder_enabled`). O e-mail traz o motivo do envio.
