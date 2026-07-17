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

## DESIGN SYSTEM — ESSENCIAL agora, resto durante o beta (fundadora rev.2)
- □ **BETA-11-essencial · DS mínimo p/ beta** `DS` — SOMENTE: **sidebar** (contraste, item ativo, consistência), **cores principais**, **botões**, **cards**. Paleta Almond Blossom/Van Gogh (aqua/azul-esverdeado/bege/branco/marrom/preto/dourado) — base já existe; incluir dourado. Fazer JUNTO do rename de nav (BETA-1) para tocar a sidebar uma vez.
- ⏸ **BETA-11-completo · Identidade visual completa** `DS` — gráficos, ícones, formulários, hover, alertas, indicadores, Timeline, Dashboard inteiros — **evolui durante o beta** (não bloqueia a liberação).

## PRIORIDADE 5 — GOVERNANÇA
- □ **BETA-12 · Consistência arquitetural** `GOV` — requisito transversal aplicado a TODOS os itens acima: preservar SPAGS/ADRs/Modelo Canônico, rastreabilidade, alimentação automática (Timeline/Agenda/Histórico/Despesas), sem duplicação, reúso de componentes. (Não é tarefa isolada — é gate de cada merge.)

## PRIORIDADE 6 — CONFORMIDADE
- □ **BETA-13 · Auditoria final de conformidade + relatório de prontidão** `GOV` — antes do beta: aderência a regulatório/jurídico/LGPD/SPAGS/normativos (COMPLIANCE-001, DATA-001/002, API-001, AI-001, HIP-001, ADRs)/governança da informação. Relatório: implementadas · pendências · riscos · recomendações · checklist de prontidão.

## SUGESTÃO ESTRATÉGICA DA FUNDADORA (aceita)
- □ **BETA-14 · Domínio "Despesas em Saúde" consolidado** `ARQ (já alinhado)` — **já existe** como `/dashboard/gastos` (consolida via projeção, sem duplicar). Enriquecer: filtro por categoria, consulta por período, export IR, relatórios financeiros, evolução de custos. Confirma e completa a regra do BETA-7.

---

## Carryover do backlog anterior
- ☑ **EVT-C6 — EventLink write-side** — concluído (commit f49b39f). Exames/Eventos 100% concluídos.

## ORDEM DE EXECUÇÃO — revisão 2 da fundadora (17/07)
> Núcleo primeiro (captura + financeiro alimentam os demais módulos); Home antes de Relatórios (é a 1ª tela
> da usuária); DS **essencial** (não a identidade inteira agora); "Outros" entra junto de Recursos. **Reúso
> máximo** — nunca implementação específica quando um componente institucional atende múltiplos módulos.

1. **BETA-2 · Captura única institucional (rollout completo)** `ARQ` — **ADR gate = CAP-001** (spec congelada e aprovada pela fundadora; não duplicar). O componente `CreateRecordMenu` JÁ é completo (arquivo/foto/manual + **voz** via slot + **arrastar** via drop→bundle + multipágina) — BETA-2 é puro **rollout de adoção**. **Adoção atual:** ✅ Exames · ✅ Medicamentos · ✅ Condições · ❌ Recursos · ❌ Medidas · ❌ Contracepção(ciclo) · ❌ Agenda · ❌ Documentos · ❌ Sinais Vitais · ❌ Hábitos. Meta: `CreateRecordMenu` como ÚNICO "Adicionar" em cada um (os módulos com passo dedicado — Medidas/Contracepção/Recursos — recebem a captura ao chegar seu passo; os demais entram aqui). Nenhum `<input type=file>` avulso.
2. **BETA-7 · Modelo financeiro universal** `ARQ` — ADR interino ANTES; valor·NF·recibo·comprovante → projeção automática p/ Despesas em qualquer módulo, sem duplicação.
3. **BETA-3 · Exames com integração financeira** — valor + anexos financeiros vinculados ao exame; alimenta Despesas/Relatórios/Histórico/Agenda (consome o padrão do item 2).
4. **BETA-WEAR · Infraestrutura de Wearables (Connector Layer / HIP-001)** `ARQ` — **NOVO (fundadora 17/07, rev.3)**. Concluir a Connector Layer prevista no HIP-001: conector vendor-neutral (Adapter), OAuth2 quando aplicável, sync automática+manual, proveniência da fonte, persistência no Modelo Canônico (UCDA), propagação p/ Timeline·Indicadores·Registros de Saúde, novos conectores sem alterar domínios; dados mínimos (atividades·passos·distância·calorias·FC·sono·carga/recuperação·VO₂máx quando disponíveis), **nunca substituindo a fonte** (proveniência preservada). Conectores P1: Garmin·Strava·WHOOP; P2: Apple Health·Health Connect. **VER RESTRIÇÕES DURAS ABAIXO** (credenciais de provedor = dep. externa; Apple Health/Health Connect = exigem app NATIVO, não conectam via web). Alcance autônomo agora: **toda a infraestrutura + 1 conector de referência em código até a fronteira de credenciais**.
5. **BETA-5 · Medidas** — único "Adicionar Medida" via captura institucional; bioimpedância auto-detectada.
5. **BETA-6 · Contracepção integrada a Medicamentos** `ARQ` — ADR interino ANTES; registro ÚNICO compartilhado (pílula), recorrência, reposição, lembretes, financeiro; propaga p/ Agenda/Histórico/Despesas/Relatórios.
6. **BETA-4+Recursos · Recursos de Saúde (inclui restaurar "Tipo→Outros")** — "Outros" é simples e entra junto; aplicar captura institucional ao módulo.
7. **BETA-9 · Home institucional** — Login→Home→Dashboard; copy da narrativa estratégica; slot p/ o vídeo (BETA-10, asset da fundadora). **Antes dos relatórios.**
8. **BETA-1 + BETA-11-essencial · Nav + Design System essencial** — renomear nav (Histórico→Registros de Saúde; Evolução→Histórico de Exames) JUNTO com a revisão da **sidebar + cores principais + botões + cards** (tocar a sidebar uma vez só; reúso). Restante do DS evolui durante o beta.
9. **BETA-8 · Relatórios** — Registros de Saúde, Histórico de Exames, Documentos Financeiros (download em lote de NFs p/ IR/contador). Depois da Home (relatório é uso posterior).
10. **BETA-13 · Auditoria final de conformidade + relatório de prontidão para beta** `GOV`.

