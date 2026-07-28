# MUL-001 — Modelo Multi-sujeito (Pessoa · Titular · Dependente · Rede)

> Prioridade 3 da visão expandida. Modela o eixo que a Jornada de Saúde ([JOR-001](JOR-001_JORNADA_DE_SAUDE.md))
> introduziu: a plataforma passa a acompanhar a saúde da **titular E de seus dependentes**. **Maior mudança de
> modelo** (hoje `profiles` = 1 pessoa) — mas **sem novo pipeline**: adiciona uma **dimensão de sujeito** aos
> fatos existentes. Guardrail [REG-001](REG-001_GUARDRAIL_REGULATORIO.md) aplicado; não muda o propósito da plataforma.

## 1. Entidades

| Entidade | Definição | Hoje |
|---|---|---|
| **Pessoa** | Abstração de um indivíduo cuja saúde é acompanhada. Concretiza-se como **Titular** ou **Dependente**. | implícita (só a titular) |
| **Titular** | Dona da conta e do acesso (= `profiles`). Concede/revoga acessos; exerce a tutela dos dependentes. | existe |
| **Dependente** | Pessoa sob cuidado da titular (filho; e, no futuro, outros). Nome, data de nascimento, relação. **Não** tem conta própria. | **novo** |
| **Responsável legal / Tutor** | Papel de quem exerce o consentimento por um dependente (em geral a própria titular). | **novo (papel)** |
| **Profissional** | Participante externo da saúde (médico, pediatra, nutri…), entra pela Rede de Cuidado. | CARE-001/002 |
| **Familiar / Cuidador** | Rede pessoal de apoio; acesso autorizado a um sujeito. | CARE-002 |

**Sujeito do cuidado** = **Titular ou Dependente** — a pessoa a quem um **fato** (exame, evento, medida,
observação) se refere.

## 2. Relacionamentos

```mermaid
flowchart TD
  Tit[Titular] -->|tutela| Dep[Dependente]
  Tit -->|exerce consentimento por| Dep
  Tit -->|é| Suj[Sujeito do cuidado]
  Dep -->|é| Suj
  Suj -->|dono de| Fato[Fato: Exame · Evento · Medida · Observação]
  Tit -->|concede acesso por sujeito+escopo+prazo| Part[Participante: Profissional · Familiar · Cuidador]
  Part -->|acessa (só o autorizado)| Suj
```

## 3. Regras

1. **Todo fato pertence a um Sujeito.** Adiciona-se uma **dimensão `sujeito`** aos fatos (não duplica o fato — o
   atribui). O titular é o sujeito default; dependentes são sujeitos explícitos.
2. **Tutela e visibilidade (RLS/LGPD):** a titular vê os próprios fatos **e** os dos dependentes sob sua tutela.
   Dado de dependente = **dado sensível de terceiro**, sob responsabilidade e **consentimento** da titular/tutor.
3. **Concessão por sujeito:** o acesso da Rede de Cuidado (CARE-002) é sempre **por sujeito** (pediatra → filho;
   obstetra → titular na fase Gestação) + escopo + prazo + auditoria.
4. **Isolamento de contexto:** os fatos de cada sujeito são analisados **no seu próprio contexto** — a IA nunca
   mistura a saúde de pessoas diferentes.
5. **"Graduação" do dependente (futuro):** quando um dependente vira titular (ex.: filho atinge a maioridade), há
   **portabilidade** dos seus dados para uma conta própria (LGPD). Modelar a transição desde já, implementar depois.

## 4. Impactos (verbos seguros — REG-001)

- **IA:** passa a operar **por sujeito** (e por fase, via JOR-001). **Organiza e prioriza** o contexto de cada
  pessoa separadamente; **não** interpreta clinicamente nem cruza sujeitos.
- **Notificações (NOTIF-001):** um lembrete de um dependente pode ir para a **titular/cuidador** (alerta à rede,
  CARE-002 §5), sempre factual (dose, consulta, vacina) — nunca juízo clínico.
- **Wearables (HIP-007):** cada Observação é atribuída a um **sujeito** (de quem é o dispositivo). Um dependente
  pode ter dispositivo próprio; a sincronização (HIP-009) não muda — ganha só a atribuição de sujeito.
- **Jornada (JOR-001):** "Saúde Infantil" é um recorte **por dependente**; as fases da titular (gestação,
  menopausa) são recortes do sujeito titular.

## 5. LGPD (dado de terceiro sob tutela)

- Consentimento do dependente exercido pela **titular/tutor**; registrar base legal e finalidade.
- **Minimização:** coletar do dependente só o necessário ao cuidado.
- **Portabilidade/eliminação:** prever a saída dos dados do dependente (graduação ou revogação da tutela).
- Reusa a postura de privacidade já existente (Privacy by Design, COMPLIANCE-001) — **sem** novo pipeline.

## 6. Decisões a ratificar

- **D-MUL-1** — Entidade **Dependente** (sem conta própria, sob tutela da titular) confirmada como o modelo do multi-sujeito?
- **D-MUL-2** — Dimensão `sujeito` nos fatos (atribuição, não duplicação) é o caminho (vs. contas separadas)?
- **D-MUL-3** — "Graduação" do dependente para titular fica **modelada agora, implementada depois**?
- **D-MUL-4** — Escopo inicial de dependente = **filhos**; outros (idosos/terceiros) ficam para fase posterior?

---
**Conformidade:** ✔ REG-001 · ✔ LGPD · ✔ ADR-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: JOR-001 (fase+sujeito) · CARE-001/002 (acesso por sujeito) · NOTIF-001 (alertas) · HIP-007/009 (wearables) ·
COMPLIANCE-001 (LGPD) · REG-001 (guardrail) · ADR-001 (não duplica — atribui).*
