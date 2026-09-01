-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────
-- 153 — RECUPERA O TEXTO DOS LAUDOS QUE A PLATAFORMA LEU E NÃO GUARDOU.
--
-- O DEFEITO (homologação de 01/09/2026): dez dos dezenove exames da fundadora estavam com
-- `status = 'processed'` e `exam_text` VAZIO. A tela dizia "processado"; a busca não encontrava uma palavra
-- sequer dentro deles. Ela buscou "hemograma", não achou, e concluiu que não estava lá — estava, num exame
-- com 63 marcadores extraídos.
--
-- A causa está em `src/app/api/exams/[id]/analyze/route.ts`: o caminho de PDF grava `exam_text`; o caminho de
-- IMAGEM não grava nada. Corrigir a rota conserta o que ENTRAR daqui em diante — não conserta o que já entrou.
-- Esta migração conserta o que já entrou. As duas coisas são necessárias, e essa lição já custou um ciclo
-- inteiro de homologação nas atividades do Health Connect.
--
-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────
-- DE ONDE VEM O TEXTO, E POR QUE ELE É CONFIÁVEL.
--
-- Cada marcador extraído guarda `raw_text` — a LINHA LITERAL do laudo:
--     "Linfocitos             :38,5%     1.170Nmm3  1.000 A 3.500Nmm3"
-- mais `source_exam_name` ("Hemograma") e `source_material` ("Sangue"), ambos transcritos do documento.
-- Nada aqui é inventado nem inferido: são palavras do próprio laudo, que já estavam no banco, guardadas
-- numa tabela que a busca de texto não alcança.
--
-- O nome NORMALIZADO do marcador ("Linfócitos", com acento — rótulo NOSSO, de catálogo) NÃO entra. Ele já tem
-- consulta própria na busca. Incluí-lo aqui faria `exam_text` conter palavras que o documento pode não conter,
-- e um resultado que aponta um laudo por uma palavra que não está nele destrói a confiança na busca inteira.
-- A regra é a mesma da função `textoRecuperado` em @sintera/core, que é quem manda nas gravações novas.
--
-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────
-- LIMITES, DECLARADOS.
--
-- Cinco dos dez exames não têm nenhum fragmento extraído — são fotos que ninguém transcreveu. Esta migração
-- NÃO os toca, e não pode: não há texto de onde tirar. Eles continuam sem `exam_text`, e é a interface que
-- passa a DIZER isso, em vez de chamá-los de processados (ver `estadoDaLeitura` em @sintera/core).
-- Preencher esses cinco com qualquer coisa seria trocar um silêncio por uma mentira.
--
-- SEGURANÇA: só escreve onde `exam_text` está ausente ou vazio. Nenhum texto existente é sobrescrito.
-- Idempotente: rodar de novo não muda nada, porque as linhas já preenchidas deixam de casar o WHERE.
-- ─────────────────────────────────────────────────────────────────────────────────────────────────────────

WITH linhas AS (
  -- Normaliza o espaçamento para que "Plaquetas:   187.000" e "Plaquetas: 187.000" sejam a MESMA linha.
  SELECT
    b.exam_id,
    btrim(regexp_replace(b.raw_text, '\s+', ' ', 'g'))                            AS linha,
    concat_ws(' — ',
      nullif(btrim(coalesce(b.source_exam_name, '')), ''),
      nullif(btrim(coalesce(b.source_material,  '')), '')
    )                                                                              AS cabecalho,
    b.created_at,
    b.id
  FROM public.biomarkers b
  JOIN public.exams e ON e.id = b.exam_id
  WHERE coalesce(btrim(b.raw_text), '') <> ''
    AND coalesce(btrim(e.exam_text), '') = ''
),
-- A MESMA linha não entra duas vezes: laudo repete cabeçalho por página. Fica na primeira ocorrência.
unicas AS (
  SELECT DISTINCT ON (exam_id, linha) exam_id, linha, cabecalho, created_at, id
  FROM linhas
  ORDER BY exam_id, linha, created_at, id
),
blocos AS (
  SELECT
    exam_id,
    cabecalho,
    min(created_at) AS ordem,
    string_agg(linha, E'\n' ORDER BY created_at, id) AS corpo
  FROM unicas
  GROUP BY exam_id, cabecalho
),
texto AS (
  SELECT
    exam_id,
    string_agg(
      CASE WHEN coalesce(cabecalho, '') = '' THEN corpo ELSE cabecalho || E'\n' || corpo END,
      E'\n\n' ORDER BY ordem
    ) AS conteudo
  FROM blocos
  GROUP BY exam_id
)
UPDATE public.exams e
SET exam_text = t.conteudo
FROM texto t
WHERE e.id = t.exam_id
  AND coalesce(btrim(e.exam_text), '') = ''
  AND coalesce(btrim(t.conteudo), '') <> '';
