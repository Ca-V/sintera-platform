-- Backlog A1 — identificação do exame no card: tipo · laboratório/clínica · médico SOLICITANTE.
-- Captura best-effort do solicitante (quem pediu o exame), transcrito do documento (não interpreta).
-- Coluna nullable/não-destrutiva. Write-once no analyze (só na 1ª extração), como o emissor.
alter table public.exams add column if not exists requesting_physician text;
comment on column public.exams.requesting_physician is
  'Médico SOLICITANTE (quem pediu o exame), transcrito do laudo (best-effort, não interpretativo). Identificação do card (A1); distinto do emissor (laboratório/clínica) e do assinante do laudo.';
