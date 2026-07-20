# V2 · Épico 3 — Sincronização contínua + validação do Aha Moment — PLANO

**Status:** PLANEJAMENTO — aguardando aprovação. **Nenhum código antes do aval.** Sob [[V2_PLANO_EXECUCAO]],
[[HIP-001_PLATAFORMA_INTEGRACOES]]. Épicos 1 (Fundação HIP-001) e 2 (conector cloud end-to-end, mock comportamental)
concluídos. Este épico **fecha a V2** — ainda com o mock (o Withings real depende das credenciais da fundadora).

## Objetivo do épico
Fechar a experiência de **RETORNO automático**: depois de conectar, o usuário volta e a história de saúde **cresceu
sozinha**, sem ação manual — e a plataforma torna esse benefício **percebido o quanto antes**. Este é o épico que
consuma o **critério de sucesso da V2**.

## ⭐ Diretriz de produto (fundadora 20/07) — a PERGUNTA que avalia tudo
> **"O usuário percebe claramente que a SINTERA trabalhou por ele sem que ele precisasse fazer nada?"**

Toda funcionalidade deste épico é avaliada por essa pergunta. **Sincronizar não basta — o usuário precisa PERCEBER que
algo aconteceu.** A **comunicação do benefício** é preocupação de primeira classe (não um detalhe): a experiência de
**retorno** deve tornar **evidente**, de forma natural e discreta (sem animações chamativas), que a plataforma está
**continuamente construindo** a história de saúde. Formas a avaliar/propor:
- **Indicação de que novos dados foram incorporados desde a última visita** (o "novo desde …").
- **Destaque visual dos novos registros** (sutil — ex.: marcador "novo" nos pontos recém-chegados).
- **Timeline / Histórico evidenciando o que mudou** (o que entrou sozinho aparece com clareza no lugar certo).
- **Mensagens discretas** que reforçam que a plataforma **trabalhou em segundo plano** — sem ruído, sempre dispensáveis.

Princípios de execução (mantidos): **reúso máximo** da infra existente · **consistência** com os padrões da plataforma ·
**simplicidade** da experiência · **nenhum novo padrão de interação** se já existir um equivalente.

## Problema que resolve para o usuário
No Épico 2, o dado só entra quando o usuário **clica "Sincronizar agora"**. O valor da captura automática só se realiza
se ela acontecer **sozinha** e o usuário **perceber**. Sem isso, a promessa "a SINTERA constrói sua história" continua
dependente de ação manual — e o **Aha se perde**. O norte deste épico é **reduzir o tempo até o 1º benefício percebido**.

## As 4 perguntas da versão (aplicadas ao épico)
1. **Problema:** o dado não entra sozinho no retorno; o benefício não é percebido.
2. **Transformação:** a história cresce sozinha **e o usuário percebe rápido**.
3. **Como saber que concluiu:** critérios de aceite + o indicador "tempo até o 1º benefício percebido".
4. **Por que antes da V3:** a Inteligência Longitudinal (V3) precisa de **fluxo contínuo real** e de saber que o valor
   está sendo percebido.

## Funcionalidades (o quê · ganho de experiência · contribuição ao Aha)

### F1 — Sincronização on-open (automática)
- **O quê:** ao abrir a plataforma/Conexões/Monitoramento, dispara a sync das fontes conectadas — **idempotente** e com
  **throttle** por última sincronização (não floodar provedor/worker).
- **Ganho de experiência:** o usuário **não precisa lembrar** de sincronizar; o dado novo já está lá quando ele chega.
- **Contribuição ao Aha:** elimina o passo manual entre "abrir" e "ver dado novo" → **reduz a ~zero** o tempo até o
  benefício no retorno.

### F2 — Mock comportamental que cresce no tempo
- **O quê:** o "Dispositivo de demonstração" passa a gerar **novas medições ao longo dos dias** (determinístico por
  data), simulando um dispositivo real que mede continuamente.
- **Ganho de experiência:** no Preview/demo, o retorno mostra **dados novos de fato** — "cresceu sozinha" é real, não
  estático.
- **Contribuição ao Aha:** permite **ver e validar** o benefício de retorno **já com o mock** (antes do Withings).

