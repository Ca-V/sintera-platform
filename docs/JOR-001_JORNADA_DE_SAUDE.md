# JOR-001 — Jornada de Saúde (modelo de domínio · SSOT de produto)

> **Status:** modelagem de produto (fundadora, 2026-07-27) — **redefine o posicionamento da SINTERA**. Sem UI,
> sem código. Branch `docs/visao-expandida` (isolada da `pre-inc4-ready`). Reusa a arquitetura existente
> ([ADR-001](ADR-001_PROJECAO_SEM_DUPLICACAO_SSOT.md) projeção · [Evento Assistencial](EVENTO_ASSISTENCIAL.md) ·
> [HUB-001](HUB-001_REGISTRATION_HUB.md) · [CARE-001](CARE-001_ESPACO_COLABORATIVO.md) · Sidebar SSOT · UCDA).

## 0. Identidade da plataforma (teste de coerência)

> **A SINTERA é uma plataforma de inteligência preventiva que integra dados clínicos, hábitos, dispositivos,
> profissionais e a rede de cuidado para acompanhar a jornada de saúde de cada pessoa ao longo da vida.**

Toda decisão de produto passa por este teste: *cabe nessa proposta?* Wearables (sim), Rede de Cuidado (sim),
IA (sim), vacinação infantil (sim), menopausa (sim), lembretes de hábitos (sim). Se um recurso futuro **não**
puder ser explicado dentro dessa frase, reavaliar se pertence ao produto.

## 1. O que é a Jornada de Saúde

Uma **LENTE de organização por FASE DE VIDA** — não um novo silo de dados. A Jornada **projeta e referencia**
fatos que continuam sendo donos de seus domínios (Exames, Eventos, Medidas, Observações), organizando-os pela
fase/jornada a que pertencem e adicionando o que é **específico da fase** (calendário vacinal, cronograma de
pré-natal, rastreamentos por idade). Princípio [ADR-001](ADR-001_PROJECAO_SEM_DUPLICACAO_SSOT.md): **um fato =
um registro**; a Jornada nunca duplica — projeta.

**Dois eixos novos que a Jornada introduz:**
1. **Fase de vida** — o *quando* da saúde (prevenção, ciclo, gestação, infância…).
2. **Multi-sujeito** — o *de quem*: a titular **e seus dependentes** (a saúde da família, não só a própria).

## 2. Taxonomia (Sidebar = SSOT)

**Taxonomia DEFINITIVA (congelada 2026-07-27 — muda só por ADR)** — "Jornada de Saúde" como **domínio de 1º
nível** (lente), ao lado dos existentes (Acompanhamento · Minha Saúde · Rede de Cuidado · Organização · Configurações):

```
Jornada de Saúde
├── Saúde Feminina
│   ├── Ciclo              ← relocado de "Minha Saúde"
│   ├── Contracepção       ← relocado de "Minha Saúde" (CTC-001)
│   ├── Tentante
│   ├── Gestação
│   ├── Pós-parto
│   ├── Menopausa
│   └── Histórico ginecológico
├── Saúde Infantil                 (por dependente)
│   ├── Vacinação
│   ├── Crescimento
│   ├── Pediatria
│   ├── Odontopediatria
│   └── Desenvolvimento
└── Saúde Preventiva
    ├── Check-ups
    ├── Rastreamentos
    ├── Exames             ← PROJEÇÃO do domínio Exames (não move o dado)
    └── Fatores de risco
```

**Decisões de taxonomia — RATIFICADAS (congeladas):** (D-JOR-1 ✔) Ciclo/Contracepção **saem** de "Minha Saúde" e
passam a "Saúde Feminina"; (D-JOR-2 ✔) "Saúde Preventiva → Exames" e "Vacinação" são **projeções** (o dado
permanece no domínio dono); (D-JOR-3 ✔) "Saúde Infantil" **por dependente**. *(A organização VISUAL da Sidebar é
"Estável para MVP" — revisável por UX; ver [ARC-000 §6](ARC-000_ARQUITETURA_DE_PRODUTO.md).)*

## 3. Entidades de domínio

