# MOD-001 — Catálogo de módulos (matriz de capacidades)

> Prioridade 6 da visão expandida. Visão **cross-cutting** de todos os módulos e como se ligam aos eixos
> transversais (IA · Wearables · Rede de Cuidado · Multi-sujeito · Notificações). Não duplica descrições dos docs
> donos — é um **índice de capacidades** para priorização e coerência. Guardrail [REG-001](REG-001_GUARDRAIL_REGULATORIO.md).

## Legenda
✅ usa · — não usa · **Dep.** = suporta sujeito **dependente** (MUL-001). Colunas transversais: **IA** (organiza/
prioriza — nunca diagnostica) · **Wear** (recebe Observação) · **Rede** (compartilhável via CARE-002) · **Dep.** ·
**Notif** (gera lembrete/alerta via NOTIF-001).

| Módulo | Objetivo | Entradas | Saídas | Dependências | IA | Wear | Rede | Dep. | Notif |
|---|---|---|---|---|:--:|:--:|:--:|:--:|:--:|
| **Início / Painel** | Mostrar o que precisa de atenção hoje | projeções dos módulos | destaques, próximos passos | ADR-018 (slots) | ✅ | — | — | ✅ | — |
| **Exames** | Guardar/organizar exames | upload de documento (CAP) | histórico, original a 1 clique | Capture Hub · CEF · UCDA | ✅ | — | ✅ | ✅ | ✅ |
| **Agenda / Histórico** | Organizar eventos no tempo | Evento Assistencial | timeline, recorrência | Evento Assistencial · DATE-001 | ✅ | — | ✅ | ✅ | ✅ |
| **Composição Corporal** | Acompanhar medidas | registro manual · dispositivos | séries no tempo | body_metrics | ✅ | ✅ | ✅ | ✅ | — |
| **Monitoramento / Wearables** | Trazer sinais contínuos | conectores (OAuth) | Observações | HIP-007/009 · WEA-001/002 | ✅ | ✅ | ✅ | ✅ | — |
| **Condições de Saúde** | Registrar condições | registro do usuário | contexto | domínio Condições | ✅ | — | ✅ | ✅ | — |
| **Medicamentos** | Organizar uso e doses | registro · bula | doses, lembretes | domínio Medicamentos | ✅ | — | ✅ | ✅ | ✅ |
| **Suplementos** | Organizar suplementos | registro | doses, lembretes | domínio Suplementos | ✅ | — | ✅ | ✅ | ✅ |
| **Recursos de Saúde** | Registrar recursos/planos | registro | contexto financeiro/apoio | domínio Recursos · FIN-001 | — | — | ✅ | ✅ | ✅ |
| **Rotinas** (ex-Hábitos) | Programar atividades recorrentes | definição de rotina | recorrência, lembretes | Evento Assistencial · NOTIF-001 · ROT-001 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Jornada de Saúde** | Organizar saúde por fase | projeções por sujeito+fase | visão por fase, templates | JOR-001 (projeção) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Rede de Cuidado** | Governar participação/compartilhamento | convites, permissões | acessos, auditoria | CARE-001/002 · MUL-001 | — | — | ✅ | ✅ | ✅ |
| **Despesas** | Acompanhar custos dos fatos | valor nos fatos | projeção financeira | FIN-001 (projeção) | — | — | — | ✅ | ✅ |
| **Relatórios** | Gerar relatórios que espelham dados | domínios | documento compartilhável | Relatório espelha domínio | — | — | ✅ | ✅ | — |
| **Central de Notificações** | Preferências de aviso por categoria/canal | preferências | despacho (e-mail/WhatsApp) | NOTIF-001 (autoridade única) | — | — | ✅ | ✅ | ✅ |
| **Configurações / Perfil** | Conta, privacidade, preferências | dados do usuário | perfil, consentimentos | profiles · LGPD | — | — | — | ✅ | — |

## Como usar
- **Priorização:** colunas transversais mostram o alcance real de cada módulo (ex.: Rotinas toca IA·Wear·Rede·Dep.·Notif → alto reuso).
- **Coerência:** todo módulo com ✅ em IA respeita REG-001 (organiza/prioriza, não diagnostica). Todo ✅ em Notif passa pela Central (autoridade única). Todo ✅ em Rede passa por CARE-002 (consentimento+auditoria). Todo ✅ em Dep. respeita MUL-001 (isolamento de sujeito).
- **Manutenção:** ao criar um módulo, preencher a linha e validar contra o teste de coerência (REG-001 §guardrail).

---
**Conformidade:** ✔ REG-001 · ✔ ADR-001 · ✔ RDC 657

**Governança:** ✔ não duplica · ✔ reutiliza conceitos do ARC-000 · ✔ respeita REG-001 · ✔ não altera o núcleo arquitetural · ✔ referencia documentos-fonte · ✔ novos conceitos exigem ADR

*Relaciona: Sidebar SSOT · JOR-001 · CARE-002 · MUL-001 · ROT-001 · WEA-002 · NOTIF-001 · FIN-001 · REG-001 · CATALOGO_PLATAFORMA (catálogo descritivo — este é a matriz de capacidades).*
