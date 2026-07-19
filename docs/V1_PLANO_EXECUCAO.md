# V1 — Plano de Execução (Consolidação da organização da saúde)

**Status:** PLANEJAMENTO — aguardando aprovação (fundadora 19/07/2026). **Nenhum código antes da aprovação.**
Processo permanente: **Planejar → Aprovar → Implementar → Validar → Encerrar → Próxima versão.** Sob
[[ROADMAP_CONCLUSAO_PLATAFORMA]]. Regra: dentro da versão, entregar **experiências completas** para o usuário —
nunca meio-módulos.

## Objetivo da V1
Fechar tudo que já está próximo da conclusão, elevando **imediatamente** a qualidade percebida da organização.
A SINTERA passa a parecer "inteira".

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
- **A2 — Seção "Histórico de Exames" (evolução dos resultados)** em *Acompanhamento*. Hoje só há contagem; passa a
  listar, por indicador, **último valor + tendência/comparação temporal**, **reutilizando** a montagem de
  `/dashboard/saude` (`lib/biomarkers` grouping/summarize) — **não** construir do zero. **Esforço:** médio. **Dep:**
  independente de A1. **Critério:** seção selecionável, por indicador com valor mais recente + tendência, rastreável à
  origem, respeitando o período; **sem** framing de diagnóstico.
- **A3 — Consistência da árvore + copy** (Exames×Histórico de Exames; ordem; rótulos) e fechamento do "espelho 100%".
  **Esforço:** baixo. **Dep:** A1, A2.

**Riscos — técnico:** A2, volume de biomarcadores na impressão/PDF (paginação/performance). **UX:** confundir
*Histórico de Exames* (evolução) com *Exames* (documentos).
**Simplificação proposta:** A2 = **resumo por indicador** (último valor + seta de tendência), **adiando gráficos no
PDF** — entrega o valor de acompanhamento sem o custo de renderizar gráficos para impressão. A árvore herda o SSOT da
navegação (sem re-desenho).

## ÉPICO B — Composição Corporal: finalização (auditar antes; provavelmente pequeno)
**Funcionalidades (ordem ideal):**
- **B0 — Auditoria de estado (0 código):** confirmar o que está pronto × pendente (bioimpedância end-to-end com
  origem; painel de peso/GLP-1; métricas duplicadas). Define o escopo real de B1–B3. **Critério:** checklist do estado.
- **B1 — Resolver as métricas duplicadas** (há uma **decisão pendente sua**: qual bloco entre *Resumo atual* e
  *Comparar avaliações* está redundante). **Proposta:** mesclar/clarificar em vez de apagar. **Esforço:** baixo.
  **Critério:** sem repetição dos mesmos indicadores; nenhum dado essencial perdido.
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

## Decisões suas necessárias antes de implementar
1. **Métricas duplicadas (B1):** qual bloco é o redundante — *Resumo atual* (grade de indicadores) ou *Comparar
   avaliações* (tabela entre duas datas)? (Recomendo **manter os dois** e apenas remover a sobreposição, se houver.)
2. **A2 no relatório:** aprova a **simplificação** (resumo por indicador + tendência, sem gráfico no PDF nesta versão)?
