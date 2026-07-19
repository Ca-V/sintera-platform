# V1 — Plano de Execução (Consolidação da organização da saúde)

**Status:** PLANEJAMENTO — aguardando aprovação (fundadora 19/07/2026). **Nenhum código antes da aprovação.**
Processo permanente: **Planejar → Aprovar → Implementar → Validar → Encerrar → Próxima versão.** Sob
[[ROADMAP_CONCLUSAO_PLATAFORMA]]. Regra: dentro da versão, entregar **experiências completas** para o usuário —
nunca meio-módulos.

## As 4 perguntas da versão (padrão de todas as versões)
1. **Qual problema do usuário resolvemos?** Hoje, para entender a própria evolução, o usuário precisa abrir dezenas de
   exames/documentos individuais.
2. **Qual transformação a V1 entrega?** Uma **visão longitudinal muito mais completa** da saúde, num só lugar.
3. **Como saberemos que foi concluída?** Pelo *Critério de sucesso* + *Definition of Done* abaixo.
4. **Por que precisa existir antes da próxima?** Sem uma base longitudinal clara e completa, a captura automática (V2)
   e a inteligência (V3) não têm onde se apoiar, e a colaboração (V4) exporia dados ainda incompletos.

## Objetivo da V1
Fechar tudo que já está próximo da conclusão, elevando **imediatamente** a qualidade percebida da organização.
A SINTERA passa a parecer "inteira".

## ⭐ Critério de SUCESSO da V1 (objetivo maior — toda decisão se mede por ele)
> **Ao finalizar a V1, qualquer usuário deve conseguir compreender sua evolução em saúde ao longo do tempo SEM
> precisar abrir dezenas de exames ou documentos individuais.**

Toda decisão de implementação se pergunta: **"isso aproxima ou afasta a V1 desse resultado?"**

## V1 = UMA experiência, não épicos independentes
Os épicos A e B **não são entregas isoladas** — todos convergem para **uma única percepção**: *"a SINTERA passou a me
mostrar minha saúde ao longo do tempo, de forma completa e simples"*. Relatório e Composição devem sair da V1 falando a
mesma língua longitudinal (mesma voz, mesmos rótulos de tendência/período, mesma leitura de "como isto evoluiu").

## Estado apurado (evita reimplementar o que existe — product-first)
- **Relatório:** hoje junta *Agenda + Histórico* sob **um** item ("Agenda"); os dados já são separados internamente
  (`perAgenda` × `perHistorico`). Biomarcadores aparecem só como **contagem** (`bioOrg`), não como evolução.
- **Composição Corporal:** já tem *Resumo atual* (com origem/confiabilidade/tendência), *Indicadores ao longo do
  tempo*, *Comparar avaliações*, painel de peso, e a **fiação bioimpedância/DEXA → `body_metrics` com origem já
  existe**. Logo, esta versão é de **FINALIZAÇÃO**, não construção.

---

## ÉPICO A — Relatório completo (espelho da navegação) · maior valor de completude
**Funcionalidades (ordem ideal):**
- **A1 — Separar "Agenda" (futuro) × "Histórico de Saúde" (passado)** na árvore + renderização. *Dado já existe.*
  **Esforço:** baixo. **Dep:** nenhuma. **Critério:** dois itens selecionáveis independentes; cada um renderiza só o
  seu conjunto; contagens corretas; espelha a navegação.
- **A2 — Seção "Histórico de Exames" (evolução dos resultados)** em *Acompanhamento*. Hoje só há contagem; passa a um
  **excelente resumo longitudinal por indicador** (aprovado adiar gráficos), **reutilizando** a montagem de
  `/dashboard/saude` (`lib/biomarkers`) — **não** construir do zero. Cada indicador mostra: **último resultado** ·
  **tendência** (quando houver dados suficientes) · **data da última realização** · **indicação clara de evolução ao
  longo do tempo**. **Esforço:** médio. **Dep:** independente de A1.
  **Critério (o usuário responde rápido, sem abrir exames):** *Como esse exame evoluiu? Está melhorando? Está piorando?
  Quando foi realizado pela última vez?* — de forma **factual** (RDC 657; "melhor/pior" só como direção do valor vs.
  faixa do laudo, nunca conclusão clínica), rastreável à origem, respeitando o período.
- **A3 — Consistência da árvore + copy** (Exames×Histórico de Exames; ordem; rótulos) e fechamento do "espelho 100%".
  **Esforço:** baixo. **Dep:** A1, A2.

**Riscos — técnico:** A2, volume de biomarcadores na impressão/PDF (paginação/performance). **UX:** confundir
*Histórico de Exames* (evolução) com *Exames* (documentos).
**Simplificação proposta:** A2 = **resumo por indicador** (último valor + seta de tendência), **adiando gráficos no
PDF** — entrega o valor de acompanhamento sem o custo de renderizar gráficos para impressão. A árvore herda o SSOT da
navegação (sem re-desenho).

