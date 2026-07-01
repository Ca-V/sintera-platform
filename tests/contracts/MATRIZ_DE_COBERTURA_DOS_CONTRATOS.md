# SINTERA — Matriz de Cobertura dos Contratos

> Documento de **engenharia** (não de produto). Consolida a seção `COBERTURA` de cada contrato para (1) identificar lacunas e (2) planejar implementação e testes automatizados. Gerado ao fim da Fase 2 (replicação). Fonte de verdade: os arquivos `*.contract.test.ts`.

## Matriz por jornada

| Jornada | Componentes-chave | Programas | Eventos | Estados | Projeções |
|---|---|---|---|---|---|
| Documento → Compartilhar | CaptureCenter · Indicator* · Timeline · RelatedItems · ReportSection · SituationCard | Diabetes | Exame | Entrada→Compartilhamento | Exame · Indicador · Histórico · Relatório · report_shares |
| Interromper → Retomar | ActionForm · SituationCard · Dashboard | — (transversal) | Compra | Entrada(parcial) · Acompanhamento · Confirmando · Sucesso | Gasto · Agenda · Histórico |
| Ceratocone + Sjögren | CaptureCenter · Card de item(kind) · ActionForm · Timeline · RelatedItems · ReportSection | Oftalmologia | Compra · Adaptação · Troca | Dispositivo ativo · Receita vigente | Histórico · Gastos · Agenda · Relatório |
| Gravidez | CaptureCenter · SituationCard · Timeline · IndicatorEvolutionCard · Programa · Rede de Cuidado · ReportSection | Saúde da Mulher | Exame pré-natal · Consulta · Vacina | Gestação ativa · transição de trimestre · atenção | Agenda · Histórico · Indicadores · Relatório |
| Infantil | CaptureCenter · SituationCard · Timeline · IndicatorEvolutionCard · Programa · Rede de Cuidado · ReportSection | Saúde Infantil | Vacina · Consulta · Exame | Dependente ativo · atenção | Agenda · Histórico · Indicadores · Relatório |
| Idoso | CaptureCenter · Card de item · ActionForm · SituationCard · Timeline · Programa · Rede de Cuidado · ReportSection · Card Financeiro | Cardiometabólico · (múltiplos) | Compra · Recompra · Consulta · Exame | Várias condições ativas · atenção | Agenda · Histórico · Gastos · Indicadores · Relatório |
| Diabetes | CaptureCenter · Card de item · ActionForm · Timeline · Indicator* · ReportSection · SituationCard | Cardiometabólico | Compra · Troca · Exame | Condição ativa · atenção | Histórico · Gastos · Agenda · Indicadores · Relatório |
| Preventiva | CaptureCenter · SituationCard · Indicator* · Programa · ReportSection | Preventivo | Exame de rotina · Consulta | Sem condição · atenção | Indicadores · Agenda · Histórico · Relatório |
| Autoimunes | CaptureCenter · Card de item · ActionForm · SituationCard · Timeline · IndicatorEvolutionCard · Programa · Rede de Cuidado · ReportSection · Card Financeiro | Autoimune | Compra · Recompra · Consulta · Exame | Múltiplas condições ativas · atenção | Histórico · Gastos · Agenda · Indicadores · Relatório |
| Saúde Mental | Card de item · ActionForm · Timeline · SituationCard · ReportSection | Saúde Mental | Compra · Recompra · Consulta | Tratamento ativo · atenção | Histórico · Gastos · Agenda · Relatório |

## Cobertura por componente *(quais jornadas exercitam cada um)*
| Componente | Jornadas que exercitam |
|---|---|
| CaptureCenter | Documento · Ceratocone · Gravidez · Infantil · Idoso · Diabetes · Preventiva · Autoimunes |
| ActionForm | Interromper · Ceratocone · Idoso · Diabetes · Autoimunes · Saúde Mental |
| Card de item (kind) | Ceratocone · Idoso · Diabetes · Autoimunes · Saúde Mental |
| SituationCard | **todas** |
| Timeline | Documento · Ceratocone · Gravidez · Infantil · Idoso · Diabetes · Autoimunes · Saúde Mental |
| IndicatorSummaryCard / EvolutionCard | Documento · Gravidez · Infantil · Idoso · Diabetes · Preventiva · Autoimunes |
| RelatedItems | Documento · Ceratocone |
| ReportSection | **todas** |
| Card de Programa | Gravidez · Infantil · Idoso · Diabetes · Preventiva · Autoimunes |
| Rede de Cuidado (widget) | Gravidez · Infantil · Idoso · Autoimunes |
| Card Financeiro | Idoso · Autoimunes |

## Lacunas observadas *(insumo de planejamento — não defeito)*
- **RelatedItems** exercitado só em 2 jornadas (Documento · Ceratocone) → ao implementar, garantir uso transversal (já previsto: é o "Relacionado" de todas as telas).
- **Card Financeiro** só em jornadas com múltiplos custos (Idoso · Autoimunes) — esperado (especializado).
- **Rede de Cuidado** restrito às jornadas compartilhadas/dependentes — esperado (subconjunto).
- Núcleo presente em (quase) todas: **CaptureCenter · ActionForm · Timeline · SituationCard · ReportSection** → prioridade de implementação e de testes reais (L1).

## Ordem de ativação sugerida
`L1 (UX) → L2 (domínio) → L3 (integração)` por contrato, começando pelos componentes de núcleo. Os passos de domínio dependem do **Estado 2** (congelado até o fim do monitoramento T2-C). Os contratos são os **critérios de aceite** da implementação.
