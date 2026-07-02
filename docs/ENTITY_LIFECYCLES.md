# SINTERA — Ciclo de Vida das Entidades (ENTITY_LIFECYCLES)

**Status:** Etapa 5 do fechamento do Domain Model (fundadora, 02/07/2026). Documenta **como cada entidade relevante nasce, evolui e termina** (nascimento → curadoria/versão → arquivamento/descontinuação). Conceitual — sem schema. Complementa `SCIENTIFIC_DOMAIN_MODEL` (estrutura), `DOMAIN_BEHAVIORS` (comportamento), `DOMAIN_EVENTS`, `DOMAIN_INVARIANTS`. Estados formais em `DOMAIN_STATE_MACHINE.md`. Ver `ADR-014`.

---

## Documento
**Nasce:** Recebido → OCR → Parser → Classificado → Validado → Relacionado (a um Exame/Evento) → Auditado → Arquivado.
**Morre/evolui:** pode ser **substituído** (nova versão; o original **nunca** é apagado da auditoria); pode ser **arquivado**; **não** é excluído sem trilha. Imutabilidade do conteúdo original é invariante.

## Medição
**Nasce:** Extraída → Normalizada → Relacionada ao Catálogo (`catalog_id`) → Persistida → Indexada → Projetada (séries/dashboards) → Comparável.
**Morre/evolui:** removida junto com o Exame que a originou; **nunca reescrita** por curadoria/catálogo (apenas reprojetada). Se sem `catalog_id`: fica **pendente de cobertura** (registrada), não silenciosa.

## Evento (de Saúde) / Exame
**Nasce:** Criado → Relacionado (paciente/tipo) → Incluído na Timeline → Visível → Auditado.
**Morre/evolui:** pode ser **editado**, **concluído** (planejado→realizado), **reaberto**, **excluído** (com reprojeção e auditoria), **substituído** (Exame: laudo trocado = nova versão). Sempre pertence a uma Timeline.

## Biomarcador (no Catálogo)
**Nasce:** Criado no Catálogo (DRAFT) → Curado → Versionado → Publicado → Disponível → Utilizado (por Medições).
**Morre/evolui:** pode ser **versionado** (nova versão do metadado), **reclassificado** (painel/material — reprojeta consumidores, não reescreve Medições), **descontinuado (DEPRECATED)** — nunca some retroativamente das séries que já o usaram (identidade `catalog_id` preservada).

## Diretriz / Protocolo / Evidência (Knowledge)
**Nasce:** Nova → Revisada → Publicada → Disponível para referência.
**Morre/evolui:** **Superada** por nova versão (versionamento; a anterior fica como histórico). Nunca é aplicada como decisão — só referenciada.

## Produto (Medicamento / Suplemento / Dispositivo)
**Nasce:** Cadastrado (pelo paciente, com especificação) → Relacionado ao Catálogo de Produtos → Projeta para Timeline/Histórico/Gastos → Em uso.
**Morre/evolui:** pode ser **suspenso**, **encerrado**, **substituído**, **excluído** (com reprojeção). Dispositivo pode ser **conectado/desconectado** (integrações).

---
## Perguntas de ciclo de vida (respostas oficiais)
| Entidade | Excluir? | Arquivar? | Substituir? | Versionar? | Descontinuar? |
|---|---|---|---|---|---|
| Documento | Não (só arquivar) | Sim | Sim (nova versão) | Sim | — |
| Medição | Só via Exame | — | Só via novo laudo | Por versão de extração | — |
| Exame/Evento | Sim (com auditoria) | Sim | Sim | Sim (laudo) | — |
| Biomarcador (catálogo) | Não | — | — | Sim | Sim (DEPRECATED) |
| Diretriz/Protocolo | Não | — | — | Sim | Sim (SUPERSEDED) |
| Produto | Sim | Sim | Sim | — | Sim (encerrado) |

---
**Fechamento:** os ciclos acima cobrem corretamente o nascimento/evolução/fim de cada entidade? Alguma entidade relevante faltando?
