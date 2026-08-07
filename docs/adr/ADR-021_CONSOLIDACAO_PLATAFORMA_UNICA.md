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

## Diretrizes de execução (adendo — fundadora, 2026‑08‑06)
Refinam **como** executar sob os 10 princípios:
1. **Evoluir, não só padronizar.** Reavaliar cada módulo criticamente; ao identificar arquitetura/fluxo/experiência
   superior à planejada, **propor e adotar a solução tecnicamente mais robusta**. O objetivo não é reproduzir a
   plataforma atual com componentes novos — é **evoluir o produto**.
2. **Escalabilidade obrigatória.** Antes de criar componente compartilhado, validar que se sustenta com **centenas de
   categorias, milhares de exames, dezenas de milhares de documentos, múltiplos idiomas, múltiplos países e módulos
   futuros**. Proibido o que só funciona para o estado atual (ex.: i18n‑ready, listas virtualizadas/paginadas, chaves
   estáveis, sem enumerações fechadas — [[principio_modelo_aberto]]).
3. **Três níveis de mudança por entrega:** classificar tudo em **Correção** (bug/inconsistência) · **Padronização**
   (paridade/DS/SSOT) · **Evolução de produto** (melhoria funcional/UX). Facilita homologações futuras.
4. **Simplicidade.** Entre duas soluções corretas, a **mais simples**. Reduzir regras, exceções, estados, componentes,
   dependências. Menos complexidade estrutural = mais capacidade de evolução.
5. **Auditoria contínua.** Não limitar aos itens registrados; enquanto reestrutura, registrar e propor oportunidades
   relevantes (arquitetura/UX/consistência/desempenho).
6. **Governança das decisões — interromper só** quando a decisão alterar: arquitetura do produto · modelo de dados ·
   UX · comportamento funcional · regras de negócio · priorização do roadmap. Questões **exclusivamente técnicas** =
   autônomas.
7. **Evidências por entrega:** testes · builds · typecheck · validações · impacto nos módulos · critérios de aceite
   atendidos. Sem passo a passo — só a comprovação de integridade.

## Regra de governança — PARIDADE OBRIGATÓRIA (Definition of Done) — fundadora, 2026‑08‑06
**5ª regra, vinculante.** Nenhuma funcionalidade é **CONCLUÍDA** se:
- (a) existir em **apenas uma** plataforma; ou
- (b) apresentar diferença de **nomenclatura · texto · título · botão · mensagem · opção · fluxo · componente ·
  comportamento** entre Web e Mobile —
**SALVO** quando a diferença decorrer de **limitação inerente ao dispositivo** (ex.: câmera, gestos nativos).

**Correção por PADRÃO DE SISTEMA, não página a página:** sempre que houver um **seletor**, um **formulário**, uma
**ação de adicionar**, uma **nomenclatura** ou um **fluxo equivalente**, aplica‑se o mesmo padrão em **toda** a Web e
**todo** o Mobile — não só onde o problema foi visto. Padrões operacionais em **`docs/UX-003`** (PS‑1 seletor universal
· PS‑2 protocolo único de "Adicionar" · PS‑3 nomenclatura/copy idênticas).

**Critério de aceite (antes de cada build de homologação):** varredura completa de consistência — nomenclaturas ·
botões · componentes de seleção · fluxos de inclusão · Web↔Mobile. **A homologação NÃO se conclui** enquanto houver
diferença de UX entre plataformas para funcionalidade equivalente. Reforça [[principio_paridade_total_web_mobile]] e a
matriz de paridade (G4) — agora como **gate de conclusão**, não só princípio.

**Gate adicional — COERÊNCIA DO MODELO DE DADOS:** nenhuma informação pode ser apresentada de forma diferente entre Web
e Mobile quando representar o **mesmo objeto de domínio** (Exame · Indicador · Medição · Medicamento · Evento…). A
diferença entre plataformas limita‑se a **layout/adaptação ao device**, **nunca** ao modelo conceitual — porque vários
defeitos (ex.: extração bruta exibida como estruturada; longitudinal ausente no Mobile) nascem da **representação do
dado**, não da interface. Operacionaliza‑se com **H‑11 (SSOT de componentes)**: funcionalidade em ambas as plataformas
reutiliza o **mesmo modelo conceitual e a mesma lógica** (core), variando só a apresentação. Detalhe em `docs/UX-003`.

**Quatro níveis de paridade (gate completo):** (1) **visual** · (2) **componentes** · (3) **modelo de dados** ·
(4) **funcional** — *qualquer AÇÃO* disponível numa plataforma existe na outra (adicionar/reabrir/editar/incluir/criar
link/exportar/abrir anexo/histórico por tipo…), salvo limitação de device. UX‑003 + ADR‑021 constituem o **Product
System da SINTERA** (arquitetura · componentes · comportamento · modelo de dados · representação · paridade).

## Princípio orientador — Desenvolvimento orientado ao DOMÍNIO (não à tela) — fundadora, 2026‑08‑06
**A referência da SINTERA deixa de ser a tela e passa a ser o DOMÍNIO.** Ao implementar qualquer funcionalidade,
pensa‑se **primeiro no objeto de domínio** (Exame · Indicador · Evento · Medicamento · Documento · Relatório…) e só
depois na tela. Decorre daí:
- **Comportamento** pertence ao **domínio**, não à interface.
- **Lógica** pertence ao **core**, não à página.
- **Representação do dado** é **única** (uma só verdade).
- **Telas apenas consomem** essa lógica e apresentam a informação adequada ao contexto/dispositivo.

Consequência: Web e Mobile **deixam de ser dois produtos** e passam a ser **duas interfaces para o mesmo sistema**.
**Regra de decisão:** diante da escolha entre *solução específica de tela* × *fortalecer um componente / regra de
domínio / lógica compartilhada*, a prioridade é **sempre fortalecer a base**. Reduz manutenção, evita regressões e faz
as próximas funcionalidades **nascerem consistentes**. É o degrau de maturidade que unifica IA · Design System ·
governança de UX · paridade (4 níveis) · coerência do modelo de dados · SSOT de componentes · gates de validação —
tudo já formalizado neste ADR e em `docs/UX-003`. **Meta pós‑entrega:** o esforço de desenvolvimento migra de "corrigir
diferenças/inconsistências" para "**agregar novas capacidades**".

## Fora de escopo / a consolidar depois
- O **ADR de Governança v1.0** (framework de certificação G1–G4 / matriz de paridade) permanece para consolidar
  **pós‑RC1**, registrando a arquitetura validada — este ADR‑021 registra os **princípios diretores** declarados agora.
