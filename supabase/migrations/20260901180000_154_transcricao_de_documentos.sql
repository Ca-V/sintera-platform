-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────
-- 154 — TODO DOCUMENTO QUE ENTRA É LIDO E TRANSCRITO, E O RASTRO DISSO FICA GRAVADO.
--
-- DECISÃO DA FUNDADORA (01/09/2026), textual: "A plataforma web e mobile precisam conseguir ler e transcrever
-- todos os documentos que entram, que são adicionados ou fotografados. Independente da forma que ele entra,
-- todos os documentos que são adicionados precisam ser lidos e transcritos. [...] de dezenove precisa ler
-- dezenove. [...] faça de forma segura, auditável, rastreável, e registrada em modelo de dados."
--
-- O QUE ESTAVA ERRADO. `exam_text` era gravado por UM caminho só (PDF com camada de texto). Foto de laudo, PDF
-- escaneado e qualquer documento sem camada de texto entravam, eram marcados 'processed', e ficavam sem uma
-- palavra pesquisável — indistinguíveis de um laudo lido por inteiro. E receitas e atestados
-- (`patient_documents`) nunca tiveram transcrição de espécie alguma.
--
-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────
-- POR QUE ESTA MIGRAÇÃO NÃO É SÓ "UMA COLUNA DE TEXTO".
--
-- Um texto transcrito por modelo de visão NÃO É a mesma coisa que um texto extraído da camada do PDF. O
-- segundo é cópia exata dos bytes do arquivo; o primeiro é leitura, e leitura pode errar. Guardar os dois na
-- mesma coluna, sem distinção, faria a plataforma tratar como fato literal algo que é interpretação de pixels
-- — e ninguém, depois, conseguiria saber qual era qual.
--
-- Por isso cada texto passa a carregar DE ONDE VEIO, QUANDO, POR QUAL VERSÃO DE PROMPT e COM QUAL RESULTADO,
-- com ponteiro para a linha de auditoria da chamada de IA. É isso que torna a leitura auditável e rastreável:
-- de qualquer registro se chega ao evento que o produziu.
--
-- E o estado da transcrição separa quatro coisas que já foram confundidas nesta plataforma, cada confusão
-- custando um ciclo de homologação:
--     'ok'        — leu o documento inteiro
--     'parcial'   — leu, e há trechos que o próprio modelo marcou como ilegíveis
--     'ilegivel'  — leu e NADA estava legível (documento borrado, foto escura)
--     'falhou'    — NÃO CONSEGUIU LER (rede, cota, erro do provedor)
-- "Não consegui ler" nunca mais pode parecer "li e não havia nada".
--
-- ADITIVA E REVERSÍVEL EM ESPÍRITO: só acrescenta colunas anuláveis e um valor padrão. Nenhuma coluna é
-- removida, nenhum dado existente é apagado ou reescrito, salvo o preenchimento da PROVENIÊNCIA do que já
-- existe (abaixo), que apenas nomeia a origem de textos que já estavam lá.
-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────

-- ── 1. A auditoria da chamada de IA passa a saber QUAL OPERAÇÃO a produziu ───────────────────────────────
-- Havia só extração. Com a transcrição, duas operações diferentes gravam aqui, e sem esta coluna as linhas
-- ficariam indistinguíveis — o custo por operação, a taxa de falha e a versão de prompt usada virariam uma
-- mistura impossível de auditar.
alter table public.ai_processing_log
  add column if not exists operation text not null default 'extraction',
  add column if not exists prompt_version text,
  -- Documento de paciente (receita/atestado). `exam_id` continua para exames; um dos dois é preenchido.
  add column if not exists document_id uuid references public.patient_documents(id) on delete cascade;

comment on column public.ai_processing_log.operation is
  'Operação que gerou esta linha: extraction (biomarcadores) | transcription (texto do documento).';
comment on column public.ai_processing_log.prompt_version is
  'Versão do prompt em prompt_registry usada nesta chamada — reprodutibilidade.';
comment on column public.ai_processing_log.document_id is
  'patient_documents.id quando a operação foi sobre receita/atestado. Exclusivo com exam_id.';

create index if not exists ai_processing_log_document_id_idx on public.ai_processing_log (document_id);
create index if not exists ai_processing_log_operation_idx on public.ai_processing_log (operation);

