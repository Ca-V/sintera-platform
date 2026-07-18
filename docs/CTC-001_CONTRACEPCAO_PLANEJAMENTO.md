# CTC-001 — Contracepção & Arquitetura de Planejamento (ESPECIFICAÇÃO para validação)

**Status:** ✅ **aprovada (fundadora 18/07) — em implementação incremental** · **Versão:** 1.0 (18/07/2026, +7 refinamentos).
**Objetivo:** definir a **arquitetura funcional da contracepção** e sua relação com **Medicamentos**,
**Recursos/Dispositivos**, **Ciclo**, **Agenda/Notificações** e o futuro domínio de **Planejamento** — **sem
duplicação de dados** e **rastreável**. Escopo atual = **contracepção**; a arquitetura já **nasce compatível** com
a evolução para **Planejamento em Saúde**. Fontes: [[FIN-001]]/[[BOD-001]] (fato único + projeção), [[req_saude_da_mulher]],
[[NOTIF-001]], RDC 657 (organiza, não prescreve). Segue [[ARCH-000]] §4.

---

## 0. Princípio de PROPRIEDADE DE DOMÍNIO + SSOT (fundadora 17/07 — reutilizável; formalizado em [[ADR-001]])
> **Os domínios permanecem PROPRIETÁRIOS dos seus fatos. Outros módulos podem PROJETAR ou REFERENCIAR essas
> informações, mas NUNCA assumir sua propriedade nem DUPLICAR seus registros.** Assim, a contracepção pertence ao
> Ciclo/Planejamento Reprodutivo; Medicamentos apenas **projeta** o que é relevante ao gerenciamento
> farmacológico; Recursos/Dispositivos apenas **referencia** os dispositivos. Vale para todo o modelo (exames,
> despesas, indicadores corporais, marcos…) — reforça a consistência do modelo de dados.
>
> **Ponto único de edição / SSOT (fundadora, princípio mais importante):** *As interfaces da SINTERA podem
> apresentar uma mesma informação em diferentes contextos, porém sempre preservando um **único ponto de edição** e
> uma **única fonte de verdade (SSOT)**.* Medicamentos mostra · Timeline mostra · Relatório mostra · Painel mostra
> · Rede de Cuidado mostra — **mas existe apenas UM local onde a informação pode ser alterada** (o domínio dono; a
> contracepção só se edita no Ciclo). Detalhamento e aplicações no [[ADR-001]] (projeção sem duplicação + SSOT).

## 1. Princípio de PLANEJAMENTO (fundadora 17/07) — domínio estratégico (GENÉRICO, não é da contracepção)
> **Planejamento NÃO pertence à contracepção.** É um **domínio estratégico** da plataforma que representa **todas
> as ações FUTURAS de saúde**; a **contracepção é apenas UM dos seus componentes**. O CTC-001 **usa** essa
> arquitetura, mas **não a define exclusivamente**. No futuro o mesmo domínio suportará: planejamento de exames ·
> consultas · vacinação · terapêutico · gestação · preventivo · metas de saúde.
> **Planejamento** representa **todas as ações FUTURAS relacionadas ao cuidado com a saúde**. É um **domínio
> estratégico** da plataforma. Hierarquia:
> - **Planejamento** (domínio) → **é DONO dos planos**; engloba: planejamento reprodutivo/contraceptivo · gestação ·
>   exames periódicos · consultas · vacinação · medicamentos/tratamentos · acompanhamento de doenças crônicas · metas.
> - **Planejamento reprodutivo** = **subdomínio**.
> - **Contracepção** = **um componente** do subdomínio reprodutivo.
> - **Agenda** = uma **VISÃO** que apresenta os planos **cronologicamente** — **não é dona do planejamento**. É
>   projeção temporal do que o domínio Planejamento possui.
> - **Lembretes · notificações** = **EXECUÇÃO** — disparam as ações no tempo. Não são o planejamento nem a agenda.
>
> **Inversão (fundadora, refinamento):** a arquitetura NÃO é Planejamento→Contracepção→Agenda→Notificações. É
> **Planejamento (domínio, dono dos planos) → Agenda (visão cronológica) → Notificações (execução)**. "A Agenda
> não é dona do planejamento": ela só o apresenta no eixo do tempo. Mesmo padrão de projeção sem duplicação
> ([[ADR-001]]).
>
> **Regra de compatibilidade:** o CTC-001 mantém o escopo em **contracepção agora**, mas modela de forma que possa
> **evoluir para o domínio Planejamento sem reestruturar a arquitetura**. (Planejamento é registrado como direção;
> ver §7. Não abre item de menu "morto" antes de existir.)

## 2. Escopo
**Dentro (agora):** modelo e relações da **contracepção** (métodos hormonais × dispositivos), vínculo com
Medicamentos/Recursos, integração com Ciclo e com Agenda/Notificações, sem duplicar dados. **Fora (futuro,
documentado):** o domínio **Planejamento** completo e os demais subdomínios (gestação, exames periódicos, metas…).

## 3. Modelo de Dados — VÍNCULO por referência (decisão da fundadora)
**O método contraceptivo é UM FATO** (fonte: `contraceptive_methods`, no domínio Ciclo). Ele é **referenciado**
por outros domínios conforme sua natureza — **sem criar registro duplicado**:

