-- Princípio da Reprodutibilidade (GOVERNANCA) — assinatura da representação estruturada certificada.
-- Mesma versão de extrator + mesmo documento => mesma assinatura. Diferença = evento de consistência
-- (nunca substitui automaticamente os dados). Coluna nullable (não-destrutiva).
alter table public.exams
  add column if not exists representation_fingerprint text;

comment on column public.exams.representation_fingerprint is
  'SHA-256 da representação estruturada certificada (nome documental + classificação + resultados). Princípio da Reprodutibilidade: mesma versão de extrator + mesmo documento => mesma assinatura.';