-- ── 2. EXAMES — a proveniência do texto ──────────────────────────────────────────────────────────────────
alter table public.exams
  add column if not exists exam_text_origin text,
  add column if not exists text_transcription_status text,
  add column if not exists text_transcription_prompt_version text,
  add column if not exists text_transcribed_at timestamptz,
  add column if not exists text_transcription_log_id uuid references public.ai_processing_log(id) on delete set null;

comment on column public.exams.exam_text_origin is
  'De onde veio exam_text: pdf_nativo (camada de texto do arquivo) | transcricao_visao (lido por modelo de visão) | recuperado_de_marcadores (recomposto das linhas literais já extraídas — migração 153) | digitado.';
comment on column public.exams.text_transcription_status is
  'ok | parcial | ilegivel | falhou. "falhou" é NÃO CONSEGUIU LER, e nunca pode ser lido como "não havia nada".';

do $$ begin
  alter table public.exams add constraint exams_exam_text_origin_check
    check (exam_text_origin is null or exam_text_origin in
      ('pdf_nativo','transcricao_visao','recuperado_de_marcadores','digitado'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.exams add constraint exams_text_transcription_status_check
    check (text_transcription_status is null or text_transcription_status in
      ('ok','parcial','ilegivel','falhou'));
exception when duplicate_object then null; end $$;

-- ── 3. RECEITAS, ATESTADOS E DEMAIS DOCUMENTOS — que nunca tiveram transcrição ───────────────────────────
-- A leitura assistida já lia estes documentos para preencher profissional, instituição, data e itens
-- prescritos — e DESCARTAVA o texto. A busca nunca alcançou o conteúdo de uma receita.
alter table public.patient_documents
  add column if not exists transcricao text,
  add column if not exists transcricao_origin text,
  add column if not exists transcricao_status text,
  add column if not exists transcricao_prompt_version text,
  add column if not exists transcrito_em timestamptz,
  add column if not exists transcricao_log_id uuid references public.ai_processing_log(id) on delete set null;

comment on column public.patient_documents.transcricao is
  'Texto do documento, transcrito. FATO transcrito, nunca interpretação (ADR-000 / RDC 657/2022).';
comment on column public.patient_documents.transcricao_status is
  'ok | parcial | ilegivel | falhou. Mesma semântica de exams.text_transcription_status.';

do $$ begin
  alter table public.patient_documents add constraint patient_documents_transcricao_origin_check
    check (transcricao_origin is null or transcricao_origin in
      ('pdf_nativo','transcricao_visao','digitado'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.patient_documents add constraint patient_documents_transcricao_status_check
    check (transcricao_status is null or transcricao_status in
      ('ok','parcial','ilegivel','falhou'));
exception when duplicate_object then null; end $$;

-- ── 4. A BUSCA precisa alcançar o que foi transcrito ─────────────────────────────────────────────────────
-- Sem índice, `ilike '%palavra%'` varre a tabela inteira. Hoje são dezenas de documentos por pessoa e isso não
-- pesa; com transcrição de TODOS os documentos, o volume de texto multiplica. `pg_trgm` serve exatamente à
-- busca por trecho no meio da palavra, que é como a pessoa procura.
create extension if not exists pg_trgm;
create index if not exists exams_exam_text_trgm_idx
  on public.exams using gin (exam_text gin_trgm_ops);
create index if not exists patient_documents_transcricao_trgm_idx
  on public.patient_documents using gin (transcricao gin_trgm_ops);

-- ── 5. A PROVENIÊNCIA DO QUE JÁ EXISTE ──────────────────────────────────────────────────────────────────
-- Sem isto, todo texto anterior ficaria com origem desconhecida — e "desconhecido" numa coluna de auditoria é
-- o mesmo silêncio que esta migração existe para acabar. Nenhum TEXTO é alterado aqui; nomeia-se a origem.
--
-- Quem tem camada de texto boa veio do PDF. Quem NÃO tem (imagem/insuficiente/nula) e mesmo assim tem texto só
-- pode tê-lo recebido da migração 153, que o recompôs das linhas literais dos marcadores.
update public.exams
   set exam_text_origin = case
         when pdf_quality = 'good_text' then 'pdf_nativo'
         else 'recuperado_de_marcadores'
       end
 where exam_text_origin is null
   and coalesce(btrim(exam_text), '') <> '';
