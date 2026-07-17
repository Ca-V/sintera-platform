# BACKLOG DE BETA — Sprint final para liberação a usuárias

> **Origem:** solicitação da fundadora (17/07/2026) após revisão funcional — "Sprint Final para Beta", 14 itens
> em 6 prioridades. Objetivo: liberar a plataforma para acesso e teste de usuárias.
> **Regras herdadas:** preservar arquitetura (ADR-000 + normativos), aderência ao SPAGS (quando disponível),
> Modelo Canônico, rastreabilidade, alimentação automática de Timeline/Agenda/Histórico/Despesas, **sem duplicação
> de dados**, **reúso de componentes compartilhados**. Compliance Gate + aderência antes de cada merge.
> **Classificação por tipo:** `IMPL` (implementação autônoma) · `ARQ` (toca arquitetura permanente → nota de
> desenho/ADR ANTES) · `DS` (design system) · `GOV` (governança) · `EXT` (depende de asset/decisão externa).

## Estado que JÁ EXISTE (reduz escopo — reusar, não recriar)
- **Despesas** = domínio `/dashboard/gastos` (projeção `listFinancial` do Evento Assistencial). → item 14 já é isto.
- **Captura institucional** = `CreateRecordMenu` (arquivo/foto/manual + slot de voz "Falar"). → item 2 = rollout.
- **Campos financeiros no Evento** = `amountCents`, `directExpense`, `attachmentUrl`. → base dos itens 3 e 7.
- **Paleta Van Gogh / Almond Blossom** = aqua turquesa já é a cor principal (tokens em globals.css). → item 11 = varredura + sidebar + dourado, não recomeço.
- **Ciclo e Contracepção** = `/dashboard/ciclo`. **Recursos de Saúde** = `/dashboard/recursos`. **Medidas** = `/dashboard/medidas`.

---

## PRIORIDADE 1 — OBRIGATÓRIO ANTES DO BETA

- □ **BETA-1 · Reorganização da navegação** `IMPL` — **DECISÃO DA FUNDADORA (17/07):** módulo principal **"Histórico" → "Registros de Saúde"** (responde "quais informações de saúde estão armazenadas"; escala p/ vacinas/procedimentos/internações/documentos sem renomear); submódulo/aba **"Evolução" → "Histórico de Exames"** (responde "como esse exame foi registrado ao longo do tempo"). A aba "Linha do Tempo" permanece dentro de "Registros de Saúde". Refletir em: menu lateral, abas (`HistoricoTabs`), breadcrumbs, títulos de página (`saude/page` "Histórico — Evolução", `timeline`), relatórios (`ReportView`), links internos e docs. Fazer só APÓS concluir Exames/Eventos.
- □ **BETA-4 · Restaurar "Tipo → Outros" em Recursos de Saúde** `IMPL/bug` — campo existia e sumiu; restaurar. *(Item mais rápido; começa por aqui.)*
- □ **BETA-3 · Exames: valor pago + anexos financeiros (NF/recibo/comprovante)** `IMPL` — adicionar ao cadastro de exame; anexos vinculados ao exame; alimentar Despesas/Relatórios/Histórico/Agenda. Reusa infra financeira do Evento.
- □ **BETA-5 · Medidas: um único "Adicionar Medida"** `IMPL` — substituir os dois caminhos ("Escanear Bioimpedância" + "Adicionar") pelo padrão institucional (`CreateRecordMenu`); bioimpedância detectada automaticamente no processamento (sem botão dedicado).
- □ **BETA-2 · Padrão único de captura em TODO módulo** `IMPL/ARQ-leve` — `CreateRecordMenu` como único ponto de "Adicionar" (arquivo/arrastar/foto/manual/voz) em Exames, Recursos, Medidas, Medicamentos, Contracepção, Agenda, Documentos e demais cadastros. Consolidar "arrastar" e "voz" onde faltam. Elevar a padrão institucional (CAP-001).
- □ **BETA-7 · Integração financeira universal** `ARQ` — regra transversal: todo registro com valor/NF/recibo/comprovante alimenta Despesas automaticamente (Exames, Medicamentos, Contracepção, Recursos, Consultas, Procedimentos…). **Nota de desenho ANTES** (projeção canônica → Despesas; evitar duplicação).
- □ **BETA-6 · Contracepção compatível + integração com Medicamentos** `ARQ` — adicionar valor/NF/recibo/comprovante, recorrência de uso, data prevista de reposição, lembretes na Agenda; quando o método for medicamento (ex.: pílula), **registro ÚNICO compartilhado** entre Contracepção e Medicamentos (sem duplicar), alimentando Agenda/Histórico/Despesas/Relatórios. **Nota de desenho ANTES** (registro de origem compartilhado no Modelo Canônico).

## PRIORIDADE 2 — RELATÓRIOS
- □ **BETA-8 · Evolução do módulo de Relatórios** `IMPL` — incluir seções "Registros de Saúde" (todo o histórico), "Histórico de Exames" (cronológico) e "Documentos Financeiros" (por registro: tipo, descrição, valor, data, documento; visualizar; download individual; **download em lote** de NFs/comprovantes). Objetivo: enviar documentação ao contador (IR/reembolso).

