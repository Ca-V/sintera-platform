-- 150 — HIP-014 §5/§6: o APARELHO passa a poder gravar o que leu.
--
-- DDL ADITIVO e idempotente. Não altera política existente; só acrescenta as que faltam.
--
-- POR QUE: `wearable_readings` e `connector_sync_runs` têm HOJE apenas política de SELECT. Com RLS ativo, isso
-- significa que a sessão do usuário pode LER e não pode ESCREVER — só a chave service-role escreve. Era coerente
-- enquanto todo conector era OAuth do lado do servidor.
--
-- O Health Connect quebra essa premissa: ele lê NO APARELHO. Sem política de INSERT, o telefone lê os dados de
-- saúde da pessoa e não consegue gravá-los em lugar nenhum — e o princípio de nuvem sem servidor próprio exige
-- que o que se lê suba na MESMA sincronização, porque o aparelho é conduto, nunca armazenamento. Este é o
-- bloqueio real da integração, e ele é de banco, não de código.
--
-- ALTERNATIVA DESCARTADA: o aparelho postar numa rota da Web que usa service-role. Funciona, mas põe a Web no
-- caminho crítico de toda sincronização do aplicativo e mantém escrita privilegiada onde ela não é necessária —
-- estes dados são do próprio dono e o RLS já sabe expressar isso.
--
-- O QUE ESTA MIGRAÇÃO **NÃO** FAZ, de propósito: não abre escrita em `wearable_connections`.
--   Aquela tabela guarda access_token e refresh_token. Hoje a leitura do cliente é restrita POR COLUNA
--   (`authenticated` só enxerga provider, scope, status) — bem feito, e verificado. Mas o GRANT de INSERT/UPDATE
--   para `authenticated` inclui as colunas de token; ele é inofensivo agora apenas porque não existe política
--   de INSERT que o habilite. Criar essa política sem antes revogar o grant abriria escrita de token pelo
--   cliente. Fica registrado aqui como ARMADILHA para quem vier depois: se precisar que o aparelho registre a
--   conexão, revogue as colunas de token do grant ANTES de criar a política.
--   O Health Connect não precisa disso: a autorização dele vive na permissão do sistema operacional, não em
--   token nosso.
--
-- INTEGRIDADE DA PROVENIÊNCIA: com INSERT liberado, a pessoa pode gravar uma leitura dizendo `provider='strava'`
-- sem que ela tenha vindo do Strava. Isso é inerente a dado gerado pelo paciente e não é resolvido escrevendo
-- pelo servidor — o aparelho poderia mentir para o servidor do mesmo jeito. A proveniência registra O QUE A
-- PLATAFORMA FOI INFORMADA, não uma atestação criptográfica, e é assim em todo sistema de PGHD (HIP-014 §5).
-- O dado é do próprio dono; o risco é de autoengano, não de acesso indevido a terceiro.

-- ── wearable_readings — série bruta lida do aparelho (SSOT imutável por origem)
drop policy if exists wearable_readings_insert_own on public.wearable_readings;
create policy wearable_readings_insert_own on public.wearable_readings
  for insert with check (auth.uid() = user_id);

-- UPDATE é necessário para o upsert idempotente do re-sync
-- (unique user_id, provider, metric, recorded_at — migração 025).
drop policy if exists wearable_readings_update_own on public.wearable_readings;
create policy wearable_readings_update_own on public.wearable_readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- DELETE: a pessoa pode remover os próprios dados (LGPD, direito de eliminação).
drop policy if exists wearable_readings_delete_own on public.wearable_readings;
create policy wearable_readings_delete_own on public.wearable_readings
  for delete using (auth.uid() = user_id);

-- ── connector_sync_runs — histórico operacional da sincronização
-- Sem INSERT o aparelho sincroniza às cegas: nada registra o que rodou, quando, e se falhou. O painel de
-- Conexões existe justamente para mostrar isso.
drop policy if exists connector_sync_runs_insert_own on public.connector_sync_runs;
create policy connector_sync_runs_insert_own on public.connector_sync_runs
  for insert with check (auth.uid() = user_id);

-- A execução nasce 'pending' e é fechada ao terminar — daí o UPDATE.
drop policy if exists connector_sync_runs_update_own on public.connector_sync_runs;
create policy connector_sync_runs_update_own on public.connector_sync_runs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.wearable_readings is
  'Série BRUTA por conector (SSOT imutável, com proveniência). Escrita pelo dono a partir da migração 150: o '
  'Health Connect lê no aparelho, e o aparelho é conduto — o que se lê sobe na mesma sincronização (HIP-014 §6).';
