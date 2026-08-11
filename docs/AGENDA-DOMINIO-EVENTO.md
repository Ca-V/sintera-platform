# Domínio Agenda — Evento como conceito permanente da plataforma

**Status:** fundação arquitetural consolidada. Este documento fixa a fronteira do domínio
Agenda e por que "Evento" é o conceito permanente. Orienta todas as integrações futuras.

## 1. O que a Agenda é (e o que não é)

A Agenda **não** é dona dos domínios de negócio. Ela é a **dona única do ciclo de vida dos
eventos** da plataforma. Conhece apenas conceitos de evento:

`criar · atualizar · cancelar · reagendar · concluir · reabrir · lembrete · recorrência ·
estado · data/hora · vínculo com a origem`.

Ela **nunca** implementa regra de negócio de outro domínio. Verificado: `src/lib/agenda/` não
importa nenhum domínio consumidor (medicamentos, ciclo, exames, insights…). Os nomes "medicamento/
wearable" que aparecem ali são apenas (a) comentários, (b) o **enum `source`** (origem do evento),
(c) labels de `event_type` para renderização — nunca lógica.

## 2. Por que "Evento" é o conceito permanente (não só pelos consumidores atuais)

Validação pelo **modelo conceitual**, não pela implementação:

- **Um Evento é "uma ocorrência na linha do tempo de saúde da pessoa, de qualquer origem".**
  Não é especialização de nada mais fundamental *dentro do domínio temporal* — o par fundamental
  é **Evento × Observação** (conceitos irmãos, §3), não Evento⊂X.
- **"Existe registro que precise ser sincronizado sem ser um Evento?"** Sim — mas ele não usa a
  Agenda: ou é uma **Observação** (medição → domínio de Observação), ou é o **registro próprio de
  um domínio** (o `medications`/`contraceptive_methods` em si → persistido pelo próprio domínio na
  fundação). `syncEvent` é especificamente para **eventos vinculados a uma origem**.
- **Novos domínios** (vacinas, protocolos, consultas, wearables que geram *ocorrências*) produzem
  Eventos → usam a mesma API. Domínios que produzem *medições* usam Observação. A fronteira se
  mantém. Logo, "Evento" continua correto quando surgirem novos domínios.

## 3. Fronteira Evento × Observação (permanente)

| | **Observação** | **Evento** |
|---|---|---|
| O que é | **dado clínico produzido por medição** (exames, wearables, laboratórios, dispositivos) | **ocorrência na linha do tempo**, de qualquer origem |
| Dono | domínio de Observação Clínica (modelo canônico) | domínio **Agenda** |
| Exemplo | HRV 48 ms; glicemia 92 mg/dL; sono 7 h | "Consulta cardiologia"; "Comprar losartana"; "Vacina" |

Relações permitidas, **sem** fundir os domínios:
- uma **Observação pode originar um Evento** (leitura alterada → agenda follow-up);
- um **Evento pode referenciar uma Observação** (consulta vinculada a um exame).

Essa separação permanece válida para **todas** as integrações futuras.

## 4. `syncEvent` é neutro

```ts
syncEvent(userId, { existingId, draft: EventDraft | null }) → Promise<string | null>
```
Recebe apenas um `EventDraft` (type/title/date/estado/valor/origem…) e **reconcilia** o Evento ao
estado desejado (cria/atualiza e devolve o id; `null` remove). **Nenhuma** regra de medicamentos/
exames/consultas/IA/wearables vive na Agenda. O consumidor guarda o id devolvido na sua própria
tabela (o vínculo origem↔evento). Toda regra de negócio permanece no domínio de origem.

**Exemplo — compra de medicamento:** a Agenda gerencia o Evento "Comprar medicamento" e o vínculo.
Ficam **no domínio Medicamentos**: cálculo da próxima recompra (`nextRepurchaseDate`), estoque,
frequência, posologia, adesão, regras farmacológicas. O mesmo para qualquer origem.

## 5. Teste de evolução (evidência de estabilidade)

Todos usam **a mesma API** (`create` / `syncEvent` / `remove` / `reschedule` / `syncReminder` …),
sem alterar o domínio Agenda — só muda o *conteúdo* do `EventDraft`:

| Cenário | Como usa a Agenda |
|---|---|
| Wearable gera alerta que vira item da Agenda | `syncEvent(draft: { type, title, date, source:'wearable', … })` |
| IA cria acompanhamento automático | `create`/`syncEvent` (source `ai`) |
| Protocolo cria sequência de eventos | `create` por ocorrência (recorrência no domínio) |
| Laboratório agenda recoleta | `syncEvent` (source `lab`/`connector`) |
| Profissional agenda retorno | `create` (source `manual`) |

O modelo `HealthEvent` **já** carrega `source` (tipo de origem) e `links[]` (referências), então o
`Evento → origem { tipo, id }` do modelo conceitual já existe. A API é estável.

## 6. Critério permanente para novas capacidades da Agenda

Toda capacidade nova responde: **é conceito do ciclo de vida do evento** (→ Agenda) **ou regra de
negócio de outro domínio** (→ permanece na origem)? Só o primeiro entra na Agenda, e é consolidado
ali para reúso por toda a plataforma.
