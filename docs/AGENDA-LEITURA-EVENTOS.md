# Domínio Agenda — leitura de eventos como capacidade proprietária

**Status:** fundação consolidada. Espelho de LEITURA da consolidação de escrita
(Agenda = escritora única de `health_events`/`agenda_events`).

## Causa estrutural eliminada
As projeções de apresentação (Dashboard, Timeline, Relatório) hand-escreviam um
`select` **byte-idêntico** de `health_events`
(`id,event_type,title,event_date,event_time,status,amount_cents,professional_name,establishment,links`)
em três containers cliente — `DashboardNew.tsx`, `TimelineNew.tsx`, `ReportNew.tsx` —
para alimentar os adapters puros. O domínio Agenda **já** era dono da leitura de eventos
(`EventQueryService`/repositório), mas expunha `HealthEvent[]` enquanto os adapters
consumiam `HealthEventRow[]` (linha crua). Esse descasamento de forma fazia cada
superfície reabrir o SQL — e o Mobile viraria a 6ª cópia.

## Conceito permanente
**A leitura de eventos pertence ao domínio Agenda; a apresentação consome `HealthEvent`,
nunca a linha crua.** A linha (`HealthEventRow`) é INTERNA ao domínio.

- **Owner:** `EventQueryService.listAll(userId): Promise<HealthEvent[]>` (repositório
  `listAllEvents`) — coexistência legado+canônico, dedup (canônico vence), ordem canônica.
- **Adapters** (`src/lib/ui/adapters/{dashboard,timeline,report}.ts`) passam a receber
  `HealthEvent[]`; `rowToHealthEvent`/`HealthEventRow` saem da camada de apresentação
  (restam só nas *fixtures* de teste, que constroem domínio a partir de linhas).
- **Containers** chamam `eventServicesFor(supabase).query.listAll(user.id)` — o mesmo
  padrão já usado pelo Dashboard legado (`services.query.nextUpcoming`). O Mobile reusa
  a mesma query; impossível re-hand-escrever o select.

Correção lateral: os containers v2 liam só `health_events` (perdiam eventos legados de
`agenda_events` que a Agenda/Histórico já mostram). Via `listAll`, passam a incluir os
legados — consistência com o resto do domínio.

## Fronteiras deliberadas (não são dívida; são decisões)
- **Páginas legadas** (`dashboard/page.tsx`, `timeline/page.tsx`) ainda leem
  `health_events` direto: (a) usam `confidence`, campo que NÃO existe no `HealthEvent`
  canônico; (b) fazem agregações próprias (contagem "último evento") e carga de UM evento
  por id para edição. Estão atrás do cutover v2 (Entry) e serão aposentadas — migrá-las
  exige adicionar `confidence` ao domínio ou novas capacidades (`getById`), o que é outra
  causa, não esta.
- **Read-model do Relatório** (`src/lib/communication/reportDataset.ts`) projeta eventos
  **canônicos apenas** (`synthetic=false`, sem `agenda_events`), via o mapeador de domínio
  `rowToHealthEvent`. É uma projeção factual (RDC 657) distinta da projeção de timeline:
  incluir lembretes legados no relatório profissional e/ou trocar a ordem de exibição é
  **decisão de produto** — por isso não foi unificada silenciosamente com `listAll`.

## Critérios de encerramento
1. Único dono: `EventQueryService.listAll` (repositório `listAllEvents`).
2. Única implementação: a leitura de jornada vive só no repositório (`listAll` interno).
3. Consumidores de apresentação usam-na: Dashboard/Timeline/Relatório (v2).
4. Sem adaptações locais: `HealthEventRow`/`rowToHealthEvent` fora dos adapters de produção.
5. Reauditoria: **0** selects de evento byte-idênticos nos containers.
6. Consistente para próximas fases: wearables/labs entram no repositório; UI não muda.
7. Reduz dívida: 3 selects idênticos + 2 mapeamentos → uma capacidade de domínio.
