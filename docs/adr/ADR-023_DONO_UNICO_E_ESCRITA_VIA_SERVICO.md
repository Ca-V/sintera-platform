# ADR-023 — Dono único por conceito e escrita de domínio via serviço + rota

**Status:** aceito como direção · aplicação **incremental pendente**
**Data:** 2026-08-24
**Origem:** PR #109 ("Estabilização arquitetural v1.0 — 9 fundações com dono único"), encerrada sem merge

---

## Contexto

A PR #109 propôs uma consolidação arquitetural real: um **dono único por conceito** e a
eliminação de **escrita CRUD client-direct** nas páginas do dashboard, roteando toda escrita de
domínio por **serviço + rota autenticada** (Web = cookie · Mobile = Bearer).

Ela foi trabalhada até 19/08, com validação declarada de `tsc` 0 · 78 testes · `next build` 74/74.

**Por que foi encerrada sem merge.** Sua base era de **04/08**. Quando a triagem de PRs a
alcançou, em 24/08, `main` tinha avançado **896 commits** — incluindo, no mesmo dia, as correções
do Ciclo 1 de homologação (H‑09 preservação da incerteza, H‑10 lateralidade, PEDIDO‑001/002,
gênero documental). Essas correções tocaram **exatamente** os arquivos que a #109 reescrevia:
`analyze/route.ts`, apresentação de exames, pipeline clínico.

Reconciliar 185 arquivos nessas condições significa resolver conflitos onde uma escolha errada
**reintroduz bugs achados por pessoa testando no aparelho** — defeitos que a suíte automatizada
não cobre, porque não são de lógica pura. O risco não era técnico; era de regressão invisível.

**O código apodreceu; as ideias não.** Este ADR preserva as ideias.

> Precedente concreto, no mesmo dia: ao consolidar a trilha FHIR (#161), a versão antiga de
> `packages/core/src/index.ts` **apagava** o export de `orderTitle` — a correção do PEDIDO‑002
> entregue horas antes. Foi detectado por revisão do diff, não por teste. É exatamente a classe
> de falha que a reconciliação da #109 multiplicaria por 185 arquivos.

## Decisão

Adotar os princípios da #109 como direção arquitetural, e **aplicá-los incrementalmente sobre a
`main` atual**, domínio por domínio, com homologação a cada bloco — nunca de uma vez.

### Princípio 1 — Dono único por conceito

Cada conceito transversal tem **um** proprietário no código. Quem precisa dele consome; ninguém
reimplementa. É o mesmo princípio do SSOT ([[ADR-001]]) aplicado a código, não a dado.

### Princípio 2 — Escrita de domínio nunca parte do cliente

Toda escrita passa por **serviço + rota autenticada**. A página chama o serviço; o serviço chama
a rota; a rota valida, autoriza e escreve.

O motivo não é estilo. Com escrita client-direct, a única barreira é a RLS do Postgres: não há
camada de validação de servidor, não há ponto único para auditoria, e a regra de negócio fica
espalhada por componentes de UI. Numa plataforma de saúde sob LGPD, isso é insuficiente.

**Exceção legítima:** *leituras* de projeção por superfície (dashboard, timeline, agenda) podem
permanecer client-direct — são projeções distintas, não escrita.

## Estado medido em `main` (2026-08-24, commit `77aa02bd`)

O trabalho da #109 **não entrou em nenhuma parte**. Medição direta:

| | |
|---|---|
| Fundações da #109 presentes em `main` | **0 de 11** |
| Páginas de dashboard com escrita client-direct | **16** |
| Ocorrências de `.from(…).insert\|update\|delete\|upsert` | **64** |

### Fundações a criar

| Dono | Fundação |
|---|---|
| API | `lib/api/http.ts` (`authed`) · `lib/api/errors.ts` · `lib/api/db.ts` · `lib/api/storage.ts` (`uploadUserDocument`) |
| Agenda | escritor único de eventos + `EventQueryService.listAll`; adapters consomem `HealthEvent[]` |
| Comunicação | `lib/communication/reportDataset.ts` (read-model) · `lib/communication/reportSharing.ts` |
| Design System | `components/ui/field.ts` (`fieldClass`) |
| UI | `lib/ui/useListResource.ts` (ciclo de recurso de lista) |
| Exames | `lib/exams/presentation.ts` + `ExamStatusChip` · `lib/exams/model.ts` · `lib/exams/service.ts` |

### Páginas a migrar

```
agenda · ciclo · condicoes · configuracoes · exams · exams/[id] · gastos · habitos
medicamentos · medidas · omics · omics/[id] · recursos · relatorio · sinais-vitais · timeline
```

Boa parte das rotas de destino **já existe** em `src/app/api/` — `account`, `agenda`, `events`,
`exams`, `medications`, `omics`, `profile`, entre outras. A migração é sobretudo redirecionar a
escrita para elas, não criá-las do zero.

## Como aplicar

1. **Fundação primeiro, por dono.** `lib/api/*` antes de tudo — todo o resto depende dela.
2. **Um domínio por vez**, em PR própria: fundação → rota → página → teste.
3. **Homologação a cada bloco.** Se o domínio tem tela, ela é testada antes do próximo.
4. **Ordem sugerida** — do menor acoplamento ao maior: `sinais-vitais` · `medidas` · `condicoes`
   · `habitos` · `recursos` · `ciclo` · `medicamentos` · `gastos` · `agenda` · `relatorio` ·
   `exams` · `omics` · `timeline`.
5. **Nunca** abrir uma PR que toque mais de um domínio.

## Verificação

O invariante é executável. Zero ocorrências em páginas de dashboard significa objetivo atingido:

```bash
grep -rE "\.from\([^)]*\)\s*\.\s*(insert|update|delete|upsert)" src/app/dashboard/
```

Hoje: **64 ocorrências em 16 arquivos**. Cada PR de domínio deve reduzir esse número e nunca
aumentá-lo. Quando chegar a zero, o Princípio 2 está cumprido e o `grep` pode virar gate de CI.

## Consequências

**Positivas.** Ponto único de validação e auditoria por escrita; regra de negócio fora da UI;
paridade Web↔Mobile por construção (ambos consomem a mesma rota); superfície de escrita
enumerável — que é pré-requisito para qualquer auditoria de segurança séria.

**Negativas.** Mais indireção para escritas triviais; cada domínio migrado é uma PR e um ciclo
de homologação; o trabalho é longo e não entrega funcionalidade visível.

**Se não for feito.** As 64 escritas continuam dependendo exclusivamente da RLS, e a regra de
negócio segue espalhada por 16 páginas — o que torna cada auditoria futura mais cara e cada
paridade Mobile um retrabalho.

## Fora de escopo (registrado na #109)

`prevencao` (CRM) · cutover v2 · DOC‑001/`health_documents` com bucket dedicado e exclusão LGPD
recursiva · jornadas/programas · Catalog v2 · Knowledge Graph · paridade Mobile (Bearer) das
rotas `omics/*`, hoje cookie-only pela convenção `omicsAuth`.

## Referências

- PR #109 — texto integral da proposta e tabela de fundações
- `docs/ADL_ARCHITECTURE_DECISION_LOG.md` — log de decisões arquiteturais
- `docs/DEV-001_PROTOCOLO_NAO_REGRESSAO.md` — protocolo de não-regressão e regression gate
- ADR-001 — projeção sem duplicação e SSOT (o análogo deste ADR no plano do dado)