## ÉPICO B — Composição Corporal: finalização (auditar antes; provavelmente pequeno)
**Funcionalidades (ordem ideal):**
- **B0 — Auditoria COMPLETA da tela (0 código; orientada à experiência):** avaliar, bloco a bloco, **o que agrega
  valor · o que é redundante · o que poderia ser unificado · o que aumenta a carga cognitiva**. Também: bioimpedância
  end-to-end com origem; painel de peso/GLP-1. **Entrega:** uma **recomendação fundamentada** (decisão pela EXPERIÊNCIA
  do usuário, não pela estrutura da UI). **Princípio:** não remover um bloco só por haver sobreposição — duas
  visualizações semelhantes podem cumprir objetivos diferentes. **Critério:** recomendação com justificativa por bloco.
- **B1 — Aplicar a recomendação do B0** (unificar/clarificar/remover conforme a análise, **após seu aval**). **Esforço:**
  baixo. **Critério:** a tela reduz carga cognitiva sem perder informação que agrega valor.
- **B2 — Painel de acompanhamento de peso (FB-007 pt2):** completar só o que B0 apontar (perda acumulada, ritmo, meta,
  preservação de massa magra). **Esforço:** definido por B0.
- **B3 — Rastreabilidade da bioimpedância:** garantir origem visível por indicador + reprodutibilidade. Verificar/completar.

**Riscos — técnico:** mexer em cálculo/summarize sem quebrar reprodutibilidade (reusar `lib/body`). **UX:** remover o
bloco errado (por isso B0 + sua decisão).
**Simplificação proposta:** se B0 mostrar B2/B3 prontos, a V1-Composição reduz a **B1 (dedup) + polish** — encurtando a V1.

---

## Ordem geral da V1 (valor percebido cedo primeiro)
1. **A1** — Agenda × Histórico de Saúde no relatório *(rápido, clareza imediata)*.
2. **B0** — Auditoria da Composição *(barata; define escopo; evita retrabalho)*.
3. **B1** — Dedup da Composição *(rápido, limpeza visível)*.
4. **A2** — Histórico de Exames no relatório *(a entrega de MAIOR valor de completude)*.
5. **A3 + B2/B3** — finalização conforme B0.

**Regra de desempate (valor percebido):** entre duas de esforço semelhante, priorizar a que faz o usuário perceber
mais claramente a evolução (por isso A1/B1 cedo, e A2 como espinha de valor).

## Definition of Done da V1
- Relatório é **espelho 100%** da navegação, com **Agenda × Histórico de Saúde** e **Exames × Histórico de Exames**
  distintos e renderizados.
- Composição **sem métricas duplicadas**, com bioimpedância **rastreável** e painel de peso completo.
- TSC + suíte + build verdes · Gate de Conformidade · **zero** framing de diagnóstico/tratamento (regra léxica DS-001 §9).

## ENCERRAMENTO DA V1 (validação + congelamento)

### Changelog de PRODUTO — O que mudou para o usuário
- O **relatório** agora distingue claramente **passado e futuro** (Histórico de Saúde × Agenda).
- A **evolução dos exames** pode ser compreendida rapidamente (último resultado · tendência · última realização),
  sem abrir cada exame.
- A **Composição Corporal** passou a ser organizada pelas **perguntas** que o usuário quer responder.
- A **experiência longitudinal** ficou muito mais clara e consistente.

### Checklist de encerramento
- ✅ **Critério de sucesso atingido** — compreende-se a evolução no tempo sem abrir dezenas de exames.
- ✅ **Nenhuma inconsistência de navegação** — árvore do relatório = espelho 100% da navegação.
- ⚠️ **Linguagem consistente** — Composição usa títulos-pergunta; relatório usa títulos descritivos (aceitável:
  documento × tela). Registrado como limite consciente do princípio, não como defeito.
- ✅ **Fluxos completos do ponto de vista do usuário** — relatório e Composição entregam experiências inteiras.
- ✅ **Débitos técnicos documentados** (abaixo).
- ✅ **Melhorias adiadas registradas** (abaixo).

### Débitos técnicos / melhorias DELIBERADAMENTE ADIADAS (não fazer sob congelamento; abrir na próxima limpeza)
1. **Relatório — redundância de biomarcadores:** a contagem no resumo do topo (sob "Exames") ficou redundante com a
   seção dedicada *Histórico de Exames*. Remover a contagem (o Histórico de Exames responde melhor). *Pequeno; candidato
   a limpeza na abertura da V2.*
2. **Relatório — Histórico de Exames ignora o filtro de período** (mostra a evolução completa, enquanto o resto respeita
   o período). Escolha deliberada e sinalizada na legenda; avaliar na V3 (Inteligência longitudinal) se deve respeitar o período.
3. **Títulos-pergunta** (princípio DS-001 §10): avaliar estender a outras telas multi-bloco em versões futuras (não é V1).

### Congelamento
A V1 está **CONGELADA**: apenas correção de defeitos. Nenhuma nova funcionalidade, melhoria oportunista ou refatoração
sem necessidade até o início oficial da V2.

## Decisões (estado)
1. **A2 (Histórico de Exames):** simplificação **aprovada** — excelente resumo longitudinal, gráficos ficam para versão futura.
2. **Composição (B1):** **sem decisão antecipada.** Primeiro a **auditoria B0** (orientada à experiência) → recomendação
   fundamentada → seu aval → só então B1. Não remover bloco por mera sobreposição.