| Entidade | Papel | Nova? | Reuso |
|---|---|---|---|
| **Sujeito do cuidado** | A pessoa a quem o fato se refere: **titular** ou **dependente**. | **Sim** (hoje tudo é o titular) | Liga-se a `profiles` (titular) e a CARE-001 (familiares/cuidadores). |
| **Dependente** | Pessoa sob cuidado da titular (filho, e futuramente outros). Nome, data de nascimento, relação. | **Sim** | Um "perfil reduzido"; herda RLS via titular. |
| **Fase / Jornada** | Contexto temporal de saúde (Gestação, Menopausa, Infância-de-X): período, status, sujeito. | **Sim** (dado pequeno) | Agrega fatos por projeção; gera templates. |
| **Template de fase** | Conjunto de marcos/recorrências da fase (calendário vacinal, pré-natal, rastreamentos por idade). | **Sim** (conteúdo) | Materializa-se em **Eventos Assistenciais** (recorrência + lembrete). |
| Exame · Evento · Medida · Observação · Condição · Medicação | Os fatos em si. | Não | **Donos permanecem**; a Jornada só projeta/filtra por sujeito + fase. |

> **Fronteira factual (RDC 657):** a Jornada **organiza e apresenta**; não interpreta nem produz conteúdo
> clínico. Um "template de fase" (ex.: calendário vacinal do PNI) é **referência pública**, com origem citada —
> não recomendação da SINTERA.

## 4. Relacionamento entre módulos (tudo por projeção)

- **Exames** → aparecem em "Saúde Preventiva" e dentro de uma fase (ex.: exames do pré-natal), filtrados por
  sujeito + período. O dado vive no domínio Exames.
- **Agenda / Eventos Assistenciais** → consultas de pediatra, retorno pós-parto, doses de vacina: **Eventos**
  com `sujeito` + `fase`. A recorrência e o lembrete **já existem**.
- **Medidas / Composição Corporal** → peso na gestação, crescimento infantil (percentis): **Medidas** por sujeito.
- **Monitoramento / Observações (wearables)** → sono/atividade na fase (HIP-007). Alimentam a IA da fase.
- **Condições / Medicações** → projetadas por sujeito e fase quando relevantes.

## 5. Impactos (o que a Jornada muda em cada pilar)

**IA preventiva.** Ganha dois contextos que hoje não tem: **fase** e **sujeito**. O que a plataforma passa a
mostrar fica "certo para o momento" (ex.: lembrar de rastreamentos por faixa etária como **referência pública**;
destacar sinais registrados no período) e por pessoa (titular × filho). Mantém a fronteira ([REG-001](REG-001_GUARDRAIL_REGULATORIO.md)):
a IA **organiza, correlaciona, prioriza e lembra** a partir do que existe — **não** interpreta, **não** prevê
risco clínico e **não** produz diagnóstico (RDC 657). A Jornada dá à IA o "mapa" para **organizar** o preventivo — quem decide é a pessoa e o profissional.

**Wearables.** A Observação (HIP-007) passa a ter endereço na jornada: sono/HRV/atividade **da fase** (ex.:
sono na gestação, atividade na menopausa). Nenhuma mudança na arquitetura de sincronização (HIP-009) — só o
**contexto** de leitura. Vendors (Health Connect/Apple Health pilares; Garmin/Oura/Whoop/Fitbit) inalterados.

**Rede de Cuidado (CARE-001).** É aqui que o **multi-sujeito** fecha o modelo: os "Familiares autorizados" e a
"Equipe de cuidado" do CARE-001 passam a ter **objeto** — os dependentes. Um **pediatra** entra num Care Space
da **Saúde Infantil** de um filho; um **obstetra** num Care Space da **Gestação** da titular. Participantes
possíveis (CARE-001 estende): titular · médico · psicólogo · nutricionista · fisioterapeuta · educador físico ·
dentista · pediatra · familiares · cuidadores — cada um com permissão por módulo/fase e auditoria (já em CARE-001).

## 6. O que NÃO muda

- Nenhum pipeline novo; nenhum dado duplicado (ADR-001).
- Evento Assistencial continua a entidade central (recorrência/agenda/timeline).
- HUB-001 continua decidindo **como** capturar (a Jornada só diz **em que fase/para quem**).
- A plataforma segue **factual** (RDC 657) e privada por design (LGPD; dependente = dado sensível de terceiro,
  sob tutela da titular — a modelar com o mesmo rigor de consentimento do CARE-001).

## 7. Decisões RATIFICADAS (congeladas · 2026-07-27)

