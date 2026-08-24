# ORD-002 — Correlação Pedido ↔ Resultado (sugestão de vínculo) — SPEC

**Status:** especificação (evolução funcional). **Separada** do bug PEDIDO-001 (roteamento do pedido), que já está
corrigido e testado. Aqui **nada** altera o comportamento já homologado; é uma capacidade nova a implementar depois.

## Problema / desejo (fundadora)
Quando a usuária adiciona um **resultado de exame** e já existe, na plataforma, um **pedido** daquele exame, o SINTERA
deve **reconhecer uma possível correspondência** e **apresentar o pedido** para que ela **vincule** — em vez de deixar
o vínculo só manual e escondido.

## Comportamento desejado
```
Upload do RESULTADO
  → sistema identifica que é um RESULTADO (não pedido)
  → busca PEDIDOS de exame existentes COMPATÍVEIS (mesmo usuário, pedido em aberto)
  → se encontrar candidato(s), apresenta:

      Vincular a um pedido de exame?
      Encontramos este pedido que pode corresponder a este resultado.
      [ Pedido de exame — nome / data / emissor ]
      [ Vincular ]   [ Agora não ]
```
- **Confirmação obrigatória:** o sistema **sugere**, a usuária **confirma**. **Nunca** vincular silenciosamente nesta 1ª versão (evita que uma correspondência imperfeita altere a relação documental sem confirmação).
- **Múltiplos candidatos:** apresentar as **opções para seleção**, nunca escolher arbitrariamente.
- **Recusa:** "Agora não" → o resultado permanece **independente** (sem vínculo).

## Modelo (reusa o que já existe — sem schema novo)
- Vínculo resultado→pedido: **`exams.fulfills_order_id`** (já existe; 1 pedido → N resultados). "Marcar realizado"/
  `order_status` já derivam de vínculos (`effectiveOrderStatus`). A ação manual "Vincular a um pedido" já existe no
  detalhe (Web/Mobile); ORD-002 adiciona a **sugestão automática na hora do upload do resultado**.

## Heurística de compatibilidade (candidatos)
Pedido é candidato quando (mesmo `user_id`):
1. `isOrderDocumentType(document_type)` = pedido; e **em aberto** (`order_status` ∈ {pendente} — não finalizado).
2. Proximidade de **nome/tipo** (ex.: "Doppler venoso" ↔ "Doppler colorido venoso") — comparação tolerante.
3. Proximidade de **data** (data do resultado ≥ data do pedido; janela configurável).
4. (Opcional) mesmo **emissor/solicitante** reforça o ranking.
Ordenar candidatos por score; **empate/≥2** → lista para a usuária escolher.

## Escopo / fora de escopo
- **Dentro:** função **pura** de matching (candidatos + score) no core (testável), + UI de sugestão no upload de resultado (Web e Mobile), + vínculo via `fulfills_order_id` **após confirmação**.
- **Fora (1ª versão):** vínculo automático sem confirmação; criar/alterar pedidos; qualquer mudança no PEDIDO-001; `exam_documents`/multi-documento.

## Critério de aceite
| Cenário | Esperado |
|---|---|
| Resultado + pedido compatível existente | Sugere "Vincular a um pedido de exame" |
| Confirmação da usuária | Resultado fica vinculado (`fulfills_order_id`) |
| Usuária recusa ("Agora não") | Resultado permanece independente |
| ≥2 candidatos | Lista as opções (sem escolha automática) |
| Nenhum candidato | Fluxo normal, sem sugestão |
| Matching puro | Coberto por testes (função de candidatos/score) |
