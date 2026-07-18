# DATE-001 — Infraestrutura Temporal Única (SSOT de datas)

**Status:** ✅ Consolidado e aprovado (fundadora 18/07/2026) · Sob [[ADR-000]] · Aplica [[ADR-001]] (SSOT) às
**regras de cálculo**. **Código:** `src/lib/date/index.ts`. **Escopo:** toda a plataforma.

## Objetivo
Ser a **única fonte** de qualquer regra temporal da SINTERA. **Nenhum domínio reimplementa cálculo de datas.**
Passam obrigatoriamente por aqui: **adição de dias · adição de meses · diferenças · data/instante atuais ·
próximas ocorrências · recorrências · vencimentos · validade · previsões futuras.** Precisou de algo novo →
**evolua este módulo**, nunca duplique num domínio.

## 1. Fonte única (invariante)
Qualquer lógica de data vive em `@/lib/date`. `@/lib/recurrence` (regra de recorrência) **delega** a aritmética
a estes primitivos — não mantém motor próprio. Domínios (Ciclo, Agenda, Relatório…) **consomem**, não recalculam.

## 2. Dois níveis (não misturar)
- **Nível 1 — PRIMITIVOS** (utilitários genéricos): `todayISO` · `nowISO` · `addDays` · `addMonths` ·
  `daysBetween`.
- **Nível 2 — REGRAS DE NEGÓCIO reutilizáveis** (construídas sobre o Nível 1): `nextOccurrenceByDays` e, à
  frente, recorrências, cálculos de validade/vencimento e próximas datas de manutenção.

Operação básica **nunca** se mistura com regra reutilizável — cada uma no seu nível.

## 3. Multi-domínio (não nasce do CTC-001)
O CTC-001 foi o primeiro consumidor, não o dono. O módulo serve — hoje e no roadmap — **Agenda · Planejamento ·
Medicamentos · Exames · Vacinação · Dispositivos · Gestação · Condições crônicas · Manutenções futuras**.
Toda data desses domínios deriva daqui.

## 4. Determinismo (invariante)
**Mesma entrada ⇒ mesmo resultado, independentemente da interface que consome.** O cálculo é *date-only* em
**UTC**, sem ler fuso/local; o relógio fica isolado em `todayISO`/`nowISO` (injetável em serviços puros por um
`Clock`). Isso elimina divergência entre **Timeline, Agenda, Notificações e Relatórios** — todos veem a mesma data.

## 5. Evolução prevista (registrada, não implementada agora)
Para não limitar a arquitetura, prevê-se o Nível 2 crescer para: **recorrências complexas** (regras de
calendário) · **periodicidade variável** e **exceções** · **feriados / dias úteis** · **janelas de tolerância** ·
**fusos horários** (quando um domínio exigir hora-local real). Cada uma entra **evoluindo o Nível 2** — nunca
duplicada num domínio. Não é prioridade agora; fica prevista para evitar retrabalho arquitetural.

## Governança
Precedência ADR-000 > ADR-001 > DATE-001. **Invariante:** zero aritmética de data fora de `@/lib/date`;
recorrência delega aos primitivos; cálculo determinístico. Violação = duplicação de regra temporal (proibida).
