-- Correção: unit_pattern deve casar como SUBSTRING LITERAL, não LIKE.
-- O caractere '%' (unidade percentual) era interpretado como coringa.
-- Re-resolve TODOS os biomarkers com strpos() e precedência por especificidade.

UPDATE biomarkers b
SET catalog_id = sub.catalog_id
FROM (
  SELECT DISTINCT ON (b2.id) b2.id AS bid, al.catalog_id
  FROM biomarkers b2
  JOIN biomarker_aliases al
    ON al.alias_normalized = lower(trim(translate(b2.name,
       'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
       'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')))
  WHERE al.unit_pattern IS NULL
     OR (b2.unit IS NOT NULL
         AND strpos(lower(b2.unit), lower(al.unit_pattern)) > 0)  -- substring LITERAL
  ORDER BY
    b2.id,
    (al.unit_pattern IS NOT NULL) DESC,           -- alias com unidade vence o genérico
    length(coalesce(al.unit_pattern,'')) DESC     -- pattern mais específico vence
) sub
WHERE b.id = sub.bid;