**Regra transversal (BETA-12):** cada item preserva SPAGS/ADRs/Modelo Canônico, rastreabilidade, alimentação automática (Timeline/Agenda/Histórico/Despesas), **sem duplicação**, **reúso de componentes** — validado no Compliance Gate antes de cada merge.

**+ BETA-14 (Despesas consolidado)** entra naturalmente com os itens 2/3 (já existe `/dashboard/gastos`; enriquecer com filtro/período/export IR ao chegar em Relatórios).

### BETA-WEAR — restrições duras (documentadas em FASE-2-WEARABLES.md · HIP-001)
- **Credenciais de provedor = dependência externa da fundadora.** Cada conector (Garmin/Strava/WHOOP) exige registrar um app no portal do provedor e obter `client_id`+`client_secret`+`redirect_uri`. **Garmin e WHOOP exigem aprovação de PARCERIA/programa** (pode levar semanas). Sem credenciais o OAuth não conclui nem testa. Não tenho como criar essas contas.
- **Apple Health e Health Connect NÃO conectam por web.** São APIs **on-device** (HealthKit=iOS nativo; Health Connect=Android nativo). A SINTERA (beta) é uma app **web** — não há como um backend web ler esses hubs sem um **app nativo/companion**. Isso contraria a priorização estratégica (Apple Health #1): arquiteturalmente correta como hub, mas **inviável no beta web**. Fica como conector REGISTRADO no HIP-001, implementado quando existir app nativo.
- **O que EU construo autônomo agora (sem credencial/nativo):** Connector Layer completa — interface de conector (Adapter vendor-neutral), modelo canônico + migration (`wearable_connections`/séries), orquestração de sync (auto+manual), proveniência/versão/auditoria, autorização/consentimento (LGPD), propagação p/ Timeline·Indicadores·Registros, e **1 conector de referência (Strava/Oura — OAuth2 REST direto, sem parceria) em código até a fronteira do handshake**. Ativação real dos provedores = quando a fundadora fornecer credenciais.
- **DECISÃO DA FUNDADORA (17/07):** Opção 1 confirmada — construir a infra completa + conector de referência agora; Garmin/WHOOP/Strava ativam com credenciais; Apple Health/Health Connect = conectores registrados no HIP-001, implementados quando houver app nativo. ADR interino do BETA-WEAR ancorado no HIP-001 (já é a spec) — não duplicar.

## Decisões da fundadora (17/07) — REGISTRADAS
- **Nav (BETA-1):** Histórico→**Registros de Saúde** (módulo principal); Evolução→**Histórico de Exames** (submódulo).
- **Arquitetura (BETA-2/6/7/14): ADRs INTERNOS AGORA** (Opção 1). Escrever ADRs para TODAS as decisões arquiteturais necessárias, **aderentes aos princípios** (arquitetura aberta, modelo canônico, reúso de componentes/serviços, **não-duplicação de dados**, rastreabilidade, Compliance by Design) e redigidos para o **SPAGS apenas os organizar depois** (integração de documentação, não de código). **Não aguardar o SPAGS.** Tratar como decisões arquiteturais PERMANENTES já: (a) componente único de captura p/ toda a plataforma; (b) modelo financeiro universal (valor·NF·recibo·comprovante); (c) domínio Despesas consolidado alimentado automaticamente; (d) integração Contracepção↔Medicamentos sem duplicação; (e) propagação automática p/ Timeline·Agenda·Histórico·Indicadores·Compartilhamentos·Relatórios quando pertinente; (f) reúso máximo de componentes/serviços entre domínios.
- **Prioridade mantida:** **concluir Exames e Eventos primeiro** (EVT-C6), depois os itens de beta na ordem P1→P6. As decisões arquiteturais devem ACELERAR, não gerar retrabalho.

## Pontos que ainda dependem da fundadora
1. **Vídeo institucional** (BETA-10) — asset de conteúdo.
2. **Sign-off visual** do DS (BETA-11) e da copy da Home (BETA-9).
3. **SPAGS** — quando fornecido, organiza os ADRs internos (sem retrabalho de código).
