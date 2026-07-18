# CTC-001 — Contracepção & Arquitetura de Planejamento (ESPECIFICAÇÃO para validação)

**Status:** 🟡 **proposta — aguarda aprovação da fundadora** (antes do código) · **Versão:** 0.1 (17/07/2026).
**Objetivo:** definir a **arquitetura funcional da contracepção** e sua relação com **Medicamentos**,
**Recursos/Dispositivos**, **Ciclo**, **Agenda/Notificações** e o futuro domínio de **Planejamento** — **sem
duplicação de dados** e **rastreável**. Escopo atual = **contracepção**; a arquitetura já **nasce compatível** com
a evolução para **Planejamento em Saúde**. Fontes: [[FIN-001]]/[[BOD-001]] (fato único + projeção), [[req_saude_da_mulher]],
[[NOTIF-001]], RDC 657 (organiza, não prescreve). Segue [[ARCH-000]] §4.

---

## 1. Princípio de PLANEJAMENTO (fundadora 17/07) — domínio estratégico
> **Planejamento** representa **todas as ações FUTURAS relacionadas ao cuidado com a saúde**. É um **domínio
> estratégico** da plataforma. Hierarquia:
> - **Planejamento** (domínio) → engloba: planejamento reprodutivo/contraceptivo · gestação · exames periódicos ·
>   consultas · vacinação · medicamentos/tratamentos · acompanhamento de doenças crônicas · metas de saúde.
> - **Planejamento reprodutivo** = **subdomínio**.
> - **Contracepção** = **um componente** do subdomínio reprodutivo.
> - **Agenda · lembretes · notificações** = **mecanismos de EXECUÇÃO** do planejamento — **não são** o planejamento.
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

- **Métodos HORMONAIS que são medicamentos** (pílula · injeção · anel · adesivo): **projetados/vinculados** ao
  módulo **Medicamentos**. Aparecem em "medicamentos em uso" como uma **referência** ao fato da contracepção
  (link de volta ao Ciclo), com lembretes/recompra e na linha do tempo — **um fato, uma vez** (mesmo padrão de
  Despesas projetar exames, [[FIN-001]]).
- **Métodos DISPOSITIVOS** (DIU de cobre/hormonal · implante): **vinculados** a **Recursos/Dispositivos** — têm
  vida útil + data de troca + lembrete (já existentes em `contraceptive_methods`).
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
- **Agenda/Notificações** ([[NOTIF-001]]) — **execução**: lembrete de troca (DIU/injeção/anel/adesivo) e de
  recompra (pílula) por CATEGORIA (`suplemento`? não — nova categoria/tipo de evento *contracepção*).
- **Planejamento** (futuro) — a contracepção é um componente; a mesma referência serve ao guarda-chuva.

## 5. Fluxos
1. **Registrar método hormonal** (pílula/injeção/anel/adesivo) no Ciclo → o fato é criado; passa a **aparecer em
   Medicamentos "em uso"** (referência) + lembrete de recompra/troca + linha do tempo. **Sem** criar linha
   separada em `medications`.
2. **Registrar dispositivo** (DIU/implante) → fato com vida útil + **lembrete de troca**; referência em
   Recursos/Dispositivos.
3. **Editar/encerrar** → sempre na fonte (Ciclo); as projeções refletem.
4. **Notificações** → categoria própria de contracepção (execução do planejamento), respeitando a Central.

## 6. Segurança & Governança
RLS por usuária em `contraceptive_methods`. LGPD (dado sensível — saúde reprodutiva). RDC 657: **organiza e
lembra; não prescreve nem interpreta**. **Invariantes:** (i) um fato = um registro (contracepção na fonte;
projeção nos demais); (ii) sem duplicação; (iii) rastreabilidade à fonte; (iv) reminders = execução, não fato.

## 7. Evolução — do CTC-001 ao domínio Planejamento
- **Agora:** contracepção (fato + vínculo Medicamentos/Recursos + notificações).
- **Depois (compatível, sem reestruturar):** o domínio **Planejamento** agrega os subdomínios (reprodutivo,
  exames periódicos, consultas, vacinação, tratamentos, crônicas, metas). Cada "plano" é um **fato de intenção
  futura** que gera execução via Agenda/Notificações. A referência da contracepção já encaixa nesse guarda-chuva.

## 8. Implementação (SÓ após aprovação)
Aditivo/reversível: discriminador hormonal×dispositivo no `lib/cycle.ts`; projeção dos métodos hormonais na lista
de Medicamentos (união, cada fato uma vez, link ao Ciclo); categoria de notificação "contracepção"; nada
destrutivo em `contraceptive_methods`/`medications`. **Nada é implementado antes do seu aval** nesta spec.
