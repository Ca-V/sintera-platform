-- 1d.0 — Schema aditivo da escrita canonica. Puramente aditivo e reversivel.
-- Aplicada em producao via MCP em 24/06/2026 (version 20260624192025).
-- Nenhum comportamento muda (nada le o que e criado; defaults preservam o estado atual).

-- (A) extraction_versions: status (valid/invalid) + processing_mode (proveniencia I6)
alter table public.extraction_versions add column if not exists status text not null default 'valid';
alter table public.extraction_versions add column if not exists processing_mode text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='extraction_versions_status_chk') then
    alter table public.extraction_versions
      add constraint extraction_versions_status_chk check (status in ('valid','invalid'));
  end if;
end $$;

comment on column public.extraction_versions.status is
  '1d: valid|invalid. Versao invalid (falha parcial) nunca e promovida nem vira current. Append-only (marca, nao deleta).';
comment on column public.extraction_versions.processing_mode is
  '1d (I6): modo de escrita que criou a versao. Ex.: backfill_legacy, replace_legacy, canonical_shadow, canonical_on. Null = legado pre-1d.';

-- (A2) Backfill processing_mode nas versoes legadas (I6 completo desde ja)
update public.extraction_versions set processing_mode = 'backfill_legacy' where processing_mode is null;

-- (B) Indice unico parcial de reuso por EXAME: so versoes validas com chave de conteudo completa
create unique index if not exists ux_extraction_versions_reuse_key
  on public.extraction_versions
     (exam_id, document_sha256, extractor_version, prompt_version, model_version)
  where status = 'valid'
    and document_sha256 is not null
    and extractor_version is not null
    and prompt_version is not null
    and model_version is not null;

-- (C) system_flags: flag de banco para o modo de escrita (off/shadow/on)
create table if not exists public.system_flags (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.system_flags (key, value)
  values ('canonical_write_mode', 'off')
  on conflict (key) do nothing;

alter table public.system_flags enable row level security;
do $$ begin
  if not exists (select 1 from pg_policy where polname='system_flags_select'
                 and polrelid = 'public.system_flags'::regclass) then
    create policy system_flags_select on public.system_flags
      for select to authenticated using (true);
  end if;
end $$;

-- grants (menor privilegio): anon nenhum; authenticated SELECT; service_role total
revoke all on public.system_flags from anon;
revoke insert, update, delete, truncate on public.system_flags from authenticated;
grant select on public.system_flags to authenticated;
grant select, insert, update, delete on public.system_flags to service_role;
