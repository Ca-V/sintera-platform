-- T2-C — health_events como modelo DEFINITIVO da jornada de saude.
-- Puramente ADITIVO e inerte (colunas nullable/default; nenhum comportamento muda
-- ate a UI/notificacoes consumirem). Sem campos especificos de notificacao:
-- a notificacao e PROJECAO do dominio.

alter table public.health_events
  -- Status canonico (enum unico de plataforma)
  add column if not exists status text not null default 'planejado'
    check (status in ('planejado','confirmado','realizado','cancelado','reagendado','perdido')),
  -- Horario do compromisso (event_date ja existe como date)
  add column if not exists event_time time,
  -- Campos do compromisso (REQ-NOTIF-001) — dominio, nao notificacao
  add column if not exists professional_name text,
  add column if not exists establishment text,
  add column if not exists location text,
  add column if not exists modality text check (modality in ('presencial','telemedicina')),
  add column if not exists preparation text,
  -- Linkagem extensivel a outros objetos da plataforma (opcional): [{kind,id,label}]
  add column if not exists links jsonb not null default '[]'::jsonb,
  -- Pronto para recorrencia (expansao = outro FS)
  add column if not exists recurrence_rule text,
  add column if not exists series_id uuid,
  -- Gancho realizado -> Historico/gasto (integracao automatica = depois)
  add column if not exists completed_at timestamptz;