## PRIORIDADE 3 — HOME DA PLATAFORMA
- □ **BETA-9 · Home institucional (Login → Home → Dashboard)** `IMPL` — nova página inicial com o que é a SINTERA, propósito, missão, visão, benefícios, como funciona, o que registrar, como compartilhar, segurança/privacidade. Copy a partir da narrativa estratégica (fundadora aprova).
- □ **BETA-10 · Vídeo institucional na Home** `EXT` — vídeo curto (funcionamento, envio de docs, foto, voz, manual, indicadores, Timeline, compartilhamento, relatórios). **Depende de asset produzido pela fundadora/equipe**; deixo o slot pronto na Home.

## PRIORIDADE 4 — DESIGN SYSTEM
- □ **BETA-11 · Revisão da identidade visual (Almond Blossom / Van Gogh)** `DS` — paleta predominante aqua/azul-esverdeado/bege/branco/marrom/preto/**dourado**; **prioridade: sidebar** (contraste, item ativo, consistência); aplicar em botões, cards, gráficos, ícones, formulários, hover, alertas, indicadores, Timeline, Dashboard, Home. **Base já existe**; escopo = varredura de aderência + sidebar-first + inclusão do dourado. Sequenciar após P1 (não desestabilizar o funcional).

## PRIORIDADE 5 — GOVERNANÇA
- □ **BETA-12 · Consistência arquitetural** `GOV` — requisito transversal aplicado a TODOS os itens acima: preservar SPAGS/ADRs/Modelo Canônico, rastreabilidade, alimentação automática (Timeline/Agenda/Histórico/Despesas), sem duplicação, reúso de componentes. (Não é tarefa isolada — é gate de cada merge.)

## PRIORIDADE 6 — CONFORMIDADE
- □ **BETA-13 · Auditoria final de conformidade + relatório de prontidão** `GOV` — antes do beta: aderência a regulatório/jurídico/LGPD/SPAGS/normativos (COMPLIANCE-001, DATA-001/002, API-001, AI-001, HIP-001, ADRs)/governança da informação. Relatório: implementadas · pendências · riscos · recomendações · checklist de prontidão.

## SUGESTÃO ESTRATÉGICA DA FUNDADORA (aceita)
- □ **BETA-14 · Domínio "Despesas em Saúde" consolidado** `ARQ (já alinhado)` — **já existe** como `/dashboard/gastos` (consolida via projeção, sem duplicar). Enriquecer: filtro por categoria, consulta por período, export IR, relatórios financeiros, evolução de custos. Confirma e completa a regra do BETA-7.

---

## Carryover do backlog anterior
- □ **EVT-C6 — EventLink write-side** (popular "Relacionado" ao criar evento a partir de exame/pedido; fecha NC-0006). Pequeno; encaixar cedo ou junto ao BETA-3/BETA-7 (mesma família de vínculo).

## Sequência proposta (dentro da prioridade da fundadora)
1. Rápidos/autônomos sem bloqueio: **BETA-4 → BETA-3 → BETA-5** (+ EVT-C6).
2. **Notas de desenho (ADR interino)** para os `ARQ`: BETA-7 (projeção financeira universal), BETA-6 (registro compartilhado Contracepção↔Medicamentos), BETA-2 (captura institucional / CAP-001). Depois implementar.
3. **BETA-1** após decisão de nav.
4. **BETA-8** (relatórios) → **BETA-9/10** (Home/vídeo) → **BETA-11** (DS) → **BETA-13** (auditoria final).

## Decisões da fundadora (17/07) — REGISTRADAS
- **Nav (BETA-1):** Histórico→**Registros de Saúde** (módulo principal); Evolução→**Histórico de Exames** (submódulo).
- **Arquitetura (BETA-2/6/7/14): ADRs INTERNOS AGORA** (Opção 1). Escrever ADRs para TODAS as decisões arquiteturais necessárias, **aderentes aos princípios** (arquitetura aberta, modelo canônico, reúso de componentes/serviços, **não-duplicação de dados**, rastreabilidade, Compliance by Design) e redigidos para o **SPAGS apenas os organizar depois** (integração de documentação, não de código). **Não aguardar o SPAGS.** Tratar como decisões arquiteturais PERMANENTES já: (a) componente único de captura p/ toda a plataforma; (b) modelo financeiro universal (valor·NF·recibo·comprovante); (c) domínio Despesas consolidado alimentado automaticamente; (d) integração Contracepção↔Medicamentos sem duplicação; (e) propagação automática p/ Timeline·Agenda·Histórico·Indicadores·Compartilhamentos·Relatórios quando pertinente; (f) reúso máximo de componentes/serviços entre domínios.
- **Prioridade mantida:** **concluir Exames e Eventos primeiro** (EVT-C6), depois os itens de beta na ordem P1→P6. As decisões arquiteturais devem ACELERAR, não gerar retrabalho.

## Pontos que ainda dependem da fundadora
1. **Vídeo institucional** (BETA-10) — asset de conteúdo.
2. **Sign-off visual** do DS (BETA-11) e da copy da Home (BETA-9).
3. **SPAGS** — quando fornecido, organiza os ADRs internos (sem retrabalho de código).
