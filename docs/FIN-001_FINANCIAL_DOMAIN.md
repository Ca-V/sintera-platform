# FIN-001 — Financial Domain (modelo financeiro universal)

**Status:** ativo · **Versão:** 1.0 (17/07/2026) · **Responsável:** Fundadora (direção) · Claude (redação).
**Objetivo:** definir o **modelo financeiro único** da plataforma — como valor pago, nota fiscal, recibo e
comprovante são registrados, consolidados e projetados em **Despesas**, sem duplicação, a partir de **qualquer**
domínio. **Escopo:** despesas de saúde (Exames, Medicamentos, Contracepção, Recursos, Consultas, Procedimentos,
e qualquer módulo futuro). **Dependências:** ADR-000, DATA-001, EVENTS-001. **Relacionado:** Evento Assistencial,
`/dashboard/gastos`, REL-001 (Relatórios). Segue a convenção de estrutura de [[ARCH-000]] §4.

---

## 1. Objetivo
Um só modelo financeiro para toda a plataforma: cada gasto de saúde é registrado **uma vez**, com seu(s)
documento(s) fiscal(is), e aparece automaticamente em **Despesas**, **Relatórios** e no **Histórico** — pronto
para IR/reembolso, sem o usuário recadastrar nada.

## 2. Escopo
**Dentro:** valor pago · tipo de documento fiscal (Nota fiscal · Recibo · Comprovante de pagamento · Outro) ·
anexo do documento · projeção para Despesas · consolidação por período/categoria · export para IR.
**Fora (1.1+):** conciliação bancária, integração contábil, múltiplas moedas, cálculo de impostos, faturamento.

## 3. Modelo de Dados
- **Portador canônico = Evento Assistencial** (`health_events`): `amount_cents`, `direct_expense`
  (despesa direta — conta como gasto sem precisar estar "realizado"), `attachment_url` (documento), e o
  **tipo de documento fiscal** (`nota_fiscal` | `recibo` | `comprovante` | `outro`).
- **NÃO existe tabela de despesas própria por domínio** (invariante anti-duplicação). Cada domínio que gera um
  gasto cria/associa um Evento financeiro **vinculado à sua origem** (`EventLink`, ex.: `{type:'exam', id}`).
- **Despesas = PROJEÇÃO** (`selectFinancial`/`listFinancial`): eventos com valor, não-cancelados, realizados ou
  despesa-direta. `/dashboard/gastos` NÃO cria registros — lê o contrato canônico.
- Núcleo puro do tipo fiscal: `src/lib/finance/expense.ts` (`EXPENSE_DOC_TYPES`, `expenseDocLabel`,
  `isFiscalDocument`) — fonte única, testado (`tests/finance/FUNC-expense-doc.test.ts`).

## 4. Componentes
- `lib/agenda` (Evento Assistencial): portador + `selectFinancial`/`isFinancial` (projeção, congelado).
- `lib/finance/expense`: classificação do documento fiscal (novo, FIN-001).
- `AgendarModal` (modo `expense`): captura reutilizável de despesa (valor + anexo + tipo fiscal) — **um único
  fluxo** para todos os módulos (reúso; nenhum módulo cria seu próprio formulário de despesa).
- `/dashboard/gastos`: projeção/consolidação. REL-001: seção "Documentos Financeiros".

## 5. Fluxos
1. **Registrar despesa (qualquer módulo):** módulo abre o `AgendarModal` em modo `expense` → usuária informa
   valor + tipo de documento fiscal + anexa NF/recibo/comprovante → salva → cria Evento `direct_expense`
   **vinculado** à origem. 2. **Projeção:** o Evento entra em Despesas (por período/categoria) e no Histórico.
   3. **Relatórios:** "Documentos Financeiros" lista tipo·descrição·valor·data·documento, com download em lote
   das NFs/recibos para o contador. 4. **Proveniência:** o vínculo (`EventLink`) preserva de qual exame/recurso
   a despesa nasceu (EVT-C6).

## 6. APIs
- Leitura: `eventServicesFor(db).query.listFinancial(userId)` → `HealthEvent[]` financeiros.
- Escrita: `useEventForm().saveEvent(userId, input, null, links)` com `directExpense`, `amount`, anexo e tipo
  fiscal. Contrato de saída = Evento canônico; consumidores nunca leem tabela de domínio.

## 7. Segurança
Anexos fiscais em storage com URL assinada; RLS por `user_id` (owner-only) em `health_events`. Tokens/segredos
fora do cliente. LGPD Art. 11 (dado sensível): consentimento no cadastro; exclusão remove Evento + anexo.

## 8. Governança
Precedência ADR-000 > SPAGS > FIN-001. **Invariantes:** (i) Evento é o único portador financeiro; (ii) proibida
tabela de despesa por domínio; (iii) Despesas é projeção, nunca fonte; (iv) toda despesa preserva proveniência
da origem. Mudança nesses invariantes = emenda ao SPAGS antes do código.

## 9. Auditoria
Cada despesa é rastreável: origem (EventLink), data/hora, valor, tipo de documento, anexo. Reprocessável e
idempotente pela chave do Evento. Export para IR = evidência auditável.

## 10. Evolução
- **Feito:** portador canônico + projeção Despesas + núcleo `expense` (tipos fiscais) + teste.
- **Em andamento (BETA-7/BETA-3):** persistir o tipo fiscal (migration `expense_doc_type`) + campo no
  `AgendarModal` modo expense + exibição em Despesas/Relatórios; rollout "registrar despesa" aos demais módulos.
- **1.1+:** categorização automática, conciliação, integração contábil, múltiplas moedas.
