# NOTIF-001 — Central de Notificações (infraestrutura ÚNICA · transversal)

> Fundadora (14/07/2026): uma SÓ infraestrutura de notificações para TODA a plataforma. O usuário
> configura, POR CATEGORIA de evento, o canal: **e-mail · WhatsApp · ambos · nenhum**. Reutilizada
> por todos os módulos — **proibido** implementação específica por funcionalidade. É a dimensão
> "Integrações transversais" (GATE de 4 dimensões) de todo módulo com item agendado.
>
> **Confirmação 17/07/2026 (FB-010).** A fundadora reforçou: a opção de **WhatsApp** deve estar disponível
> **em tudo**, ao lado do e-mail, em todo ponto de notificação. **Decisão de arquitetura (aprovada):** isso se
> realiza pela **Central de Notificações** (uma tela de preferências por categoria: e-mail/WhatsApp/ambos/nenhum),
> para a qual **todos os formulários apontam** — e **NÃO** por uma caixinha de WhatsApp duplicada em cada
> formulário (evita duplicação; padrão SINTERA de infra única). **Dependência operacional:** o **envio real** de
> WhatsApp exige um **provedor** (Meta WhatsApp Business API ou Twilio) + telefone verificado + credenciais
> (configuração da fundadora; nunca versionadas). A **preferência** fica salva desde já; o disparo liga quando o
> provedor for provisionado. Próxima entrega = construir a Central de Notificações (UI de preferências + coluna(s)
> de preferência por categoria) e ligar os módulos a ela.

## Modelo DEFINITIVO — 4 conceitos independentes (fundadora 17/07)
A Central evolui sobre **quatro conceitos ortogonais** (documentar o modelo completo, implementar por camadas):

1. **Categoria** — agrupa o que a usuária reconhece: Consultas · Exames · Medicamentos · Suplementos · Vacinas ·
   Hábitos · Compartilhamentos · (Conta e segurança) · … (aberto).
2. **Evento** — cada categoria tem seus próprios eventos (ex.: *lembrete · alteração · confirmação · cancelamento
   · resultado disponível · renovação de receita · estoque baixo*). Fase 2.
3. **Canal** — por evento (ou, na camada 1, por categoria): **Não receber · E-mail · WhatsApp · Ambos**.
4. **Prioridade** — **Obrigatórias** (segurança/acesso/LGPD: cadastro, senha, compartilhamento aceito) —
   independem das preferências, sempre enviadas; **Configuráveis** — seguem as escolhas da usuária.

**Camadas de implementação:**
- **Camada 1 (beta, FEITA):** preferências por **categoria** + **canal** + **prioridade** (bloco "Sempre enviadas")
  + botão **"Restaurar configurações recomendadas"** + **formulários exibem só o canal configurado com link
  "Alterar preferências"** (sem duplicar configuração). NÃO toca o worker de despacho.
- **Camada 2 (pós-estabilização):** configuração por **evento** (`event_key`) + reescrita da resolução do worker
  (com fallback seguro). Documentada como evolução planejada — evita redesenho futuro.

## Princípio arquitetural
Como o CPE concentra o clínico e o Billing concentra o comercial, a **notificação é um serviço único**:
os módulos apenas geram eventos agendáveis (via Eventos Assistenciais); o worker de notificações decide
canal consultando a **preferência do usuário por categoria** e despacha pelos **adapters de canal**
(e-mail, WhatsApp). Nenhum módulo conhece canal/provedor.

```
Eventos (health_events/agenda_events) ─► Worker de notificações ─► resolve canal por CATEGORIA (preferências)
                                                                   └► adapters: Resend (e-mail) · Meta (WhatsApp)
```

## Refinamento 17/07/2026 (FB-010, fundadora) — fonte única + UX dos formulários

**A Central é a fonte ÚNICA de DUAS coisas** (não só do canal):
1. **Quais notificações** a usuária deseja receber, **por categoria** (liga/desliga por categoria).
2. **Por qual canal**, por categoria: **não receber · e-mail · WhatsApp · ambos**.

Exemplo: a usuária pode receber lembretes de **Consultas** e **Medicamentos**, e **não** receber de Suplementos/
Hábitos — cada categoria com seu canal. Categorias (crescem): Consultas · Exames e recorrência de exames ·
Medicamentos · Suplementos · Vacinas · Hábitos · Renovação de receitas (futuro) · Compartilhamentos (futuro).

**UX dos formulários (regra):** os formulários **NÃO duplicam** essas configurações (nada de dois checkboxes
"e-mail"/"WhatsApp" em cada tela). Eles **usam** a preferência da Central e, quando fizer sentido, apenas
**exibem** o canal atual com um link para alterar. Ex.: ao marcar recorrência de um exame → *"Canal de
notificação: WhatsApp e E-mail · **Alterar canal**"* (link → Central de Notificações).

