# Exames — Controle 1: Checklist FUNCIONAL

> Fundadora (15/07): o domínio Exames é acompanhado por **DOIS controles independentes e obrigatórios**:
> - **Controle 1 — Checklist Funcional** (este): *"a funcionalidade existe e está implementada?"*
> - **Controle 2 — Matriz de Homologação** (`tests/homolog/COVERAGE.md`): *"foi validada com documentos reais?"* (8 dimensões).
>
> **Estados (apenas estes quatro; SEM percentuais por funcionalidade):**
> `Não iniciado` · `Em desenvolvimento` · `Implementado` · `Homologado`.
> `Implementado` = código pronto e verificado, mas **ainda não** validado com documento real.
> `Homologado` = a dimensão correspondente da Matriz foi aprovada com documentos reais.
> **Um item só passa a `Homologado` quando o Controle 2 confirmar** — hoje o teto de todos é `Implementado`.
>
> **Conclusão do domínio Exames (os 3 simultaneamente):** todo o Checklist em `Homologado` **E** todas as
> dimensões da Matriz aprovadas **E** Certificação da Plataforma aprovada. Qualquer pendência → *em desenvolvimento*.

| # | Funcionalidade | Estado | Evidência / pendência |
|---|---|---|---|
| F1 | Identificação padronizada do exame (nome) | Implementado | card da lista + detalhe |
| F2 | Nomenclatura (exame único × painel laboratorial) | Implementado | E2 (`ARCH-002` · `FUNC-nomenclature-consistency`) |
| F3 | Exibição de laboratório + médico solicitante | Implementado | lista + detalhe; assinante do laudo fora da identificação |
| F4 | Reorganização da página (Exames × Pedidos e Solicitações) | Implementado | abas + ação do topo contextual |
| F5 | Fluxo completo de pedidos (Pedido→Agendamento→Realização→Resultado) | Em desenvolvimento | estados modelados (`careFlow`) + "Agendar" cria evento; **falta** vínculo duro pedido↔evento↔resultado (stepper adiado p/ pós-homologação) |
| F6 | Política binária de estruturação (nunca "parcial") | Implementado | E3 |
| F7 | Experiência completa de upload | Implementado | E6 (DocumentBundle: PDF/foto/galeria/multipágina/reordenar) |
| F8 | Financeiro do exame (valor + nota fiscal) | Implementado | E7 ("Registrar custo / NF" → Despesas) |
| F9 | Recorrência e agendamento | Implementado | E8 (AgendarModal) |
| F10 | Integração ao CPE | Implementado | `processClinical`→UCDA→`clinical_results` (aditivo); completude por modalidade = Matriz (dim. `cpe`) |
| F11 | Detecção/confirmação de duplicado | Implementado | `duplicates` + chip + "Ver original" |
| F12 | Evolução a partir do resultado | Implementado | biomarcador numérico → série no tempo |
| F13 | Varredura contínua do backlog do domínio | Em desenvolvimento | auditoria contínua; traz p/ cá qualquer não-conformidade encontrada |

**Resumo dos estados:** `Implementado` = F1,F2,F3,F4,F6,F7,F8,F9,F10,F11,F12 · `Em desenvolvimento` = F5,F13 ·
`Homologado` = (nenhum ainda — depende do Controle 2, hoje 0/8). Nenhum `Não iniciado`.

## Processo de AUDITORIA CONTÍNUA (fundadora)
Sempre que uma auditoria encontrar lacuna real: **(1) registra a não-conformidade → (2) corrige de imediato
quando possível → (3) atualiza este checklist → (4) só então retoma a fila normal.** *(Foi o que ocorreu com a
identificação — laboratório e solicitante no detalhe — comportamento esperado.)*

## Adiados (NÃO retornam à fila antes do encerramento de Exames)
stepper visual do fluxo assistencial · Care Space · push notifications · demais funcionalidades de fases posteriores.