### F3 — Feedback de retorno ("sua história cresceu")
- **O quê:** aviso **sutil e dispensável** quando há dados novos sincronizados desde a última visita (ex.: "Sua história
  cresceu: N novas medições desde [data]"), com link para a Composição/Monitoramento.
- **Ganho de experiência:** torna o benefício **explícito** — o usuário não precisa caçar o que mudou.
- **Contribuição ao Aha:** transforma o dado que entrou em **benefício percebido** — é o coração da métrica.

### F4 — Indicador "tempo até o 1º benefício percebido"
- **O quê:** instrumentar dois marcos por usuário — (a) **conectou** a fonte; (b) **1º dado automático visível**
  (apareceu na Composição/Monitoramento e/ou o feedback F3 foi exibido). Registrar em `usage_events`.
- **Ganho de experiência:** (interno) mede se a experiência entrega o benefício rápido; orienta o refino de produto.
- **Contribuição ao Aha:** é o **instrumento que mede o Aha** — fecha o loop de produto.

## Contratos e componentes
- **`SyncService`** (Épico 1/2) — reuso total; on-open chama o **mesmo** `POST /api/connectors/[source]/sync`.
- **Hook `useOnOpenSync`** (novo, client) — montado em Conexões/Monitoramento; **debounce/throttle** por última sync
  (via `connector_sync_runs.last_success_at` ou marca local). Não muda contrato do serviço.
- **`MockWorld`** (Épico 2) — evoluir para **gerar medições por data** (função determinística do "hoje").
- **Feedback de retorno** (novo, UI) — compara `last_seen` do usuário × `recorded_at` das leituras.
- **Telemetria** — tabela `usage_events` (existente): eventos `connector_connected` e `connector_first_benefit`.

## Reaproveitamento da infra existente
- `SyncService` · `orchestrator` · `persistence` · `ConnectionStore` · `runtime.server` (Épico 1/2) — **sem mudança de
  contrato**.
- **Composição / Monitoramento** (V1) — destino de exibição já pronto.
- **`usage_events`** (migração 018) — telemetria.
- **`connector_sync_runs`** — última sync (base do throttle) e do "novo desde a última visita".

## Critérios de aceite
- Ao **retornar** (com fonte conectada), **novos dados aparecem SEM clicar sync** (on-open).
- O **mock demonstra crescimento** ao longo do tempo (datas diferentes → medições novas).
- O **feedback "sua história cresceu"** aparece quando há dado novo desde a última visita — e **não** aparece quando não há.
- Os **dois marcos** (conexão · 1º benefício) são registrados em `usage_events`.
- On-open sync é **idempotente** e **não dispara em excesso** (throttle comprovado por teste).
- tsc + suíte + build verdes; **zero** framing de diagnóstico/tratamento (RDC 657).

## Riscos
- **Técnico:** on-open pode floodar → **throttle por última sync + debounce**; web sem background → on-open + webhook
  (sem cron nativo); determinismo do mock temporal (o núcleo puro não usa `Date.now()`; runtime usa relógio real, testes
  usam relógio injetado).
- **Produto:** o feedback "cresceu" **não pode virar ruído** (mostrar só quando relevante; sempre dispensável); o
  indicador depende de **definir bem "1º dado visível"** (proponho: 1ª leitura projetada na Composição/Monitoramento).

## Impactos em outros módulos
- **Monitoramento / Composição:** ganham o disparo on-open e (opcional) o aviso de retorno — **aditivo**, sem quebrar.
- **Nenhuma** mudança em contratos de dados; **nenhum** impacto em Agenda, Notificações, Relatório, Recursos.

## Fora do escopo (explícito)
- **Withings REAL** (depende das credenciais — ativação posterior; só troca de adapter).
- **App mobile / Health Connect / Apple Health** (V2.2+ com MOB-001).
- **Novos conectores** (balanças reais, CGM, labs).
- **Inteligência longitudinal / tendências / insights** (isso é a **V3**).
- **Notificação push** de "dado novo" por e-mail/WhatsApp (a Central cuida de lembretes de agenda; o aviso de sync é
  **in-app** por ora).
- **Background sync nativo** (não existe no web).

## Subitens verificáveis (após aprovação; cada um TSC + suíte + build verdes + commit)
- **3.1** — Hook on-open sync (throttle) + fiação em Conexões/Monitoramento.
- **3.2** — Mock temporal (gera medições por data) + testes.
- **3.3** — Feedback de retorno ("novo desde a última visita").
- **3.4** — Telemetria do Aha (`usage_events`: conexão + 1º benefício).
- **3.5** — Validação end-to-end + **encerramento da V2** (validação de experiência + changelog de produto + congelamento)
  + **avaliação crítica de produto** (obrigatória, fundadora 20/07) respondendo objetivamente:
  1. **O Aha Moment realmente ficou perceptível?**
  2. **Quais pontos ainda impedem que essa experiência seja considerada excelente?**
  3. **Quais melhorias eu recomendaria ANTES da integração com os wearables reais (Withings)?**
  Objetivo: a entrada dos conectores reais acontece sobre uma experiência **já validada do ponto de vista do usuário**.

## Critério de sucesso da V2 (fechado por este épico)
> O usuário **conecta uma fonte e vê a história crescer sozinha**, sem registro manual — e **reconhece isso como o
> motivo** para usar a SINTERA. O épico mede isso pelo **tempo até o 1º benefício percebido**.
