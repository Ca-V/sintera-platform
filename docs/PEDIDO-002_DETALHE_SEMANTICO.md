# PEDIDO-002 — Detalhe do Pedido semântico + título do conteúdo (defeito funcional)

**Status:** defeito funcional NOVO, **separado** do PEDIDO-001 (roteamento — já homologado: pedido vai direto para
Pedidos). **Não** usar a ORD-002 (correlação Pedido↔Resultado) como solução. Reteste em device (18/08) confirmou o
roteamento OK e revelou dois defeitos na **tela/dados do pedido**.

## Defeitos
### A. Título vindo do NOME DO ARQUIVO
O pedido aparece como "pedido" (filename). O título deve ser **derivado dos procedimentos solicitados** no documento —
ex.: `Doppler colorido venoso de membro inferior — bilateral` (ou "esquerdo e direito" se a taxonomia preservar itens).
**Causa provável:** ao gravar `document_type='medical_order'` na criação (PEDIDO-001), a identidade fica estabelecida e
a derivação de `display_title` do pedido (naming) é **pulada** → sobra o `type` (filename).

### B. Detalhe do pedido renderiza como RESULTADO (o mais grave)
Ao abrir o pedido aparece "Resultados estruturados / 2 resultados / <procedimentos>". O detalhe **reutiliza a estrutura
de exame/resultado**. Um Pedido e um Resultado são objetos semanticamente distintos:

| Pedido de exame | Resultado de exame |
|---|---|
| o que foi **solicitado** | o que foi **realizado** |
| procedimentos solicitados | resultados/achados |
| data da **solicitação** | data da **realização** |
| médico **solicitante** | **executante**/serviço |
| documento do **pedido** | documento do **resultado** |
| status do pedido (pendente…) | resultados estruturados (finalizado…) |

**Causa provável:** o `document_type='medical_order'` corrigiu destino/listagem, mas o **componente de detalhe** ainda
roteia/renderiza pela estrutura de resultado. É preciso **rotear o detalhe pelo tipo semântico**.

## Critério de aceite
### A. Título
- [ ] Não usar o nome do arquivo como título clínico.
- [ ] Derivar o título dos **procedimentos solicitados** identificados no documento.

### B. Detalhe do pedido
- [ ] Abrir uma tela/estado semântico de **Pedido de exame**.
- [ ] Exibir informações do pedido e seus **procedimentos solicitados** (+ solicitante, data da solicitação, status).
- [ ] **Não** exibir "Resultados estruturados", nem resultados clínicos, nem tratar como exam/result.
- [ ] O documento original continua acessível em **"Ver documento"**.

### C. Fluxo já homologado — PRESERVAR (não regredir)
- [ ] Início → Adicionar registro → Pedido de exame → **Pedidos**.
- [ ] Pedidos → Adicionar pedido de exame → **Pedidos**.
- [ ] Pedido **não** aparece em Exames (durante ou após o processamento).

### D. ORD-002 — separado
- [ ] Correlação Pedido↔Resultado permanece spec própria; **não** é solução deste defeito.

## Testes de regressão exigidos
- `medical_order` → **Pedidos + detalhe de Pedido** (nunca detalhe de Resultado).
- `exam/result` → **Exames + detalhe de Resultado** (inalterado).
- **Nunca** `medical_order → Pedidos → detalhe de Exame`.
