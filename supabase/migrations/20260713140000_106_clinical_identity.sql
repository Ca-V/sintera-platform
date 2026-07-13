-- Identidade Clínica (Clinical Identity Registry, CEF §3.0) — 2 atributos por exame/CDU.
-- Separados da identidade DOCUMENTAL (document_title/document_type): "que tipo de exame é" (interno).
-- Colunas nullable (não-destrutivas). Write-once no analyze (só na 1ª extração).
alter table public.exams add column if not exists clinical_family text;
alter table public.exams add column if not exists clinical_type text;

comment on column public.exams.clinical_family is
  'Família clínica da modalidade (ex.: Oftalmologia, Imagem — mama). Saída do Clinical Identity Registry (ensemble de evidências). Identidade CLÍNICA, não documental.';
comment on column public.exams.clinical_type is
  'Tipo clínico específico (ex.: Mamografia, Tomografia de córnea (Pentacam)). Escolhe o extrator do CEF (M5).';
