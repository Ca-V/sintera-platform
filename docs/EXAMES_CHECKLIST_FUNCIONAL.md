# Exames — Checklist FUNCIONAL (controle de implementação)

> Fundadora (15/07): o domínio Exames tem **DOIS controles que coexistem** até o encerramento:
> 1. **este checklist funcional** (as funcionalidades estão IMPLEMENTADAS?),
> 2. a **matriz de homologação** (`tests/homolog/COVERAGE.md` — foram VALIDADAS com documentos reais?).
>
> Não declarar "código completo" nem "Exames concluído" enquanto houver item funcional aberto.
> **Conclusão** = todas as funcionalidades implementadas **E** todas as dimensões da matriz homologadas
> com docs reais **E** Certificação da Plataforma aprovada.
>
> Legenda: ✅ implementado e verificado · 🔄 parcial / a refinar · ⬜ pendente.

| # | Funcionalidade | Estado | Evidência / pendência |
|---|---|---|---|
| F1 | Padronização definitiva da identificação dos cards | ✅ | Card da lista em 3 linhas (nome/lab/solicitante) + **detalhe** agora idem (issuer+requesting_physician) |
| F2 | Nomenclatura (exame único × painel laboratorial) | ✅ | E2 domínio + `ARCH-002`/`FUNC-nomenclature-consistency` (regra validada; homologação final = doc real) |
| F3 | Exibição de laboratório + médico solicitante | ✅ | Lista + detalhe; assinante do laudo fora da identificação (está no documento) |
| F4 | Reorganização da página (Exames × Pedidos e Solicitações) | ✅ | Abas + ação do topo contextual |
| F5 | Fluxo completo de pedidos (Pedido→Agendamento→Realização→Resultado) | 🔄 | Estados modelados (`careFlow`); pedido→"Agendar" cria evento. **Falta:** vínculo duro pedido↔evento↔resultado e o stepper (adiado pela fundadora p/ após homologação) |
| F6 | Política binária de estruturação (nunca "parcial") | ✅ | E3 (selo/badge binários) |
| F7 | Experiência completa de upload | ✅ | E6 fluxo único (PDF/foto/galeria/multipágina/reordenar) via DocumentBundle |
| F8 | Financeiro do exame (valor + nota fiscal) | ✅ | E7 "Registrar custo / NF" (NF visível de imediato) → Despesas |
| F9 | Recorrência e agendamento | ✅ | E8 (AgendarModal: recorrência + reagendar) |
| F10 | Integração completa ao CPE | 🔄 | `processClinical`→UCDA→`clinical_results` (aditivo); coexiste com laboratório legado por Convergência Progressiva. **A validar:** cobertura por modalidade (homologação) |
| F11 | Detecção/confirmação de duplicado | ✅ | `duplicates` + chip + "Ver original" |
| F12 | Evolução a partir do resultado | ✅ | Biomarcador numérico → série no tempo |
| F13 | Demais itens do backlog do domínio | 🔄 | Ver `EXAMES_CONCLUSAO.md`; itens abertos consolidados aqui conforme surgirem |

## Itens funcionais AINDA ABERTOS (foco da execução antes da homologação)
- **F5** — completar o fluxo de pedidos: vínculo duro pedido↔evento↔resultado (hoje por nota) e a
  visualização de etapa (stepper — a fundadora priorizou APÓS a homologação, então fica registrado, não bloqueia).
- **F10** — a integração ao CPE existe; a "completude" por modalidade é confirmada na homologação (matriz).
- **F13** — varrer o backlog do domínio e trazer para cá qualquer pendência funcional remanescente.

_À medida que cada item fecha, marca-se ✅ com evidência. Só quando F1–F13 = ✅ é que a etapa passa a
depender exclusivamente da matriz de homologação._
