# Release 1.0 — Definition (escopo congelado da versão)

**Status:** vivo até o congelamento do escopo · **Versão:** 0.1 (17/07/2026) · **Responsável:** Fundadora (decisão) · Claude (curadoria).
**Objetivo:** fixar o **escopo da 1.0** para que a reta final não cresça indefinidamente. **Regra de disciplina:**
toda ideia nova responde a UMA pergunta — **"Isso faz parte da Release 1.0 ou fica para a 1.1?"**. O padrão é **1.1**;
entrar na 1.0 exige decisão explícita da fundadora e caber nos critérios abaixo.

> Subordinado a [[ARCH-000]] (camada operacional). O **como** vem de `BACKLOG_BETA.md`; o **o quê/até onde**, daqui.

---

## 1. Escopo da versão 1.0 (o beta fechado)
Plataforma **web** de organização e continuidade da informação de saúde, centrada na pessoa, factual (não interpreta —
RDC 657), com captura universal, linha do tempo, financeiro, compartilhamento e infraestrutura de integrações.

## 2. Funcionalidades INCLUÍDAS na 1.0
- **Exames** — captura, estruturação, reprodutibilidade, evolução, pedidos/solicitações, financeiro. ✅ concluído.
- **Eventos Assistenciais** — Agenda/Histórico, preparo/desfecho/modalidade/prioridade/retorno, vínculos, recorrência. ✅ concluído.
- **Captura única institucional** (`CreateRecordMenu`) em todos os módulos com cadastro (BETA-2).
- **Modelo financeiro universal** — valor·NF·recibo·comprovante → Despesas, sem duplicação (BETA-7/FIN-001).
- **Despesas** consolidado (filtro/período/export IR) (BETA-14).
- **Connector Layer (HIP-001)** — infra completa vendor+domain-neutral, histórico de sync, reconciliação/dedup, painel operacional; **Strava ao vivo** + **Garmin completo até auth+sync** (ativação com credenciais) (BETA-WEAR/WEA-001).
- **Medidas** — captura única, bioimpedância auto-detectada. ✅ concluído.
- **Contracepção ↔ Medicamentos** — registro único compartilhado, recorrência/reposição/lembretes/financeiro (BETA-6).
- **Recursos de Saúde** — captura institucional + restauração "Tipo→Outros" (BETA-6/Recursos).
- **Home institucional** — Login→Home→Dashboard (BETA-9/HOM-001); slot para o vídeo.
- **Navegação** — Histórico→Registros de Saúde; Evolução→Histórico de Exames (BETA-1).
- **Design System essencial** — sidebar, cores principais, botões, cards (BETA-11-essencial).
- **Relatórios** — Registros de Saúde, Histórico de Exames, Documentos Financeiros (download em lote de NFs) (BETA-8/RPT-001).
- **Compartilhamento** (existente) e **Timeline/Indicadores** alimentados automaticamente.
- **Auditoria final de conformidade** + relatório de prontidão (BETA-13).

## 3. Funcionalidades EXCLUÍDAS da 1.0 (→ 1.1+)
- **App nativo iOS/Android** e, com ele, **Apple Health / Health Connect** (exigem nativo — MOB-001).
- **Ativação de Garmin/WHOOP** dependente de aprovação de parceria (infra pronta; liga quando a credencial chegar).
- **Identidade visual completa** (só o essencial entra; o resto evolui durante o beta).
- **Vídeo institucional** (asset da fundadora; a Home entra com o slot pronto, o vídeo pode chegar depois).
- Conectores além de Strava/Garmin (labs, hospitais, EMR, farmácias, seguradoras — HIP-001 os comporta, 1.1+).
- CARE-001 (Care Space), modalidades clínicas novas (Pentacam rica/E6), billing comercial ativo.

## 3.1 DECISÃO ARQUITETURAL OBRIGATÓRIA — Base única Beta = Produção 1.0 (fundadora 17/07)
> **O Beta Oficial da SINTERA utilizará a mesma base de dados que será promovida para Produção 1.0. Não haverá
> migração entre um banco de beta e um banco de produção. O ambiente poderá possuir mecanismos de isolamento,
> monitoramento e feature flags, mas os dados inseridos pelos usuários participantes do beta constituirão o
> histórico oficial da plataforma e deverão ser preservados integralmente.**

Base arquitetural que sustenta a decisão: extrações *append-only*; identidade documental *write-once*; migrations
**aditivas/reversíveis** (nunca destrutivas); Modelo Canônico preserva o documento original (princípios Preservação
do Original · Backward Compatibility · Evolução sem Quebrar). Migração destrutiva ou troca de base que perca dados
de usuária é **proibida**. Isolamento/monitoramento/feature flags são permitidos; perda de histórico do beta, não.

