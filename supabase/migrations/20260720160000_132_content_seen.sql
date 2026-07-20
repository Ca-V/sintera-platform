-- NOV-001 — Infraestrutura de Novidade (fonte ÚNICA). Responde, para TODA a plataforma: "o usuário já tomou
-- conhecimento deste conteúdo?". Uma marca de "visto" por (usuário × fluxo de conteúdo). Aditivo/seguro.
create table if not exists public.content_seen (
  user_id  uuid not null references auth.users on delete cascade,
  stream   text not null,                 -- fluxo: 'wearable_body', 'exams', 'documents'… (aberto)
  seen_at  timestamptz not null default now(),
  primary key (user_id, stream)
);
comment on table public.content_seen is
  'NOV-001: marca de "visto" por usuario x fluxo de conteudo. Nao-visto = itens do fluxo com created_at > seen_at. Fonte unica de novidade (banner, selos, futuras notificacoes).';
alter table public.content_seen enable row level security;
drop policy if exists content_seen_own on public.content_seen;
create policy content_seen_own on public.content_seen for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
