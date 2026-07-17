-- FB-007 parte 2: meta de peso (kg) para o painel de acompanhamento GLP-1 na Composição Corporal.
-- Aditivo/nullable; sem meta = painel mostra progresso sem alvo. Fato do próprio usuário (não interpreta).
alter table public.profiles add column if not exists weight_goal_kg numeric;
comment on column public.profiles.weight_goal_kg is 'FB-007/BOD-001: meta de peso (kg) definida pela pessoa; alimenta o painel de acompanhamento (GLP-1).';
