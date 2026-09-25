-- 162 — BILLING-003: os seis planos passam a existir no catálogo.
--
-- ============================================================================================
-- O QUE ESTA MIGRAÇÃO **NÃO** FAZ, E POR QUÊ
-- ============================================================================================
-- Ela NÃO mexe no plano `free`. Ele continua com `{"features":["*"],"modules":["*"]}` — curinga, concede tudo.
--
-- A razão está no BILLING-003 §2.2: trocar esse curinga pela fronteira real TIRA ACESSO, no mesmo instante,
-- de todo mundo que não tem assinatura. E tem um segundo efeito menos óbvio: `resolveEntitlements` cai no FREE
-- quando o status é `past_due`, `suspended` ou `canceled` — então a definição do gratuito é TAMBÉM a definição
-- do que acontece com quem parou de pagar.
--
-- A sequência obrigatória é:
--   1. cadastrar os planos pagos, com `free` intacto  ← ESTA MIGRAÇÃO
--   2. ligar os consumidores (telas lendo can/limit/hasModule) — nada muda, porque o gratuito ainda dá tudo
--   3. só então trocar o curinga, avisando antes quem vai perder acesso
--
-- Inverter 2 e 3 restringiria antes de existir tela que explicasse a restrição.
--
-- ============================================================================================
-- IDEMPOTENTE E SEM EFEITO VISÍVEL
-- ============================================================================================
-- Nenhuma assinatura existe hoje (subscriptions está vazia). Cadastrar plano não cria assinatura para
-- ninguém, então esta migração não muda o que qualquer pessoa vê. É preparação.
--
-- Os entitlements vêm de BILLING-003 §4.1 e §5. Os nomes de módulo são os identificadores de
-- `packages/core/src/domain/navigation/sections.ts` — a sidebar é SSOT da taxonomia, e inventar nomes aqui
-- criaria uma segunda.

-- ── Planos da pessoa ──────────────────────────────────────────────────────────────────────────────────────
insert into public.billing_plans (id, name, entitlements, active) values
(
  'evolucao', 'Evolução',
  '{
     "features": ["extracao.exames","medidas.comparacao_por_metodo","timeline.completa","conectores.sistema_operacional"],
     "limits": { "profissionais": 3 },
     "modules": ["inicio","agenda","exames","pedidos","documentos","medidas","medicamentos","suplementos",
                 "condicoes","ciclo","habitos","monitoramento","historico-exames","historico-saude","rede",
                 "despesas","configuracoes"]
   }'::jsonb, true
),
(
  'plus', 'Plus',
  '{
     "features": ["extracao.exames","medidas.comparacao_por_metodo","timeline.completa",
                  "conectores.sistema_operacional","conectores.dispositivo","exportacao.portabilidade"],
     "limits": {},
     "modules": ["*"]
   }'::jsonb, true
)
on conflict (id) do update set name = excluded.name, entitlements = excluded.entitlements, active = excluded.active;

-- ── Planos do profissional ────────────────────────────────────────────────────────────────────────────────
-- `prof.painel_carteira` e `prof.convidar_pacientes` ficam CADASTRADOS E DESLIGADOS na prática: dependem das
-- questões 1 e 3 do Briefing Jurídico. A permissão existir antes da função não custa nada; a função existir
-- antes do parecer, sim. `prof_acompanhamento` não concede nenhuma das duas.
insert into public.billing_plans (id, name, entitlements, active) values
(
  'prof_acompanhamento', 'Acompanhamento',
  '{
     "features": ["prof.receber_pacientes","prof.enviar_documento","prof.ver_evolucao"],
     "limits": {},
     "modules": ["profissional"]
   }'::jsonb, true
),
(
  'prof_inteligencia', 'Inteligência da Prática',
  '{
     "features": ["prof.receber_pacientes","prof.enviar_documento","prof.ver_evolucao",
                  "prof.painel_carteira","prof.convidar_pacientes","prof.exportar_relatorio"],
     "limits": {},
     "modules": ["profissional"]
   }'::jsonb, true
),
(
  'prof_clinica', 'Clínica e equipe',
  '{
     "features": ["prof.receber_pacientes","prof.enviar_documento","prof.ver_evolucao",
                  "prof.painel_carteira","prof.convidar_pacientes","prof.exportar_relatorio","prof.equipe"],
     "limits": { "profissionais_na_conta": 5 },
     "modules": ["profissional"]
   }'::jsonb, true
)
on conflict (id) do update set name = excluded.name, entitlements = excluded.entitlements, active = excluded.active;

-- O `free` fica como está, de propósito. Quando a fronteira for ligada (passo 3), será por migração PRÓPRIA,
-- para que a mudança que tira acesso de gente tenha um commit só dela e possa ser revertida sozinha.
comment on table public.billing_plans is
  'BILLING-001/003: catalogo de planos. entitlements = {features[],limits{},modules[]}. Fronteira unica. '
  'O plano `free` mantem o curinga "*" ATE o passo 3 do BILLING-003 §2.2 — troca-lo tira acesso de quem nao '
  'assina e de quem parou de pagar, e por isso tem migracao propria.';