## 3.1.1 POLÍTICA DE AMBIENTES — Preview × Produção (ressalva da fundadora 17/07)
O Preview da Vercel aponta hoje para o **mesmo banco** da produção. **Isso é aceitável APENAS enquanto** (i) esse
banco ainda é o ambiente oficial do beta **e** (ii) **não há usuárias reais** usando a plataforma.

**Gatilho — a partir da primeira usuária beta EXTERNA:** obrigatório **um** dos dois:
- **(a) separar os ambientes** (Preview e Produção com bancos distintos), ou
- **(b) no mínimo**, proteger **toda funcionalidade experimental/incompleta por feature flag**, de modo que um
  deploy de Preview **nunca afete** os dados ou a experiência de usuárias reais.

Consequência prática: **antes de onboarding de usuária externa, feature flags para o que está incompleto deixam de
ser recomendação e passam a ser requisito** (reforça o §3.2 item 5). Preview com código experimental tocando dados
reais de usuárias é proibido.

## 3.2 GATE DE PRIMEIRO PUSH / PREVIEW (pré-beta) — checklist obrigatório (fundadora 17/07)
Antes de publicar a primeira URL (Vercel) para a fundadora ou usuárias, TODOS devem estar ✅ — para que a URL já
represente um ambiente utilizável por usuárias reais, sem reinicializar a base depois:
1. **Build de produção sem erros** (`next build`).
2. **Testes automatizados passando** (suíte verde).
3. **Migrations aplicadas e verificadas** (schema em dia; nenhuma pendente).
4. **Seed inicial** (se necessário).
5. **Feature flags** configuradas para funcionalidades ainda incompletas (ex.: Connector Layer/wearables sem
   credenciais → oculto/rotulado, nunca quebrado).
6. **Backup e restauração do banco** testados (política validada).
7. **Observabilidade mínima** (logs, erros e monitoramento — OPS-001).

**Foco de fase (fundadora 17/07):** a partir daqui, MENOS features novas e MAIS **estabilização, observabilidade e
preparação do ambiente**. Novas ideias passam por "1.0 ou 1.1?" com viés conservador para a 1.0.

## 4. Critérios de ACEITE (cada item incluído)
- Código de produção + TSC limpo + suíte verde + Compliance Gate (9 eixos) + commit rastreável.
- Aderência ao Modelo Canônico, rastreabilidade e **não-duplicação**; reúso de componentes institucionais.
- Alimentação automática de Timeline/Agenda/Histórico/Despesas quando pertinente.
- Documento de domínio criado/atualizado quando o item é arquitetural (convenção ARCH-000 §4).

## 5. Critérios para INÍCIO do beta (entrar com usuárias)
1. Itens INCLUÍDOS §2 concluídos OU com degradação segura documentada (nunca quebra visível).
2. Home institucional publicada (1ª tela) + navegação renomeada.
3. Captura institucional funcionando em todos os módulos de cadastro.
4. Auditoria de conformidade (BETA-13) sem NC **crítica/alta** aberta; LGPD/consentimento ativos.
5. Ambiente de produção logável e observável (OPS-001); segredos no Vault (não no código).

## 6. Critérios para ENCERRAMENTO do beta
1. Jornadas-chave validadas por usuárias reais (captura → estruturação → timeline → relatório → compartilhamento).
2. Estoque de NC crítica/alta = 0; P1 tratadas; P2 trilhadas no backlog.
3. Feedback incorporado ou explicitamente adiado para 1.1 (sem escopo crescer na reta final).
4. Métricas operacionais estáveis (erros de sync, falhas de captura) dentro do aceitável.

## 7. Critérios para LANÇAMENTO público (1.0 GA)
1. Beta encerrado (§6) + auditoria regulatória/jurídica/LGPD final aprovada.
2. Conectores estratégicos com credenciais oficiais ativas OU claramente sinalizados como "em breve".
3. Billing/assinaturas prontos se o lançamento for comercial (BILLING-001).
4. Documentação institucionalizada (ARCH-000 completo; domínios com doc próprio).
5. Plano de suporte e de resposta a incidentes ativo.

---
**Processo:** mudanças de escopo só por decisão da fundadora, registradas aqui com data. Cada nova ideia recebe rótulo
**[1.0]** ou **[1.1]** antes de entrar em qualquer backlog. **Relaciona:** ARCH-000 · BACKLOG_BETA · COMPLIANCE-001 · GOV-001.
