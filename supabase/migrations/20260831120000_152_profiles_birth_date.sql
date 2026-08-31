-- 152 — DATA DE NASCIMENTO no perfil.
--
-- DECISÃO DA FUNDADORA (31/08): a plataforma precisa contextualizar o acompanhamento por fase da vida, "desde
-- bebê, criança, adolescente, adulto, idoso". O perfil guardava FAIXA ETÁRIA, e faixa não serve para o começo
-- da vida — "0 a 5 anos" trata um recém-nascido e uma criança de cinco anos como a mesma coisa, quando entre
-- os 2 e os 8 meses muda tudo. Curva de crescimento e marcos dependem da idade EXATA.
--
-- ADITIVA. Acrescenta UMA coluna nula. `age_range` PERMANECE, com o conteúdo que tem: quem informou só a faixa
-- continua com ela valendo, e nada é convertido nem apagado. Havendo data, a faixa passa a ser DERIVADA dela
-- na leitura (`faixaDerivada`, no núcleo) — guardar as duas separadamente seria manter dois registros do mesmo
-- fato, e o segundo envelheceria sozinho: a pessoa faz aniversário e a faixa continua a antiga.
--
-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────
-- LGPD. Data de nascimento é dado pessoal, e o tratamento aqui é o que a lei pede — e um pouco mais:
--
--   FINALIDADE ESPECÍFICA   organizar o registro por fase da vida. Declarada NA TELA, antes de pedir
--                           (`MOTIVO_DATA_NASCIMENTO`), e não escondida numa política que ninguém lê.
--   MINIMIZAÇÃO             guarda-se a data e deriva-se o resto. Nenhum campo redundante.
--   OPCIONAL                nulável de propósito. Nada deixa de funcionar sem ela; muda a precisão da
--                           organização, e a tela diz isso antes de perguntar.
--   ELIMINAÇÃO              apagável a qualquer momento pela própria pessoa, pelo mesmo caminho de edição.
--                           Apagar reverte a plataforma ao estado anterior, sem resíduo.
--   ACESSO                  a RLS de `profiles` já existe e é por linha (`auth.uid() = id`). Esta coluna
--                           entra sob a MESMA política — ninguém além da dona alcança.
--
-- E O QUE A PLATAFORMA NÃO FAZ COM ELA, dito à pessoa (`LIMITE_DATA_NASCIMENTO`): não avalia resultado, não
-- sugere exame, não recomenda tratamento. Organiza o que ela registrou. Quem interpreta é o médico dela.
-- O silêncio nesse ponto seria lido como a promessa oposta.
-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists birth_date date;

comment on column public.profiles.birth_date is
  'Data de nascimento. OPCIONAL (LGPD: finalidade declarada na tela, minimização, eliminação pela titular). '
  'Usada só para derivar idade e fase da vida — nunca para avaliar resultado nem sugerir conduta.';
