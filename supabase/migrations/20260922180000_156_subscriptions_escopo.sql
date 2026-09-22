-- 156 — BILLING-003 §2.1: uma pessoa pode ter DUAS assinaturas.
--
-- A migração 116 criou `subscriptions` com `user_id` como CHAVE PRIMÁRIA — uma assinatura por pessoa. O
-- modelo de negócio exige o contrário: a nutricionista assina o Evolução para a própria saúde E o
-- Inteligência da Prática para a carteira dela. Dois produtos, dois preços, dois ciclos de cobrança.
--
-- Decisão da fundadora (22/09/2026, CARE-003 §2.0): UM login, UMA pessoa, DOIS perfis, DUAS assinaturas. A
-- alternativa de dois cadastros separados — pessoal por CPF, profissional por CNPJ — foi descartada porque o
-- CNPJ amarraria a carteira do profissional a quem o emprega: quem sai da clínica perderia os vínculos.
--
-- ADITIVA E REVERSÍVEL. `escopo` entra com default 'pessoal', então toda linha existente permanece válida e
-- com o mesmo significado que tinha. Nenhum dado se move, nenhuma leitura muda de resultado enquanto não
-- houver assinatura profissional.
--
-- FEITA AGORA, E NÃO DEPOIS, por uma razão de janela: enquanto não há assinatura paga real, trocar a chave
-- primária é aditivo. Depois, deixa de ser.

alter table public.subscriptions
  add column if not exists escopo text not null default 'pessoal';

alter table public.subscriptions
  drop constraint if exists subscriptions_escopo_check;
alter table public.subscriptions
  add constraint subscriptions_escopo_check check (escopo in ('pessoal', 'profissional'));

comment on column public.subscriptions.escopo is
  'BILLING-003: qual perfil esta assinatura paga. pessoal = Evolucao/Plus; profissional = Inteligencia/Clinica. '
  'Uma pessoa pode ter uma de cada — nunca duas do mesmo escopo.';

-- A chave primária passa de (user_id) para (user_id, escopo). O nome da constraint é o que o Postgres gerou
-- na 116; `if exists` cobre o caso de ela já ter outro nome em algum ambiente.
alter table public.subscriptions drop constraint if exists subscriptions_pkey;
alter table public.subscriptions add primary key (user_id, escopo);

-- Índice para a leitura mais comum — as assinaturas de uma pessoa.
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

-- A RLS da 116 continua correta: `auth.uid() = user_id` vale igual para as duas linhas, e a pessoa lê as duas
-- assinaturas dela. Escrita segue restrita ao service role.
