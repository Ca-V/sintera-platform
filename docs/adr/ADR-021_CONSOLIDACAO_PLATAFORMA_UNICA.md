# ADR-021 — Consolidação: Plataforma Única (10 princípios)

- **Status:** Aceito (fundadora, 2026‑08‑06) — **vinculante**.
- **Contexto:** encerrada a homologação comparativa Web↔Mobile. O volume de inconsistências (arquitetura, UX,
  paridade, padronização) justifica uma **reengenharia de consolidação**. Muda‑se o modo de trabalho: de "executar
  lista de tarefas" para **executar guiado por princípios** — decisões de implementação orientadas por uma visão
  arquitetural consistente.
- **Relação:** operacionaliza [[ADR-000]] (princípios raiz) e [[ADR-001]] (SSOT) para a fase de consolidação;
  plano executável em `docs/UX-002`; governa junto de [[ADR-011]] (componentes cross‑platform), [[ADR-002]]/[[ADR-003]]
  (mobile‑first/api‑first), [[ADR-012]] (decisão estrutural no repo).

## Decisão — os 10 princípios (regem TODA implementação a partir de agora)

1. **Plataforma única.** Web e Mobile = **duas interfaces** sobre a MESMA arquitetura, lógica de negócio, contratos,
   componentes, protocolos e fonte de dados (SSOT). Toda função nova nasce **simultânea** nas duas — exceção só
   **pré‑aprovada**.
2. **Design System único.** Um só DS para componentes, tipografia, hierarquia, espaçamentos, margens, paddings, cores,
   estados, ícones, botões, seletores, cards, formulários, navegação. Proibido componente semelhante feito de formas
   diferentes.
3. **Experiência única.** Mesmo comportamento na Web e no Mobile; muda apenas a adaptação natural do dispositivo.
4. **Protocolo único de entrada.** Todo conteúdo entra pelo MESMO fluxo, em qualquer módulo (exames, medicamentos,
   suplementos, eventos, composição corporal, documentos, categorias futuras). Ref.: CAP‑001/HUB‑001.
5. **Componentes reutilizáveis.** 1ª pergunta ao surgir necessidade: *"já existe componente que resolve?"* Se sim,
   reusar; se não, criar **genérico** no DS. Nunca solução específica de uma só tela.
6. **Fonte única de verdade.** Toda regra — negócio, interpretação, classificação, estruturação, transformação,
   cálculo, filtros, recorrência, exibição — existe **uma vez** (núcleo). A interface **só consome**.
7. **Arquitetura antes da interface.** O desenvolvimento deixa de ser guiado pelas telas. Define‑se primeiro
   arquitetura, contratos, modelos, entidades, componentes compartilhados e protocolos; **depois** a interface.
8. **Auditoria completa.** Cada tela revisada criticamente — não só por defeitos, mas por **oportunidades reais**
   (simplicidade, consistência, legibilidade, menos cliques, menos carga cognitiva, escalabilidade, reuso, excelência).
9. **Padrão de excelência.** Não só corrigir — **elevar** o nível. Cada decisão pesa escalabilidade, manutenção, reuso,
   consistência, UX e qualidade. Havendo solução melhor que a prevista, adotá‑la — **desde que preserve a arquitetura**.
10. **Autonomia.** Autonomia para estruturar a reengenharia; **sem aprovação item a item**. Interromper **só** quando
    houver decisão realmente **arquitetural ou de produto** que dependa da fundadora. No resto, executar preservando os
    princípios e **reportar apenas as entregas concluídas**.

## Consequências
- **Ordem de trabalho:** arquitetura/contratos/componentes compartilhados/protocolos → depois interface (P7). A
  execução da reengenharia começa pela **fundação compartilhada** (DS + core), não pelas telas.
- **Gate de paridade** passa a ser condição de conclusão: nenhuma entrega nasce só‑Web ou só‑Mobile; a lógica mora no
  core; Web/Mobile só apresentam (P1/P6).
- **DS único** absorve componentes duplicados; toda nova UI consome tokens/recipes existentes (P2/P5) — DS‑002/DS‑003.
- **Reporte:** só entregas concluídas; decisões estruturais viram doc/ADR (P10 + ADR‑012).
- **Excelência sobre paridade literal:** quando uma solução melhor que a Web beneficiar ambas, adotá‑la e documentá‑la
  (P9) — alinhado a [[feedback_questionar_web_propor_melhorias]].

## Fora de escopo / a consolidar depois
- O **ADR de Governança v1.0** (framework de certificação G1–G4 / matriz de paridade) permanece para consolidar
  **pós‑RC1**, registrando a arquitetura validada — este ADR‑021 registra os **princípios diretores** declarados agora.