**Exceção — notificações PONTUAIS.** Ações one-off (ex.: *"compartilhar um relatório com um médico"*) **podem**
escolher o canal na própria ação (Enviar por e-mail? por WhatsApp?), porque a escolha vale só para aquela ação —
não é preferência permanente.

**Sequenciamento (decisão 17/07 — beta em estabilização).** O modelo-ALVO é o de 3 níveis (categoria→evento→
canal) + prioridade. Como já existe uma Central por **categoria** integrada a um **worker de despacho vivo**
(`api/agenda/reminders`), a evolução é em duas fases para não desestabilizar o envio real:
- **FASE 1 (beta, feita):** enriquecer a Central de **categoria** existente — **Prioridade** (bloco "Sempre
  enviadas" com as obrigatórias, fora das preferências) + botão **"Restaurar configurações recomendadas"** +
  reaproveitar telefone/WhatsApp; sem tocar o worker. Lib: `MANDATORY_NOTIFICATIONS`, `recommendedChannels()`.
- **FASE 2 (pós-estabilização):** evoluir a persistência para **nível-evento** (`event_key`) e reescrever a
  resolução do worker por evento (com fallback seguro para o comportamento atual). Só então a granularidade
  por tipo de evento passa a valer no despacho.

**Detalhe arquitetural — separar CATEGORIA de EVENTO.** Uma **categoria** agrupa vários **tipos de evento**:
- Medicamentos → *lembrete de horário · renovação de receita · estoque acabando (futuro)*
- Exames → *exame agendado · lembrete de recorrência · resultado recebido (futuro)*
- Consultas → *lembrete da consulta · alteração de horário · confirmação*

A configuração começa **por categoria** (simples); o modelo já prevê **granularidade por tipo de evento** dentro
da categoria, para evoluir **sem redesenhar** (compatibilidade retroativa). Persistência: `preferência(usuário ×
categoria [× tipo_de_evento opcional] → canal)`; o default por categoria vale enquanto não houver override por evento.

## Reúso confirmado (descoberta 14/07 — não recriar)
- **Conteúdo canônico único:** `src/lib/agenda/notification.ts` (`buildEventNotification`) — fonte de
  verdade do conteúdo, já consumida por e-mail e WhatsApp.
- **Adapters de canal:** `src/lib/email/*` (Resend) · `src/lib/whatsapp/send.ts` (Meta Cloud, template
  aprovado, degrada sem lançar).
- **Orquestrador:** `src/app/api/agenda/reminders/route.ts` — multi-canal + dedup + marca enviado;
  acionado por **pg_cron + pg_net** (padrão rota Next protegida por `ADMIN_SECRET`).
- **Categorias:** `EVENT_TYPE_DEFS`/`EVENT_TYPE_LABELS` (`src/lib/agenda/presentation.ts`).
- **Preferências (base):** `profiles.phone` + `pref_whatsapp_reminder` (opt-in legado) + tela
  `dashboard/configuracoes`.

## Entregue (fundação — 14/07)
- **Domínio** `src/lib/notifications/preferences.ts` — contrato `NotificationChannel`
  (email/whatsapp/both/none), `NOTIFICATION_CATEGORIES` (abertas), `categoryForEventType` (mapa aberto,
  fallback 'outro'), `resolveChannels`, `resolveChannelsForEvent` (preferência manda; sem ela mantém o
  comportamento atual — e-mail sempre; WhatsApp com opt-in legado). Puro/determinístico.
- **Persistência** migration 115 `notification_preferences` (user × categoria × canal; RLS por dono;
  advisor limpo). `category` string aberta.
- **Orquestrador** consulta as preferências por categoria e decide os canais por evento (inclui 'none' =
  não notifica, marca processado sem re-tentar).
- **UI** `dashboard/configuracoes` — card "Central de Notificações" com a matriz categoria × canal.
- **Certificação** `tests/notifications/FUNC-notification-preferences.test.ts` (12 casos).

## Pendências (backlog — para NOTIF-001 concluir pelas 4 dimensões)
- Generalizar o worker além da Agenda (hoje lê health_events/agenda_events; estender a qualquer módulo
  que gere item agendável, sem duplicar).
- Multi-antecedência por categoria (ex.: exames 30d/7d/1d/no dia) e quiet hours.
- Histórico de entregas (auditabilidade) — tabela de deliveries se/quando necessário.
- WhatsApp em produção depende de pré-requisitos de negócio (CNPJ, verificação, número) — **config de
  produção, dependente da fundadora** (código pronto, degrada). Cron de lembretes versionado em migration.
- Confirmação de execução (medicamento tomado / exame realizado) alimentando histórico (ver backlog §6.4).

## Posição
Capacidade transversal (Eventos · **Notificações** · Billing), pré-CARE. Relaciona:
`evento_assistencial_entidade_central` · `billing_001_assinaturas` · `principio_capacidade_concluida_4dimensoes`.
