# Ciclo de vida do Recurso de Lista (cliente) — `useListResource`

**Status:** fundação consolidada. Proprietário: camada de UI (`src/lib/ui/`).

## Proprietário e conceito
A auditoria perguntou **"quem é o dono deste conceito?"** e encontrou um **vácuo de
propriedade**: o esqueleto de rota autenticada tem dono no servidor
(`src/lib/api/http.ts` → `authed`, cujo comentário diz "elimina o esqueleto que TODA rota
repetia"), mas a **metade cliente** desse mesmo esqueleto — buscar → listar →
criar/editar → remover, com estados `loading/saving/busyId/error` e a extração de erro
`e.error ?? 'Falha ao salvar.'` — ficou **órfã e reimplementada em ~6 páginas CRUD**.

Conceito permanente: um **Recurso de Lista** é uma coleção user-scoped em `/api/<módulo>`
(GET lista · POST cria · POST|PATCH edita · DELETE `?id=` remove). É o **espelho-cliente**
da rota `authed`. Dono único:

```ts
// src/lib/ui/useListResource.ts
useListResource<T>({ endpoint, listKey, editMethod? }): {
  items, loading, saving, busyId, error, setError, reload, save, remove
}
```

## Fronteira (o que o hook NÃO possui)
O hook possui o **recurso** (itens + ciclo assíncrono + persistência). **Não** possui o
**formulário** (showForm, editingId, valores dos campos) nem a **confirmação de exclusão**
(mensagem do domínio) — isso permanece na página. `listKey` (chave do envelope GET) e
`editMethod` (PATCH vs POST-com-id) são **configuração do recurso**, não regra de negócio:
parametrizam as rotas existentes sem reabri-las.

## Propagação
Migrados (ciclo CRUD → hook, preservando formulário/validação/confirmação): **condicoes,
habitos, sinais-vitais, medidas, recursos, medicamentos**. Cada página perdeu ~25–30
linhas de boilerplate idêntico.

## Critério de encerramento (por CONCEITO, não por contagem)
**Não resta nenhuma implementação paralela do ciclo de vida de recurso de lista dentro do
escopo.** Reauditoria: toda página de recurso único serve seu list/save/remove pelo hook.

## Fronteiras deliberadas (classificadas)
- **`ciclo` — LIMITAÇÃO TRANSITÓRIA (documentada):** é uma página **agregada**, não um
  recurso único: o GET é combinado (`/api/ciclo` → `{ methods, periods }`) enquanto as
  escritas se dividem (`/api/ciclo/methods`, `/api/ciclo/periods`). Não cabe no dono de
  recurso-único, e adicionar split read/write só para ela violaria a regra "não criar
  abstração sem duplicação comprovada". Migrá-la exigiria dar GET próprio a cada
  sub-rota — outra causa (do servidor), não esta.
- **`medidas` — leitura irmã + ingestão por scan (distintas, não paralelas):** o endpoint
  `/api/medidas` devolve também `exams` (laudos de bioimpedância), lidos por um `loadExams`
  próprio; e o **scan** de bioimpedância é uma ingestão especializada (imagem → medidas em
  lote). Nenhum é o ciclo CRUD padrão do recurso `measures` — este passa pelo hook.

## Preparação para as próximas fases
`reload` é o ponto único de invalidação: ingestões externas (Apple Health, Health Connect,
Garmin, WHOOP, laboratórios, FHIR) disparam refresh de lista em UM lugar, e o cliente
Mobile reutiliza o mesmo dono — sem reescrever o ciclo em cada página.
