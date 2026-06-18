# Rascunho de mapeamento LOINC — para revisão clínica

**Arquivo:** `loinc-mapping-draft.csv`
**Status:** `draft` — **NÃO aplicado ao banco**. Aguardando revisão e aprovação.
**Data:** 2026-06-15

---

## O que é este arquivo

Um **rascunho** que liga cada um dos 83 biomarcadores do `biomarker_catalog`
(coluna `code`) a um **código LOINC candidato** — o identificador universal do
tipo de exame (interoperabilidade). Ver `GOVERNANCA-CIENTIFICA.md §1.2`.

LOINC é **identificação**, não interpretação clínica: dizer que "Glicose (jejum)"
corresponde ao código LOINC `1558-6` não atribui faixa, nem `clinical_flag`, nem
juízo. Por isso este mapeamento pode ser **rascunhado** sem decisão clínica — mas
**precisa de validação humana** antes de entrar em produção, porque o LOINC tem
múltiplas variantes por analito (soro vs plasma, massa vs molar, método), e
escolher a errada compromete a interoperabilidade.

## O que este arquivo NÃO é

- ❌ Não foi escrito no banco. As colunas `loinc_code`/`snomed_ct_code` do
  catálogo continuam **vazias**.
- ❌ Não contém conteúdo clínico (limiares, flags, textos). Isso segue bloqueado
  até o Responsável Clínico.
- ❌ Não é verdade verificada. Os códigos foram atribuídos a partir de
  conhecimento geral e **todos** estão marcados `needs_verification = sim`.

## Colunas

| Coluna | Significado |
|---|---|
| `code` | Código interno do `biomarker_catalog`. |
| `display_name`, `specimen`, `canonical_unit` | Dados atuais do catálogo (contexto). |
| `loinc_code_candidate` | Código LOINC sugerido (a conferir). Vazio = não sugerido. |
| `loinc_confidence` | `alta` / `media` / `baixa` — minha confiança na sugestão. |
| `snomed_ct_candidate` | SNOMED CT (em geral vazio — passo seguinte de curadoria). |
| `needs_verification` | Sempre `sim` neste rascunho. |
| `notes` | Nome longo LOINC / ressalvas / variantes a conferir. |

## Como validar (curadoria)

1. Para cada linha, conferir o código em **https://loinc.org** (busca por
   componente + sistema/espécime + unidade), priorizando a variante de
   soro/plasma na unidade que os laudos brasileiros usam.
2. Corrigir/confirmar `loinc_code_candidate`; ajustar `loinc_confidence`.
3. Itens `baixa` exigem atenção: coagulação em %, contagens absolutas de
   bastonetes/segmentados, sedimento urinário (epitélios, muco, cilindros
   patológicos) — categorias amplas ou com variantes.
4. (Passo 2) Preencher `snomed_ct_candidate` via browser SNOMED CT, quando o
   projeto for integrar FHIR/prontuários.
5. Registrar a revisão (responsável + data) em `GOVERNANCA-CLINICA-SINTERA.md §6`.

## Como aplicar (somente após validação)

Depois de revisado e aprovado, o preenchimento do banco é um `UPDATE` simples
por `code` (LOINC não depende de assinatura clínica como as regras, mas a
**revisão** do mapa é o gate). Sugestão de processo:

- Gerar a partir do CSV validado os `UPDATE biomarker_catalog SET loinc_code = …
  WHERE code = …`.
- Aplicar via migração versionada (próximo número disponível).
- A tela `/admin/catalogo` passa a refletir a cobertura e a habilitar a camada
  educativa MedlinePlus para os itens mapeados.

> Enquanto este arquivo não for revisado e aplicado, a cobertura LOINC no painel
> permanece 0/83 — estado honesto e intencional.
