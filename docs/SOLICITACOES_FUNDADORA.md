# Solicitações da Fundadora — Registro Oficial (log de mudanças)

**Objetivo:** registrar **toda** solicitação/observação da fundadora com **ID, data e status**, para que
**nada se perca** e para **evitar pedidos repetidos**. **Regra:** antes de implementar qualquer item, consultar
este log; ao concluir, atualizar o status com o commit. Subordinado a [[ARCH-000]] (operacional). Status:
`🔴 aberto` · `🟡 em andamento` · `🟢 feito` · `⏸ decisão pendente (fundadora)` · `🔁 repetido` (já pedido antes).

> **Por que existe:** a fundadora observou (17/07) que às vezes repete uma solicitação já feita. Este log é a
> fonte única para checar o que já foi pedido/feito. Cada rodada de validação vira entradas `FB-###`.

---

## Rodada de validação do Preview — 17/07/2026

| ID | Área | Solicitação | Status | Notas |
|---|---|---|---|---|
| **FB-001** | Exames · Financeiro | No detalhe do exame, tornar **acessível** valor pago · tipo de documento (NF/Recibo/Comprovante) · anexo fiscal · recorrência. Sugestão: seção **"Mais detalhes"**. | 🟢 feito 17/07 | Seção proeminente **"Financeiro e acompanhamento"** no detalhe: estado vazio com CTA **"Registrar valor / NF"** + (quando há) valor pago·tipo de documento·link do anexo·"em Despesas" + CTA de recorrência ("Criar lembrete de repetição"). Botões secundários redundantes removidos (sem duplicação). Visível no Preview após push. |
| **FB-002** | Exames · Card | Card deve mostrar **nome · local (emissor) · médico SOLICITANTE**. Mamografia com "Solicitante: Dra. Marilene" no laudo NÃO mostra o solicitante no card. | 🟡 re-extrair / verificar | **DIAGNÓSTICO:** o card JÁ mostra local e "Solicitante: X" (`exams/page:725-727`) — só renderiza quando o campo existe. O extrator (`requestingPhysician.ts`) RECONHECE "Solicitante: X" (LLM + normalização) e o analyze grava sem guarda write-once (`analyze:460`). Logo, o campo da mamografia está **vazio** porque o exame foi processado ANTES da captura (14/07). **Ação:** **re-extrair o exame** ("Extrair novamente") deve capturar "Dra. Marilene". Se persistir após re-extrair → o OCR não trouxe a linha OU o formato específico escapou → preciso do texto do laudo p/ ajustar o extrator. |
| **FB-003** | Exames · Bioimpedância | Bioimpedância = **exame**; resultados **alimentam** a Composição Corporal (BOD-001); Composição Corporal = só visualização. | 🟡 em andamento | **Decisão ✔️ (Bioimpedância→Exames).** **Subitem b ✅:** modelo clínico `bioimpedance` (parametric) + processador no CPE (`bioimpedance.ts`, +2 testes) — peso/IMC/%gordura/massa muscular/magra/óssea/água/gordura visceral/TMB. **Faltam:** (b2) classificação de um laudo de bioimpedância → `clinicalModel='bioimpedance'`; (c) fiação aditiva: ao processar, gravar os pontos em `body_metrics` com `source='bioimpedancia'` (+ migration da coluna `source`); (d) entrada por Exames + Composição Corporal lê. |
| **FB-004** | Recursos de Saúde | Unificar os **dois botões**; restaurar **Tipo→Outros**; **valor · doc fiscal · anexos · recorrência**. | 🟢 feito 17/07 | **A ✅:** um `CreateRecordMenu` (foto/arquivo/manual; receita→grau auto) + tipo **"Outros"** (migration 122) + Cancelar. **B ✅:** ação **"Registrar valor pago / NF"** no card abre o fluxo financeiro único (AgendarModal modo despesa) **vinculado ao recurso** (novo EventLink `resource`); captura valor + tipo de doc fiscal + anexo + recorrência; o card mostra 💰 valor + tipo do documento. Reúso do FIN-001 (Evento = portador; sem colunas de despesa por domínio). |
| **FB-005** | Wearables · Nomenclatura | "Sinais Vitais" fica limitado quando os conectores trouxerem atividade/sono/passos/FC/HRV/VO₂/etc. | 🟢 feito 17/07 | **DECISÃO DA FUNDADORA: "Sinais Vitais" → "Monitoramento".** Renomeado em: menu (Sidebar), página `/dashboard/sinais-vitais` (eyebrow+título+subtítulo), Relatórios (seção) e compartilhamento `r/[token]`. URL interna mantida. Visível no Preview. |
| **FB-006** | Ambiente Demo · Seed | Estruturar **seed reproduzível** (um comando cria usuário + popula tudo). Se a auth impedir criação automática, criar `demo@sintera.app` 1x e o script só popula. | 🟢 feito 17/07 | Função SQL `public.seed_demo()` (migration 121, fonte única, idempotente) + runner `scripts/seed-demo.mjs` (Admin API cria o usuário + chama a função) + `npm run seed:demo`. Requer `SUPABASE_SERVICE_ROLE_KEY` no ambiente (não versionado). Fallback manual documentado. |

