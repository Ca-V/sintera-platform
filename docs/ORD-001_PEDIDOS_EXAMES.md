# ORD-001 — Pedidos ↔ Exames (integração e rastreabilidade da jornada)

**Status:** ✅ Implementado e aprovado (fundadora 18/07/2026) · Sob [[ADR-000]] · Aplica [[ADR-001]] (SSOT/projeção),
[[DATE-001]] (datas) e o princípio de propriedade de domínio do [[CTC-001]]. **Código:** `src/lib/exams/orderStatus.ts`,
`src/app/dashboard/exams/*`. **Escopo:** o par pedido↔resultado no domínio Exames.

## 1. O pedido é uma ENTIDADE ASSISTENCIAL (não só um documento)
O pedido representa uma **decisão clínica tomada em um momento** da jornada do paciente — não é um mero anexo. Por
isso **permanece como entidade histórica mesmo depois de todos os exames concluídos**. O resultado **não substitui**
o pedido: são **etapas diferentes da mesma jornada**, conectadas por origem e rastreabilidade.

## 2. Modelo (implementado)
- `exams.fulfills_order_id` — resultado → **pedido de origem**. Relação **1 pedido → N resultados** (um pedido pode
  originar vários exames laboratoriais/imagem/procedimentos).
- `exams.order_status` — estado do pedido. `finalizado` é **derivado** de ter ≥1 resultado vinculado (prevalece
  sobre o valor marcado à mão). Lógica pura em `src/lib/exams/orderStatus.ts`.
- Ambos coexistem; nada é duplicado (ADR-001: um fato = um registro). "Marcar realizado" é **só estado** — não cria
  evento, não exige o laudo (realização e resultado são momentos independentes).

## 3. Estados = FLUXO ASSISTENCIAL (não status administrativo)
Os estados são etapas do cuidado, não rótulos de gestão. Fluxo natural:

> **Pendente → Realizado → Finalizado**

**Evolução prevista (sem alterar a arquitetura):** novos estados como **Cancelado · Expirado · Substituído** entram
apenas estendendo o conjunto em `orderStatus.ts` — o modelo (`order_status` aberto + derivação por vínculo) já
comporta. Documentar aqui evita retrabalho quando surgirem.

## 4. Timeline contextual (evolução prevista)
A linha do tempo deve mostrar a **evolução completa** do processo, com eventos no seu contexto real:

> Pedido de exames emitido → Exame realizado → Resultado recebido → Resultado vinculado ao pedido

Preserva a natureza de cada passo (mesmo princípio da Timeline do [[CTC-001]]: nunca um genérico). Modelagem já
compatível; acrescentar os tipos de evento é aditivo.

## 5. Navegação bidirecional (evolução prevista)
Hoje: do **resultado** navega-se ao **pedido de origem**. Evolução: também o sentido inverso —

> Pedido → Resultados vinculados → Abrir resultado

Reforça a rastreabilidade nos dois sentidos. O modelo (`fulfills_order_id`, 1→N) já sustenta; falta só a UI no card
do pedido.

## 6. PRINCÍPIO — relacionamentos são a TRAJETÓRIA do cuidado
> **Os relacionamentos entre entidades representam a trajetória do cuidado, não apenas vínculos técnicos entre
> registros.** Ligar um pedido a um exame não é só relacionar duas linhas — é **preservar a sequência real dos
> acontecimentos** na jornada de saúde da pessoa.

Este conceito é central ao posicionamento da SINTERA como **plataforma longitudinal**: cada vínculo conta parte da
história. Aplica-se além de pedido↔exame — a todo relacionamento entre entidades da plataforma.

## Governança
Precedência ADR-000 > ADR-001 > ORD-001. **Invariantes:** pedido preservado como entidade histórica; sem
duplicação; 1→N; `finalizado` derivado do vínculo; estados evoluem por extensão, não por reestruturação.