- **Métodos HORMONAIS que são medicamentos** (pílula · injeção · anel · adesivo): **registrados e editados no
  próprio Ciclo** (SSOT — decisão **Opção A** da fundadora, 18/07) e **projetados** (só leitura) no módulo
  **Medicamentos**. O Ciclo captura início + **cadência de recompra/reaplicação** (semanal/mensal/trimestral,
  coluna `usage_cadence`) + lembrete; Medicamentos apenas mostra "em uso" com a categoria **Contracepção
  hormonal** e a nota *"Gerenciado no Ciclo"* — **um fato, uma vez** (mesmo padrão de Despesas projetar exames,
  [[FIN-001]] / [[ADR-001]]). **Removido:** o antigo texto do Ciclo que mandava "registrar em Medicamentos" —
  criava um `medications` solto, sem vínculo (violava "um fato = um registro").
- **Métodos DISPOSITIVOS** (DIU de cobre/hormonal · implante): **vinculados** a **Recursos/Dispositivos** — têm
  vida útil + data de troca + lembrete (já existentes em `contraceptive_methods`). **Dispositivos = conceito AMPLO
  (fundadora):** Recursos/Dispositivos NÃO é orientado à contracepção — no futuro abriga **lentes esclerais · CPAP
  · bombas de infusão · sensores contínuos de glicose (CGM) · próteses · órteses** etc. O DIU/implante é só um caso.
- **Atributos do fato** (permanecem em `contraceptive_methods`): tipo (`kind`), marca, início, duração/vida útil,
  data de troca, status, lembrete, notas. **Novo (aditivo):** um discriminador de natureza derivado do `kind`
  (`hormonal` × `dispositivo`) — mapa no código (SSOT `lib/cycle.ts`), sem coluna nova obrigatória.

**Invariante:** contracepção NÃO é reimplementada em Medicamentos; Medicamentos **lê/projeta** o fato. Editar o
método é sempre no Ciclo (a fonte). Rastreabilidade: a referência preserva a origem.

## 4. Componentes & relações
- **Ciclo e Contracepção** (`/dashboard/ciclo`) — **fonte** do fato contraceptivo + ciclo menstrual.
- **Medicamentos** (`/dashboard/medicamentos`) — **projeta** os métodos hormonais como "em uso" (referência),
  com CTA "gerenciar no Ciclo". Sem duplicar linha em `medications`.
- **Recursos/Dispositivos** — DIU/implante como dispositivo com troca/vida útil.
- **Agenda/Notificações** ([[NOTIF-001]]) — **execução**. **Notificações por TIPO DE AÇÃO, não por domínio
  (fundadora):** NÃO criar categoria "Contracepção". A Central organiza por ação — **Medicamentos · Exames ·
  Consultas · Procedimentos · Dispositivos · Planejamento**. Assim: **recompra da pílula → Medicamento**; **troca
  do DIU → Dispositivo (ou Planejamento)**, conforme a natureza da ação. Evita multiplicar categorias a cada novo
  domínio.
- **Timeline (princípio, fundadora):** a linha do tempo mostra o evento **no contexto em que ocorreu**,
  preservando a **natureza original** — *"Início do anticoncepcional"*, *"Inserção do DIU"*, *"Colocação do
  implante"* — **nunca** um genérico "Medicamento iniciado" (que perde contexto). **Feito (v1):** o marco de
  **início**. **Previsto (modelagem já compatível, sem reestruturar):** a mesma Timeline deverá exibir também
  **troca de método · suspensão · falha de adesão · pausa temporária · retomada**. O rótulo já é derivado por
  natureza (`lib/cycle.ts`); acrescentar novos tipos de evento é aditivo.
- **Planejamento** (futuro) — a contracepção é um componente; a mesma referência serve ao guarda-chuva.

## 5. Fluxos
1. **Registrar método hormonal** (pílula/injeção/anel/adesivo) no Ciclo → o fato é criado; passa a **aparecer em
   Medicamentos "em uso"** (referência) + lembrete de recompra/troca + linha do tempo. **Sem** criar linha
   separada em `medications`.
2. **Registrar dispositivo** (DIU/implante) → fato com vida útil + **lembrete de troca**; referência em
   Recursos/Dispositivos.
3. **Editar/encerrar** → sempre na fonte (Ciclo); as projeções refletem.
4. **Notificações** → por TIPO DE AÇÃO (recompra→Medicamento; troca de dispositivo→Dispositivo/Planejamento);
   sem categoria "Contracepção". Respeita a Central ([[NOTIF-001]]).

## 6. Segurança & Governança
RLS por usuária em `contraceptive_methods`. LGPD (dado sensível — saúde reprodutiva). RDC 657: **organiza e
lembra; não prescreve nem interpreta**. **Invariantes:** (i) um fato = um registro (contracepção na fonte;
projeção nos demais); (ii) sem duplicação; (iii) rastreabilidade à fonte; (iv) reminders = execução, não fato.

## 7. Evolução — do CTC-001 ao domínio Planejamento
- **Agora:** contracepção (fato + vínculo Medicamentos/Recursos + notificações).
- **Depois (compatível, sem reestruturar):** o domínio **Planejamento** (dono dos planos) agrega os subdomínios
  (reprodutivo, exames periódicos, consultas, vacinação, tratamentos, crônicas, metas). Cada "plano" é um **fato de
  intenção futura**; a **Agenda** o apresenta cronologicamente (visão) e as **Notificações** o executam. A
  referência da contracepção já encaixa nesse guarda-chuva sem reestruturar.

## 8. Implementação (SÓ após aprovação)
Aditivo/reversível: discriminador hormonal×dispositivo no `lib/cycle.ts`; projeção dos métodos hormonais na lista
de Medicamentos (união, cada fato uma vez, **rótulo "Contracepção hormonal"**, link ao Ciclo); **Timeline com
rótulo contextual** por natureza; notificações **por tipo de ação** (Dispositivos/Planejamento como categorias de
AÇÃO, não "Contracepção"); nada
destrutivo em `contraceptive_methods`/`medications`. **Nada é implementado antes do seu aval** nesta spec.
