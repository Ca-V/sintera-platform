# ROT-001 — Rotinas e Lembretes (ampliação de "Hábitos")

> Item #4 da visão expandida. **Amplia o conceito de "Hábitos" para "Rotinas"**: qualquer atividade recorrente
> da vida da pessoa — usando a **mesma infraestrutura de recorrência e lembrete que já existe**
> ([Evento Assistencial](EVENTO_ASSISTENCIAL.md) + [NOTIF-001](NOTIF-001_NOTIFICACOES.md)). Sem UI/código; reusa,
> não reconstrói. Reforça a fronteira factual (RDC 657): a plataforma **registra e lembra** — não prescreve.

## 1. Conceito

"Hábitos" é estreito demais. A pessoa quer **programar e ser lembrada** de qualquer atividade recorrente —
treino, terapia, hidratação, uma aula de tênis. **Rotina** = uma atividade recorrente que a pessoa agenda; toda
Rotina **pode gerar um lembrete**. Não há mecanismo novo: a recorrência é do Evento Assistencial; o lembrete
(canal e-mail/WhatsApp por categoria) é do NOTIF-001. Rotinas é a **taxonomia + a lente** sobre isso.

## 2. O que Rotinas POSSUI × o que PROJETA (ADR-001)

- **Possui** (não tinham dono antes) — as rotinas de **estilo de vida**:
  - **Atividade física:** academia · corrida · tênis · pilates · yoga · personal.
  - **Terapias e bem-estar:** fisioterapia · psicoterapia · meditação.
  - **Autocuidado diário:** água/hidratação · sono · vitaminas.
- **Projeta** (donos permanecem — um fato = um registro):
  - **Medicação** → domínio Medicamentos (a dose recorrente aparece como rotina, mas o medicamento é do seu domínio).
  - **Exames/Consultas recorrentes** → domínio Exames / Agenda (a recorrência já existe no Evento Assistencial).

> "Hábitos" torna-se uma **categoria legada dentro de Rotinas** (ou renomeia-se para Rotinas) — decisão §6.

## 3. Modelo (reuso, não novo pipeline)

| Elemento | De onde vem |
|---|---|
| Recorrência (diária/semanal/custom, fim, exceções) | **Evento Assistencial** (infra temporal única, DATE-001) |
| Lembrete (quando avisar, por qual canal) | **NOTIF-001** (`event_key` + canal por categoria; Central = autoridade única) |
| Categoria da rotina | **taxonomia Rotinas** (§2) — nova, aberta (modelo aberto: categoria nova degrada, não quebra) |
| Sujeito / fase | **JOR-001** — rotina pode ser de um **dependente** (ex.: fisioterapia do filho) ou de uma **fase** (ex.: exercício orientado na menopausa) |

**Uma Rotina =** atividade (categoria) + recorrência (Evento Assistencial) + lembrete opcional (NOTIF-001) +
sujeito (titular/dependente). Exemplo: *"aula de tênis, 3ª e 5ª, 19h, lembrar por WhatsApp 1h antes"* →
Evento recorrente + preferência de canal na Central. Nada disso é construído do zero.

## 4. Integração com os outros domínios

- **IA preventiva (fronteira factual):** rotinas viram **contexto** — a IA organiza e prioriza (ex.: "atividade
  física caiu nas últimas semanas" como **fato**), **nunca** prescreve ("faça 30 min de corrida"). Quem define a
  rotina é a pessoa (ou seu profissional, como conteúdo dele).
- **Wearables:** a Observação (HIP-007) pode **confirmar** a realização de uma rotina (ex.: treino detectado),
  como sinal factual — sem juízo.
- **Rede de Cuidado (CARE-002):** um educador físico/fisioterapeuta pode acompanhar as rotinas do seu escopo; um
  cuidador pode **receber o lembrete** da rotina de um dependente (alerta à rede, §CARE-002).

## 5. Fronteira (RDC 657)

A SINTERA **registra** a rotina que a pessoa programou e **lembra** no momento certo. Não recomenda atividade,
intensidade ou frequência como conduta clínica. Um plano de exercícios/fisioterapia, quando existe, é **conteúdo
do profissional** (via Rede de Cuidado), não da plataforma.

## 6. Decisões a ratificar (fundadora)

- **D-ROT-1** — "Hábitos" **renomeia** para "Rotinas" (e absorve o conceito), ou "Rotinas" é um guarda-chuva que **contém** Hábitos?
- **D-ROT-2** — Confirmar que Medicação/Exames/Consultas recorrentes **projetam** (não duplicam) dentro de Rotinas.
- **D-ROT-3** — Rotinas por **dependente** (JOR-001) entram já no modelo?
- **D-ROT-4** — Onde Rotinas vive na Sidebar: em "Minha Saúde" (onde Hábitos está hoje) ou promovido?

---
**Conformidade:** ✔ REG-001 · ✔ ADR-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: Evento Assistencial (recorrência) · NOTIF-001 (lembrete) · JOR-001 (sujeito/fase) · CARE-002 (alertas à rede) · DATE-001 (infra temporal) · Modelo Aberto · RDC 657.*