- **D-JOR-1 ✔** — Ciclo/Contracepção migram de "Minha Saúde" para "Jornada de Saúde › Saúde Feminina".
- **D-JOR-2 ✔** — "Exames" e "Vacinação" sob a Jornada são **projeção** dos domínios donos (não cópia).
- **D-JOR-3 ✔** — Multi-sujeito: entidade **Dependente** + recorte "Saúde Infantil por dependente" ([MUL-001](MUL-001_MODELO_MULTISSUJEITO.md)).
- **D-JOR-4 ✔** — "Jornada de Saúde" é **domínio de 1º nível**.

**Congeladas** (mudança só por ADR — [ARC-000 §5/§6](ARC-000_ARQUITETURA_DE_PRODUTO.md)). A organização **visual**
da Sidebar é "Estável para MVP" (revisável por UX). Este doc é o **SSOT de produto** da Jornada.

## 8. Consolidação (taxonomia definitiva · módulos · navegação · entidades)

> Guardrail [REG-001](REG-001_GUARDRAIL_REGULATORIO.md) aplicado. Taxonomia **DEFINITIVA** (congelada 2026-07-27;
> muda só por ADR). A Jornada **não muda o propósito** da plataforma — organiza o que já existe por fase.

### 8.1 Taxonomia definitiva (proposta)

`Jornada de Saúde` = domínio de 1º nível (lente). **Possui** contexto de fase + templates; **projeta** os fatos.

| Área | Módulos | Natureza | Dono do fato |
|---|---|---|---|
| **Saúde Feminina** | Ciclo · Contracepção · Tentante · Gestação · Pós-parto · Menopausa · Histórico ginecológico | possui contexto; projeta exames/eventos/medidas | Ciclo/CTC-001 + domínios de fato |
| **Saúde Infantil** (por dependente) | Vacinação · Crescimento · Pediatria · Odontopediatria · Desenvolvimento | possui contexto+templates (calendário vacinal); projeta eventos/medidas | Evento Assistencial · Medidas |
| **Saúde Preventiva** | Check-ups · Rastreamentos · Exames (projeção) · Fatores de risco | projeção + templates por faixa etária | Exames · Agenda |

### 8.2 Navegação conceitual (sem tela — só o fluxo)

`Jornada de Saúde` → escolher **sujeito** (titular ou dependente) → escolher **área/fase** → ver os **fatos
projetados** daquela fase (exames, eventos, medidas, observações) + os **marcos da fase** (templates) → de um
marco, **agir** (registrar · agendar · compartilhar na Rede de Cuidado). Nenhuma interpretação — só organização e ação.

### 8.3 Entidades e projeção (diagrama)

```mermaid
flowchart TD
  Tit[Titular] -->|tutela / consentimento| Dep[Dependente]
  Tit -->|é um| Suj[Sujeito do cuidado]
  Dep -->|é um| Suj
  Suj --> Fase[Fase / Jornada  (período · status)]
  Fase --> Tmpl[Template de fase  (calendário vacinal · pré-natal · rastreamentos)]
  Tmpl -->|materializa| Ev[Evento Assistencial  (recorrência + lembrete)]
  Fase -. projeta .-> Exames
  Fase -. projeta .-> Ev
  Fase -. projeta .-> Medidas
  Fase -. projeta .-> Obs[Observações  (wearables · HIP-007)]
  Ev --> Notif[NOTIF-001  (lembrete por canal)]
  Fase -. contexto .-> IA[IA  (organiza · prioriza — REG-001)]
  Suj -. compartilhável .-> Rede[Rede de Cuidado  (CARE-002)]
```

### 8.4 Impactos consolidados (verbos seguros — REG-001)

- **IA:** ganha contexto de **fase + sujeito**; **organiza, correlaciona e prioriza** o que merece atenção naquele
  momento; **não** diagnostica nem recomenda conduta.
- **Wearables:** a Observação passa a ter endereço na fase (contexto de leitura); arquitetura de sync inalterada.
- **Rede de Cuidado:** o **dependente** dá objeto aos "familiares/equipe" do CARE-001/002 (pediatra ↔ Saúde Infantil).
- **Notificações:** os templates de fase geram **lembretes factuais** (calendário vacinal, pré-natal) via NOTIF-001.

---
**Conformidade:** ✔ REG-001 · ✔ LGPD · ✔ ADR-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: identidade da plataforma (§0) · REG-001 (guardrail) · ADR-001 (projeção) · Evento Assistencial · HUB-001 ·
CARE-001/002 · HIP-007 (Observação) · NOTIF-001 (lembretes) · Sidebar SSOT · princípio "não produz conteúdo clínico" (RDC 657).*
