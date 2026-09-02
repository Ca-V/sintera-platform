-- 151 — O que a leitura do documento JÁ EXTRAI e não tinha onde guardar.
--
-- POR QUE ESTA MIGRAÇÃO EXISTE (homologação da fundadora, 28 a 30/08). Ela fotografou uma receita, a leitura
-- funcionou, e o cartão apareceu com o médico e a data — sem o nome do medicamento. A observação dela:
-- "não aparece o nome do medicamento, que é o item mais importante". Não era falha de leitura: a transcrição
-- acontecia e era descartada, porque a ficha do documento não tinha campo para recebê-la.
--
-- Três achados dependiam disto:
--   8  — o nome do medicamento na receita
--   9  — avisar que um documento já tinha sido adicionado (`document_sha256` existe e nunca foi preenchida)
--   10 — o médico separado da instituição; num atestado apareceu a clínica no lugar do médico
--
-- E também o fluxo receita → medicamento/suplemento/dispositivo, autorizado por ela em 30/08.
--
-- ADITIVA, E SÓ ADITIVA (autorização explícita da fundadora, 30/08: "não desestruture ou altere outras coisas
-- da plataforma"). Acrescenta três colunas nulas. Nenhuma coluna é alterada, renomeada ou removida; nenhuma
-- linha é tocada. Os documentos existentes seguem exatamente como estavam.
--
-- FRONTEIRA (ADR-000 · RDC 657): o que entra nestes campos é TRANSCRIÇÃO — o nome e a concentração como estão
-- escritos no papel, quem assinou, qual instituição. Não é posologia, não é indicação, não é interpretação.

alter table public.patient_documents
  -- O que a receita prescreve, como está escrito. Lista, porque uma receita tem mais de um item — e um texto
  -- corrido obrigaria cada tela a reinventar o mesmo desmembramento, divergindo na primeira vírgula.
  add column if not exists prescribed_items text[],
  -- O PROFISSIONAL e a INSTITUIÇÃO são fatos diferentes, e a diferença importa por tipo de documento: numa
  -- receita o que interessa é quem assinou; num laudo, quem realizou. Um campo só (`issuer`) obrigava a
  -- escolher um dos dois e perder o outro — foi o que fez a clínica aparecer no lugar do médico.
  add column if not exists professional_name text,
  add column if not exists institution_name text;

comment on column public.patient_documents.prescribed_items is
  'Itens prescritos, TRANSCRITOS do documento ("Losartana 50mg"). Nunca posologia nem indicação (RDC 657).';
comment on column public.patient_documents.professional_name is
  'Profissional que assinou o documento, transcrito. Distinto de institution_name.';
comment on column public.patient_documents.institution_name is
  'Instituição emissora (clínica, laboratório, hospital), transcrita. Distinta de professional_name.';

-- `issuer` PERMANECE, com o conteúdo que já tem. Não é migrada nem esvaziada: dividi-la automaticamente entre
-- profissional e instituição exigiria adivinhar qual dos dois está escrito ali, e adivinhar sobre um registro
-- de saúde já existente é exatamente o que a plataforma não faz. Os documentos antigos continuam legíveis pelo
-- campo antigo; os novos passam a preencher os três.
