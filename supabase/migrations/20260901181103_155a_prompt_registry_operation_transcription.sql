-- 155a — prompt_registry aceita a operação de transcrição.
--
-- MATERIALIZAÇÃO DE UMA MIGRAÇÃO APLICADA FORA DO GIT (23/09/2026).
--
-- Esta migração foi aplicada ao banco de produção em 01/09/2026 e nunca entrou no repositório. Era a ÚNICA
-- divergência real que o `check-migration-drift` acusava — o alarme estava vermelho todos os dias desde então
-- por causa dela, e só dela. Tudo o mais que parecia drift era ruído de carimbo de tempo: o `version` é
-- gravado no momento da APLICAÇÃO e não deriva do nome do arquivo, então a mesma migração aparece no ledger
-- sob versões diferentes.
--
-- O DDL abaixo é o conteúdo LITERAL recuperado de `supabase_migrations.schema_migrations`, não uma
-- reconstrução. O `version` no nome do arquivo é o de produção, para que o par arquivo↔ledger seja exato.
--
-- Um alarme que toca todo dia deixa de ser alarme: treina todo mundo a ignorá-lo, e no dia em que aparecer um
-- drift de verdade — alguém aplicando DDL à mão em produção — ninguém vai olhar. É por isso que fechar esta
-- divergência importa mais do que o tamanho dela sugere.
--
-- Conteúdo original, como aplicado:

-- A GOVERNANCA DE PROMPTS PASSA A CONHECER A TRANSCRICAO.
-- O CHECK limitava `operation` a extraction | narrative | qa. Sem esta alteracao o prompt de transcricao nao
-- poderia sequer ser registrado — e rodar um prompt fora do registro seria abrir mao da verificacao de
-- integridade, que e justamente o que torna a leitura auditavel.
alter table public.prompt_registry drop constraint if exists prompt_registry_operation_check;
alter table public.prompt_registry add constraint prompt_registry_operation_check
  check (operation = any (array['extraction','narrative','qa','transcription']));