| **FB-007** | Arquitetura · 3 domínios | Renomear **Medidas → Composição Corporal**; fixar como PRINCÍPIO a separação: **Registros de Saúde** (timeline de todos os eventos) · **Histórico de Exames** (exames + evolução por exame/biomarcador) · **Composição Corporal** (painel longitudinal multi-origem, foco GLP-1). "Histórico guarda o FATO; painéis apresentam conhecimento derivado/evolução." | 🟡 princípio ✅, painel a evoluir | **Rename ✅** (menu/página/relatório). **Princípio + domínio ✅** documentados em BOD-001 (registrado no ARCH-000). **Painel Composição Corporal (a construir, incremental):** indicadores com ROTULO DE ORIGEM (peso/IMC/%gordura/massa muscular/magra/óssea/água/gordura visceral/TMB/circunferências) + painel **GLP-1** (peso inicial/atual/meta/perda acumulada/ritmo/preservação de massa magra). Conecta ao FB-003 (bioimpedância/DEXA entram por Exames e alimentam este painel). |

## Rodada de validação do Preview — 17/07 (tarde)
| ID | Área | Solicitação | Status | Notas |
|---|---|---|---|---|
| **FB-008** | Exames · Financeiro/Despesas | **BUG (quebra princípio):** registrar valor/NF/recorrência num exame existente **cria um NOVO Evento de Saúde** → exame DUPLICA em Registros de Saúde + despesa duplica (um sem valor, outro com). Esperado: financeiro é **ATRIBUTO do exame** (o fato), **sem criar novo evento**; despesa única por exame (validação anti-duplicação); recorrência = **um** lembrete. | 🔴 aberto (ARQ, alta) | **Refina FIN-001:** o financeiro deve viver **no próprio fato** (exame→exame; recurso→recurso), não como Evento separado que aparece na timeline. **Plano:** (1) colunas financeiras no exame (`expense_amount_cents`/`expense_doc_type`/`expense_doc_url`), migração aditiva; (2) seção "Financeiro" do exame edita esses atributos (SEM criar evento); (3) Despesas = projeção sobre TODOS os fatos com valor (eventos + exames + recursos), cada um UMA vez; (4) validação anti-duplicação; (5) recorrência = 1 lembrete. Implementar no loop (prioridade sobre FB-003). |
| **FB-009** | Exames · Form de custo | "Despesa direta" vinha **marcada** ao abrir o form de valor do exame — deve vir **desmarcada** (o usuário marca se for). | 🟢 feito 17/07 | Removido `directExpense: true` do initialEvent (exame e recursos); o evento segue contando em Despesas por estar "realizado"; despesa direta = escolha do usuário. |

| **FB-010** | Nav · Barra lateral | Reestruturar/renomear a barra lateral (categoria "Histórico" + relação Exames × Histórico de Exames); definir distribuição em Acompanhamento × Minha Saúde + nomenclatura ideal. **Toda mudança na Sidebar reflete no Relatório.** | ⏸ proposta — aguarda aprovação | **PROPOSTA do Claude:** Acompanhamento = Agenda · **Registros de Saúde** (timeline de eventos = "Histórico" atual) · **Histórico de Exames** (funde "Exames"+"Evolução": documento/biomarcadores + evolução por exame) · Medicamentos e Suplementos. Minha Saúde = Condições · Composição Corporal · Monitoramento · Recursos · Hábitos · Ciclo. Organização = Despesas · Relatórios. **Decisões-chave:** (1) Histórico→Registros de Saúde; (2) Exames+Evolução MERGE→Histórico de Exames (elimina 3 itens sobrepostos→2 domínios). Implementar só após aprovação; espelhar no Relatório (SELECT_GROUPS). |

### Observação transversal (fundadora)
> A maior parte das alterações desta etapa **ainda não ficou perceptível** no Preview. **Prioridade:** tornar as
> funcionalidades já implementadas **claramente acessíveis na interface ANTES** de evoluir o restante do backlog.
> **Causa raiz (honesta):** muitas funcionalidades são **dirigidas por dados** (só aparecem com exames/eventos que
> tenham os campos) — por isso o **seed demo** é crítico — E há gaps reais de **descoberta/ponto de entrada**
> (FB-001) e possivelmente **regressão** (FB-002). Ambos entram como prioridade.

### Recomendações do Claude p/ os itens de decisão
- **FB-003 (Bioimpedância):** recomendo tratá-la como **exame** (é um laudo com clínica/profissional/data/valor),
  cujo processamento **alimenta automaticamente os indicadores corporais** (Medidas passa a ser a VISÃO dos
  indicadores no tempo, não o ponto de entrada do laudo). Alinha com FIN-001 (valor/NF via Evento) e com o
  Modelo Canônico. Alternativa mínima: manter em Medidas mas adicionar financeiro/recorrência/anexos.
- **FB-005 (nome da seção):** sugestões — **"Dados de Dispositivos"**, **"Monitoramento Contínuo"**, **"Dados de
  Wearables"** ou **"Sinais e Atividades"**. Recomendo **"Monitoramento Contínuo"** (abrange sinais vitais,
  atividade, sono, composição corporal) e é neutro a fabricante (coerente com HIP-001).
