# FIN-001 — Financial Domain (modelo financeiro universal)

**Status:** ativo · **Versão:** 1.1 (17/07/2026, refino FB-008) · **Responsável:** Fundadora (direção) · Claude (redação).
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

### 3.1 Princípio (refino FB-008) — o financeiro é ATRIBUTO do FATO
Um **fato de saúde** (um exame, um recurso, um medicamento) é um **único registro**. Valor pago, documento
fiscal e recorrência são **atributos desse fato**, **não novos Eventos**. Registrar o valor de um exame existente
**não cria** um Evento de Saúde — grava colunas no próprio exame. Isso evita a duplicação em Registros de Saúde e
em Despesas (o bug FB-008: um fato aparecia duas vezes, um sem valor e outro com).

- **Financeiro-atributo (preferencial):** o fato guarda o financeiro em suas próprias colunas.
  - `exams`: `expense_amount_cents`, `expense_doc_type` (`nota_fiscal|recibo|comprovante|outro`), `expense_doc_url`.
  - (Recursos/Medicamentos seguirão o mesmo padrão quando o financeiro passar a ser atributo do fato.)
- **Despesa AVULSA = Evento próprio:** só quando **não há fato pré-existente** (ex.: plano de saúde, academia,
  mensalidade) a despesa nasce como Evento financeiro (`health_events`: `amount_cents`, `direct_expense`,
  `attachment_url`, `expense_doc_type`). Aqui o Evento **é** o fato.
- **NÃO existe tabela de despesas própria por domínio** (invariante anti-duplicação): o financeiro ou é atributo
  do fato, ou é um Evento avulso — nunca uma terceira tabela paralela.

### 3.2 Despesas = PROJEÇÃO sobre TODOS os fatos com valor
`/dashboard/gastos` **não cria registros**: projeta a **união** de (a) Eventos financeiros avulsos
(`listFinancial`) **excluindo** os legados vinculados a um fato, com (b) **exames com valor**
(`expense_amount_cents > 0`), cada fato **uma única vez**. Lançamentos de exame ligam de volta ao exame; excluir
um lançamento de exame **limpa as colunas** (mantém o exame), não apaga o fato.

- Núcleo puro do tipo fiscal: `src/lib/finance/expense.ts` (`EXPENSE_DOC_TYPES`, `expenseDocLabel`,
  `isFiscalDocument`) — fonte única, testado (`tests/finance/FUNC-expense-doc.test.ts`).

## 4. Componentes
- `lib/agenda` (Evento Assistencial): portador + `selectFinancial`/`isFinancial` (projeção, congelado).
- `lib/finance/expense`: classificação do documento fiscal (novo, FIN-001).
- `AgendarModal` (modo `expense`): captura reutilizável de despesa (valor + anexo + tipo fiscal) — **um único
  fluxo** para todos os módulos (reúso; nenhum módulo cria seu próprio formulário de despesa).
- `/dashboard/gastos`: projeção/consolidação. REL-001: seção "Documentos Financeiros".

## 5. Fluxos
1. **Financeiro de um fato existente (ex.: exame):** no detalhe do exame, a seção "Financeiro e acompanhamento"
   edita os **atributos do próprio exame** (form inline: valor + tipo de doc fiscal + anexo) — **sem** abrir
   `AgendarModal` e **sem** criar Evento. 2. **Despesa avulsa (sem fato):** módulo abre o `AgendarModal` em modo
   `expense` → valor + tipo fiscal + anexo → cria Evento (é o próprio fato). 3. **Projeção:** exames-com-valor e
   Eventos avulsos entram em Despesas (união, cada fato uma vez) e o exame aparece na timeline como exame (não
   duplicado por um evento-despesa). 4. **Recorrência:** o "lembrete de repetição" do exame é **um** Evento de
   lembrete (sem valor) — não uma despesa. 5. **Relatórios:** "Documentos Financeiros" lista
   tipo·descrição·valor·data·documento, com download em lote das NFs/recibos. 6. **Proveniência:** o lançamento de
   exame liga de volta ao exame; despesas avulsas vinculadas preservam a origem (`EventLink`, EVT-C6).

## 6. APIs
- Leitura: `eventServicesFor(db).query.listFinancial(userId)` → `HealthEvent[]` financeiros.
- Escrita: `useEventForm().saveEvent(userId, input, null, links)` com `directExpense`, `amount`, anexo e tipo
  fiscal. Contrato de saída = Evento canônico; consumidores nunca leem tabela de domínio.

## 7. Segurança
Anexos fiscais em storage com URL assinada; RLS por `user_id` (owner-only) em `health_events`. Tokens/segredos
fora do cliente. LGPD Art. 11 (dado sensível): consentimento no cadastro; exclusão remove Evento + anexo.

## 8. Governança
Precedência ADR-000 > SPAGS > FIN-001. **Invariantes (v1.1):** (i) **um fato = um registro**: o financeiro é
atributo do fato; só despesa **avulsa** (sem fato) é Evento próprio; (ii) proibida tabela de despesa por domínio;
(iii) Despesas é **projeção** (união de fatos com valor), nunca fonte, cada fato **uma vez**; (iv) toda despesa
preserva proveniência da origem; (v) recorrência = **um** lembrete, nunca uma despesa. Mudança nesses invariantes
= emenda ao SPAGS antes do código.

## 9. Auditoria
Cada despesa é rastreável: origem (EventLink), data/hora, valor, tipo de documento, anexo. Reprocessável e
idempotente pela chave do Evento. Export para IR = evidência auditável.

## 10. Evolução
- **Feito (1.0):** portador canônico + projeção Despesas + núcleo `expense` (tipos fiscais) + teste.
- **Feito (1.1, FB-008):** financeiro do exame como **atributo do fato** (migration 123: colunas em `exams`);
  detalhe do exame edita atributos **sem criar Evento**; Despesas projeta exames-com-valor ∪ eventos avulsos
  (cada fato uma vez, ligando ao exame; exclusão limpa colunas); timeline oculta eventos-despesa legados
  vinculados a exame (elimina a duplicação FB-008); recorrência = um lembrete.
- **Próximo:** estender o padrão "financeiro-atributo" a Recursos/Medicamentos (avaliar sem quebrar FB-004-B).
- **1.1+:** categorização automática, conciliação, integração contábil, múltiplas moedas.
