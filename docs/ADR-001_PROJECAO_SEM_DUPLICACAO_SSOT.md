# ADR-001 — Projeção sem duplicação + Ponto único de edição (SSOT)

**Status:** ✅ Aceito (18/07/2026) · Referencia [[ADR-000]] · Reutilizável em TODA a plataforma.
**Origem:** consolidado a partir de FIN-001 (Despesas projeta exames), BOD-001 (Composição Corporal projeta
indicadores), BOD-001 ⑤ (Marcos projetam eventos) e CTC-001 (Medicamentos/Timeline projetam contracepção).

## Contexto
A mesma informação de saúde é útil em **vários contextos** (Medicamentos, Registros de Saúde/Timeline, Relatório,
Painel Inicial, Composição Corporal, Rede de Cuidado…). A tentação é **copiar** o registro para cada tela — o que
gera **duplicação**, divergência e dupla edição. A SINTERA é orientada a **domínios**, e a governança exige um dado
**rastreável** e **consistente**.

## Decisão
1. **Propriedade de domínio.** Cada **domínio é DONO dos seus fatos**. (Ex.: a contracepção pertence ao Ciclo; o
   exame ao Histórico de Exames; a despesa nasce do fato que a originou.)
2. **Projeção/referência, nunca duplicação.** Outros módulos **apresentam** a informação por **projeção** (leitura
   derivada) ou **referência** (link ao fato) — **nunca criam um segundo registro** nem assumem a propriedade.
3. **SSOT + ponto único de edição.** *As interfaces da SINTERA podem apresentar uma mesma informação em diferentes
   contextos, porém sempre preservando um **único ponto de edição** e uma **única fonte de verdade (SSOT)**.* Em
   termos práticos: **Medicamentos mostra · Timeline mostra · Relatório mostra · Painel mostra · Rede de Cuidado
   mostra — mas existe apenas UM local onde aquela informação pode ser alterada** (o domínio dono).
4. **Rastreabilidade.** Toda projeção/referência **preserva a origem** (link ao fato/documento). Nada fica "solto".
5. **Evidência de propriedade na UI.** Quando um módulo projeta um fato de outro domínio, a interface deve deixar
   **claro onde editar** (ex.: contraceptivo em Medicamentos exibe "Gerenciado no Ciclo").

## Consequências
- **Positivas:** sem duplicação nem divergência; edição num só lugar; rastreabilidade; domínios coesos; telas
  compõem-se por leitura. Reduz erro do usuário (editar no lugar errado).
- **Custos:** cada tela consumidora precisa saber **projetar** (query de leitura + link à fonte) e **rotular** a
  origem; mudanças no fato exigem que as projeções reflitam (por leitura, não por cópia).

## Aplicações já no código (referência)
- **Despesas** projeta exames-com-valor + eventos ([[FIN-001]]).
- **Composição Corporal** projeta indicadores de `body_metrics` de várias origens ([[BOD-001]]).
- **Marcos da Evolução** projetam medicamentos/avaliações/consultas ([[BOD-001]] ⑤).
- **Medicamentos** e **Timeline** projetam a **contracepção** hormonal/dispositivo ([[CTC-001]]).

## Governança
Precedência ADR-000 > ADR-001. **Invariante:** um fato = um registro no seu domínio dono; consumidores projetam/
referenciam, com origem preservada e um único ponto de edição. Violação = duplicação (proibida). Mudança = revisão
explícita.
